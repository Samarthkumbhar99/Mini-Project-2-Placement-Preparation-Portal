import { Router } from "express";
import {
  analyzeProfile,
  evaluateInterview,
  generateInterview,
  getProfile,
  getReadiness,
  getRecommendations,
  getRoadmap,
  updateProfile,
  uploadResume
} from "../controllers/studentController.js";
import { authorize, protect } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();
router.use(protect, authorize("student"));
router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.post("/resume", upload.single("resume"), uploadResume);
router.post("/analyze", analyzeProfile);
router.get("/readiness", getReadiness);
router.get("/roadmap", getRoadmap);
router.get("/recommendations", getRecommendations);
router.post("/interview/generate", generateInterview);
router.post("/interview/evaluate", evaluateInterview);
export default router;

