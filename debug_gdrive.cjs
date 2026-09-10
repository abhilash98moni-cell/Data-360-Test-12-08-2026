const { google } = require('googleapis');
require('dotenv').config();

async function run() {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN || process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
  const accessToken = process.env.GOOGLE_ACCESS_TOKEN;

  console.log("ENV VARS PRESENT:");
  console.log("CLIENT_ID:", !!clientId);
  console.log("CLIENT_SECRET:", !!clientSecret);
  console.log("REFRESH_TOKEN:", !!refreshToken);
  
  try {
    let drive;
    if (clientId && clientSecret && refreshToken) {
      const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
      oauth2Client.setCredentials({
        refresh_token: refreshToken,
        access_token: accessToken
      });
      drive = google.drive({ version: 'v3', auth: oauth2Client });
    } else {
      const auth = new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive']
      });
      drive = google.drive({ version: 'v3', auth });
    }
    
    console.log("Attempting to list files...");
    const res = await drive.files.list({ pageSize: 1 });
    console.log("List success:", res.data.files.length, "files found");
  } catch (err) {
    console.error("GDrive Error:", err.message);
    if (err.response) {
      console.error("GDrive Response Error:", err.response.data);
    }
  }
}
run();
