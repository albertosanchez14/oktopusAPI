// APP
const { google } = require("googleapis");
const fs = require("fs");
const { listFiles, authorize } = require("./drive");

const express = require("express");
const app = express();

const dotenv = require("dotenv");
dotenv.config();

let index;

let oauth2Clients = [];

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);
const oauth2Client2 = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

try {
  const creds = fs.readFileSync("credentials/credentials.json");
  oauth2Client.setCredentials(JSON.parse(creds));
  oauth2Client2.setCredentials(JSON.parse(creds));
} catch (err) {
  console.log(err);
}

app.get("/auth/google/:id", async (req, res) => {
  // const client = await authorize();
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/drive"],
  });
  index = req.params.id;
  res.redirect(url);
});

app.get("/google/redirect", async (req, res) => {
  // TODO: Refactor this to use a single function
  if (index == 1) {
    console.log("Redirected from Google");
    const { code } = req.query;
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    fs.writeFileSync("credentials/token.json", JSON.stringify(tokens));
  } else {
    console.log("Redirected from Google2");
    const { code } = req.query;
    const { tokens } = await oauth2Client2.getToken(code);
    oauth2Client2.setCredentials(tokens);
    fs.writeFileSync("credentials/token2.json", JSON.stringify(tokens));
  }  
  res.send("You are now authenticated with Google");
});

app.get("/list", async (req, res) => {
  const file_list = await listFiles(oauth2Client);
  const file_list2 = await listFiles(oauth2Client2);
  res.send("Files1: " + file_list + "Files2: " + file_list2);
});

app.get("/retrieve/:fileid", (req, res) => {
  const fileId = req.params.fileid;
  
  res.send("File ID: " + fileId);
});

app.listen(8000, () => {
  console.log("Server is running on port 8000");
});
