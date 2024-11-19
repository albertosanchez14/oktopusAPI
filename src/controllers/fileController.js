const User = require("../models/User");
const asyncHandler = require("express-async-handler");
const fs = require("fs");
const multer = require("multer");
const crypto = require("crypto");

const { listFilesFolder, getFilebyId, uploadFiletoDrive } = require("./drive");

// @desc Get all files
// @route GET /files
// @access Private
const getAllFiles = asyncHandler(async (req, res) => {
  const username = req.username;
  const email = req.email;
  // Find user in MongoDB
  const foundUser = await User.findOne({
    username: username,
    email: email,
  })
    .lean()
    .exec();
  if (!foundUser) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  // Get all files from the google accounts
  const credentials = foundUser.google_credentials;
  if (!credentials) {
    return res.status(400).json({ message: "No google credentials" });
  }
  const files = new Array();
  for (const googleCred of credentials) {
    const folderFiles = await listFilesFolder(googleCred.tokens, "root");
    folderFiles.map((file) => files.push(file));
  }
  res.json({ message: "Files from home", files: files });
});

// Set storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, `file-${crypto.randomUUID()}.png`);
  },
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 10000000 }, //10MB
});

// @desc Upload new file
// @route POST /files or /folders/:folderId/:fileId
// @access Private
const uploadFile = asyncHandler(async (req, res) => {
  upload.any()(req, res, async function (err) {
    if (err) {
      return res.status(400).json({ message: "Error uploading file" });
    }
    const folderId = req.params.folderId;
    const username = req.username;
    const email = req.email;
    // Find user in MongoDB
    const foundUser = await User.findOne({
      username: username,
      email: email,
    })
      .lean()
      .exec();
    if (!foundUser) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    // Get the google credentials
    const credentials = foundUser.google_credentials;
    if (!credentials) {
      return res.status(400).json({ message: "No google credentials" });
    }
    // Upload the file to the google accounts with space
    let index = 0;
    const googleFiles = [];
    while (index < credentials.length) {
      const googleCred = credentials[index];
      const files = req.files;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const data = await uploadFiletoDrive(googleCred.tokens, file, folderId);
        if (data === undefined) {
          // Error when uploading, trying next account
          index++;
          break;
        } else {
          // File uploaded successfully
          googleFiles.push(data);
          fs.unlinkSync(file.path); // Delete the uploaded file
          files.splice(i, 1); // Remove the uploaded file from the array
          i--; // Adjust index after removing the item
        }
      }
      index = files.length === 0 ? credentials.length : 0;
    }
    res.json({ message: "Files uploaded", files: googleFiles });
  });
});

// @desc Delete a file
// @route DELETE /files
// @access Private
const deleteFile = asyncHandler(async (req, res) => {});

// @desc Get all files from a folder
// @route GET /files/folders/:folderId
// @access Private
const getFolderFiles = asyncHandler(async (req, res) => {
  console.log("Get folder files");
  const folderId = req.params.folderId;
  const username = req.username;
  const email = req.email;
  // Find user in MongoDB
  const foundUser = await User.findOne({
    username: username,
    email: email,
  })
    .lean()
    .exec();
  if (!foundUser) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  // Get the google credentials
  const credentials = foundUser.google_credentials;
  if (!credentials) {
    return res.status(400).json({ message: "No google credentials" });
  }
  // Get all files from the google accounts
  const files = new Array();
  for (const googleCred of credentials) {
    const folderFiles = await listFilesFolder(googleCred.tokens, folderId);
    folderFiles.map((file) => files.push(file));
  }
  res.json({ message: `Files from folder: ${folderId}`, files: files });
});

// @desc Get file by id
// @route GET /files/:fileId or /files/folders/:folderId/:fileId
// @access Private
const getFile = asyncHandler(async (req, res) => {
  console.log("Get file");
  const username = req.username;
  const email = req.email;
  // Find user in MongoDB
  const foundUser = await User.findOne({
    username: username,
    email: email,
  })
    .lean()
    .exec();
  if (!foundUser) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  // Get the file from the google account
  const fileId = req.body.id;
  if (fileId !== req.params.fileId) {
    return res.status(400).json({ message: "File id mismatch" });
  }
  const googleEmails = req.body.owners.map((owner) => owner.emailAddress);
  googleEmails.map(async (email) => {
    const googleCred = foundUser.google_credentials.find(
      (cred) => cred.email === email
    );
    if (googleCred) {
      const data = await getFilebyId(googleCred.tokens, fileId);
      // TODO: Only for testing, remove when done
      const dest = fs.createWriteStream(`${req.body.name}`);
      data
        .on("end", () => console.log("Done."))
        .on("error", (err) => {
          console.log(err);
          return process.exit();
        })
        .pipe(dest);
      //
      res.json({ message: "File retrieved", data });
    }
  });
});

module.exports = {
  getAllFiles,
  uploadFile,
  deleteFile,
  getFolderFiles,
  getFile,
};
