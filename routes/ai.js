import { Router } from "express";
import connectToDatabase from "../config/db.js";
import authMiddleware from "../middleware/auth_middleware.js";

const router = Router();

router.post("/project", authMiddleware, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const { title, description } = req.body;

    const existingProjects = await db
      .collection("projects")
      .find({ isPublic: true })
      .project({ title: 1, description: 1, tags: 1, authorName: 1, _id: 1 })
      .limit(50)
      .toArray();

    const projectList = existingProjects
      .map(
        (p) =>
          `- "${p.title}" od ${p.authorName}: ${p.description?.slice(0, 100)}`,
      )
      .join("\n");

    //spajanje na claude
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 800,
        messages: [
          {
            role: "user",
            content: `Student želi napraviti projekt:
            Naziv: "${title}"
            Opis: "${description}"

            Postojeći projekti na platformi:
            ${projectList || "Nema još projekata."}

            Odgovori na hrvatskom u ovom formatu:
            1. SLIČNI PROJEKTI: Navedi koji postojeći projekti su slični i zašto (ako nema sličnih, reci to)
            2. ŠTO PROJEKT ČINI JEDINSTVENIM: Što student može dodati da se razlikuje od drugih projekata
            3. PRIJEDLOZI ZA RAZVOJ: 3 konkretna prijedloga kako razviti ideju
            4. OPIS: Napiši kratki opis sa ova prethodna 2 poglavlja bez sličnih projekata`,
          },
        ],
      }),
    });
    const data = await response.json();
    console.log("STATUS:", response.status);
    console.log("ANTHROPIC RESPONSE:", JSON.stringify(data)); // add this

    if (!response.ok) {
      return res
        .status(500)
        .json({ error: data.error?.message || "AI req fail" });
    }

    res.json({ feedback: data.content[0].text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
