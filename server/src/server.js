import dotenv from "dotenv";
import { app } from "./app.js";
import { connectDb } from "./config/db.js";

dotenv.config();
const port = process.env.PORT || 5000;

const handleListenError = (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `Port ${port} is already in use. Stop the process using this port or change PORT in server/.env.`
    );
  } else if (error.code === "EACCES") {
    console.error(`Permission denied while trying to use port ${port}.`);
  } else {
    console.error("Server failed to start:", error.message);
  }

  process.exit(1);
};

connectDb()
  .then(() => {
    const server = app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });

    server.on("error", handleListenError);
  })
  .catch((error) => {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  });
