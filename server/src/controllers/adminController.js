import { Company } from "../models/Company.js";
import { InterviewSession } from "../models/InterviewSession.js";
import { JobRole } from "../models/JobRole.js";
import { ReadinessReport } from "../models/ReadinessReport.js";
import { StudentProfile } from "../models/StudentProfile.js";
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
  const [students, reports, interviews] = await Promise.all([
    StudentProfile.find().populate("user", "name email"),
    ReadinessReport.find(),
    InterviewSession.find().sort({ updatedAt: -1 })
  ]);

  const reportMap = new Map(reports.map((report) => [String(report.student), report]));
  const latestInterviewMap = new Map();

  interviews.forEach((session) => {
    const studentId = String(session.student);
    if (!latestInterviewMap.has(studentId)) {
      latestInterviewMap.set(studentId, session);
    }
  });

  const studentSummaries = students.map((student) => {
    const readiness = reportMap.get(String(student._id));
    const latestInterview = latestInterviewMap.get(String(student._id));

    return {
      ...student.toObject(),
      readiness: readiness
        ? {
            score: readiness.score,
            category: readiness.category,
            missingSkills: readiness.missingSkills || [],
            strengths: readiness.strengths || [],
            selectedCompany: readiness.selectedCompany || null,
            generatedAt: readiness.generatedAt
          }
        : null,
      latestInterview: latestInterview
        ? {
            overallScore: latestInterview.overallScore,
            updatedAt: latestInterview.updatedAt
          }
        : null
    };
  });

  res.json(studentSummaries);
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
