import { DataSource } from 'typeorm';
import { Source } from '../modules/sources/entities/source.entity';
import { SourceHealth } from '../modules/sources/entities/source-health.entity';

/**
 * TypeORM DataSource for CLI operations — migrations, schema sync, seed.
 *
 * Used by:
 *   pnpm migration:generate
 *   pnpm migration:run
 *   pnpm migration:revert
 *
 * NOTE: This is separate from the runtime DataSource configured in AppModule
 * to avoid loading NestJS context for CLI operations.
 */
export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL ?? 'postgresql://rouaa:rouaa_dev@localhost:5432/rouaa',
  entities: [Source, SourceHealth],
  migrations: ['src/migrations/*.ts', 'dist/migrations/*.js'],
  logging: process.env.NODE_ENV === 'development',
  synchronize: false,
});
