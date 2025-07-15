/*
 * Clerk Middleware for Authentication
 */

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define routes that require authentication
const isProtectedRoute = createRouteMatcher([
  "/blogs/new", // Creating new posts
  "/blogs/edit/(.*)", // Editing posts
  "/profile(.*)", // Profile routes
]);

const isBlogsListingRoute = (pathname: string) => {
  return pathname === "/blogs" || pathname === "/blogs/";
};

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;

  if (isBlogsListingRoute(pathname)) {
    await auth.protect(); // Only let authenticated users access /blogs
  }

  // Protect other routes that require authentication
  if (isProtectedRoute(req)) {
    await auth.protect(); // Only let authenticated users access matched protected routes
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
