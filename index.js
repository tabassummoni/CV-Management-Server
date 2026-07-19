import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import createAuthRouter from "./src/routes/auth.js";
import setupGoogleAuth from "./src/config/googleAuth.js";
import cvRouter from "./src/routes/cv.js"; 
import positionRoutes from "./src/routes/position.js";
import attributeRoutes from "./src/routes/attribute.js";
import applicationCvRoutes from "./src/routes/applicationCv.js";
import adminRouter from "./src/routes/routes/admin.js";

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
app.use("/api/position", positionRoutes);
app.use("/api/attribute", attributeRoutes);
app.use('/api/applications', applicationCvRoutes);
app.use('/api/admin', adminRouter);
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