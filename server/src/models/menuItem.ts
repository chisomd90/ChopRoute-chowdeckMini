import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    name: { type: String, required: true },
    priceKobo: { type: Number, required: true },
    description: String,
    category: String,
    isAvailable: { type: Boolean, default: true },
    aiSuggestion: {
      field: String,
      original: String,
      suggestion: String,
      reason: String,
      resolved: { type: Boolean, default: false },
    },
  },
  { timestamps: true },
);

export default mongoose.model("MenuItem", menuItemSchema);
