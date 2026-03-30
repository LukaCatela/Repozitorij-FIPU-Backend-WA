import { Router } from "express";
import connectToDatabase from "../config/db.js";
import authMiddleware from "../middleware/auth_middleware.js";
import roleMiddleware from "../middleware/role_middleware.js";
import { ObjectId } from "mongodb";

const router = Router();

//GET    /         -- svi useri (admin)
router.get("/", authMiddleware, roleMiddleware("admin"), async (req, res) => {
  if (req.user.role !== "admin" && req.user.id !== req.params.userId)
    return res.status(403).json({ error: "Access denied" });

  try {
    const db = await connectToDatabase();
    const users = await db
      .collection("users")
      .find({}, { projection: { password: 0 } })
      .toArray();
    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

//GET    /:id         -- pojedini user
router.get("/:id", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const user = await db
      .collection("users")
      .findOne(
        { _id: new ObjectId(req.params.id) },
        { projection: { password: 0 } },
      );
    if (!user) return res.status(404).json({ error: "Korisnik nije pronađen" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});
//PATCH   /:id      -- updejt user (admin ili user)
router.patch("/:userId", authMiddleware, async (req, res) => {
  if (req.user.id !== req.params.userId)
    return res.status(403).json({ error: "Pristup zabranjen" });

  try {
    const db = await connectToDatabase();
    const updateFields = {};
    if (req.body.FirstName !== undefined)
      updateFields.FirstName = req.body.FirstName;
    if (req.body.LastName !== undefined)
      updateFields.LastName = req.body.LastName;
    if (req.body.email !== undefined) updateFields.email = req.body.email;
    updateFields.updatedAt = new Date();

    await db.collection("users").updateOne(
      { _id: new ObjectId(req.params.userId) }, // ← _id not user_id!
      { $set: updateFields },
    );

    res.status(200).json({ message: "Profil updejtan" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

//DELETE /:id      -- izbrisi usera (admin)
router.delete(
  "/:userId",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const db = await connectToDatabase();
      await db
        .collection("users")
        .deleteOne({ _id: new ObjectId(req.params.userId) });
      res.status(200).json({ message: "Korisnik izbrisan" });
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  },
);

export default router;
