import mongoose, { Document, Schema } from "mongoose";

export type AdminActivityAction =
  | "vendor_approved"
  | "vendor_rejected"
  | "vendor_suspended"
  | "vendor_reinstated"
  | "user_suspended"
  | "user_reinstated"
  | "order_cancelled"
  | "refund_approved"
  | "refund_rejected";

export type AdminActivitySubject =
  | "user"
  | "vendor"
  | "order"
  | "refund";

export interface IAdminActivity extends Document {
  actor: mongoose.Types.ObjectId;

  action: AdminActivityAction;

  subjectType: AdminActivitySubject;

  subjectId: mongoose.Types.ObjectId;

  message: string;

  metadata?: Record<string, unknown>;

  createdAt: Date;

  updatedAt: Date;
}

const adminActivitySchema = new Schema<IAdminActivity>(
  {
    actor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    action: {
      type: String,
      enum: [
        "vendor_approved",
        "vendor_rejected",
        "vendor_suspended",
        "vendor_reinstated",
        "user_suspended",
        "user_reinstated",
        "order_cancelled",
        "refund_approved",
        "refund_rejected",
      ],
      required: true,
    },

    subjectType: {
      type: String,
      enum: ["user", "vendor", "order", "refund"],
      required: true,
    },

    subjectId: {
      type: Schema.Types.ObjectId,
      required: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: undefined,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes

adminActivitySchema.index({
  createdAt: -1,
});

adminActivitySchema.index({
  action: 1,
  createdAt: -1,
});

adminActivitySchema.index({
  subjectType: 1,
  subjectId: 1,
  createdAt: -1,
});

// Model

const AdminActivity =
  (mongoose.models.AdminActivity as mongoose.Model<IAdminActivity>) ||
  mongoose.model<IAdminActivity>(
    "AdminActivity",
    adminActivitySchema,
    "admin_activities",
  );

export default AdminActivity;
