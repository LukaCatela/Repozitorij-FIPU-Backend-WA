import { Router } from "express";
import connectToDatabase from "../config/db";

const router = Router();

const db = await connectToDatabase();
