import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import connectToDatabase from "../config/db.js";
import authMiddleware from "../middleware/auth_middleware.js";
import { ObjectId } from "mongodb";

const router = Router();

// POST /api/auth/register -- registracija user-a
router.post("/register", async (req, res) => {
  try {
    const db = await connectToDatabase();

    const { FirstName, LastName, email, password, role, jmbg } = req.body;

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
      jmbg: jmbg || "-",
      role: role || "gost",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("users").insertOne(newUser);

    await db.collection("profiles").insertOne({
      user_id: result.insertedId,
      bio: "",
      study_year: "",
      department: "",
      skill: [],
      social: {
        github: "",
        linkedin: "",
        web: "",
      },
      profilePicture: null,
      isPublic: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    res
      .status(201)
      .json({ message: "Korisnik uspjesno kreiran", id: result.insertedId });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/auth/login -- login user-a
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
      { id: user._id.toString(), role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.FirstName,
        last_name: user.LastName,
        role: user.role,
      },
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
        { _id: new ObjectId(req.user.id) },
        { projection: { password: 0 } },
      );
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});
export default router;
