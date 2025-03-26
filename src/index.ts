import { Hono } from "hono";
import { cors } from "hono/cors";
import { AppVariables } from "./types";
import { API_BASE } from "./config";
import { auth } from "./services/auth";
import { calendarRouter } from "./v1/calendar";

export const app = new Hono<{
  Variables: AppVariables;
}>();

app.use(
  cors({
    origin: ["http://localhost:3000"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.on(["POST", "GET"], "/api/auth/**", (c) => auth.handler(c.req.raw));

app.route(`${API_BASE}/calendar`, calendarRouter);

app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

export default {
  port: 8080,
  fetch: app.fetch,
};
