import mongoose, {
  type Document,
  type Model,
  Schema,
  type Types,
} from "mongoose";

export interface IMenuItem extends Document {
  vendor: Types.ObjectId;
  name: string;
  priceKobo: number; // money is always stored in kobo
  category?: string;
  description?: string;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const menuItemSchema = new Schema<IMenuItem>(
  {
    vendor: {
      type: Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    priceKobo: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "priceKobo must be a whole number",
      },
    },
    category: { type: String, trim: true },
    description: { type: String, trim: true },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const MenuItem: Model<IMenuItem> = mongoose.model<IMenuItem>(
  "MenuItem",
  menuItemSchema,
);
export default MenuItem;
