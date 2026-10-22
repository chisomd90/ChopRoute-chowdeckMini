import { Router } from "express";
import { requireAdmin, verifySession } from "../middlewares/auth.js";
import {
  decideVerificationController,
  getVendorController,
  listVendorsController,
  listUsersController,
  getUserByIdController
} from "../controllers/adminController.js";

const router = Router();

// Every route here is admin-only.
router.use(verifySession, requireAdmin);

router.get("/vendors", listVendorsController); // ?verificationTier=pending for the review queue
router.get("/vendors/:vendorId", getVendorController);
router.post("/vendors/:vendorId/verification", decideVerificationController);
router.get("/", listUsersController);
router.get("/:id", getUserByIdController);

export default router;
