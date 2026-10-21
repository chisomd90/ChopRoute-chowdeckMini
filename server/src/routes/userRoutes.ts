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

const router = Router();

router.use(verifySession, requireRole("customer"));

// Any role: customer, vendor, admin
router.get("/me",  getMeController);
router.patch("/me", updateMeController);

export default router;
