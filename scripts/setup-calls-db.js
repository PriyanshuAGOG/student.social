#!/usr/bin/env node

const { Client, Databases } = require('node-appwrite');
const dotenv = require('dotenv');

// Load env variables
dotenv.config({ path: '.env.local' });

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'peerspark-main-db';

if (!PROJECT_ID || !API_KEY) {
  console.error('Missing required environment variables: NEXT_PUBLIC_APPWRITE_PROJECT_ID, APPWRITE_API_KEY');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);

async function setupCalls() {
  console.log('[Calls Setup] Starting...');

  try {
    // Check if calls collection exists
    let callsCollection;
    try {
      callsCollection = await databases.getCollection(DATABASE_ID, 'calls');
      console.log('[Calls Setup] Calls collection already exists');
    } catch (error) {
      if (error.code === 404) {
        console.log('[Calls Setup] Creating calls collection...');
        callsCollection = await databases.createCollection(
          DATABASE_ID,
          'calls',
          'Calls',
          ['role:all']
        );
        console.log('[Calls Setup] Calls collection created');
      } else {
        throw error;
      }
    }

    // Define attributes for calls collection
    const attributes = [
      {
        key: 'roomName',
        type: 'string',
        size: 256,
        required: true,
      },
      {
        key: 'chatId',
        type: 'string',
        size: 256,
        required: true,
      },
      {
        key: 'callerId',
        type: 'string',
        size: 256,
        required: true,
      },
      {
        key: 'receiverId',
        type: 'string',
        size: 256,
        required: true,
      },
      {
        key: 'callType',
        type: 'string',
        size: 20,
        required: true,
      },
      {
        key: 'status',
        type: 'string',
        size: 30,
        required: true,
      },
      {
        key: 'startedAt',
        type: 'datetime',
        required: false,
      },
      {
        key: 'acceptedAt',
        type: 'datetime',
        required: false,
      },
      {
        key: 'endedAt',
        type: 'datetime',
        required: false,
      },
      {
        key: 'durationSeconds',
        type: 'integer',
        required: false,
      },
      {
        key: 'endedBy',
        type: 'string',
        size: 256,
        required: false,
      },
      {
        key: 'createdAt',
        type: 'datetime',
        required: false,
      },
      {
        key: 'updatedAt',
        type: 'datetime',
        required: false,
      },
    ];

    // Create attributes
    for (const attr of attributes) {
      try {
        // Check if attribute exists
        await databases.getCollectionAttribute(DATABASE_ID, 'calls', attr.key);
        console.log(`[Calls Setup] Attribute '${attr.key}' already exists`);
      } catch (error) {
        if (error.code === 404) {
          console.log(`[Calls Setup] Creating attribute '${attr.key}'...`);
          await databases.createStringAttribute(
            DATABASE_ID,
            'calls',
            attr.key,
            attr.size || 256,
            attr.required || false
          );
          console.log(`[Calls Setup] Attribute '${attr.key}' created`);
        }
      }
    }

    // Create indexes
    const indexes = [
      {
        key: 'idx_receiver_status',
        attributes: ['receiverId', 'status'],
        orders: ['ASC', 'ASC'],
      },
      {
        key: 'idx_chat_calls',
        attributes: ['chatId'],
        orders: ['ASC'],
      },
      {
        key: 'idx_caller',
        attributes: ['callerId'],
        orders: ['ASC'],
      },
    ];

    for (const index of indexes) {
      try {
        await databases.getCollectionIndex(DATABASE_ID, 'calls', index.key);
        console.log(`[Calls Setup] Index '${index.key}' already exists`);
      } catch (error) {
        if (error.code === 404) {
          console.log(`[Calls Setup] Creating index '${index.key}'...`);
          await databases.createIndex(
            DATABASE_ID,
            'calls',
            index.key,
            index.attributes,
            index.orders
          );
          console.log(`[Calls Setup] Index '${index.key}' created`);
        }
      }
    }

    console.log('[Calls Setup] Complete!');
  } catch (error) {
    console.error('[Calls Setup] Error:', error.message || error);
    process.exit(1);
  }
}

setupCalls();
