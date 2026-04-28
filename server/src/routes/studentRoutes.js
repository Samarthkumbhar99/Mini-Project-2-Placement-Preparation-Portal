import { Router } from "express";
import {
  analyzeSelectedCompany,
  analyzeProfile,
  evaluateInterview,
  generateInterview,
  getAIInsights,
  createStudentGoal,
  getStudentGoalsList,
  updateGoal,
  removeGoal,
  getGoalsAnalytics,
  getGoalAlerts,
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
router.post("/company-analysis", analyzeSelectedCompany);
router.get("/readiness", getReadiness);
router.get("/roadmap", getRoadmap);
router.get("/recommendations", getRecommendations);
router.post("/interview/generate", generateInterview);
router.post("/interview/evaluate", evaluateInterview);
router.get("/ai-insights", getAIInsights);
router.post("/goals", createStudentGoal);
router.get("/goals", getStudentGoalsList);
router.put("/goals/:goalId", updateGoal);
router.delete("/goals/:goalId", removeGoal);
router.get("/goals/analytics", getGoalsAnalytics);
router.get("/goals/alerts", getGoalAlerts);
export default router;

