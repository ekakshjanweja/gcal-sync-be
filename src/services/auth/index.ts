import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from "../../config";
import { multiSession } from "better-auth/plugins";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  socialProviders: {
    google: {
      clientId: GOOGLE_CLIENT_ID!,
      clientSecret: GOOGLE_CLIENT_SECRET!,
    },
  },
  plugins: [
    multiSession({
      maximumSessions: 5,
    }),
  ],
  trustedOrigins(request) {
    return ["http://localhost:3000"];
  },
});
