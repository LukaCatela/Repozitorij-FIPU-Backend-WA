import express from "express";
import cors from "cors";
import connectToDatabase from "./config/db.js";

import authRouter from "./routes/auth.js";
import profilesRouter from "./routes/profiles.js";
import usersRouter from "./routes/users.js";
//import projektiRouter from './routes/projects.js';
//const express = require('express'); //jer smo stavili u package.json type:module umisto commonjs
const router = express.Router();

const app = express();

const PORT = 3000;
app.use(cors());
app.use(express.json());

connectToDatabase().then(() => {
  app.use("/users", usersRouter);
  //app.use("/api/projects", projektiRouter);
  app.use("/auth", authRouter);
  app.use("/profiles", profilesRouter);

  app.listen(PORT, (error) => {
    if (error) {
      console.error(
        `Greška prilikom pokretanja poslužitelja: ${error.message}`,
      );
    } else {
      console.log(`Server dela na portu: ${PORT}`);
    }
  });
});
export default router;
