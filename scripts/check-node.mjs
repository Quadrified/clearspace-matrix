// Fail fast with a readable message when Node is outside package.json "engines".
// Vite 8 otherwise crashes on old Node with an unhelpful `styleText` import error.
const [major, minor, patch] = process.versions.node.split('.').map(Number);
const supported =
  (major === 22 && (minor > 22 || (minor === 22 && patch >= 1))) || major === 24 || major >= 26;
if (!supported) {
  console.error(
    `Clearspace needs Node.js 24 (or 22.22.1+); you are on ${process.version}.\n` +
      'Run `nvm install && nvm use` (reads .nvmrc), then `npm ci`.',
  );
  process.exit(1);
}
