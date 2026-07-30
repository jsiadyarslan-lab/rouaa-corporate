/**
 * Seed script — runs bulk insert of the initial Source Registry data.
 *
 * Usage:
 *   pnpm --filter @rouaa/backend run seed
 *
 * Or directly:
 *   cd backend && ts-node src/config/seed.ts
 *
 * This script:
 *   1. Connects to PostgreSQL using DATABASE_URL
 *   2. Initializes the TypeORM schema (creates tables if missing — dev only)
 *   3. Bulk-inserts the SOURCES_SEED array
 *   4. Logs the result
 *
 * In production, migrations run first; the seed only inserts new rows.
 */
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Source } from '../modules/sources/entities/source.entity';
import { SourceHealth } from '../modules/sources/entities/source-health.entity';
import { SOURCES_SEED } from './seed-data';

async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL ?? 'postgresql://rouaa:rouaa_dev@localhost:5432/rouaa',
    entities: [Source, SourceHealth],
    synchronize: process.env.NODE_ENV !== 'production', // Dev-only: auto-create schema
    logging: false,
  });

  console.log('Connecting to database...');
  await dataSource.initialize();
  console.log('Connected.');

  const sourceRepo = dataSource.getRepository(Source);
  const healthRepo = dataSource.getRepository(SourceHealth);

  let inserted = 0;
  let skipped = 0;

  console.log(`Seeding ${SOURCES_SEED.length} sources...`);

  for (const dto of SOURCES_SEED) {
    const existing = await sourceRepo.findOne({ where: { code: dto.code } });
    if (existing) {
      console.log(`  SKIP  ${dto.code} — already exists`);
      skipped++;
      continue;
    }

    const source = sourceRepo.create({
      ...dto,
      authorityLevel: 'primary',
      trustTier: dto.trustTier ?? 1,
      ingestionPattern: dto.ingestionPattern ?? 'scheduled_polling',
      pollingIntervalSec: dto.pollingIntervalSec ?? 300,
      status: dto.status ?? 'active',
      metadata: {},
    });
    const saved = await sourceRepo.save(source);

    // Initialize health record
    const health = healthRepo.create({
      sourceId: saved.id,
      status: 'unknown',
      reliabilityScore: 1.0,
    });
    await healthRepo.save(health);

    console.log(`  SEED  ${dto.code} — ${dto.name}`);
    inserted++;
  }

  console.log('');
  console.log(`Seed complete — inserted: ${inserted}, skipped: ${skipped}, total in registry: ${inserted + skipped + (await sourceRepo.count() - inserted - skipped)}`);
  console.log(`Total sources in database: ${await sourceRepo.count()}`);

  await dataSource.destroy();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
