import fs from "fs";
import path from "path";
import zlib from "zlib";

// CRC32 implementation for PNG chunks
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcPayload = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(crcPayload);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function createPng(width, height, drawPixel) {
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = makeChunk("IHDR", ihdrData);

  // Raw Scanlines: (1 + width * 4) per row
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter byte: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawPixel(x, y, width, height);
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  // IDAT
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk("IDAT", compressed);

  // IEND
  const iendChunk = makeChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Drawing VIRA Brand Icon (Premium dark rounded badge with vibrant Teal to Amber 'V')
function drawViraIcon(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;

  // Normalized coords [-1, 1]
  const nx = (x - cx) / (w / 2);
  const ny = (y - cy) / (h / 2);

  // Rounded squircle / box mask with radius ~ 0.88
  const cornerR = 0.22;
  const boxW = 0.90;
  const boxH = 0.90;
  const dx = Math.max(0, Math.abs(nx) - (boxW - cornerR));
  const dy = Math.max(0, Math.abs(ny) - (boxH - cornerR));
  const dist = Math.sqrt(dx * dx + dy * dy);
  const inBox = dist <= cornerR;

  if (!inBox) {
    return [0, 0, 0, 0]; // Transparent background outside rounded rect
  }

  // Deep cosmic background gradient (#070B14 to #0E1A2D)
  const bgGrad = (ny + 1) / 2;
  let r = Math.round(7 + bgGrad * 7);
  let g = Math.round(11 + bgGrad * 15);
  let b = Math.round(20 + bgGrad * 25);
  let a = 255;

  // Thin outer border highlight
  if (dist >= cornerR - 0.02 && dist <= cornerR) {
    return [255, 255, 255, 40];
  }

  // Subtle ambient teal glow around center
  const centerDist = Math.sqrt(nx * nx + ny * ny);
  if (centerDist < 0.7) {
    const glow = (1 - centerDist / 0.7) * 0.25;
    r = Math.round(r + 31 * glow);
    g = Math.round(g + 111 * glow);
    b = Math.round(b + 107 * glow);
  }

  // Render Elegant 'V' Glyph
  // V vertices: Left top (-0.46, -0.42), Center bottom (0.0, 0.44), Right top (0.46, -0.42)
  const leftX = -0.46;
  const rightX = 0.46;
  const topY = -0.44;
  const botY = 0.44;
  const stroke = 0.13;

  // Check distance to Left leg: line from (-0.46, -0.44) to (0.0, 0.44)
  const distSegment = (px, py, x1, y1, x2, y2) => {
    const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    if (l2 === 0) return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    const projX = x1 + t * (x2 - x1);
    const projY = y1 + t * (y2 - y1);
    return Math.sqrt((px - projX) * (px - projX) + (py - projY) * (py - projY));
  };

  const dLeft = distSegment(nx, ny, leftX, topY, 0.0, botY);
  const dRight = distSegment(nx, ny, rightX, topY, 0.0, botY);
  const minD = Math.min(dLeft, dRight);

  if (minD <= stroke) {
    // Distance from center line for smooth antialiasing
    const edge = Math.max(0, Math.min(1, (stroke - minD) / 0.025));

    // Gradient along V: Left is vibrant desk-teal (#1F6F6B -> #2DD4BF), Right is warm desk-amber (#E0A458 -> #FBBF24)
    const tH = (nx + 0.5); // 0 to 1
    const glyphR = Math.round(31 * (1 - tH) + 224 * tH);
    const glyphG = Math.round(111 * (1 - tH) + 164 * tH);
    const glyphB = Math.round(107 * (1 - tH) + 88 * tH);

    r = Math.round(r * (1 - edge) + glyphR * edge);
    g = Math.round(g * (1 - edge) + glyphG * edge);
    b = Math.round(b * (1 - edge) + glyphB * edge);
  }

  // Small luminous orbit dot above right arm (reminiscent of the VIRA / Orbit concept)
  const dotX = 0.34;
  const dotY = -0.44;
  const dotR = 0.055;
  const dDot = Math.sqrt((nx - dotX) * (nx - dotX) + (ny - dotY) * (ny - dotY));
  if (dDot <= dotR) {
    const edge = Math.max(0, Math.min(1, (dotR - dDot) / 0.015));
    r = Math.round(r * (1 - edge) + 224 * edge);
    g = Math.round(g * (1 - edge) + 164 * edge);
    b = Math.round(b * (1 - edge) + 88 * edge);
  }

  return [r, g, b, a];
}

// Generate public/icon-192.png
const png192 = createPng(192, 192, drawViraIcon);
fs.writeFileSync(path.join(process.cwd(), "public", "icon-192.png"), png192);
console.log("✅ Generated public/icon-192.png (192x192, " + png192.length + " bytes)");

// Generate public/icon-512.png
const png512 = createPng(512, 512, drawViraIcon);
fs.writeFileSync(path.join(process.cwd(), "public", "icon-512.png"), png512);
console.log("✅ Generated public/icon-512.png (512x512, " + png512.length + " bytes)");

// Generate public/favicon.ico (Valid 32x32 ICO wrapper)
const png32 = createPng(32, 32, drawViraIcon);
fs.writeFileSync(path.join(process.cwd(), "public", "favicon-32.png"), png32);

// Standard ICO format containing 1 image (PNG embedded)
const icoHeader = Buffer.alloc(6);
icoHeader.writeUInt16LE(0, 0); // Reserved
icoHeader.writeUInt16LE(1, 2); // Type 1 = ICO
icoHeader.writeUInt16LE(1, 4); // Number of images = 1

const icoDir = Buffer.alloc(16);
icoDir.writeUInt8(32, 0); // Width
icoDir.writeUInt8(32, 1); // Height
icoDir.writeUInt8(0, 2);  // Palette size
icoDir.writeUInt8(0, 3);  // Reserved
icoDir.writeUInt16LE(1, 4); // Color planes
icoDir.writeUInt16LE(32, 6); // Bits per pixel
icoDir.writeUInt32LE(png32.length, 8); // Size of image data
icoDir.writeUInt32LE(22, 12); // Offset to image data (6 + 16 = 22)

const icoFile = Buffer.concat([icoHeader, icoDir, png32]);
fs.writeFileSync(path.join(process.cwd(), "public", "favicon.ico"), icoFile);
console.log("✅ Generated public/favicon.ico (" + icoFile.length + " bytes)");
