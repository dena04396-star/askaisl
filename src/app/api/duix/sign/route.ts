import { NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

function b64url(s: string) {
  return Buffer.from(s).toString("base64")
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function createSign(appId: string, appKey: string): string {
  const now = Math.floor(Date.now() / 1000);
  const header  = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = b64url(JSON.stringify({ appId, iat: now, exp: now + 3600 }));
  const unsigned = `${header}.${payload}`;
  const sig = crypto.createHmac("sha256", appKey)
    .update(unsigned).digest("base64")
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${unsigned}.${sig}`;
}

export async function GET() {
  const appId          = process.env.APP_ID;
  const appKey         = process.env.APP_KEY;
  const conversationId = process.env.DUIX_CONVERSATION_ID;

  if (!appId || !appKey || !conversationId) {
    return NextResponse.json({ error: "DUIX not configured" }, { status: 500 });
  }

  return NextResponse.json({ sign: createSign(appId, appKey), conversationId });
}
