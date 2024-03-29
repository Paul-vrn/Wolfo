import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { SECRET } from "../utils/env";

const extractBearerToken = (headerValue: string) => {
  if (typeof headerValue !== "string") {
    return false;
  }
  const matches = headerValue.match(/(bearer)\s+(\S+)/i);
  return matches && matches[2];
};

export default function checkToken(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization && extractBearerToken(req.headers.authorization);
  if (!token) {
    return res.status(401).json({ message: "Unauthorized", route: req.originalUrl });
  }
  // Véracité du token
  jwt.verify(token, SECRET, (err, _decodedToken) => {
    if (err) {
      res.status(401).json({ message: "Error. Bad token" });
    } else {
      return next();
    }
  });
}
