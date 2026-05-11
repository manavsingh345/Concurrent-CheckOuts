import { createHash } from "node:crypto";

import { IDEMPOTENCY_TTL_SECONDS } from "@/lib/constants";
import { redis } from "@/lib/redis";

type CachedPayload<T> = {
  status: number;
  body: T;
};

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function buildIdempotencyCacheKey(key: string, body: unknown) {
  const bodyHash = sha256(JSON.stringify(body));

  return `reservation:idempotency:${sha256(key)}:${bodyHash}`;
}

export async function getCachedMutation<T>(cacheKey: string) {
  if (!redis) {
    return null;
  }

  return redis.get<CachedPayload<T>>(cacheKey);
}

export async function setCachedMutation<T>(
  cacheKey: string,
  payload: CachedPayload<T>,
) {
  if (!redis) {
    return;
  }

  await redis.set(cacheKey, payload, { ex: IDEMPOTENCY_TTL_SECONDS });
}
