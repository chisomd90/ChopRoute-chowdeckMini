import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    businessName: { type: String, required: true },
    description: String,
    photoUrl: String,
    address: {
      line1: String,
      city: { type: String, default: "Lagos" },
      location: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number], default: [0, 0] },
      },
    },
    verificationTier: {
      type: String,
      enum: ["unverified", "pending", "verified"],
      default: "unverified",
    },
    storefrontStatus: {
      type: String,
      enum: [
        "editing",
        "queued_for_review",
        "rejected",
        "live",
        "queued_for_manual_review",
      ],
      default: "editing",
    },
    orderLimitPerDay: { type: Number, default: 10 },
  },
  { timestamps: true },
);

vendorSchema.index({ "address.location": "2dsphere" });

export default mongoose.model("Vendor", vendorSchema);
