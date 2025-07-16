const https = require('https');

// Your Render service URL
const SERVICE_URL = 'https://ade-royal-cbt-backend.onrender.com'; // Replace with your actual URL

function pingService() {
  const url = `${SERVICE_URL}/api/health`;
  
  console.log(`[${new Date().toISOString()}] Pinging service...`);
  
  https.get(url, (res) => {
    console.log(`[${new Date().toISOString()}] Ping successful: ${res.statusCode}`);
  }).on('error', (err) => {
    console.error(`[${new Date().toISOString()}] Ping failed:`, err.message);
  });
}

// Ping every 10 minutes (600,000 ms)
setInterval(pingService, 10 * 60 * 1000);

// Initial ping
pingService();

console.log('Keep-alive service started - pinging every 10 minutes'); 