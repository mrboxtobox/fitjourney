import sharp from 'sharp';

// Idaraya - minimalist icon design
// Simple letter 'I' in a clean, modern style
const size = 512;

// Light/app icon - dark 'I' on light background
const appIconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#fafafa"/>
  <text
    x="${size/2}"
    y="${size/2 + 40}"
    font-family="Inter, system-ui, sans-serif"
    font-size="280"
    font-weight="600"
    fill="#1a1a1a"
    text-anchor="middle"
  >I</text>
</svg>`;

// Dark variant for OG image
const darkIconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#0f0f0f"/>
  <text
    x="${size/2}"
    y="${size/2 + 40}"
    font-family="Inter, system-ui, sans-serif"
    font-size="280"
    font-weight="600"
    fill="#fafafa"
    text-anchor="middle"
  >I</text>
</svg>`;

async function generateIcons() {
  // Generate favicon.png (32x32)
  await sharp(Buffer.from(appIconSvg))
    .resize(32, 32)
    .png()
    .toFile('./public/favicon.png');
  console.log('Created favicon.png');

  // Generate apple-touch-icon.png (180x180)
  await sharp(Buffer.from(appIconSvg))
    .resize(180, 180)
    .png()
    .toFile('./public/apple-touch-icon.png');
  console.log('Created apple-touch-icon.png');

  // Generate PWA icons
  await sharp(Buffer.from(appIconSvg))
    .resize(192, 192)
    .png()
    .toFile('./public/pwa-192x192.png');
  console.log('Created pwa-192x192.png');

  await sharp(Buffer.from(appIconSvg))
    .resize(512, 512)
    .png()
    .toFile('./public/pwa-512x512.png');
  console.log('Created pwa-512x512.png');

  // Generate OG image (1200x630)
  const ogSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0f0f0f"/>
  <!-- Logo mark -->
  <text
    x="200"
    y="380"
    font-family="Inter, system-ui, sans-serif"
    font-size="200"
    font-weight="600"
    fill="#fafafa"
    text-anchor="middle"
  >I</text>
  <!-- Text -->
  <text x="350" y="280" font-family="Inter, system-ui, sans-serif" font-size="64" font-weight="600" fill="#fafafa">Idaraya</text>
  <text x="350" y="340" font-family="Inter, system-ui, sans-serif" font-size="24" fill="#666">Minimalist movement practice</text>
  <text x="350" y="400" font-family="Inter, system-ui, sans-serif" font-size="18" fill="#444">McGill Big 3 · Goblet Squat · Farmer's Carry · Hip Mobility</text>
</svg>`;

  await sharp(Buffer.from(ogSvg))
    .png()
    .toFile('./public/og-image.png');
  console.log('Created og-image.png');

  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);
