import bcrypt from "bcryptjs";
import { connectDB, gracefulShutDown } from "../config/database.js";
import User from "../models/user.js";

async function main(): Promise<void> {
  const phoneNumber = process.env.ADMIN_PHONE?.trim();
  const password = process.env.ADMIN_PASSWORD;

  if (!phoneNumber || !password) {
    throw new Error("Set both ADMIN_PHONE and ADMIN_PASSWORD.");
  }
  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD must be at least 8 characters long.");
  }

  await connectDB();

  const existing = await User.findOne({ phoneNumber });
  if (existing) {
    throw new Error(
      `A user with ${phoneNumber} already exists (role: ${existing.role}). ` +
        "To promote an existing account, do it deliberately in mongosh.",
    );
  }

  await User.create({
    role: "admin",
    phoneNumber,
    password: await bcrypt.hash(password, 10),
    isPhoneVerified: true,
  });

  console.log(
    `Admin created for ${phoneNumber}. Log in through the normal login endpoint.`,
  );
}

main()
  .catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await gracefulShutDown();
    process.exit();
  });
