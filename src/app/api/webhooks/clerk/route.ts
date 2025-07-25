/*
 * Webhook for Clerk & Neon DB
 */

import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";

// Define types for Clerk webhook data
interface ClerkUserData {
  id: string;
  first_name?: string;
  last_name?: string;
  email_addresses: Array<{
    email_address: string;
    id: string;
  }>;
}

// Type for deleted user data (has different structure)
interface ClerkDeletedUserData {
  id: string;
  object: "user";
  deleted: boolean;
}

/**
 * POST Webhook Handler - Verifies and Processes Clerk Webhook Events
 */

export async function POST(req: Request) {
  // Get the headers - await the promise
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occurred -- no svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.text();

  // Get the Webhook secret
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error(
      "Please add CLERK_WEBHOOK_SECRET to your environment variables"
    );
  }

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occurred", {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;

  try {
    switch (eventType) {
      case "user.created":
        await handleUserCreated(evt.data as ClerkUserData);
        break;
      case "user.updated":
        await handleUserUpdated(evt.data as ClerkUserData);
        break;
      case "user.deleted":
        await handleUserDeleted(evt.data as ClerkDeletedUserData);
        break;
      default:
        console.log(`Unhandled event type: ${eventType}`);
    }
  } catch (error) {
    console.error(`Error handling webhook ${eventType}:`, error);
    return new Response("Error occurred while processing webhook", {
      status: 500,
    });
  }

  return new Response("Webhook processed successfully", { status: 200 });
}

/**
 * Create: Create user
 */

async function handleUserCreated(userData: ClerkUserData) {
  try {
    console.log("Creating user:", userData);

    const result = await db
      .insert(users)
      .values({
        clerk_id: userData.id,
        first_name: userData.first_name || null,
        last_name: userData.last_name || null,
        email: userData.email_addresses[0]?.email_address || "",
      })
      .returning();

    console.log(`User created in database:`, result[0]);
  } catch (error) {
    console.error("Error creating user in database:", error);
    throw error;
  }
}

/**
 * Update: Update user data
 */

async function handleUserUpdated(userData: ClerkUserData) {
  try {
    console.log("Updating user:", userData);

    const result = await db
      .update(users)
      .set({
        first_name: userData.first_name || null,
        last_name: userData.last_name || null,
        email: userData.email_addresses[0]?.email_address || "",
        updated_at: new Date(),
      })
      .where(eq(users.clerk_id, userData.id))
      .returning();

    console.log(`User updated in database:`, result[0]);
  } catch (error) {
    console.error("Error updating user in database:", error);
    throw error;
  }
}

/**
 * Update: Delete user data
 */

async function handleUserDeleted(userData: ClerkDeletedUserData) {
  try {
    console.log("Deleting user:", userData);

    const result = await db
      .delete(users)
      .where(eq(users.clerk_id, userData.id))
      .returning();

    console.log(`User deleted from database:`, result[0]);
  } catch (error) {
    console.error("Error deleting user from database:", error);
    throw error;
  }
}
