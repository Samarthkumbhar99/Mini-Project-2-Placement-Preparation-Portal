import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    prompt: String,
    type: String,
    expectedFocus: [String],
    answer: { type: String, default: "" },
    feedback: { type: String, default: "" },
    score: { type: Number, default: 0 }
  },
  { _id: false }
);

const interviewSessionSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "StudentProfile", required: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    jobRole: { type: mongoose.Schema.Types.ObjectId, ref: "JobRole", required: true },
    questions: { type: [questionSchema], default: [] },
    overallScore: { type: Number, default: 0 },
    improvementTips: { type: [String], default: [] }
  },
  { timestamps: true }
);

export const InterviewSession = mongoose.model("InterviewSession", interviewSessionSchema);

