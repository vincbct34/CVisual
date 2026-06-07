/**
 * Generate PWA icons from SVG template.
 * Run: node scripts/generate-icons.mjs
 *
 * Creates PNG icons at 192x192 and 512x512 for both regular and maskable variants.
 * Uses canvas-based rendering (no external dependencies needed beyond Node.js built-ins).
 */

import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");
const iconsDir = join(publicDir, "icons");

// SVG icon - a document/resume icon with the RF monogram
function createSvgIcon(size, maskable = false) {
  const padding = maskable ? Math.round(size * 0.1) : 0;
  const innerSize = size - padding * 2;
  const cx = size / 2;
  const cy = size / 2;

  // Document shape dimensions
  const docW = innerSize * 0.5;
  const docH = innerSize * 0.65;
  const docX = cx - docW / 2;
  const docY = cy - docH / 2;
  const foldSize = docW * 0.22;
  const radius = innerSize * 0.04;

  // Text positioning
  const textSize = innerSize * 0.2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${maskable ? `<rect width="${size}" height="${size}" fill="#2563eb" rx="0"/>` : ""}
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#2563eb"/>
      <stop offset="100%" stop-color="#1d4ed8"/>
    </linearGradient>
  </defs>
  ${!maskable ? `<rect width="${size}" height="${size}" rx="${size * 0.18}" fill="url(#bg)"/>` : ""}
  <!-- Document shape with folded corner -->
  <path d="M${docX + radius} ${docY}
    H${docX + docW - foldSize}
    L${docX + docW} ${docY + foldSize}
    V${docY + docH - radius}
    Q${docX + docW} ${docY + docH} ${docX + docW - radius} ${docY + docH}
    H${docX + radius}
    Q${docX} ${docY + docH} ${docX} ${docY + docH - radius}
    V${docY + radius}
    Q${docX} ${docY} ${docX + radius} ${docY}Z"
    fill="white" fill-opacity="0.95"/>
  <!-- Fold triangle -->
  <path d="M${docX + docW - foldSize} ${docY}
    V${docY + foldSize}
    H${docX + docW}Z"
    fill="white" fill-opacity="0.6"/>
  <!-- RF text -->
  <text x="${cx}" y="${cy + textSize * 0.1}"
    font-family="system-ui, -apple-system, sans-serif"
    font-weight="800"
    font-size="${textSize}"
    fill="#2563eb"
    text-anchor="middle"
    dominant-baseline="middle">RF</text>
  <!-- Lines representing text -->
  <line x1="${docX + docW * 0.15}" y1="${cy + docH * 0.28}"
        x2="${docX + docW * 0.85}" y2="${cy + docH * 0.28}"
        stroke="#2563eb" stroke-opacity="0.3" stroke-width="${innerSize * 0.015}" stroke-linecap="round"/>
  <line x1="${docX + docW * 0.15}" y1="${cy + docH * 0.36}"
        x2="${docX + docW * 0.65}" y2="${cy + docH * 0.36}"
        stroke="#2563eb" stroke-opacity="0.2" stroke-width="${innerSize * 0.015}" stroke-linecap="round"/>
</svg>`;
}

// Write SVG files (can be used as-is or converted to PNG)
const sizes = [192, 512];

for (const size of sizes) {
  const regular = createSvgIcon(size, false);
  const maskable = createSvgIcon(size, true);

  writeFileSync(join(iconsDir, `icon-${size}.svg`), regular);
  writeFileSync(join(iconsDir, `icon-maskable-${size}.svg`), maskable);

  console.log(`Generated icon-${size}.svg and icon-maskable-${size}.svg`);
}

// Create favicon.svg
const favicon = createSvgIcon(32, false);
writeFileSync(join(publicDir, "favicon.svg"), favicon);
console.log("Generated favicon.svg");

console.log(
  "\nNote: For production, convert SVGs to PNGs using an image tool.",
);
console.log(
  "The manifest references .png files - update to .svg if using SVGs directly.",
);
