// Generate PNG launcher icons for all Android densities
// Uses the same "I" design from ic_launcher_foreground.xml
const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');
const path = require('path');

const resDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

// Android mipmap sizes: mdpi=48, hdpi=72, xhdpi=96, xxhdpi=144, xxxhdpi=192
const densities = [
  { name: 'mipmap-mdpi', size: 48 },
  { name: 'mipmap-hdpi', size: 72 },
  { name: 'mipmap-xhdpi', size: 96 },
  { name: 'mipmap-xxhdpi', size: 144 },
  { name: 'mipmap-xxxhdpi', size: 192 },
];

// Geometric "I" for Instrument — matching the adaptive icon foreground
// The adaptive icon has a 108dp viewport with the "I" centered.
// For the legacy PNG, we render at the target size with padding.
function makeSvg(size) {
  // Scale factor from 108dp viewport to target size
  const s = size / 108;
  // Add slight padding for round icon variant
  const pad = size * 0.05;
  const innerSize = size - pad * 2;
  const si = innerSize / 108;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#0A0A0A"/>
  <g transform="translate(${pad}, ${pad}) scale(${si})">
    <!-- Vertical bar -->
    <rect x="48" y="30" width="12" height="48" fill="#F0F0F0"/>
    <!-- Top bar -->
    <rect x="38" y="30" width="32" height="6" fill="#F0F0F0"/>
    <!-- Bottom bar -->
    <rect x="38" y="72" width="32" height="6" fill="#F0F0F0"/>
  </g>
</svg>`;
}

function makeRoundSvg(size) {
  const r = size / 2;
  const s = size / 108;
  const pad = size * 0.12; // more padding for round
  const innerSize = size - pad * 2;
  const si = innerSize / 108;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <circle cx="${r}" cy="${r}" r="${r}" fill="#0A0A0A"/>
  <g transform="translate(${pad}, ${pad}) scale(${si})">
    <rect x="48" y="30" width="12" height="48" fill="#F0F0F0"/>
    <rect x="38" y="30" width="32" height="6" fill="#F0F0F0"/>
    <rect x="38" y="72" width="32" height="6" fill="#F0F0F0"/>
  </g>
</svg>`;
}

for (const { name, size } of densities) {
  const dir = path.join(resDir, name);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  // Square icon
  const svg = makeSvg(size);
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: size } });
  const pngData = resvg.render();
  fs.writeFileSync(path.join(dir, 'ic_launcher.png'), pngData.asPng());

  // Round icon
  const roundSvg = makeRoundSvg(size);
  const resvgRound = new Resvg(roundSvg, { fitTo: { mode: 'width', value: size } });
  const roundPng = resvgRound.render();
  fs.writeFileSync(path.join(dir, 'ic_launcher_round.png'), roundPng.asPng());

  console.log(`${name}: ${size}x${size} — ic_launcher.png + ic_launcher_round.png`);
}

console.log('Done! PNG icons generated for all densities.');
