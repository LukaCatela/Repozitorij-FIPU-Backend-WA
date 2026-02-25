import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import connectToDatabase from "../config/db.js";

const router = Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const db = await connectToDatabase();

    const { name, surname, email, password, role } = req.body;

    if (!name || !surname || !email || !password)
      return res.status(400).json({ error: "Potrebna sva polja" });

    const existing = await db.collection("users").findOne({ email });
    if (existing) return res.status(400).json({ error: "Email vec postoji" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      name,
      surname,
      email,
      password: hashedPassword,
      role: role || "gost",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("users").insertOne(newUser);
    res
      .status(201)
      .json({ message: "Korisnik uspjesno kreiran", id: result.insertedId });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Potrebna sva polja" });

    const user = await db.collection("users").findOne({ email });
    if (!user) return res.status(400).json({ error: "Krivi podaci" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Krivi podaci" });

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      token,
      user: { id: user._id, name: user.name, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
