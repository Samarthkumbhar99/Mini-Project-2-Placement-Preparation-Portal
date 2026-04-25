import mongoose from "mongoose";

const jobRoleSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    title: { type: String, required: true },
    requiredSkills: { type: [String], default: [] },
    preferredSkills: { type: [String], default: [] },
    aptitudeFocus: { type: [String], default: [] },
    coreSubjects: { type: [String], default: [] },
    minCgpa: { type: Number, default: 0 },
    description: { type: String, default: "" }
  },
  { timestamps: true }
);

export const JobRole = mongoose.model("JobRole", jobRoleSchema);

