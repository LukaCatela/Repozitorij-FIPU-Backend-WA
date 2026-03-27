import express from "express";
import cors from "cors";
import connectToDatabase from "./config/db.js";
import helmet from "helmet";
import morgan from "morgan";

import authRouter from "./routes/auth.js";
import profilesRouter from "./routes/profiles.js";
import usersRouter from "./routes/users.js";
import projektiRouter from "./routes/projects.js";
//const express = require('express'); //jer smo stavili u package.json type:module umisto commonjs

const app = express();

const PORT = 3000;
/*app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);*/

app.use(cors());
app.use(express.json());
/*app.use(
  helmet({ crossOriginResourcePolicy: false, contentSecurityPolicy: false }),
); //secures HTTP headers, protects against common attacks -> pojasnjenje

*/
app.use(morgan("dev")); // za laski ispis log ruta

connectToDatabase().then(() => {
  app.use("/users", usersRouter);
  app.use("/projects", projektiRouter);
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
