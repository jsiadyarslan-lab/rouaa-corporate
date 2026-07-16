#!/usr/bin/env node
// Pre-generate all images from a scenes JSON and save them to disk
// Then enriches the JSON with imageBase64 for the renderer to use

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { generateImage } from './image-gen-local.mjs';

async function main() {
  const input = process.argv[2];
  const imagesDir = process.argv[3];
  if (!input || !imagesDir) {
    console.error('Usage: node pre-generate-images.mjs <scenes.json> <output_images_dir>');
    process.exit(1);
  }

  console.log('Loading scenes from:', input);
  const data = JSON.parse(readFileSync(input, 'utf-8'));

  mkdirSync(imagesDir, { recursive: true });

  console.log(`Generating ${data.scenes.length} images sequentially...`);
  const imagePaths = [];

  for (let i = 0; i < data.scenes.length; i++) {
    const scene = data.scenes[i];
    const imgPath = `${imagesDir}/scene_${i}.jpg`;

    if (existsSync(imgPath)) {
      console.log(`  [${i+1}/${data.scenes.length}] ✓ already exists`);
      imagePaths.push(imgPath);
      continue;
    }

    console.log(`  [${i+1}/${data.scenes.length}] Generating: "${scene.imagePrompt.slice(0, 60)}..."`);
    const buf = await generateImage(scene.imagePrompt);
    if (buf) {
      writeFileSync(imgPath, buf);
      console.log(`  [${i+1}/${data.scenes.length}] ✓ saved ${imgPath} (${(buf.length/1024).toFixed(0)}KB)`);
      imagePaths.push(imgPath);
    } else {
      console.log(`  [${i+1}/${data.scenes.length}] ✗ failed`);
      imagePaths.push(null);
    }

    if (i < data.scenes.length - 1) {
      console.log(`  Waiting 5s...`);
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Total: ${imagePaths.length}`);
  console.log(`Successful: ${imagePaths.filter(p => p).length}`);
  console.log(`Failed: ${imagePaths.filter(p => !p).length}`);

  const enrichedScenes = data.scenes.map((scene, i) => {
    const path = imagePaths[i];
    if (path) {
      const buf = readFileSync(path);
      return { ...scene, imageBase64: buf.toString('base64') };
    }
    return scene;
  });

  const outputPath = input.replace('.json', '-enriched.json');
  writeFileSync(outputPath, JSON.stringify({ ...data, scenes: enrichedScenes }, null, 2), 'utf-8');
  console.log(`\n✓ Enriched JSON saved: ${outputPath}`);
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
