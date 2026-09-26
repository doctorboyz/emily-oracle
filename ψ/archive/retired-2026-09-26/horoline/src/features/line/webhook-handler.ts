import { type WebhookRequestBody, validateSignature } from "@line/bot-sdk";
import { Hono } from "hono";

const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET || "";

export const webhookRouter = new Hono();

function isValidSignature(body: string, signature: string): boolean {
  if (!LINE_CHANNEL_SECRET) return false;
  try {
    const hash = validateSignature(body, LINE_CHANNEL_SECRET, signature);
    return hash;
  } catch {
    return false;
  }
}

webhookRouter.post("/", async (c) => {
  const signature = c.req.header("x-line-signature") ?? "";
  const rawBody = await c.req.text();

  // Verify LINE signature
  if (!isValidSignature(rawBody, signature)) {
    return c.json({ error: "Invalid signature" }, 403);
  }

  const body: WebhookRequestBody = JSON.parse(rawBody);

  for (const event of body.events) {
    // Process events asynchronously — don't block the response
    handleEvent(event).catch((err) => {
      console.error("Event handler error:", err);
    });
  }

  return c.json({ status: "ok" });
});

type LineEvent = WebhookRequestBody["events"][number];

async function handleEvent(event: LineEvent) {
  const { type } = event;

  switch (type) {
    case "follow":
      await handleFollow(event);
      break;
    case "unfollow":
      await handleUnfollow(event);
      break;
    case "message":
      await handleMessage(event);
      break;
    case "postback":
      await handlePostback(event);
      break;
    default:
      console.log("Unhandled event type:", type);
  }
}

async function handleFollow(event: LineEvent) {
  const lineUserId = event.source?.userId;
  if (!lineUserId) return;

  console.log("New follower:", lineUserId);
  // Will be implemented: create user, start onboarding
}

async function handleUnfollow(event: LineEvent) {
  const lineUserId = event.source?.userId;
  if (!lineUserId) return;

  console.log("User unfollowed:", lineUserId);
  // Will be implemented: mark user as inactive
}

async function handleMessage(event: LineEvent) {
  if (event.type !== "message") return;
  const { replyToken, message, source } = event;
  if (!source?.userId || !message) return;

  console.log("Message from:", source.userId, message.type);
  // Will be implemented: route to session state machine
}

async function handlePostback(event: LineEvent) {
  if (event.type !== "postback") return;
  const { replyToken, postback, source } = event;
  if (!source?.userId || !postback) return;

  console.log("Postback from:", source.userId, postback.data);
  // Will be implemented: handle onboarding steps, reading selections
}
