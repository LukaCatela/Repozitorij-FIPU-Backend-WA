import { validationResult } from "express-validator";

// provjerava rezultate previla na odredenoj ruti
export default function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}
