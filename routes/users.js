import { Router } from "express";
import connectToDatabase from "../config/db.js";

const router = Router();

//GET    /         -- svi useri (admin)
//GET    /:id      -- pojedini user (logged in)
//PUT    /:id      -- updejt user (admin ili user)
//DELETE /:id      -- izbrisi usera (admin)
