import jwt from "jsonwebtoken";

export default function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1]; //objasnit
  if (!token) return res.status(401).json({ error: "Nema tokena" });
  try {
  } catch (error) {
    res.status(401).json({ error: "Krivi tokena" });
  }
}
