const https = require('https');
const fs = require('fs');

const PROJECT_REF = 'hoorlxgtnamwdxszsbwt';
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || '';

const options = {
  hostname: 'api.supabase.com',
  port: 443,
  path: `/v1/projects/${PROJECT_REF}/types/typescript`,
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${ACCESS_TOKEN}`
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      // The API returns the raw typescript file content directly or wrapped in JSON?
      // Usually it returns the raw string if it's the right accept header, but let's check if it's JSON.
      try {
        const json = JSON.parse(data);
        if (json.types) {
          fs.writeFileSync('packages/supabase/database.types.ts', json.types);
        } else {
          fs.writeFileSync('packages/supabase/database.types.ts', data);
        }
      } catch (e) {
        fs.writeFileSync('packages/supabase/database.types.ts', data);
      }
      console.log('Types generated successfully!');
    } else {
      console.error(`Error: ${res.statusCode} ${data}`);
    }
  });
});

req.on('error', (e) => {
  console.error(e);
});

req.end();
