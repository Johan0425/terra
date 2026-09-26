"use client";

// Upload a photo -> detect + crop the face client-side -> upload the crop
// (never the original photo) to private Blob storage -> save the pathname.
// See lib/faceDetection.ts for the detection/alignment math and
// components/avatar/FaceCard.tsx for how the result gets onto the avatar.
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import {
  canvasToJpegFile,
  detectAndCropFace,
  FaceDetectionError,
  preloadFaceDetector,
} from "@/lib/faceDetection";

type Status =
  | { step: "idle" }
  | { step: "detecting" }
  | { step: "preview"; canvas: HTMLCanvasElement; previewUrl: string }
  | { step: "uploading" }
  | { step: "error"; message: string };

export interface AvatarPhotoUploadProps {
  userId: string;
  hasExistingPhoto: boolean;
}

export function AvatarPhotoUpload({
  userId,
  hasExistingPhoto,
}: AvatarPhotoUploadProps) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>({ step: "idle" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Warm up the ~230KB model + WASM runtime as soon as this section mounts,
  // so there's no cold-start delay when the user actually picks a photo.
  useEffect(() => {
    preloadFaceDetector();
  }, []);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;

    setStatus({ step: "detecting" });
    try {
      const canvas = await detectAndCropFace(file);
      setStatus({ step: "preview", canvas, previewUrl: canvas.toDataURL("image/jpeg", 0.9) });
    } catch (err) {
      setStatus({
        step: "error",
        message:
          err instanceof FaceDetectionError
            ? err.message
            : "Couldn't process that photo — try another.",
      });
    }
  }

  async function handleConfirm() {
    if (status.step !== "preview") return;
    setStatus({ step: "uploading" });
    try {
      const file = await canvasToJpegFile(status.canvas, "face.jpg");
      const pathname = `avatar-photos/${userId}-${Date.now()}.jpg`;

      const result = await upload(pathname, file, {
        access: "private",
        handleUploadUrl: "/api/avatar-photo/upload",
      });

      const confirmRes = await fetch("/api/avatar-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pathname: result.pathname }),
      });
      if (!confirmRes.ok) throw new Error("Failed to save photo");

      setStatus({ step: "idle" });
      router.refresh();
    } catch {
      setStatus({
        step: "error",
        message: "Upload failed — check your connection and try again.",
      });
    }
  }

  return (
    <div className="border border-zinc-800 p-4">
      <p className="text-xs uppercase tracking-[0.3em] text-amber-500/80">
        Your Face
      </p>
      <p className="mt-1 text-xs text-zinc-500">
        Detected and cropped entirely in your browser — only the cropped
        result is ever uploaded, not the original photo.
      </p>

      <div className="mt-4 flex items-center gap-4">
        {hasExistingPhoto && status.step === "idle" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/api/avatar-photo/photo"
            alt="Your current avatar face"
            className="h-16 w-16 rounded-full border border-zinc-700 object-cover"
          />
        )}

        {status.step === "preview" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={status.previewUrl}
            alt="Cropped preview"
            className="h-40 w-40 rounded-full border border-amber-500/40 object-cover"
          />
        )}

        <div className="flex-1">
          {status.step === "detecting" && (
            <p className="text-sm text-zinc-400">Detecting face…</p>
          )}
          {status.step === "uploading" && (
            <p className="text-sm text-zinc-400">Uploading…</p>
          )}
          {status.step === "error" && (
            <p className="text-sm text-red-400">{status.message}</p>
          )}

          {status.step === "preview" ? (
            <div className="flex gap-2">
              <button
                onClick={handleConfirm}
                className="border border-amber-500/60 bg-amber-500/10 px-4 py-2 text-xs uppercase tracking-widest text-amber-400 hover:bg-amber-500/20"
              >
                Use this photo
              </button>
              <button
                onClick={() => setStatus({ step: "idle" })}
                className="border border-zinc-700 px-4 py-2 text-xs uppercase tracking-widest text-zinc-400 hover:border-zinc-500"
              >
                Retake
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={status.step === "detecting" || status.step === "uploading"}
              className="border border-zinc-700 px-4 py-2 text-xs uppercase tracking-widest text-zinc-400 hover:border-amber-500/50 hover:text-amber-400 disabled:opacity-50"
            >
              {hasExistingPhoto ? "Replace Photo" : "Upload Photo"}
            </button>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
