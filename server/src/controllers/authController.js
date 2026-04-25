import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { StudentProfile } from "../models/StudentProfile.js";
import { generateToken } from "../utils/generateToken.js";

export const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required." });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: "User already exists." });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashedPassword, role: "student" });
  await StudentProfile.create({ user: user._id });

  res.status(201).json({
    token: generateToken(user._id),
    user: { id: user._id, name: user.name, email: user.email, role: user.role }
  });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  const matches = await bcrypt.compare(password, user.password);
  if (!matches) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  res.json({
    token: generateToken(user._id),
    user: { id: user._id, name: user.name, email: user.email, role: user.role }
  });
};

export const me = async (req, res) => {
  res.json({ user: req.user });
};
