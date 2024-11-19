const fs = require("fs");

const {
  listFilesFolder,
  uploadFiletoDrive,
  getFilebyId,
} = require("./driveService");

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

/**
 * Handles the download of a file from the user's google drive accounts.
 * @param {String} username The username of the user.
 * @param {String} email The email of the user.
 * @param {String} fileId The file ID to download.
 * @param {Array} owners_email The email of the file owners.
 * @returns { message, data } An object containing a message and the file data.
 * @throws { Error } If the user is unauthorized, has no google credentials, or
 * if the file download fails.
 */
async function handleDownload(username, email, fileId, owners_email) {
  // Find user in database
  const foundUser = await User.findOne({
    username: username,
    email: email,
  })
    .lean()
    .exec();
  if (!foundUser) return { message: "Unauthorized" };
  // From the file owners email, find the google credentials that match
  const results = await Promise.all(
    owners_email.map(async (ownerEmail) => {
      const googleCred = foundUser.google_credentials.find(
        (cred) => cred.email === ownerEmail
      );
      if (googleCred) {
        const data = await getFilebyId(googleCred.tokens, fileId);
        // Save the file locally for testing (can be removed later)
        const dest = fs.createWriteStream(`${fileId}.png`);
        // TODO: This only for testing purposes, remove later
        await data
          .on("end", () => console.log("Done downloading."))
          .on("error", (err) => {
            console.error(err);
            process.exit(1);
          })
          .pipe(dest);
        // Return the result when the file is successfully downloaded
        return data;
      }
    })
  );
  // Assume the first valid result
  if (results[0] === undefined)
    return { message: "No valid credentials or download failed" };
  return { message: "File downloaded", data: results[0] };
}

module.exports = { handleListFolderFiles, handleUpload, handleDownload };
