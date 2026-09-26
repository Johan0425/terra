import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { auth } from "@/auth";

// Issues a short-lived client-upload token so the browser can PUT the photo
// straight to our private Vercel Blob store (bypassing the 4.5MB Vercel
// Function body limit — not that a single face photo needs it, but it's the
// correct pattern for any user-uploaded file). Every blob in this store is
// private by default (the store itself was created with --access private).
//
// The actual users.avatarPhotoPath write happens in /api/avatar-photo
// (called by the client right after upload() resolves) — NOT in
// onUploadCompleted below, since that fires via a webhook Vercel Blob sends
// back to this deployment, which localhost can't receive during dev.
export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // The client constructs the pathname (see AvatarPhotoUpload.tsx) —
        // enforce it's actually scoped to the requesting user.
        if (!pathname.startsWith(`avatar-photos/${session.user.id}-`)) {
          throw new Error("Invalid pathname for this user");
        }
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
          addRandomSuffix: true,
          maximumSizeInBytes: 8 * 1024 * 1024, // 8MB — plenty for a cropped face photo
        };
      },
      onUploadCompleted: async () => {
        // Intentionally a no-op — see comment above.
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 },
    );
  }
}
