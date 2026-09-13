/**
 * HireScope — API Router Index (v1)
 */

import { Router } from "express";
import authRoutes from "./auth.routes.js";
import kitsRoutes from "./kits.routes.js";

const router = Router();

router.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
});

router.use("/auth", authRoutes);
router.use("/kits", kitsRoutes);

export default router;
