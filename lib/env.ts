import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    STRIPE_SECRET_KEY: z.string().startsWith("sk_"),
    STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_"),
    STRIPE_PRICE_CONSUMER_MONTHLY: z.string().startsWith("price_"),
    STRIPE_PRICE_CONSUMER_YEARLY: z.string().startsWith("price_"),
    STRIPE_PRICE_FLEET_MONTHLY: z.string().startsWith("price_"),
    APP_URL: z.string().url(),
  },
  client: {},
  runtimeEnv: {
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_PRICE_CONSUMER_MONTHLY: process.env.STRIPE_PRICE_CONSUMER_MONTHLY,
    STRIPE_PRICE_CONSUMER_YEARLY: process.env.STRIPE_PRICE_CONSUMER_YEARLY,
    STRIPE_PRICE_FLEET_MONTHLY: process.env.STRIPE_PRICE_FLEET_MONTHLY,
    APP_URL: process.env.APP_URL,
  },
});
