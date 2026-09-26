import { NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { auth } from "@/auth";
import { getUser } from "@/lib/db/queries";

// Streams the signed-in user's own face photo back out. Never exposes the
// underlying Blob pathname/URL to the client — the 3D scene just points an
// <img>/texture loader at this same-origin route, and cookies carry auth.
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getUser(session.user.id);
  if (!user?.avatarPhotoPath) {
    return NextResponse.json({ error: "No photo" }, { status: 404 });
  }

  const result = await get(user.avatarPhotoPath, { access: "private" });
  if (!result || result.statusCode !== 200) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
