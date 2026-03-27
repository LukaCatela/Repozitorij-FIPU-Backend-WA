import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import connectToDatabase from "../config/db.js";
import authMiddleware from "../middleware/auth_middleware.js";
import { ObjectId } from "mongodb";
import validate from "../middleware/validate_middleware.js";
import { body } from "express-validator";
import rateLimit from "express-rate-limit";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 15 minutes pauza te 10 pokusaja logina
  max: 2,
  message: { error: "Previše pokušaja, pričekajte 15 minuta" },
});

const registracija_rules = [
  body("FirstName")
    .notEmpty()
    .withMessage("Ime je obavezno")
    .isLength({ min: 2 })
    .withMessage("Ime ne smije imati manje od dva slova"),

  body("LastName")
    .notEmpty()
    .withMessage("Prezime je obavezno")
    .isLength({ min: 2 })
    .withMessage("Prezime mora imati najmanje 2 znaka"),

  body("email")
    .notEmpty()
    .withMessage("Email je obavezan")
    .isEmail()
    .withMessage("Email nije valjan"),

  body("password")
    .notEmpty()
    .withMessage("Lozinka je obavezna")
    .isLength({ min: 6 })
    .withMessage("Lozinka mora imati najmanje 6 znakova"),

  body("role")
    .optional()
    .isIn(["student", "profesor", "admin", "gost"])
    .withMessage("Rola nije valjana"),
];

const login_rules = [
  body("email")
    .notEmpty()
    .withMessage("Email je obavezan")
    .isEmail()
    .withMessage("Email nije valjan"),

  body("password").notEmpty().withMessage("Lozinka je obavezna"),
];

// POST /api/auth/register -- registracija user-a
router.post("/register", registracija_rules, validate, async (req, res) => {
  try {
    const db = await connectToDatabase();

    const { FirstName, LastName, email, password, role, jmbg } = req.body;

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
router.post("/login", authLimiter, login_rules, validate, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const { email, password } = req.body;

    const user = await db.collection("users").findOne({ email });
    if (!user) return res.status(400).json({ error: "Krivi podaci" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Krivi podaci" });

    const token = jwt.sign(
      { id: user._id.toString(), role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    res.json({
      token,
      user: {
        id: user._id,
        FirstName: user.FirstName,
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
