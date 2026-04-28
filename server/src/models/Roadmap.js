import mongoose from "mongoose";

const roadmapItemSchema = new mongoose.Schema(
  {
    week: Number,
    theme: String,
    tasks: [String],
    targetSkills: [String],
    status: { type: String, enum: ["pending", "in-progress", "completed"], default: "pending" }
  },
  { _id: false }
);

const roadmapSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "StudentProfile", required: true, unique: true },
    items: { type: [roadmapItemSchema], default: [] },
    focusAreas: { type: [String], default: [] },
    selectedCompany: {
      companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", default: null },
      companyName: { type: String, default: "" },
      roleId: { type: mongoose.Schema.Types.ObjectId, ref: "JobRole", default: null },
      roleTitle: { type: String, default: "" },
      updatedAt: { type: Date, default: null }
    }
  },
  { timestamps: true }
);

export const Roadmap = mongoose.model("Roadmap", roadmapSchema);

