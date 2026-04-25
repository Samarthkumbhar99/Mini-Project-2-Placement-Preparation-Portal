import mongoose from "mongoose";

const readinessReportSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "StudentProfile", required: true, unique: true },
    score: { type: Number, default: 0 },
    category: { type: String, enum: ["Low", "Medium", "High"], default: "Low" },
    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    missingSkills: { type: [String], default: [] },
    recommendations: { type: [String], default: [] },
    topMatches: { type: [Object], default: [] },
    generatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const ReadinessReport = mongoose.model("ReadinessReport", readinessReportSchema);

