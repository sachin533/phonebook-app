const fs = require('fs');
const path = require('path');

const source = path.join(__dirname, '..', 'client', 'dist');
const target = path.join(__dirname, '..', 'server', 'public');

if (!fs.existsSync(source)) {
  console.error('client/dist does not exist. Run: npm run build:client');
  process.exit(1);
}

fs.rmSync(target, { recursive: true, force: true });
fs.cpSync(source, target, { recursive: true });
console.log(`Copied Vue production build to ${target}`);
