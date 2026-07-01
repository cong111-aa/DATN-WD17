const fs = require("fs");
const path = require("path");
const multer = require("multer");

const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];

const ensureDirectory = (directory) => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
};

const createImageUploader = (folderName) => {
  const uploadDir = path.join(__dirname, "..", "..", "uploads", folderName);
  ensureDirectory(uploadDir);

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const extension = path.extname(file.originalname).toLowerCase();
      const safeName = file.originalname
        .replace(extension, "")
        .replace(/[^a-zA-Z0-9-_]/g, "-")
        .slice(0, 40);

      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}${extension}`);
    },
  });

  return multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(new Error("Only jpg, png and webp images are allowed"));
      }

      cb(null, true);
    },
  });
};

module.exports = { createImageUploader };
