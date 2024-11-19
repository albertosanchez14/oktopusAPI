const fs = require("fs");

const { google } = require("googleapis");

/**
 * Lists the names and IDs of all files in the user's homepage Google Drive.
 * @param googleTokens Client tokens.
 * @returns { Array<{ kind, fileExtension, mimeType, parents, owners,
 * size, id, name}> || undefined } An array of file metadata objects.
 */
async function listFilesFolder(tokens, folderId) {
  // Create an OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
  );
  oauth2Client.setCredentials(tokens);
  // Create a drive client
  const drive = google.drive({ version: "v3", auth: oauth2Client });
  // List files
  try {
    const res = await drive.files.list({
      fields:
        "nextPageToken, files(id, name, parents, kind, mimeType, fileExtension, size, properties, owners)",
      q: `'${folderId}' in parents and trashed = false`,
    });
    const files = res.data.files;
    if (files.length === 0) {
      console.log("No files found.");
      return files;
    }
    return files;
  } catch (error) {
    console.error(error);
  }
}

async function getFilebyId(tokens, fileId) {
  // Create an OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
  );
  oauth2Client.setCredentials(tokens);
  // Create a drive client
  const drive = google.drive({ version: "v3", auth: oauth2Client });
  // Get file
  try {
    const res = await drive.files.get(
      { fileId: fileId, alt: "media" },
      { responseType: "stream" }
    );
    const data = res.data;
    return data;
  } catch (error) {
    console.error(error);
  }
}

/**
 * Uploads a file to the user's homepage Google Drive.
 * @param googleTokens Client tokens.
 * @param file The file to upload.
 * @param folderId The folder ID to upload the file to.
 * @returns { id, name } || undefined The metadata of the uploaded
 * file.
 * @throws { Error } If the file cannot be uploaded.
 */
async function uploadFiletoDrive(tokens, file, folderId) {
  // Create an OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
  );
  oauth2Client.setCredentials(tokens);
  // Create a drive client
  const drive = google.drive({ version: "v3", auth: oauth2Client });
  // Upload the file
  const parent = folderId === undefined ? "root" : folderId;
  const requestBody = {
    name: file.originalname,
    fields: "id",
    parents: [parent],
  };
  const media = {
    mimeType: file.mimetype,
    body: fs.createReadStream(file.path),
  };
  try {
    const res = await drive.files.create({
      requestBody,
      media: media,
    });
    return res.data;
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

module.exports = { listFilesFolder, getFilebyId, uploadFiletoDrive };
