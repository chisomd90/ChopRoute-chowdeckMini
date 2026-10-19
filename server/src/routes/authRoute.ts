import { Router } from "express";
import {
  loginController,
  logoutController,
  registerController,
} from "../controllers/authController.js";
import { verifySession } from "../middlewares/auth.js";

const router = Router();

router.post("/register", registerController);
router.post("/login", loginController);
router.post("/logout", verifySession, logoutController);

export default router;