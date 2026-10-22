import mongoose, {
  type Document,
  type Model,
  Schema,
  type Types,
} from "mongoose";

export type VerificationTier = "unverified" | "pending" | "verified";
export type StorefrontStatus = "editing" | "live";

export interface IVendor extends Document {
  owner: Types.ObjectId;
  businessName: string;
  description?: string;
  photoUrl?: string;
  address: {
    street: string;
    city: string;
    state: string;
    location: { type: "Point"; coordinates: [number, number] }; // [lng, lat]
  };
  verificationTier: VerificationTier;
  storefrontStatus: StorefrontStatus;
  orderLimitPerDay: number;
  verification: {
    registrationNumber?: string; // e.g. CAC number, submitted by the vendor
    note?: string; // vendor's message to the reviewer
    submittedAt?: Date;
    reviewedAt?: Date;
    reviewedBy?: Types.ObjectId; // the admin who decided
    decisionNote?: string; // admin's reason, shown to the vendor
  };
  createdAt: Date;
  updatedAt: Date;
}

const vendorSchema = new Schema<IVendor>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    businessName: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    photoUrl: String,
    address: {
      street: { type: String, required: true, trim: true },
      city: { type: String, required: true, default: "Lagos" },
      state: { type: String, required: true, default: "Lagos" },
      location: {
        type: { type: String, enum: ["Point"], required: true },
        coordinates: { type: [Number], required: true },
      },
    },
   
    verificationTier: {
      type: String,
      enum: ["unverified", "pending", "verified"],
      default: "unverified",
    },
    storefrontStatus: {
      type: String,
      enum: ["editing", "live"],
      default: "editing",
    },
    orderLimitPerDay: { type: Number, default: 10 },
    verification: {
      registrationNumber: { type: String, trim: true },
      note: { type: String, trim: true },
      submittedAt: Date,
      reviewedAt: Date,
      reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
      decisionNote: { type: String, trim: true },
    },
  },
  { timestamps: true },
);

vendorSchema.index({ "address.location": "2dsphere" });

const Vendor: Model<IVendor> = mongoose.model<IVendor>("Vendor", vendorSchema);
export default Vendor;
