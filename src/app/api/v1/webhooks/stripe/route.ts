// Delegate to the verified Stripe webhook handler. This avoids duplicating
// signature verification logic and ensures all Stripe events are processed
// identically regardless of which URL the webhook is delivered to.
export { POST } from "@/app/api/webhooks/stripe/route";
