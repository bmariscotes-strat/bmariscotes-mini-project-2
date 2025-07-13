"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { auth, currentUser } from "@clerk/nextjs/server";
import type { User } from "@clerk/nextjs/server";

interface UserData {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string;
  created_at: Date | null;
}

/**
 * Get a user by ID
 * @param id number - user id
 * @returns user object or null if not found
 */
export async function getUserById(userId: number): Promise<UserData | null> {
  try {
    const user = await db
      .select({
        id: users.id,
        first_name: users.first_name,
        last_name: users.last_name,
        email: users.email,
        created_at: users.created_at,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return user[0] || null;
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    return null;
  }
}

/**
 * Get a user by Clerk ID
 * @param clerkId string - Clerk user ID
 * @returns user object or null if not found
 */
export async function getUserByClerkId(clerkId: string) {
  try {
    const user = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.clerk_id, clerkId),
    });

    return user;
  } catch (error) {
    console.error("Error fetching user by Clerk ID:", error);
    return null;
  }
}

/**
 * Create or update user from Clerk data
 * @param clerkUser - Clerk user object
 * @returns user object or null if error
 */
export async function createOrUpdateUser(clerkUser: User) {
  try {
    // Check if user already exists
    const existingUser = await getUserByClerkId(clerkUser.id);

    if (existingUser) {
      // Update existing user
      const [updatedUser] = await db
        .update(users)
        .set({
          first_name: clerkUser.firstName || null,
          last_name: clerkUser.lastName || null,
          email: clerkUser.emailAddresses[0]?.emailAddress || "",
          updated_at: new Date(),
        })
        .where(eq(users.clerk_id, clerkUser.id))
        .returning();

      return updatedUser;
    } else {
      // Create new user
      const [newUser] = await db
        .insert(users)
        .values({
          clerk_id: clerkUser.id,
          first_name: clerkUser.firstName || null,
          last_name: clerkUser.lastName || null,
          email: clerkUser.emailAddresses[0]?.emailAddress || "",
        })
        .returning();

      return newUser;
    }
  } catch (error) {
    console.error("Error creating/updating user:", error);
    return null;
  }
}

/**
 * Get current authenticated user
 * @returns user object or null if not authenticated
 */
export async function getCurrentUser() {
  try {
    const authResult = await auth();
    const { userId } = authResult;

    if (!userId) {
      return null;
    }

    const user = await getUserByClerkId(userId);

    // If user doesn't exist in our database, create it
    if (!user) {
      const clerkUser = await currentUser();
      if (clerkUser) {
        return await createOrUpdateUser(clerkUser);
      }
    }

    return user;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

/**
 * Sync Clerk user with database
 * Called from webhooks or when user data changes
 */
export async function syncUserWithClerk() {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return null;
    }

    return await createOrUpdateUser(clerkUser);
  } catch (error) {
    console.error("Error syncing user with Clerk:", error);
    return null;
  }
}
