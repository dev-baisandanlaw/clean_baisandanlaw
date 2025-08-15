import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/appointments(.*)",
  "/attorneys(.*)",
  "/cases(.*)",
  "/clients(.*)",
  "/dashboard(.*)",
]);

const isPublicAuthRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  // 1️⃣ If protected route, require authentication
  if (isProtectedRoute(req)) {
    const redirectTo = req.nextUrl.pathname + req.nextUrl.search;
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", redirectTo);

    await auth.protect(undefined, {
      unauthenticatedUrl: signInUrl.toString(),
    });
  }

  // 2️⃣ If public route but user is signed in, redirect to dashboard
  if (isPublicAuthRoute(req) && (await auth()).userId) {
    const dashboardUrl = new URL("/dashboard", req.url);
    return Response.redirect(dashboardUrl);
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
