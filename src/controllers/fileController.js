const User = require("../models/User");
const asyncHandler = require("express-async-handler");
const fs = require("fs");

const { google } = require("googleapis");
const { listFilesFolder, getFilebyId } = require("./drive");

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

// @desc Upload new file
// @route POST /files
// @access Private
const uploadFile = asyncHandler(async (req, res) => {
  // Get the file from the request

  // Get one of the clients
  const client =
    OAuth2Clients[Math.floor(Math.random() * OAuth2Clients.length)];
  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
  );
  oauth2Client.setCredentials(client["tokens"]);
  const drive = google.drive({ version: "v3", auth: oauth2Client });
  // Upload the file
  const requestBody = {
    name: "cat_blue.png",
    fields: "id",
  };
  const media = {
    mimeType: "image/png",
    body: fs.createReadStream("files/cat_blue.png"),
  };
  try {
    const file = await drive.files.create({
      requestBody,
      media: media,
    });
    console.log("File Id:", file.data.id);
    res.json({ message: "File uploaded", file: file.data });
  } catch (error) {
    console.error(error);
  }
});

// @desc Delete a file
// @route DELETE /files
// @access Private
const deleteFile = asyncHandler(async (req, res) => {});

// @desc Get all files from a folder
// @route GET /files/folders/:folderId
// @access Private
const getFolderFiles = asyncHandler(async (req, res) => {
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
    const folderFiles = await listFilesFolder(googleCred.tokens, "root");
    folderFiles.map((file) => files.push(file));
  }
  res.json({ message: `Files from folder: ${folderId}`, files: files });
});

// @desc Get file by id
// @route GET /files/:fileId
// @access Private
const getFile = asyncHandler(async (req, res) => {
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
