import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { connectDb } from "./config/db.js";
import { User } from "./models/User.js";
import { Company } from "./models/Company.js";
import { JobRole } from "./models/JobRole.js";
import { StudentProfile } from "./models/StudentProfile.js";
import { companies, jobRoles } from "./data/seedData.js";

dotenv.config();

const seed = async () => {
  await connectDb();
  await Promise.all([
    User.deleteMany({}),
    StudentProfile.deleteMany({}),
    Company.deleteMany({}),
    JobRole.deleteMany({})
  ]);

  const adminPassword = await bcrypt.hash("Admin@123", 10);
  await User.create({
    name: "Placement Admin",
    email: "admin@portal.com",
    password: adminPassword,
    role: "admin"
  });

  const createdCompanies = await Company.insertMany(companies);
  const companyMap = Object.fromEntries(createdCompanies.map((company) => [company.name, company._id]));
  await JobRole.insertMany(
    jobRoles.map((role) => ({
      ...role,
      company: companyMap[role.companyName]
    }))
  );

  console.log("Seed completed successfully.");
  process.exit(0);
};

seed().catch((error) => {
  console.error("Seed failed:", error.message);
  process.exit(1);
});

