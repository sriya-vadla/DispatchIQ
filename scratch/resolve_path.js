const path = require('path');
const artifactDir = 'C:\\Users\\Sriya\\.gemini\\antigravity\\brain\\6804a32f-ff13-473b-8a0c-7e2a47fb3b50';

const testPaths = [
  '/C:/Users/Sriya/.gemini/antigravity/brain/6804a32f-ff13-473b-8a0c-7e2a47fb3b50/screenshot_layout.png',
  '/Users/Sriya/.gemini/antigravity/brain/6804a32f-ff13-473b-8a0c-7e2a47fb3b50/screenshot_layout.png',
  'screenshot_layout.png',
  '/c/Users/Sriya/.gemini/antigravity/brain/6804a32f-ff13-473b-8a0c-7e2a47fb3b50/screenshot_layout.png',
];

testPaths.forEach(tp => {
  const resolved = path.resolve(tp);
  const resolvedWithRoot = path.resolve(artifactDir, tp);
  console.log(`Input: ${tp}`);
  console.log(`  path.resolve(tp): ${resolved} -> startsWith: ${resolved.startsWith(artifactDir)}`);
  console.log(`  path.resolve(dir, tp): ${resolvedWithRoot} -> startsWith: ${resolvedWithRoot.startsWith(artifactDir)}`);
});
