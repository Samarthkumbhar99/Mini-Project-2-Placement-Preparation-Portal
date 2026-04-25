import { Company } from "../models/Company.js";
import { JobRole } from "../models/JobRole.js";
import { StudentProfile } from "../models/StudentProfile.js";
import { ReadinessReport } from "../models/ReadinessReport.js";
import { buildAnalytics } from "../services/analyticsService.js";

export const getCompanies = async (_req, res) => {
  const companies = await Company.find().sort({ createdAt: -1 });
  res.json(companies);
};

export const createCompany = async (req, res) => {
  const company = await Company.create(req.body);
  res.status(201).json(company);
};

export const getJobRoles = async (_req, res) => {
  const roles = await JobRole.find().populate("company").sort({ createdAt: -1 });
  res.json(roles);
};

export const createJobRole = async (req, res) => {
  const role = await JobRole.create(req.body);
  const populated = await role.populate("company");
  res.status(201).json(populated);
};

export const getStudents = async (_req, res) => {
  const students = await StudentProfile.find().populate("user", "name email");
  res.json(students);
};

export const getAnalytics = async (_req, res) => {
  const [students, reports, companies, roles] = await Promise.all([
    StudentProfile.find(),
    ReadinessReport.find(),
    Company.find(),
    JobRole.find()
  ]);
  res.json(buildAnalytics({ students, reports, companies, roles }));
};

