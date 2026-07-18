import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let apiKey = '';
try {
  const envContent = fs.readFileSync(path.resolve(__dirname, '.env.local'), 'utf-8');
  const match = envContent.match(/^GEMINI_API_KEY\s*=\s*(.+)$/m);
  if (match) {
    apiKey = match[1].trim();
  }
} catch (e) {
  console.error('Failed to read .env.local file:', e.message);
}

console.log('Using API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'Undefined');

if (!apiKey) {
  console.error('Error: GEMINI_API_KEY is not defined in .env.local');
  process.exit(1);
}

const model = 'gemini-2.0-flash';
const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

const payload = {
  contents: [
    {
      role: 'user',
      parts: [{ text: 'Hello, respond with "OK" if you can hear me.' }]
    }
  ]
};

try {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  console.log('Status:', res.status, res.statusText);
  const text = await res.text();
  console.log('Response:', text);
} catch (err) {
  console.error('Fetch error:', err);
}
