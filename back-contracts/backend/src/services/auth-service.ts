import bcrypt from "bcryptjs";
import type { UserRole } from "@guacamole/shared";
import { HttpError } from "../lib/http-error.js";
import { signAccessToken } from "../lib/jwt.js";
import { UserRepository } from "../repositories/user-repository.js";

export class AuthService {
  constructor(private readonly users: UserRepository) {}

  async register(input: {
    organizationId: number | null;
    email: string;
    password: string;
    fullName: string;
    role: UserRole;
    walletPublicKey: string;
  }) {
    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await this.users.create({
      organizationId: input.organizationId,
      email: input.email,
      passwordHash,
      fullName: input.fullName,
      role: input.role,
      walletPublicKey: input.walletPublicKey
    });

    return {
      user,
      accessToken: signAccessToken(user)
    };
  }

  async login(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    if (!user) {
      throw new HttpError(401, "Invalid credentials");
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new HttpError(401, "Invalid credentials");
    }

    return {
      user,
      accessToken: signAccessToken(user)
    };
  }
}

