const { google } = require('googleapis');
require('dotenv').config();

async function run() {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN || process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
  const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  
  try {
    const res = await drive.files.create({
      requestBody: { name: 'test_upload.txt', parents: [rootFolderId] },
      media: { mimeType: 'text/plain', body: 'Hello' },
      fields: 'id'
    });
    console.log("Success:", res.data.id);
  } catch (err) {
    console.log("Error Message:", err.message);
    if (err.response && err.response.data && err.response.data.error) {
      console.log("Detailed Error:", JSON.stringify(err.response.data.error));
    }
  }
}
run();
