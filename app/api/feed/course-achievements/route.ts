// @ts-nocheck
/**
 * Course Achievement Social Feed API
 * 
 * Endpoint: POST /api/feed/course-achievements
 * 
 * Posts achievements, milestones, and course completions to user's social feed.
 * Integrates with existing social feed infrastructure.
 */

// @ts-nocheck
import { Databases, Permission, Role } from 'node-appwrite';
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes';

interface FeedPost {
  postId: string;
  userId: string;
  userName: string;
  userImage?: string;
  podId?: string; // if in a pod context
  podName?: string;
  postType: 'achievement' | 'milestone' | 'course-complete' | 'course-start' | 'chapter-complete';
  content: string;
  courseId: string;
  courseName: string;
  achievementData?: {
    achievementType: string;
    points: number;
    badge: string;
    description: string;
  };
  milestoneData?: {
    milestone: string;
    percentComplete: number;
  };
  media?: {
    type: 'certificate' | 'badge' | 'image';
    url: string;
    caption?: string;
  };
  likes: number;
  comments: number;
  shares: number;
  createdAt: string;
}

/**
 * POST /api/feed/course-achievements
 * 
 * Create a feed post for a course achievement or milestone
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      userId,
      userName,
      userImage,
      courseId,
      courseName,
      postType,
      achievementData,
      milestoneData,
      media,
      podId,
      podName,
    } = body;

    // Validation
    if (!userId || !courseId || !postType) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: userId, courseId, postType',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate content based on post type
    let content = '';
    switch (postType) {
      case 'achievement':
        content = `🎉 Earned achievement "${achievementData?.achievementType}" in ${courseName}! +${achievementData?.points} points`;
        break;
      case 'milestone':
        content = `📊 Reached ${milestoneData?.percentComplete}% completion in ${courseName}!`;
        break;
      case 'course-complete':
        content = `🏆 Completed "${courseName}"! Check out my certificate!`;
        break;
      case 'course-start':
        content = `🚀 Started learning "${courseName}"! Excited to start this journey!`;
        break;
      case 'chapter-complete':
        content = `✅ Completed a chapter in "${courseName}"! Making great progress!`;
        break;
    }

    const { databases } = createAdminClient();

    // Create feed post
    const postId = `post-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const post = await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID!,
      'feed_posts',
      postId,
      {
        userId,
        userName: userName || `User ${userId.slice(0, 8)}`,
        userImage: userImage || null,
        podId: podId || null,
        podName: podName || null,
        postType,
        content,
        courseId,
        courseName,
        achievementData: achievementData ? JSON.stringify(achievementData) : null,
        milestoneData: milestoneData ? JSON.stringify(milestoneData) : null,
        media: media ? JSON.stringify(media) : null,
        likes: 0,
        comments: 0,
        shares: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDeleted: false,
        isEdited: false,
      },
      [
        Permission.read(Role.any()),
        Permission.read(Role.users()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
      ]
    );

    // Trigger notifications to followers
    try {
      await databases.createDocument(
        process.env.APPWRITE_DATABASE_ID!,
        'notifications',
        `notif-${postId}`,
        {
          type: 'course_achievement',
          recipientId: null, // Will be populated by a background job for followers
          senderId: userId,
          senderName: userName,
          relatedPostId: postId,
          relatedCourseId: courseId,
          content: `${userName} ${content}`,
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        [Permission.read(Role.any()), Permission.read(Role.users())]
      );
    } catch (err) {
      console.log('Error creating notification:', err);
    }

    return new Response(
      JSON.stringify({
        success: true,
        postId,
        post,
        message: 'Achievement posted to feed!',
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error creating feed post:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to create feed post' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * GET /api/feed/course-achievements
 * 
 * Get achievement feed posts
 * Query params: ?courseId=xxx&userId=yyy&podId=zzz&limit=20&offset=0
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const userId = searchParams.get('userId');
    const podId = searchParams.get('podId');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const { databases } = createAdminClient();

    const filters: any[] = [
      {
        method: 'equal',
        attribute: 'isDeleted',
        value: false,
      },
    ];

    if (courseId) {
      filters.push({
        method: 'equal',
        attribute: 'courseId',
        value: courseId,
      });
    }

    if (userId) {
      filters.push({
        method: 'equal',
        attribute: 'userId',
        value: userId,
      });
    }

    if (podId) {
      filters.push({
        method: 'equal',
        attribute: 'podId',
        value: podId,
      });
    }

    const posts = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      'feed_posts',
      filters,
      limit,
      offset
    );

    // Parse JSON fields and sort by date
    const parsedPosts = posts.documents
      .map((doc: any) => ({
        ...doc,
        achievementData: doc.achievementData ? JSON.parse(doc.achievementData) : null,
        milestoneData: doc.milestoneData ? JSON.parse(doc.milestoneData) : null,
        media: doc.media ? JSON.parse(doc.media) : null,
      }))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    return new Response(
      JSON.stringify({
        success: true,
        filters: { courseId, userId, podId },
        posts: parsedPosts,
        total: posts.total,
        limit,
        offset,
        hasMore: offset + limit < posts.total,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error fetching achievement posts:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to fetch posts' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * PUT /api/feed/course-achievements
 * 
 * Like, comment on, or delete a post
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { postId, action, userId } = body;

    if (!postId || !action) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: postId, action' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { databases } = createAdminClient();

    const post = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID!,
      'feed_posts',
      postId
    );

    switch (action) {
      case 'like':
        const liked = await databases.updateDocument(
          process.env.APPWRITE_DATABASE_ID!,
          'feed_posts',
          postId,
          {
            likes: (post.likes || 0) + 1,
          }
        );
        return new Response(JSON.stringify({ success: true, post: liked }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });

      case 'share':
        const shared = await databases.updateDocument(
          process.env.APPWRITE_DATABASE_ID!,
          'feed_posts',
          postId,
          {
            shares: (post.shares || 0) + 1,
          }
        );
        return new Response(JSON.stringify({ success: true, post: shared }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });

      case 'delete':
        const deleted = await databases.updateDocument(
          process.env.APPWRITE_DATABASE_ID!,
          'feed_posts',
          postId,
          {
            isDeleted: true,
            content: '[post deleted]',
          }
        );
        return new Response(JSON.stringify({ success: true, post: deleted }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });

      default:
        return new Response(
          JSON.stringify({ error: 'Unknown action: ' + action }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }
  } catch (error: any) {
    console.error('Error updating feed post:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to update post' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
