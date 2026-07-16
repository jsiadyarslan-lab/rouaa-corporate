// ─── Seed Script: Create API Key for ROUA Agents ────────────
// Run with: npx tsx scripts/seed-agent-api-key.ts
// This inserts an API key directly into the database for agent access

import { PrismaClient } from '@prisma/client';

const AGENT_API_KEY = process.env.AGENT_API_KEY || 'rva_27fcec8190401a05acab99d8383fc45f334c57529c1d9448';

async function main() {
  const prisma = new PrismaClient();

  try {
    // Check if the key already exists
    const existing = await prisma.apiKey.findFirst({
      where: { key: AGENT_API_KEY },
    });

    if (existing) {
      console.log('✅ Agent API key already exists:', existing.id);
      console.log('   Name:', existing.name);
      console.log('   Plan:', existing.plan);
      console.log('   Active:', existing.isActive);
      return;
    }

    // Create the agent API key
    const apiKey = await prisma.apiKey.create({
      data: {
        key: AGENT_API_KEY,
        name: 'ROUA Agents Bridge Key',
        plan: 'enterprise',
        rateLimit: 10000,
        userId: null,
      },
    });

    console.log('✅ Agent API key created successfully!');
    console.log('   ID:', apiKey.id);
    console.log('   Key:', apiKey.key);
    console.log('   Name:', apiKey.name);
    console.log('   Plan:', apiKey.plan);
    console.log('   Rate Limit:', apiKey.rateLimit, 'req/hr');
  } catch (error: any) {
    console.error('❌ Error creating API key:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
