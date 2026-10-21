import { Router } from "express";
import { requireRole, verifySession } from "../middlewares/auth.js";
import {
  addMenuItemsController,
  deleteMenuItemController,
  getMyMenuController,
  getMyVendorController,
  goLiveController,
  requestVerificationController,
  updateMenuItemController,
  upsertProfileController,
} from "../controllers/vendorController.js";

const router = Router();

// Every route here is vendor-only.
router.use(verifySession, requireRole("vendor"));

router.get("/me", getMyVendorController);
router.put("/me", upsertProfileController);

router.get("/me/menu", getMyMenuController);
router.post("/me/menu", addMenuItemsController);
router.patch("/me/menu/:itemId", updateMenuItemController);
router.delete("/me/menu/:itemId", deleteMenuItemController);

router.post("/me/go-live", goLiveController);
router.post("/me/verification", requestVerificationController);

export default router;
