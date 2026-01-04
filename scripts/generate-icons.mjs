import sharp from 'sharp';
import { writeFileSync } from 'fs';

// Create a simple fitness icon - coral dumbbell on dark background
const size = 512;
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="80" fill="#0a0a0a"/>
  <!-- Dumbbell icon (simplified) -->
  <g transform="translate(${size/2}, ${size/2})">
    <!-- Bar -->
    <rect x="-140" y="-15" width="280" height="30" rx="15" fill="#FF6B5B"/>
    <!-- Left weight -->
    <rect x="-170" y="-60" width="50" height="120" rx="12" fill="#FF6B5B"/>
    <!-- Right weight -->
    <rect x="120" y="-60" width="50" height="120" rx="12" fill="#FF6B5B"/>
  </g>
</svg>`;

async function generateIcons() {
  // Generate favicon.png (32x32)
  await sharp(Buffer.from(svg))
    .resize(32, 32)
    .png()
    .toFile('./public/favicon.png');
  console.log('Created favicon.png');

  // Generate apple-touch-icon.png (180x180)
  await sharp(Buffer.from(svg))
    .resize(180, 180)
    .png()
    .toFile('./public/apple-touch-icon.png');
  console.log('Created apple-touch-icon.png');

  // Generate PWA icons
  await sharp(Buffer.from(svg))
    .resize(192, 192)
    .png()
    .toFile('./public/pwa-192x192.png');
  console.log('Created pwa-192x192.png');

  await sharp(Buffer.from(svg))
    .resize(512, 512)
    .png()
    .toFile('./public/pwa-512x512.png');
  console.log('Created pwa-512x512.png');

  // Generate OG image (1200x630)
  const ogSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0a0a0a"/>
  <!-- Dumbbell icon -->
  <g transform="translate(200, 315)">
    <rect x="-70" y="-8" width="140" height="16" rx="8" fill="#FF6B5B"/>
    <rect x="-90" y="-35" width="30" height="70" rx="8" fill="#FF6B5B"/>
    <rect x="60" y="-35" width="30" height="70" rx="8" fill="#FF6B5B"/>
  </g>
  <!-- Text -->
  <text x="320" y="290" font-family="Inter, sans-serif" font-size="72" font-weight="800" fill="#fafafa">FitJourney</text>
  <text x="320" y="360" font-family="Inter, sans-serif" font-size="32" fill="rgba(255,255,255,0.6)">52-Week Progressive Fitness Program</text>
</svg>`;

  await sharp(Buffer.from(ogSvg))
    .png()
    .toFile('./public/og-image.png');
  console.log('Created og-image.png');

  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);
