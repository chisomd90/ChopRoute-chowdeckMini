import mongoose, { Document, Model, Schema } from "mongoose";

export type UserRole = "customer" | "vendor" | "admin";

export interface IUser extends Document {
  role: UserRole;
  phoneNumber: string;
  isPhoneVerified: boolean;
  fullName?: string;
  email?: string;
  password: string;

  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    location?: {
      type: "Point";
      coordinates: [number, number];
    };
  };

  createdAt: Date;
  updatedAt: Date;

  getFormattedAddress(): string | null;
}

const userSchema = new Schema<IUser>(
  {
    role: {
      type: String,
      enum: ["customer", "vendor", "admin"],
      default: "customer",
      required: true,
    },

    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      trim: true,
    },

    isPhoneVerified: {
      type: Boolean,
      default: false,
    },

    fullName: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
      sparse: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },

    address: {
      street: String,

      city: String,

      state: {
        type: String,
        default: "Lagos",
      },

      zipCode: String,

      country: {
        type: String,
        default: "Nigeria",
      },

      location: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point",
        },

        coordinates: {
          type: [Number],
          default: [0, 0],
        },
      },
    },
  },
  {
    timestamps: true,

    toJSON: {
      virtuals: true,
    },

    toObject: {
      virtuals: true,
    },
  },
);

// Geospatial index
userSchema.index({
  "address.location": "2dsphere",
});

// Format user's address
userSchema.methods.getFormattedAddress = function (): string | null {
  if (!this.address?.street) {
    return null;
  }

  const { street, city, state, zipCode, country } = this.address;

  return `${street}, ${city}, ${state} ${zipCode}, ${country}`;
};

const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);

export default User;
