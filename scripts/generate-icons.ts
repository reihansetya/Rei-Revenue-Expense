import sharp from "sharp";
import { mkdirSync, existsSync } from "fs";

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputIcon = "./public/icons/icon-source.png";
const outputDir = "./public/icons";

if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

async function generateIcons() {
  for (const size of sizes) {
    await sharp(inputIcon)
      .resize(size, size)
      .png()
      .toFile(`${outputDir}/icon-${size}x${size}.png`);
    console.log(`Generated: icon-${size}x${size}.png`);
  }

  // Apple touch icon
  await sharp(inputIcon)
    .resize(180, 180)
    .png()
    .toFile(`${outputDir}/apple-touch-icon.png`);
  console.log("Generated: apple-touch-icon.png");

  // Maskable icon (with padding)
  await sharp(inputIcon)
    .resize(512, 512, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(`${outputDir}/maskable-icon-512x512.png`);
  console.log("Generated: maskable-icon-512x512.png");
}

generateIcons().catch(console.error);
