import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { updateUserAvatarPhotoPath } from "@/lib/db/queries";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const pathname = body?.pathname;
  if (typeof pathname !== "string") {
    return NextResponse.json({ error: "Missing pathname" }, { status: 400 });
  }
  // Defense in depth — the upload route's onBeforeGenerateToken already
  // enforces this prefix, but never trust a client-supplied string blindly.
  if (!pathname.startsWith(`avatar-photos/${session.user.id}-`)) {
    return NextResponse.json({ error: "Invalid pathname" }, { status: 400 });
  }

  await updateUserAvatarPhotoPath(session.user.id, pathname);
  return NextResponse.json({ ok: true });
}
