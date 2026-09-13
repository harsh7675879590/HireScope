/**
 * HireScope — Auth Controller
 */

import { authService } from "../services/auth.service.js";
import { RegisterRequestSchema, LoginRequestSchema } from "../shared/types/api-contracts.js";

export async function register(req, res, next) {
  try {
    const validated = RegisterRequestSchema.parse(req.body);
    const result = await authService.register(validated.email, validated.password);

    if (!result.ok) {
      return res.status(409).json({ error: result.error.message, code: result.error.code });
    }

    // Save session
    req.session.userId = result.value.id;
    return res.status(201).json(result.value);
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const validated = LoginRequestSchema.parse(req.body);
    const result = await authService.login(validated.email, validated.password);

    if (!result.ok) {
      return res.status(401).json({ error: result.error.message, code: result.error.code });
    }

    req.session.userId = result.value.id;
    return res.status(200).json(result.value);
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res, next) {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie("connect.sid");
    return res.status(200).json({ message: "Successfully logged out" });
  });
}

export async function getCurrentUser(req, res, next) {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const result = await authService.getUser(req.session.userId);
    if (!result.ok) {
      return res.status(404).json({ error: result.error.message });
    }

    return res.status(200).json(result.value);
  } catch (err) {
    next(err);
  }
}
