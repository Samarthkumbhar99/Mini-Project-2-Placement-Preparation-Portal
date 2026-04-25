import dotenv from "dotenv";
import { app } from "./app.js";
import { connectDb } from "./config/db.js";

dotenv.config();
const port = process.env.PORT || 5000;

connectDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  });

