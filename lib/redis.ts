import { Redis } from "@upstash/redis";

import { env, isRedisConfigured } from "@/lib/env";

export const redis = isRedisConfigured()
  ? new Redis({
      url: env.upstashUrl,
      token: env.upstashToken,
    })
  : null;
