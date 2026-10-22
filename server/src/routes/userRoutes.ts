import { Router } from "express";
import { verifySession, requireRole } from "../middlewares/auth.js";
import {
  getMeController,
  updateMeController,
  // listCartItemsController,
  // add2CartController,
  // removeFromCartController,
  // listUsersController,
  // getUserByIdController,
  // uploadAvatarController,
} from "../controllers/userController.js";
import {
  loginController,
  logoutController,
  registerController,
} from "../controllers/authController.js";

const router = Router();

// router.use(verifySession, requireRole("customer"));

// Any role: customer, vendor, admin
router.post("/register", registerController);
router.post("/login", loginController);
router.get("/me", verifySession,  getMeController);
router.patch("/me", verifySession, updateMeController);
router.post("/logout", verifySession, logoutController);

export default router;
