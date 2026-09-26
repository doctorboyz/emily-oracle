import { Hono } from "hono";

export const webhookRoute = new Hono();

// LINE webhook endpoint — receives events from LINE Messaging API
webhookRoute.post("/", async (c) => {
  // TODO: Verify X-Line-Signature header
  // TODO: Parse LINE events
  // TODO: Route to appropriate handler based on event type
  // TODO: Send reply via LINE Messaging API
  return c.json({ status: "received" }, 200);
});
