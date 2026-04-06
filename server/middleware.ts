import jwt from "jsonwebtoken";

const COOKIE_SECRET = process.env.COOKIE_SECRET || "exotech_industrial_secret_v1";

export const verifySession = (req: any, res: any, next: any) => {
  const uid = req.signedCookies.user_uid;
  if (!uid) return res.status(401).json({ error: "Unauthorized" });

  req.uid = uid;
  next();
};
