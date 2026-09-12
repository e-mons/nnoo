const fs = require('fs');
const https = require('https');

const token = process.env.SUPABASE_ACCESS_TOKEN || "";
const ref = "hoorlxgtnamwdxszsbwt";

const filename = process.argv[2];
if (!filename) {
  console.error("Please provide a SQL file path.");
  process.exit(1);
}

const query = fs.readFileSync(filename, 'utf-8');
const data = JSON.stringify({ query });

const options = {
  hostname: 'api.supabase.com',
  port: 443,
  path: `/v1/projects/${ref}/database/query`,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = https.request(options, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log("Migration applied successfully!");
      if (body) console.log(body);
    } else {
      console.error(`Failed with status code ${res.statusCode}:`, body);
    }
  });
});
req.on('error', console.error);
req.write(data);
req.end();
