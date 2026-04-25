import fs from "fs";
import { StudentProfile } from "../models/StudentProfile.js";
import { JobRole } from "../models/JobRole.js";
import { ReadinessReport } from "../models/ReadinessReport.js";
import { Roadmap } from "../models/Roadmap.js";
import { Company } from "../models/Company.js";
import { InterviewSession } from "../models/InterviewSession.js";
import {
  analyzeSkillGap,
  evaluateInterviewAnswer,
  generateInterviewQuestions,
  generateRoadmap,
  parseResume,
  predictReadiness
} from "../services/aiService.js";
import { buildRoleMatches } from "../services/recommendationService.js";

const normalizeList = (items = []) => items.filter(Boolean).map((item) => item.trim()).filter(Boolean);
const getStudentProfile = async (userId) =>
  StudentProfile.findOne({ user: userId }).populate("user", "name email role");

export const getProfile = async (req, res) => {
  const profile = await getStudentProfile(req.user._id);
  res.json(profile);
};

export const updateProfile = async (req, res) => {
  const profile = await getStudentProfile(req.user._id);
  if (!profile) {
    return res.status(404).json({ message: "Student profile not found." });
  }

  const updates = req.body;
  profile.branch = updates.branch ?? profile.branch;
  profile.graduationYear = updates.graduationYear ?? profile.graduationYear;
  profile.cgpa = updates.cgpa ?? profile.cgpa;
  profile.phone = updates.phone ?? profile.phone;
  profile.skills = normalizeList(updates.skills ?? profile.skills);
  profile.projects = normalizeList(updates.projects ?? profile.projects);
  profile.internships = normalizeList(updates.internships ?? profile.internships);
  profile.certifications = normalizeList(updates.certifications ?? profile.certifications);
  await profile.save();
  res.json(profile);
};

export const uploadResume = async (req, res) => {
  const profile = await getStudentProfile(req.user._id);
  if (!profile) {
    return res.status(404).json({ message: "Student profile not found." });
  }
  if (!req.file) {
    return res.status(400).json({ message: "Resume file is required." });
  }

  let extractedText = "";
  try {
    extractedText = fs.readFileSync(req.file.path, "utf8");
  } catch {
    extractedText = `${req.file.originalname} uploaded successfully. Text extraction fallback activated.`;
  }

  const parsed = await parseResume({ text: extractedText, fileName: req.file.originalname });
  profile.resume = {
    fileName: req.file.originalname,
    filePath: req.file.path,
    extractedText,
    extractedSkills: parsed.extracted_skills || [],
    uploadedAt: new Date()
  };
  profile.skills = [...new Set([...(profile.skills || []), ...(parsed.extracted_skills || [])])];
  if (parsed.projects?.length) {
    profile.projects = [...new Set([...(profile.projects || []), ...parsed.projects])];
  }
  await profile.save();

  res.status(201).json({ message: "Resume uploaded and analyzed successfully.", parsed });
};

export const analyzeProfile = async (req, res) => {
  const profile = await getStudentProfile(req.user._id);
  const roles = await JobRole.find().populate("company");
  if (!profile) {
    return res.status(404).json({ message: "Student profile not found." });
  }

  const matches = buildRoleMatches(profile, roles);
  const topMatch = matches[0];
  const combinedRequiredSkills = [
    ...(topMatch?.matchedSkills || []),
    ...(topMatch?.missingSkills || [])
  ];
  const gapAnalysis = await analyzeSkillGap({
    student_skills: profile.skills,
    required_skills: combinedRequiredSkills
  });
  const readiness = await predictReadiness({
    cgpa: profile.cgpa,
    skills: profile.skills,
    projects: profile.projects,
    internships: profile.internships,
    certifications: profile.certifications,
    target_role: topMatch?.roleTitle || ""
  });
  const roadmapPayload = await generateRoadmap({
    missing_skills: gapAnalysis.missing_skills || topMatch?.missingSkills || [],
    strengths: gapAnalysis.strengths || profile.skills.slice(0, 4),
    target_role: topMatch?.roleTitle || "",
    current_skills: profile.skills
  });

  const report = await ReadinessReport.findOneAndUpdate(
    { student: profile._id },
    {
      score: readiness.score,
      category: readiness.category,
      strengths: gapAnalysis.strengths || profile.skills.slice(0, 5),
      weaknesses: gapAnalysis.weak_skills || [],
      missingSkills: gapAnalysis.missing_skills || [],
      recommendations: [
        "Practice aptitude and coding daily",
        "Improve one missing skill per week",
        "Refine project storytelling for interviews"
      ],
      topMatches: matches.slice(0, 5),
      generatedAt: new Date()
    },
    { upsert: true, new: true }
  );

  await Roadmap.findOneAndUpdate(
    { student: profile._id },
    { items: roadmapPayload.items || [], focusAreas: roadmapPayload.focus_areas || [] },
    { upsert: true, new: true }
  );

  profile.strengths = report.strengths;
  profile.weaknesses = report.weaknesses;
  await profile.save();

  res.json({ report, roadmap: roadmapPayload, matches: matches.slice(0, 5) });
};

export const getReadiness = async (req, res) => {
  const profile = await getStudentProfile(req.user._id);
  const report = await ReadinessReport.findOne({ student: profile._id });
  res.json(report);
};

export const getRoadmap = async (req, res) => {
  const profile = await getStudentProfile(req.user._id);
  const roadmap = await Roadmap.findOne({ student: profile._id });
  res.json(roadmap);
};

export const getRecommendations = async (req, res) => {
  const profile = await getStudentProfile(req.user._id);
  const roles = await JobRole.find().populate("company");
  res.json(buildRoleMatches(profile, roles));
};

export const generateInterview = async (req, res) => {
  const profile = await getStudentProfile(req.user._id);
  const { companyId, jobRoleId } = req.body;
  const company = await Company.findById(companyId);
  const role = await JobRole.findById(jobRoleId);

  if (!company || !role) {
    return res.status(404).json({ message: "Company or role not found." });
  }

  const generated = await generateInterviewQuestions({
    student_skills: profile.skills,
    company_name: company.name,
    job_role: role.title
  });

  const session = await InterviewSession.create({
    student: profile._id,
    company: company._id,
    jobRole: role._id,
    questions: (generated.questions || []).map((question) => ({
      prompt: question.prompt,
      type: question.type,
      expectedFocus: question.expected_focus || []
    }))
  });

  res.status(201).json(session);
};

export const evaluateInterview = async (req, res) => {
  const { sessionId, answers } = req.body;
  const session = await InterviewSession.findById(sessionId);
  if (!session) {
    return res.status(404).json({ message: "Interview session not found." });
  }

  const updatedQuestions = [];
  const tips = [];
  let total = 0;

  for (let index = 0; index < session.questions.length; index += 1) {
    const question = session.questions[index];
    const answer = answers?.[index] || "";
    const evaluation = await evaluateInterviewAnswer({
      question: question.prompt,
      answer,
      expected_focus: question.expectedFocus
    });
    updatedQuestions.push({
      ...question.toObject(),
      answer,
      feedback: evaluation.feedback,
      score: Math.round(evaluation.score)
    });
    total += Math.round(evaluation.score);
    tips.push(...(evaluation.improvement_tips || []));
  }

  session.questions = updatedQuestions;
  session.overallScore = updatedQuestions.length ? Math.round(total / updatedQuestions.length) : 0;
  session.improvementTips = [...new Set(tips)].slice(0, 5);
  await session.save();
  res.json(session);
};

