import { SignJWT } from 'jose';

if (!process.env.ADMIN_SECRET) {
  console.error('[Auth] CRITICAL: ADMIN_SECRET not set. Aborting.');
  process.exit(1);
}
const SECRET = new TextEncoder().encode(process.env.ADMIN_SECRET);

async function triggerRestore() {
  const token = await new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('10m')
    .sign(SECRET);

  console.log('Generated Admin Token:', token);

  const url = 'https://rouatradingnews-production.up.railway.app/api/admin/system/restore';
  
  try {
    console.log('Triggering System Restore...');
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await res.json();
    console.log('Restore Result:', JSON.stringify(data, null, 2));
  } catch (err: any) {
    console.error('Fetch Error:', err.message);
  }
}

triggerRestore();
