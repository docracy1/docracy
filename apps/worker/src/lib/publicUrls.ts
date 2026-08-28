import type { Env } from "@docracy/shared";

type AppUrlEnv = Pick<Env, "PUBLIC_APP_URL">;

export function publicAppUrl(env: AppUrlEnv): string {
  return env.PUBLIC_APP_URL.replace(/\/$/, "");
}

export function publicAppHost(env: AppUrlEnv): string {
  return new URL(env.PUBLIC_APP_URL).host;
}
