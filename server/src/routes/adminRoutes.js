import { Router } from "express";
import {
  createCompany,
  createJobRole,
  getAnalytics,
  getCompanies,
  getJobRoles,
  getStudents
} from "../controllers/adminController.js";
import { authorize, protect } from "../middleware/auth.js";

const router = Router();
router.use(protect, authorize("admin"));
router.get("/companies", getCompanies);
router.post("/companies", createCompany);
router.get("/job-roles", getJobRoles);
router.post("/job-roles", createJobRole);
router.get("/students", getStudents);
router.get("/analytics", getAnalytics);
export default router;

