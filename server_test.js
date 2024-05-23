const express = require("express");
const cors = require("cors");
const multer = require("multer");
const crypto = require("crypto");

const app = express();

app.use(cors());

app.get("/", (req, res) => {
  return res.status(200).send("It's working");
});

const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, __dirname + "/uploads");
  },
  filename: function (req, file, callback) {
    // You can write your own logic to define the filename here (before passing it into the callback), e.g:
    console.log(file.buffer); // User-defined filename is available
    const hash = crypto.createHash("sha256");
    hash.update(file.originalname + Date.now());
    const filename = hash.digest("hex");
    callback(null, filename);
    // const filename = `file_${crypto.randomUUID()}`; // Create custom filename (crypto.randomUUID available in Node 19.0.0+ only)
    callback(null, filename);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1048576, // Defined in bytes (1 Mb)
  },
});

// POST endpoint for file upload
app.post("/files/temp", upload.single("file"), (req, res) => {
  // `file` is the name attribute in the form that contains the file input
  // `req.file` contains information about the uploaded file
  console.log(req.file.buffer);
  res.send("File uploaded!");
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
