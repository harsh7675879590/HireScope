/**
 * HireScope — Auth Service
 */

import bcrypt from "bcryptjs";
import { userRepository } from "../persistence/repositories/user.repository.js";
import { ok, err } from "../utils/result.js";

export class AuthService {
  constructor(repo = userRepository) {
    this.repo = repo;
  }

  async register(email, password) {
    const existing = await this.repo.findByEmail(email);
    if (existing) {
      return err({ code: "EMAIL_EXISTS", message: "Email is already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await this.repo.create({
      email,
      passwordHash
    });

    return ok({
      id: user._id.toString(),
      email: user.email,
      createdAt: user.createdAt
    });
  }

  async login(email, password) {
    const user = await this.repo.findByEmail(email);
    if (!user) {
      return err({ code: "INVALID_CREDENTIALS", message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return err({ code: "INVALID_CREDENTIALS", message: "Invalid email or password" });
    }

    return ok({
      id: user._id.toString(),
      email: user.email,
      createdAt: user.createdAt
    });
  }

  async getUser(id) {
    const user = await this.repo.findById(id);
    if (!user) {
      return err({ code: "USER_NOT_FOUND", message: "User not found" });
    }
    return ok({
      id: user._id.toString(),
      email: user.email,
      createdAt: user.createdAt
    });
  }
}

export const authService = new AuthService();
