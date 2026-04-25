import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, "uploads"),
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname);
    cb(null, `${Date.now()}-${file.fieldname}${extension}`);
  }
});

const fileFilter = (_req, file, cb) => {
  const allowed = [".pdf", ".doc", ".docx"];
  const extension = path.extname(file.originalname).toLowerCase();

  if (!allowed.includes(extension)) {
    return cb(new Error("Only PDF, DOC, and DOCX files are allowed."));
  }

  cb(null, true);
};

export const upload = multer({ storage, fileFilter });

