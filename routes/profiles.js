import { Router } from "express";
import connectToDatabase from "../config/db.js";

const router = Router();

// GET /profile/
router.get("/me", async (req, res) => {
  const db = await connectToDatabase();
});

//GET    /:userId  -- vlastiti profil (public, bez tokena)
router.get("/:userID", async (req, res) => {});

//POST   /         -- izradi svoj profil (logged in)
router.post("/", async (req, res) => {});

//PUT    /:userId  -- updejtaj moj profil (user)
router.put("/:userID", async (req, res) => {});

//DELETE /:userId  -- izbrisi profil (admin ili user)
router.delete("/:userID", async (req, res) => {});

export default router;
