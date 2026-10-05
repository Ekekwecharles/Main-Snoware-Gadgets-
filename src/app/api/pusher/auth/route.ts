import { NextResponse } from "next/server";
import { getApiUser, unauthorized } from "@/lib/api-auth";
import { cartChannel, getPusher } from "@/lib/pusher";

/**
 * Authorises Pusher private-channel subscriptions. A user may only listen to their own cart channel.
 * pusher-js posts form-encoded `socket_id` + `channel_name`; the mobile app may send JSON.
 */
export async function POST(req: Request) {
  const user = await getApiUser(req);
  if (!user) return unauthorized();
  const pusher = getPusher();
  if (!pusher) return NextResponse.json({ error: "Realtime is not configured" }, { status: 503 });

  const type = req.headers.get("content-type") ?? "";
  const body: Record<string, unknown> = type.includes("application/json")
    ? await req.json().catch(() => ({}))
    : Object.fromEntries(new URLSearchParams(await req.text()));
  const socketId = typeof body.socket_id === "string" ? body.socket_id : "";
  const channel = typeof body.channel_name === "string" ? body.channel_name : "";

  if (!socketId || channel !== cartChannel(user.id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json(pusher.authorizeChannel(socketId, channel));
}
