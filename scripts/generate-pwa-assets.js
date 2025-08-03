#!/usr/bin/env node

/**
 * Generate PWA Assets
 * 
 * This script generates placeholder icons and screenshots for the PWA.
 * In a production environment, these should be replaced with actual assets.
 */

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Output directory for generated assets
const outputDir = path.join(__dirname, '../../public/static/images');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`Created directory: ${outputDir}`);
}

// Icon sizes to generate
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Screenshot dimensions
const screenshots = [
  { width: 1280, height: 720, name: 'screenshot1.png', label: 'Dashboard' },
  { width: 750, height: 1334, name: 'screenshot2.png', label: 'Mobile View' }
];

// Generate icons
console.log('Generating icon assets...');
iconSizes.forEach(size => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Draw background
  ctx.fillStyle = '#4a90e2';
  ctx.fillRect(0, 0, size, size);
  
  // Draw "DT" text in the center
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${size * 0.6}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('DT', size / 2, size / 2);
  
  // Save to file
  const buffer = canvas.toBuffer('image/png');
  const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
  fs.writeFileSync(outputPath, buffer);
  console.log(`Generated: ${outputPath}`);
});

// Generate screenshots
console.log('\nGenerating screenshot placeholders...');
screenshots.forEach(({ width, height, name, label }) => {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Draw gradient background
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#4a90e2');
  gradient.addColorStop(1, '#2c5282');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // Add text
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.min(width, height) * 0.08}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Title
  ctx.font = `bold ${Math.min(width, height) * 0.1}px Arial`;
  ctx.fillText('Digital Twin', width / 2, height * 0.3);
  
  // Label
  ctx.font = `normal ${Math.min(width, height) * 0.06}px Arial`;
  ctx.fillText(label, width / 2, height * 0.4);
  
  // Device info
  ctx.font = `normal ${Math.min(width, height) * 0.04}px Arial`;
  ctx.fillText(`${width} × ${height}`, width / 2, height * 0.5);
  
  // Save to file
  const buffer = canvas.toBuffer('image/png');
  const outputPath = path.join(outputDir, name);
  fs.writeFileSync(outputPath, buffer);
  console.log(`Generated: ${outputPath}`);
});

console.log('\nPWA assets generation complete!');
console.log('Replace these placeholder assets with actual design assets in production.');
