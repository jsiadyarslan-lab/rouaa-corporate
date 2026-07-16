import { spawnSync } from 'child_process';

async function generateImageCloudflareAI(prompt) {
  const cfToken = process.env.CLOUDFLARE_API_TOKEN;
  const cfAccount = process.env.R2_ACCOUNT_ID;
  if (!cfToken || !cfAccount) return null;
  try {
    const cfModel = process.env.CF_IMAGE_MODEL || '@cf/stabilityai/stable-diffusion-xl-base-1.0';
    const result = spawnSync('curl', ['-s','-X','POST',
      `https://api.cloudflare.com/client/v4/accounts/${cfAccount}/ai/run/${cfModel}`,
      '-H',`Authorization: Bearer ${cfToken}`,'-H','Content-Type: application/json',
      '-d',JSON.stringify({prompt:prompt.slice(0,500),num_steps:20,width:1024,height:576})
    ], {encoding:'utf-8',timeout:60000});
    if (result.stdout) { const r=JSON.parse(result.stdout); if(r.success&&r.result?.image) return Buffer.from(r.result.image,'base64'); }
  } catch {}
  return null;
}

async function generateImageGeminiFlash(prompt) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  try {
    const result = spawnSync('curl', ['-s','-X','POST',
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent`,
      '-H',`x-goog-api-key: ${key}`,'-H','Content-Type: application/json',
      '-d',JSON.stringify({contents:[{parts:[{text:prompt.slice(0,1000)}]}],generationConfig:{responseModalities:['IMAGE'],imageConfig:{aspectRatio:'16:9'}}})
    ], {encoding:'utf-8',timeout:60000});
    if (result.stdout) { const d=JSON.parse(result.stdout); const p=d.candidates?.[0]?.content?.parts||[]; const ip=p.find(x=>x.inlineData); if(ip?.inlineData?.data) return Buffer.from(ip.inlineData.data,'base64'); }
  } catch {}
  return null;
}

async function generateImageProdia(prompt) {
  const key = process.env.PRODIA_API_KEY;
  if (!key) return null;
  try {
    const result = spawnSync('curl', ['-s','-X','POST','https://inference.prodia.com/v2/job',
      '-H',`Authorization: Bearer ${key}`,'-H','Content-Type: application/json','-H','Accept: image/jpeg',
      '-d',JSON.stringify({type:'inference.flux-fast.schnell.txt2img.v2',config:{prompt:prompt.slice(0,1000),aspect_ratio:'16:9'}})
    ], {encoding:null,timeout:60000});
    if (result.stdout && result.stdout.length > 2000) return result.stdout;
  } catch {}
  return null;
}

async function generateImagePollinations(prompt) {
  try {
    const sp = prompt.length > 300 ? prompt.substring(0,297)+'...' : prompt;
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(sp)}?width=1344&height=768&nologo=true&seed=${Date.now()}&model=flux`;
    const result = spawnSync('curl',['-s','-o','-','--max-time','90',url],{encoding:null,timeout:120000});
    if (result.stdout && result.stdout.length > 5000) return result.stdout;
  } catch {}
  return null;
}

async function generateImageSDK(prompt) {
  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();
    const response = await zai.images.generations.create({prompt,size:'1344x768'});
    const base64 = response.data?.[0]?.base64;
    if (base64) return Buffer.from(base64,'base64');
  } catch {}
  return null;
}

export async function generateImage(prompt) {
  console.log(`  [ImageGen] Cloudflare SDXL...`);
  let b = await generateImageCloudflareAI(prompt);
  if (b && b.length > 2000) { console.log(`  [ImageGen] ✓ SDXL (${(b.length/1024).toFixed(0)}KB)`); return b; }
  console.log(`  [ImageGen] Gemini Flash...`);
  b = await generateImageGeminiFlash(prompt);
  if (b && b.length > 2000) { console.log(`  [ImageGen] ✓ Gemini (${(b.length/1024).toFixed(0)}KB)`); return b; }
  console.log(`  [ImageGen] Prodia...`);
  b = await generateImageProdia(prompt);
  if (b && b.length > 2000) { console.log(`  [ImageGen] ✓ Prodia (${(b.length/1024).toFixed(0)}KB)`); return b; }
  console.log(`  [ImageGen] Pollinations...`);
  b = await generateImagePollinations(prompt);
  if (b && b.length > 2000) { console.log(`  [ImageGen] ✓ Pollinations (${(b.length/1024).toFixed(0)}KB)`); return b; }
  console.log(`  [ImageGen] z-ai SDK...`);
  b = await generateImageSDK(prompt);
  if (b && b.length > 2000) { console.log(`  [ImageGen] ✓ SDK (${(b.length/1024).toFixed(0)}KB)`); return b; }
  console.error(`  [ImageGen] ✗ ALL FAILED`);
  return null;
}
