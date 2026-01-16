# Frontend Architecture

PeerSpark uses a modern App Router stack with a focus on predictable data flow, strong type safety, and reusable UI primitives. This document is the single source of truth for how the frontend is organized and how to extend it safely.

## Stack At A Glance
- Framework: Next.js 16 (App Router) with React 19 and TypeScript
- Styling: Tailwind CSS v4, design tokens in [app/globals.css](../app/globals.css), animations via `tailwindcss-animate`
- UI Kit: Radix primitives + shadcn-style components in [components/ui](../components/ui)
- Theming: `next-themes` with light/dark, provider in [components/theme-provider.tsx](../components/theme-provider.tsx)
- Forms & Validation: `react-hook-form` + `@hookform/resolvers` + `zod`
- Icons & Charts: `lucide-react`, `recharts`
- State & Data: Thin client-side service calls to Appwrite helpers in [lib/appwrite.ts](../lib/appwrite.ts); local state via hooks in [hooks](../hooks)
- PWA: `next-pwa` with installer prompts in [components/pwa-install-prompt.tsx](../components/pwa-install-prompt.tsx) and service worker bootstrap in [components/pwa-index.ts](../components/pwa-index.ts)

## Routing Map (App Router)
- Global layout: [app/layout.tsx](../app/layout.tsx) wires fonts, theme provider, metadata, and shared shells.
- Landing & info: [app/page.tsx](../app/page.tsx), [app/about](../app/about), [app/privacy](../app/privacy), [app/terms](../app/terms), [app/community-guidelines](../app/community-guidelines), [app/cookies](../app/cookies), [app/accessibility](../app/accessibility), [app/dmca](../app/dmca), [app/contact](../app/contact), [app/support](../app/support), [app/help](../app/help).
- Auth: [app/login](../app/login), [app/register](../app/register), [app/forgot-password](../app/forgot-password), [app/reset-password](../app/reset-password), [app/verify-email](../app/verify-email), [app/verify-otp](../app/verify-otp), onboarding flows in [app/onboarding](../app/onboarding).
- Learning surfaces: [app/pods](../app/pods) (pod discovery and detail), [app/courses](../app/courses) (course dashboards), [app/student](../app/student), [app/instructor](../app/instructor), [app/assignments](../app/assignments) inside API.
- Social & content: [app/feed](../app/feed), [app/posts](../app/posts), comments via dynamic routes under [app/posts/[id]](../app/posts).
- Systems: [app/status](../app/status) (uptime/health), [app/demo](../app/demo) (feature demos), [app/pods/[id]](../app/pods/%5Bid%5D) (pod rooms), [app/courses/course-dashboard](../app/courses/course-dashboard) (course analytics).
- API routes: colocated handlers in [app/api](../app/api) grouped by domain (`ai`, `assignments`, `auth`, `certificates`, `courses`, `feed`, `instructor`, `payments`, `pods`, `posts`, `users`).

## Layout, Shell, and Navigation
- Shell components: [components/app-sidebar.tsx](../components/app-sidebar.tsx), [components/mobile-navigation.tsx](../components/mobile-navigation.tsx), [components/mobile-header.tsx](../components/mobile-header.tsx) coordinate navigation and responsive breakpoints.
- Floating controls: [components/floating-action-button.tsx](../components/floating-action-button.tsx) exposes quick actions; [components/create-post-modal-fixed.tsx](../components/create-post-modal-fixed.tsx) wraps feed post creation.
- Global providers: Theme provider, toast provider in [components/ui/toaster.tsx](../components/ui/toaster.tsx), auth context in [lib/auth-context.tsx](../lib/auth-context.tsx), and route protection helper in [lib/protect-route.tsx](../lib/protect-route.tsx).

## Component System
- Primitive UI: Buttons, forms, inputs, cards, dialogs, sheets, and nav elements live in [components/ui](../components/ui) and wrap Radix primitives with Tailwind styles.
- Feature widgets: AI assistant ([components/ai-assistant.tsx](../components/ai-assistant.tsx)), comments ([components/comments-section.tsx](../components/comments-section.tsx)), pod utilities, and PWA prompts encapsulate business logic behind stable props.
- Patterns: Prefer composition over inheritance, keep side-effects inside hooks, and pass typed callbacks to UI shells. Use `clsx` + `class-variance-authority` for variants.

## Data & State Flow
- Remote data: All server interactions run through helpers in [lib/appwrite.ts](../lib/appwrite.ts). Components call domain services (feed, comment, profile, pod, chat, resource, calendar, analytics) that wrap Appwrite queries and writes.
- Local data: Reusable hooks in [hooks](../hooks) (e.g., [hooks/use-toast.ts](../hooks/use-toast.ts), [hooks/use-mobile.ts](../hooks/use-mobile.ts)) gate UI state.
- Forms: Use `react-hook-form` controllers with `zod` schemas for validation. Keep validation schemas close to the component to avoid drift.
- Realtime: Appwrite realtime subscriptions (chat, posts, pods, resources) are opened inside domain services; components respond through callbacks/optimistic UI patterns.

## Styling & Theming
- Global styles live in [app/globals.css](../app/globals.css) and Tailwind config (see [postcss.config.mjs](../postcss.config.mjs)).
- Typography and spacing use CSS variables set in the layout; prefer utility classes for consistency.
- Animations rely on `tailwindcss-animate` and motion-safe variants. Avoid ad-hoc keyframes inside components.

## PWA & Performance
- PWA: Service worker registration via `next-pwa`; install prompt component in [components/pwa-install-prompt.tsx](../components/pwa-install-prompt.tsx). Keep payloads small and avoid non-serializable objects in caches.
- Images: Prefer `next/image` with static imports where possible; bucket-based avatars/resources are delivered via Appwrite URLs.
- Bundles: Tree-shake Lucide icons; lazy-load heavy charts and modal content when feasible.

## Frontend Change Checklist
- Add routes under [app](../app) using server components by default; promote to client only when interactivity or hooks are required.
- Co-locate page-level loaders and error boundaries where data fetching occurs.
- Reuse primitives from [components/ui](../components/ui) before adding new styles; if a new variant is needed, extend via `cva`.
- Keep service calls in [lib/appwrite.ts](../lib/appwrite.ts) or a thin wrapper; avoid calling Appwrite SDK directly from components.
- Provide mobile-friendly layouts; test key flows at 360px width and large desktop.
- Ensure ARIA labels on inputs, buttons, dialogs, and menus. Validate color contrast in both light and dark themes.
