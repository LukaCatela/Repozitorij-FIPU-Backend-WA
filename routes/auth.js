import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import connectToDatabase from "../config/db";

const router = Router();

const db = await connectToDatabase();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
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
