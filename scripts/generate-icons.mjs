import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const projectRoot = process.cwd()
const srcSvg = path.join(projectRoot, 'public', 'icons', 'bolt.svg')
const outDir = path.join(projectRoot, 'public', 'icons')

const targets = [
  { name: 'apple-touch-icon-180.png', size: 180 },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'maskable-192.png', size: 192 },
  { name: 'maskable-512.png', size: 512 },
]

async function ensureFileExists(filePath) {
  try {
    await fs.promises.access(filePath, fs.constants.R_OK)
    return true
  } catch {
    return false
  }
}

async function main() {
  const exists = await ensureFileExists(srcSvg)
  if (!exists) {
    console.error(`Source SVG not found at ${srcSvg}`)
    process.exit(1)
  }

  const svgBuffer = await fs.promises.readFile(srcSvg)
  await fs.promises.mkdir(outDir, { recursive: true })

  for (const { name, size } of targets) {
    const outPath = path.join(outDir, name)
    // Render the SVG to the exact square. Our SVG already has a dark rounded background.
    // Increase density for sharper rasterization.
    const png = await sharp(svgBuffer, { density: 384 })
      .resize(size, size, { fit: 'cover' })
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toBuffer()
    await fs.promises.writeFile(outPath, png)
    console.log(`Generated ${name}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})


