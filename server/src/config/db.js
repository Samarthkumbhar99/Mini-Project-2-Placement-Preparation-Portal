import mongoose from "mongoose";

export const connectDb = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI is missing from environment variables.");
  }

  await mongoose.connect(mongoUri);
  console.log("MongoDB connected");
};

