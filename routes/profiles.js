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
      study_year: req.body.study_year || "",
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

//PUT   /:userId  -- updejtaj cijeli moj profil (user)
router.put("/:userId", authMiddleware, async (req, res) => {
  if (req.user.id !== req.params.userId)
    return res.status(403).json({ error: "Pristup zabranjen" });

  try {
    const db = await connectToDatabase();
    await db.collection("profiles").updateOne(
      { user_id: new ObjectId(req.params.userId) },
      {
        $set: {
          bio: req.body.bio,
          study_year: req.body.study_year,
          department: req.body.department,
          skill: req.body.skill,
          social: req.body.social,
          updatedAt: new Date(),
        },
      },
    );

    res.status(200).json({ message: "Profil updejtan" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

//PATCH /:userId -- updejt samo parametar koji user posalje
router.patch("/:userId", authMiddleware, async (req, res) => {
  if (req.user.id !== req.params.userId)
    return res.status(403).json({ error: "Pristup zabranjen" });

  try {
    const db = connectToDatabase();
    const updateFields = {};
    if (req.body.bio !== undefined) updateFields.bio = req.body.bio;
    if (req.body.study_year !== undefined)
      updateFields.study_year = req.body.study_year;
    if (req.body.department !== undefined)
      updateFields.department = req.body.department;
    if (req.body.skill !== undefined) updateFields.skill = req.body.skill;
    if (req.body.social !== undefined) updateFields.social = req.body.social;

    await db
      .collection("profiles")
      .updateOne(
        { user_id: new ObjectId(req.params.userId) },
        { $set: updateFields },
      );
    return res.status(200).json({ message: "Uspjesno updejtano" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

//DELETE /:userId  -- izbrisi profil (admin ili user)
router.delete("/:userId", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin" && req.user.id !== req.params.userId)
    return res.status(403).json({ error: "Pristup zabranjen" });

  try {
    const db = await connectToDatabase();
    await db
      .collection("profiles")
      .deleteOne({ user_id: new ObjectId(req.params.userId) });
    res.status(200).json({ message: "Profil izbrisan" });
  } catch (error) {
    res.status(500).json({ error: "Serrver error" });
  }
});

export default router;
