import jwt from "jsonwebtoken";
import type { User } from "@guacamole/shared";
import { env } from "../config/env.js";

export function signAccessToken(user: Pick<User, "id" | "email" | "role">): string {
  return jwt.sign(
    {
      sub: String(user.id),
      email: user.email,
      role: user.role
    },
    env.JWT_SECRET,
    { expiresIn: "12h" }
  );
}

export function verifyAccessToken(token: string): { sub: string; email: string; role: string } {
  return jwt.verify(token, env.JWT_SECRET) as { sub: string; email: string; role: string };
}

