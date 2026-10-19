import { Router } from "express";
import { verifySession, requireRole } from "../middlewares/auth.js";
import {
  getMeController,
  updateMeController,
  listUsersController,
  getUserByIdController,
} from "../controllers/userController.js";

const router = Router();

// Any role: customer, vendor, admin
router.get("/me", getMeController);
router.patch("/me", updateMeController);

// Admin only. "/me" must stay ABOVE "/:id", or Express treats "me" as an id.
router.get("/", requireRole("admin"), listUsersController);
router.get("/:id", requireRole("admin"), getUserByIdController);

export default router;
