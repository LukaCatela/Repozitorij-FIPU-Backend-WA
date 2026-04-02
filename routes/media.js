import { Router } from "express";
import connectToDatabase from "../config/db.js";
import { ObjectId } from "mongodb";

const router = Router();

// GET ruta za dohvacanje slika i pdf iz baze
router.get("/:projectId", async (req, res) => {
  const db = await connectToDatabase();
  const files = await db
    .collection("media")
    .find({ projectId: new ObjectId(req.params.projectId) })
    .toArray();
  res.json(files);
});

export default router;
