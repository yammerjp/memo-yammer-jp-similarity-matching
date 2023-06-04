import type { Context } from "hono";
export function index(c: Context) {
  return c.json({
    message: "What time is it now?",
  });
}
