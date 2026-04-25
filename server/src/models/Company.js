import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    domain: { type: String, required: true },
    location: { type: String, required: true },
    salaryRange: { type: String, default: "" },
    minCgpa: { type: Number, default: 0 },
    eligibleBranches: { type: [String], default: [] },
    description: { type: String, default: "" }
  },
  { timestamps: true }
);

export const Company = mongoose.model("Company", companySchema);

