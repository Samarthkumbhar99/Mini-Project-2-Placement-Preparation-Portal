export const notFound = (_req, res) => {
  res.status(404).json({ message: "Route not found" });
};

export const errorHandler = (err, _req, res, _next) => {
  console.error(err);
  res.status(err.statusCode || 500).json({
    message: err.message || "Server error"
  });
};

