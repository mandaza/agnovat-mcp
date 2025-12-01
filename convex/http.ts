import { httpRouter } from "convex/server";
import { handleClerkWebhook } from "./clerk.js";

const http = httpRouter();

// Clerk webhook endpoint
http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: handleClerkWebhook,
});

export default http;
