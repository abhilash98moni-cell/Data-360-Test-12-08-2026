require('dotenv').config();
console.log("Token length:", (process.env.GOOGLE_REFRESH_TOKEN || "").length);
