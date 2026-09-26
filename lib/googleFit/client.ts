import "server-only";
import { getGoogleAccount, updateGoogleAccountToken } from "@/lib/db/queries";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const FITNESS_AGGREGATE_URL =
  "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate";
const FITNESS_SESSIONS_URL =
  "https://www.googleapis.com/fitness/v1/users/me/sessions";

// Google Fit's fixed activity-type id for sleep sessions.
// https://developers.google.com/fit/rest/v1/reference/activity-types
const SLEEP_ACTIVITY_TYPE = 72;

/** Returns a valid access token, transparently refreshing it via the stored refresh_token if expired. */
async function ensureFreshAccessToken(userId: string): Promise<string> {
  const account = await getGoogleAccount(userId);
  if (!account?.access_token) {
    throw new Error(
      "No Google account connected — sign in with Google to sync data.",
    );
  }

  const expiresInMs = (account.expires_at ?? 0) * 1000 - Date.now();
  const isExpiredOrExpiringSoon = expiresInMs < 60_000;
  if (!isExpiredOrExpiringSoon) return account.access_token;

  if (!account.refresh_token) {
    throw new Error(
      "Google session expired and no refresh token is on file. Sign out and sign in again to re-grant offline access.",
    );
  }

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: account.refresh_token,
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to refresh Google access token (${res.status})`);
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };
  const expiresAt = Math.floor(Date.now() / 1000) + data.expires_in;
  await updateGoogleAccountToken(userId, data.access_token, expiresAt);
  return data.access_token;
}

export interface GoogleFitDaily {
  steps: number;
  activeCalories: number;
  sleepHours: number;
  workoutCompleted: boolean;
}

interface AggregatePoint {
  value?: { intVal?: number; fpVal?: number }[];
}
interface AggregateDataset {
  point?: AggregatePoint[];
}
interface AggregateBucket {
  dataset?: AggregateDataset[];
}
interface AggregateResponse {
  bucket?: AggregateBucket[];
}

interface FitnessSession {
  activityType?: number;
  startTimeMillis?: string;
  endTimeMillis?: string;
}
interface SessionsResponse {
  session?: FitnessSession[];
}

function sumIntValues(dataset: AggregateDataset | undefined): number {
  return (dataset?.point ?? []).reduce(
    (sum, p) => sum + (p.value?.[0]?.intVal ?? 0),
    0,
  );
}

function sumFloatValues(dataset: AggregateDataset | undefined): number {
  return (dataset?.point ?? []).reduce(
    (sum, p) => sum + (p.value?.[0]?.fpVal ?? 0),
    0,
  );
}

/**
 * Pulls steps, active calories, sleep, and whether a workout happened for one
 * calendar day from the real Google Fit REST API (aggregate + sessions).
 * `dateISO` is interpreted in the server's local timezone.
 */
export async function fetchGoogleFitDaily(
  userId: string,
  dateISO: string,
): Promise<GoogleFitDaily> {
  const accessToken = await ensureFreshAccessToken(userId);

  const startTimeMillis = new Date(`${dateISO}T00:00:00`).getTime();
  const endTimeMillis = new Date(`${dateISO}T23:59:59.999`).getTime();

  const aggregateRes = await fetch(FITNESS_AGGREGATE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      // Google returns dataset[i] in the same order as aggregateBy[i].
      aggregateBy: [
        { dataTypeName: "com.google.step_count.delta" },
        { dataTypeName: "com.google.calories.expended" },
      ],
      bucketByTime: { durationMillis: endTimeMillis - startTimeMillis },
      startTimeMillis,
      endTimeMillis,
    }),
  });

  if (!aggregateRes.ok) {
    throw new Error(
      `Google Fit aggregate request failed (${aggregateRes.status})`,
    );
  }

  const aggregateData = (await aggregateRes.json()) as AggregateResponse;
  const bucket = aggregateData.bucket?.[0];
  const steps = sumIntValues(bucket?.dataset?.[0]);
  const activeCalories = sumFloatValues(bucket?.dataset?.[1]);

  const sessionsUrl = new URL(FITNESS_SESSIONS_URL);
  sessionsUrl.searchParams.set(
    "startTime",
    new Date(startTimeMillis).toISOString(),
  );
  sessionsUrl.searchParams.set(
    "endTime",
    new Date(endTimeMillis).toISOString(),
  );

  const sessionsRes = await fetch(sessionsUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!sessionsRes.ok) {
    throw new Error(`Google Fit sessions request failed (${sessionsRes.status})`);
  }
  const sessionsData = (await sessionsRes.json()) as SessionsResponse;

  let sleepMillis = 0;
  let workoutCompleted = false;
  for (const session of sessionsData.session ?? []) {
    const start = Number(session.startTimeMillis ?? 0);
    const end = Number(session.endTimeMillis ?? 0);
    const duration = end - start;
    if (duration <= 0) continue;

    if (session.activityType === SLEEP_ACTIVITY_TYPE) {
      sleepMillis += duration;
    } else {
      workoutCompleted = true;
    }
  }

  return {
    steps: Math.round(steps),
    activeCalories: Math.round(activeCalories),
    sleepHours: Math.round((sleepMillis / 3_600_000) * 10) / 10,
    workoutCompleted,
  };
}
