export { proxy as middleware } from "@/proxy";

export const config = {
  matcher: [
    /*
     * Apply to all paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|images/|fonts/).*)",
  ],
};
