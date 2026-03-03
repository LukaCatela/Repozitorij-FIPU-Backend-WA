import { Router } from "express";
import connectToDatabase from "../config/db.js";
import { ObjectId } from "mongodb";
import authMiddleware from "../middleware/auth_middleware.js";

const router = Router();

// GET /profile/
//router.get("/me", async (req, res) => {});

//GET    /:userId  -- vlastiti profil (public, bez tokena)
router.get("/:userId", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const profile = await db
      .collection("profiles")
      .findOne({ user_id: new ObjectId(req.params.userId) });

    if (!profile)
      return res.status(404).json({ error: "Profil nije pronađen" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

//POST   /         -- izradi svoj profil (logged in)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const newProfile = {
      user_id: new ObjectId(req.user.id),
      bio: req.body.bio || "",
      study_year: req.body.department || "",
      department: req.body.department || "",
      skill: req.body.skill || [],
      social: {
        github: req.body.github || "",
        linkedin: req.body.linkedin || "",
        web: req.body.web || "",
      },
      isPublic: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const rezultat = await db.collection("profiles").insertOne(newProfile);
    res.status(201).json({ message: "Profil kreiran!" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

//PUT    /:userId  -- updejtaj moj profil (user)
router.put("/:userID", async (req, res) => {});

//DELETE /:userId  -- izbrisi profil (admin ili user)
router.delete("/:userID", async (req, res) => {});

export default router;
