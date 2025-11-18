#!/usr/bin/env node
/**
 * Create proper PWA assets - icons and screenshots
 * This creates proper sized assets for PWA compliance
 */

const fs = require('fs');
const path = require('path');

// Create a simple SVG icon
const createIcon = (size, filename) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#8b7355" rx="${size * 0.125}"/>
  <text x="${size/2}" y="${size*0.65}" font-family="Arial, sans-serif" font-size="${size*0.4}" font-weight="bold"
        text-anchor="middle" fill="white">I</text>
</svg>`;

  fs.writeFileSync(path.join(__dirname, '..', 'public', filename.replace('.png', '.svg')), svg);
  return svg;
};

// Create a simple screenshot placeholder
const createScreenshot = (width, height, filename, label) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#f5f5dc"/>
  <rect x="20" y="60" width="${width-40}" height="80" fill="#8b7355" rx="8"/>
  <text x="${width/2}" y="110" font-family="Arial, sans-serif" font-size="24" font-weight="bold"
        text-anchor="middle" fill="white">Interlinear</text>
  <rect x="40" y="180" width="${width-80}" height="${height-240}" fill="white" rx="12" stroke="#e0e0e0" stroke-width="2"/>
  <text x="${width/2}" y="220" font-family="Arial, sans-serif" font-size="18"
        text-anchor="middle" fill="#333">${label}</text>
  <text x="${width/2}" y="260" font-family="Arial, sans-serif" font-size="14"
        text-anchor="middle" fill="#666">Click words to learn • AI conversations • Progress tracking</text>
</svg>`;

  fs.writeFileSync(path.join(__dirname, '..', 'public', filename.replace('.png', '.svg')), svg);
  return svg;
};

console.log('Creating PWA assets...');

// Create icons
createIcon(192, 'icon-192x192.png');
createIcon(512, 'icon-512x512.png');
createIcon(180, 'apple-touch-icon.png');

// Create screenshots
createScreenshot(1280, 720, 'screenshot-wide.png', 'Interactive Spanish Reading Experience');
createScreenshot(390, 844, 'screenshot-mobile.png', 'Mobile Language Learning');

console.log('✅ PWA assets created as SVG files');
console.log('Note: For production, convert SVGs to properly sized PNGs');