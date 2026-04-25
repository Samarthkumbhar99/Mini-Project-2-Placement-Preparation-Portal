import mongoose from "mongoose";

const studentProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    branch: { type: String, default: "" },
    graduationYear: Number,
    cgpa: { type: Number, min: 0, max: 10, default: 0 },
    phone: { type: String, default: "" },
    skills: { type: [String], default: [] },
    projects: { type: [String], default: [] },
    internships: { type: [String], default: [] },
    certifications: { type: [String], default: [] },
    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    resume: {
      fileName: String,
      filePath: String,
      extractedText: String,
      extractedSkills: { type: [String], default: [] },
      uploadedAt: Date
    }
  },
  { timestamps: true }
);

export const StudentProfile = mongoose.model("StudentProfile", studentProfileSchema);

