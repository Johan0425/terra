"use client";

// Client-only face detection + alignment, using Google's MediaPipe Tasks
// Vision (actively maintained — face-api.js, the more commonly-suggested
// library, is unmaintained since ~2020 and pulls in a vulnerable old
// TensorFlow.js/node-fetch chain). Runs entirely in the browser via WASM;
// nothing is uploaded until after a face is confirmed and cropped.
import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";

const MEDIAPIPE_VERSION = "1.0.1";
const WASM_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`;
// BlazeFace short-range detector — small (~230KB), fast, accurate enough for
// "find the face + eye positions to align a crop" (we don't need full mesh
// landmarks for that). Verified live at this path against Google's model bucket.
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";

let detectorPromise: Promise<FaceDetector> | null = null;

function getDetector(): Promise<FaceDetector> {
  if (!detectorPromise) {
    detectorPromise = FilesetResolver.forVisionTasks(WASM_BASE).then(
      (fileset) =>
        FaceDetector.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_URL },
          runningMode: "IMAGE",
        }),
    );
  }
  return detectorPromise;
}

/** Warms up the WASM + model download ahead of time (call on step mount, not on submit). */
export function preloadFaceDetector() {
  void getDetector();
}

export class FaceDetectionError extends Error {}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new FaceDetectionError("Couldn't read that image file."));
    img.src = url;
  });
}

/**
 * Detects a single face in the uploaded photo, de-rotates it level with the
 * eyes, and returns a square, centered crop as a canvas — ready either for
 * preview or for texturing directly onto the avatar's head.
 */
export async function detectAndCropFace(
  file: File,
  outputSize = 512,
): Promise<HTMLCanvasElement> {
  const image = await loadImage(file);
  const detector = await getDetector();
  const result = detector.detect(image);
  URL.revokeObjectURL(image.src);

  if (result.detections.length === 0) {
    throw new FaceDetectionError(
      "No face detected — try a clearer, front-facing, well-lit photo.",
    );
  }
  if (result.detections.length > 1) {
    throw new FaceDetectionError(
      "Multiple faces detected — please upload a photo with just you in it.",
    );
  }

  const [detection] = result.detections;
  // BlazeFace's fixed keypoint order: right eye, left eye, nose, mouth, right ear, left ear.
  const [rightEyeN, leftEyeN] = detection.keypoints;
  if (!rightEyeN || !leftEyeN) {
    throw new FaceDetectionError(
      "Couldn't find clear eye positions — try a more front-facing photo.",
    );
  }

  const w = image.naturalWidth;
  const h = image.naturalHeight;
  const rightEye = { x: rightEyeN.x * w, y: rightEyeN.y * h };
  const leftEye = { x: leftEyeN.x * w, y: leftEyeN.y * h };

  const eyeDistance = Math.hypot(leftEye.x - rightEye.x, leftEye.y - rightEye.y);
  const angle = Math.atan2(leftEye.y - rightEye.y, leftEye.x - rightEye.x);
  const centerX = (rightEye.x + leftEye.x) / 2;
  const centerY = (rightEye.y + leftEye.y) / 2;

  // Passport-style framing: interpupillary distance ~= 30% of crop width,
  // eye line sits ~42% down from the top of the crop.
  const cropSize = eyeDistance / 0.3;
  const scale = outputSize / cropSize;

  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new FaceDetectionError("Canvas not supported in this browser.");

  ctx.imageSmoothingQuality = "high";
  ctx.translate(outputSize / 2, outputSize * 0.42);
  ctx.rotate(-angle);
  ctx.scale(scale, scale);
  ctx.translate(-centerX, -centerY);
  ctx.drawImage(image, 0, 0);

  return canvas;
}

export function canvasToJpegFile(canvas: HTMLCanvasElement, filename: string): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new FaceDetectionError("Failed to encode the cropped photo."));
          return;
        }
        resolve(new File([blob], filename, { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92,
    );
  });
}
