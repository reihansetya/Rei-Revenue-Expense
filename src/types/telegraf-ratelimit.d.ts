declare module "telegraf-ratelimit" {
  import { Context, Middleware } from "telegraf";

  interface RateLimitOptions {
    window?: number;
    limit?: number;
    keyGenerator?: (ctx: Context) => string | number;
    onLimitExceeded?: (ctx: Context, next: () => Promise<void>) => void;
  }

  function rateLimit(options?: RateLimitOptions): Middleware<Context>;

  export = rateLimit;
}
