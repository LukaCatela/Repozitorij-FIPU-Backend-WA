import { Router } from "express";
import connectToDatabase from "../config/db.js";
import { ObjectId } from "mongodb";
import authMiddleware from "../middleware/auth_middleware.js";
import { upload, uploadToCloudinary } from "../config/cloudinary.js";

const router = Router();

// GET /profiles/me
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const me_profile = await db
      .collection("profiles")
      .findOne({ user_id: new ObjectId(req.user.id) });
    if (!me_profile)
      return res.status(404).json({ error: "Profil nije pronađen" });
    res.status(200).json(me_profile);
  } catch (error) {
    console.log("FULL ERROR:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /profiles/me
router.put("/me", authMiddleware, async (req, res) => {
  try {
    const db = await connectToDatabase();
    await db.collection("profiles").updateOne(
      { user_id: new ObjectId(req.user.id) },
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
    const updated = await db
      .collection("profiles")
      .findOne({ user_id: new ObjectId(req.user.id) });
    res.status(200).json(updated);
  } catch (error) {
    console.log("FULL ERROR:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /profiles/img
router.post(
  "/img",
  authMiddleware,
  upload.single("photo"),
  async (req, res) => {
    try {
      const db = await connectToDatabase();
      if (!req.file) return res.status(400).json({ error: "Nema slike" });

      const uploaded = await uploadToCloudinary(
        req.file.buffer,
        "fipuhub/images",
      );
      const photoUrl = uploaded.secure_url;

      await db
        .collection("profiles")
        .updateOne(
          { user_id: new ObjectId(req.user.id) },
          { $set: { profilePicture: photoUrl, updatedAt: new Date() } },
        );
      res.status(200).json({ profilePicture: photoUrl });
    } catch (error) {
      console.log("FULL ERROR:", error);
      res.status(500).json({ error: "Server error" });
    }
  },
);

// POST /profiles/
router.post("/", authMiddleware, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const existing = await db
      .collection("profiles")
      .findOne({ user_id: new ObjectId(req.user.id) });
    if (existing) return res.status(400).json({ error: "Profil vec postoji" });
    const newProfile = {
      user_id: new ObjectId(req.user.id),
      profilePicture: "",
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
    await db.collection("profiles").insertOne(newProfile);
    res.status(201).json({ message: "Profil kreiran!" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /profiles/:userId  (public)
router.get("/:userId", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const profile = await db
      .collection("profiles")
      .findOne({ user_id: new ObjectId(req.params.userId) });
    if (!profile)
      return res.status(404).json({ error: "Profil nije pronađen" });
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /profiles/:userId
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
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
