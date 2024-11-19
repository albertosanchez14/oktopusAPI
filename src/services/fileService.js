const fs = require("fs");

const { listFilesFolder, uploadFiletoDrive } = require("./driveService");

const User = require("../models/User");

/**
 * Handles the retrieval of all files metadata in the user's homepage drive accounts.
 * @param {String} username The username of the user.
 * @param {String} email The email of the user.
 * @param {String} folderId The folder ID to retrieve files from.
 * @returns { message, files } An object containing a message and an array of files.
 * @throws { Error } If the user is unauthorized or has no google credentials.
 */
async function handleListFolderFiles(username, email, folderId) {
  // Find user in MongoDB
  const foundUser = await User.findOne({
    username: username,
    email: email,
  })
    .lean()
    .exec();
  if (!foundUser) {
    return { message: "Unauthorized" };
  }
  // Get all files from the google accounts
  const credentials = foundUser.google_credentials;
  if (!credentials) {
    return { message: "No google credentials" };
  }
  const files = new Array();
  for (const googleCred of credentials) {
    const folderFiles = await listFilesFolder(googleCred.tokens, folderId);
    folderFiles.map((file) => files.push(file));
  }
  return { message: "Files from home", files: files };
}

/**
 * Handles the upload of files to the user's first google drive account
 * with the specified folder ID.
 * @param {String} username The username of the user.
 * @param {String} email The email of the user.
 * @param {Array} files The files to upload.
 * @param {String} folderId The folder ID to upload the files to.
 * @returns { message, files } An object containing a message and an array of files.
 * @throws { Error } If the user is unauthorized, has no google credentials, or
 * if the file upload fails.
 */
async function handleUpload(username, email, files, folderId) {
  // Validate user in MongoDB
  const foundUser = await User.findOne({ username, email }).lean().exec();
  if (!foundUser) return { message: "Unauthorized" };
  // Get google credentials
  const credentials = foundUser.google_credentials;
  if (!credentials) return { message: "No google credentials" };
  // Upload files to Google Drive
  const googleFiles = [];
  for (const file of files) {
    let success = false;
    for (const googleCred of credentials) {
      try {
        const data = await uploadFiletoDrive(googleCred.tokens, file, folderId);
        if (data) {
          googleFiles.push(data);
          await fs.promises.unlink(file.path); // Delete local file after upload
          success = true;
          break;
        }
      } catch (err) {
        console.error("Error uploading to Google Drive:", err);
        continue; // Try next account if upload fails
      }
    }
    if (!success)
      return { message: `Failed to upload file: ${file.originalname}` };
  }
  return { message: "Files uploaded", files: googleFiles };
}

module.exports = { handleUpload, handleListFolderFiles };
