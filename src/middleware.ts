import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define routes that require authentication
const isProtectedRoute = createRouteMatcher([
  "/blogs/new", // Creating new posts
  "/blogs/edit/(.*)", // Editing posts
  "/dashboard(.*)", // Dashboard routes
  "/profile(.*)", // Profile routes
  // Add other protected routes as needed
]);

// Custom function to check if it's the exact /blogs route (not individual posts)
const isBlogsListingRoute = (pathname: string) => {
  return pathname === "/blogs" || pathname === "/blogs/";
};

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;

  // Protect the /blogs listing route specifically
  if (isBlogsListingRoute(pathname)) {
    await auth.protect();
  }

  // Protect other routes that require authentication
  if (isProtectedRoute(req)) {
    await auth.protect();
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
