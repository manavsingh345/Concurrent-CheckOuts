import { DEFAULT_RESERVATION_TTL_MINUTES } from "@/lib/constants";

function toNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const env = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  upstashUrl: process.env.UPSTASH_REDIS_REST_URL ?? "",
  upstashToken: process.env.UPSTASH_REDIS_REST_TOKEN ?? "",
  cronSecret: process.env.CRON_SECRET ?? "",
  razorpayKeyId: process.env.RAZORPAY_KEY_ID ?? "",
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET ?? "",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  reservationTtlMinutes: toNumber(
    process.env.RESERVATION_TTL_MINUTES,
    DEFAULT_RESERVATION_TTL_MINUTES,
  ),
};

export function isRedisConfigured() {
  return Boolean(env.upstashUrl && env.upstashToken);
}

export function isRazorpayConfigured() {
  return Boolean(env.razorpayKeyId && env.razorpayKeySecret);
}
