"use server";

import { db } from "@/lib/db";

/**
 * Get a user by ID
 * @param id number - user id
 * @returns user object or null if not found
 */

export async function getUserById(id: number) {
  try {
    const user = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, id),
    });

    return user;
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}
