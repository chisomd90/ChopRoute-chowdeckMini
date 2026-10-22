import { NextFunction, Request, Response, RequestHandler } from "express";

const tryCatchWrapper = (fn: RequestHandler): RequestHandler => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

export default tryCatchWrapper;
