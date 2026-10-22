import "express";
import "express-session";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role?: string;
      };
    }
  }
}

declare module "express-session" {
  interface SessionData {
    userId: string;
    role?: string;
  }
}
