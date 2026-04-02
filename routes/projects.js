import { Router } from "express";
import { ObjectId } from "mongodb";
import { body } from "express-validator";
import connectToDatabase from "../config/db.js";
import authMiddleware from "../middleware/auth_middleware.js";
import validate from "../middleware/validate_middleware.js";
import { upload, uploadToCloudinary } from "../config/cloudinary.js";
const router = Router();

// prihvati slike i pdf-ove sa frontenda
const uploadFields = upload.fields([
  { name: "images", maxCount: 10 },
  { name: "pdfs", maxCount: 5 },
]);

// pravila validacije
const projectRules = [
  body("title")
    .notEmpty()
    .withMessage("Naziv je obavezan")
    .isLength({ max: 100 })
    .withMessage("Naziv ne smije biti duži od 100 znakova"),
  body("description")
    .notEmpty()
    .withMessage("Opis je obavezan")
    .isLength({ max: 1000 })
    .withMessage("Opis ne smije biti duži od 1000 znakova"),
];

// POST /projects
router.post(
  "/",
  authMiddleware,
  uploadFields,
  projectRules,
  validate,
  async (req, res) => {
    try {
      const db = await connectToDatabase();
      const tags = req.body.tags
        ? req.body.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

      const user = await db
        .collection("users")
        .findOne({ _id: new ObjectId(req.user.id) });

      const newProject = {
        title: req.body.title,
        description: req.body.description,
        tags,
        isPublic: req.body.isPublic === "true",
        ownerId: new ObjectId(req.user.id),
        authorName: `${user.FirstName} ${user.LastName}`,
        status: "published",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await db.collection("projects").insertOne(newProject);
      const projectId = result.insertedId;
      const mediaFiles = [];
      console.log("BODY:", req.body);
      console.log("FILES:", req.files);

      if (req.files?.images) {
        for (const file of req.files.images) {
          const result = await uploadToCloudinary(
            file.buffer,
            "fipuhub/images",
            "image",
          );
          //console.log("IMAGE UPLOADED:", result.secure_url);
          mediaFiles.push({
            projectId,
            uploadedBy: new ObjectId(req.user.id),
            type: "image",
            originalName: file.originalname,
            url: result.secure_url,
            cloudinary_id: result.public_id,
            size: file.size,
            uploadedAt: new Date(),
          });
        }
      }

      if (req.files?.pdfs) {
        for (const file of req.files.pdfs) {
          const result = await uploadToCloudinary(
            file.buffer,
            "fipuhub/documents",
            "raw",
          );
          console.log("PDF UPLOADED:", result.secure_url);
          mediaFiles.push({
            projectId,
            uploadedBy: new ObjectId(req.user.id),
            type: "pdf",
            originalName: file.originalname,
            url: result.secure_url,
            cloudinary_id: result.public_id,
            size: file.size,
            uploadedAt: new Date(),
          });
        }
      }
      console.log("BODY:", req.body);
      console.log("FILES:", req.files);

      if (mediaFiles.length > 0) {
        await db.collection("media").insertMany(mediaFiles);
        const firstImage = mediaFiles.find((f) => f.type === "image");
        if (firstImage) {
          await db
            .collection("projects")
            .updateOne(
              { _id: projectId },
              { $set: { thumbnail: firstImage.url } },
            );
        }
      }
      res.status(201).json({ message: "Projekt kreiran ✅", id: projectId });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
    }
  },
);

// GET /projects — all public

router.get("/", async (req, res) => {
  try {
    const db = await connectToDatabase();

    const page = parseInt(req.query.page) || 1;
    const limit = 9; // projects per page
    const skip = (page - 1) * limit;

    // build filter
    const filter = { isPublic: true };

    // search by title or description
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: "i" } },
        { description: { $regex: req.query.search, $options: "i" } },
      ];
    }

    // filter by tag
    if (req.query.tag) {
      filter.tags = { $in: [req.query.tag] };
    }

    // get total count for pagination
    const total = await db.collection("projects").countDocuments(filter);

    // get paginated projects
    const projects = await db
      .collection("projects")
      .find(filter)
      .skip(skip)
      .limit(limit)
      .toArray();

    res.status(200).json({ projects, total });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /me - vraca projekte logiranog usera
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const projects = await db
      .collection("projects")
      .find({ ownerId: new ObjectId(req.user.id) })
      .toArray();
    res.status(200).json({ projects });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /projects/user/:userId — by student
router.get("/user/:userId", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const projects = await db
      .collection("projects")
      .find({ ownerId: new ObjectId(req.params.userId) })
      .toArray();
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /projects/:id — single project
router.get("/:id", async (req, res) => {
  try {
    const db = await connectToDatabase();
    const project = await db
      .collection("projects")
      .findOne({ _id: new ObjectId(req.params.id) });
    if (!project)
      return res.status(404).json({ error: "Projekt nije pronađen" });
    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /projects/:id
router.patch("/:id", authMiddleware, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const project = await db
      .collection("projects")
      .findOne({ _id: new ObjectId(req.params.id) });

    if (!project)
      return res.status(404).json({ error: "Projekt nije pronađen" });
    if (project.ownerId.toString() !== req.user.id && req.user.role !== "admin")
      return res.status(403).json({ error: "Pristup zabranjen" });

    const updateFields = {};
    if (req.body.title !== undefined) updateFields.title = req.body.title;
    if (req.body.description !== undefined)
      updateFields.description = req.body.description;
    if (req.body.tags !== undefined)
      updateFields.tags = req.body.tags.split(",").map((t) => t.trim());
    if (req.body.isPublic !== undefined)
      updateFields.isPublic = req.body.isPublic === "true";
    updateFields.updatedAt = new Date();

    await db
      .collection("projects")
      .updateOne({ _id: new ObjectId(req.params.id) }, { $set: updateFields });

    res.status(200).json({ message: "Projekt updejtan ✅" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /projects/:id
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const project = await db
      .collection("projects")
      .findOne({ _id: new ObjectId(req.params.id) });

    if (!project)
      return res.status(404).json({ error: "Projekt nije pronađen" });
    if (project.ownerId.toString() !== req.user.id && req.user.role !== "admin")
      return res.status(403).json({ error: "Pristup zabranjen" });

    await db
      .collection("projects")
      .deleteOne({ _id: new ObjectId(req.params.id) });
    res.status(200).json({ message: "Projekt obrisan" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
