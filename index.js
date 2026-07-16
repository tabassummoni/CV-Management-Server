import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import createAuthRouter from "./src/routes/auth.js";
import setupGoogleAuth from "./src/config/googleAuth.js";
import cvRouter from "./src/routes/cv.js"; 
dotenv.config();

const app = express();
const prisma = new PrismaClient();

const googleAuthManager = setupGoogleAuth(prisma);
const authRouter = createAuthRouter(googleAuthManager, prisma);

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(googleAuthManager.initialize());
app.use("/api/cv", cvRouter); 

app.get("/", (req, res) => {
  res.json({
    message: "CV Management API is running!",
  });
});

app.use("/api/auth", authRouter);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});