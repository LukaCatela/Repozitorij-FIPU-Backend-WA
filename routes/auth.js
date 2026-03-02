import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import connectToDatabase from "../config/db.js";
import authMiddleware from "../middleware/auth_middleware.js";
import { ObjectId } from "mongodb";

const router = Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const db = await connectToDatabase();

    const { FirstName, LastName, email, password, role } = req.body;

    if (!FirstName || !LastName || !email || !password)
      return res.status(400).json({ error: "Potrebna sva polja" });

    const existing = await db.collection("users").findOne({ email });
    if (existing) return res.status(400).json({ error: "Email vec postoji" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user_id = (await db.collection("users").count()) + 1;
    const newUser = {
      user_id,
      FirstName,
      LastName,
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
      { id: user.user_id, role: user.role, email: user.email },
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

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const user = await db
      .collection("users")
      .findOne(
        { _id: new ObjectId(req.body.id) },
        { projection: { password: 0 } },
      );
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});
export default router;
