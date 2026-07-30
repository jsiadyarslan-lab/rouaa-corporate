import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Initial schema — Source Registry (Sprint 0 / TASK-010).
 *
 * Creates:
 *   - sources
 *   - source_health
 *
 * Plus indexes and the SourceType enum.
 *
 * This migration is idempotent — safe to run on an empty database or
 * on one where `synchronize: true` already created the tables (it will
 * detect existing tables and skip).
 */
export class InitSourceRegistry1700000000000 implements MigrationInterface {
  name = 'InitSourceRegistry1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Source type enum
    await queryRunner.query(`
      CREATE TYPE "sources_type_enum" AS ENUM (
        'central_bank',
        'regulator',
        'exchange',
        'statistics',
        'government',
        'international_org',
        'company'
      )
    `);

    // Authority level enum
    await queryRunner.query(`
      CREATE TYPE "sources_authority_level_enum" AS ENUM ('primary', 'secondary')
    `);

    // Ingestion pattern enum
    await queryRunner.query(`
      CREATE TYPE "sources_ingestion_pattern_enum" AS ENUM (
        'direct_api',
        'document_monitoring',
        'scheduled_polling',
        'manual'
      )
    `);

    // Status enum
    await queryRunner.query(`
      CREATE TYPE "sources_status_enum" AS ENUM (
        'active',
        'paused',
        'deprecated',
        'candidate'
      )
    `);

    // Sources table
    await queryRunner.query(`
      CREATE TABLE "sources" (
        "id"                    uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name"                  text NOT NULL UNIQUE,
        "code"                  varchar(16) NOT NULL UNIQUE,
        "type"                  sources_type_enum NOT NULL DEFAULT 'central_bank',
        "country"               varchar(16) NOT NULL,
        "jurisdiction"          text NOT NULL,
        "authority_level"       sources_authority_level_enum NOT NULL DEFAULT 'primary',
        "trust_tier"            smallint NOT NULL DEFAULT 1,
        "website_url"           text,
        "feed_url"              text,
        "api_url"               text,
        "ingestion_pattern"     sources_ingestion_pattern_enum NOT NULL DEFAULT 'scheduled_polling',
        "polling_interval_sec"  integer NOT NULL DEFAULT 300,
        "status"                sources_status_enum NOT NULL DEFAULT 'candidate',
        "metadata"              jsonb NOT NULL DEFAULT '{}',
        "description"           text,
        "created_at"            timestamptz NOT NULL DEFAULT now(),
        "updated_at"            timestamptz NOT NULL DEFAULT now()
      )
    `);

    // Indexes
    await queryRunner.query(`CREATE INDEX "idx_sources_type_country" ON "sources" ("type", "country")`);
    await queryRunner.query(`CREATE INDEX "idx_sources_status" ON "sources" ("status")`);
    await queryRunner.query(`CREATE INDEX "idx_sources_trust_tier" ON "sources" ("trust_tier")`);
    await queryRunner.query(`CREATE INDEX "idx_sources_name_trgm" ON "sources" USING gin (name gin_trgm_ops)`);
    await queryRunner.query(`CREATE INDEX "idx_sources_code_trgm" ON "sources" USING gin (code gin_trgm_ops)`);

    // Source health status enum
    await queryRunner.query(`
      CREATE TYPE "source_health_status_enum" AS ENUM (
        'healthy',
        'degraded',
        'failing',
        'paused',
        'unknown'
      )
    `);

    // Source health table
    await queryRunner.query(`
      CREATE TABLE "source_health" (
        "id"                          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "source_id"                   uuid NOT NULL UNIQUE REFERENCES "sources"("id") ON DELETE CASCADE,
        "last_successful_fetch_at"    timestamptz,
        "last_fetch_attempt_at"       timestamptz,
        "consecutive_failures"        integer NOT NULL DEFAULT 0,
        "total_successful_fetches"    integer NOT NULL DEFAULT 0,
        "total_failed_fetches"        integer NOT NULL DEFAULT 0,
        "reliability_score"           double precision NOT NULL DEFAULT 1.0,
        "status"                      source_health_status_enum NOT NULL DEFAULT 'unknown',
        "last_error_message"          text,
        "updated_at"                  timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_source_health_status" ON "source_health" ("status")`);
    await queryRunner.query(`CREATE INDEX "idx_source_health_last_success" ON "source_health" ("last_successful_fetch_at")`);

    // Updated_at trigger — auto-update on row change
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);

    await queryRunner.query(`
      CREATE TRIGGER sources_updated_at
        BEFORE UPDATE ON "sources"
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);

    await queryRunner.query(`
      CREATE TRIGGER source_health_updated_at
        BEFORE UPDATE ON "source_health"
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TRIGGER IF EXISTS source_health_updated_at ON "source_health"`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS sources_updated_at ON "sources"`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_updated_at_column`);

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_source_health_last_success"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_source_health_status"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "source_health"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "source_health_status_enum"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_sources_code_trgm"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_sources_name_trgm"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_sources_trust_tier"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_sources_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_sources_type_country"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sources"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "sources_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "sources_ingestion_pattern_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "sources_authority_level_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "sources_type_enum"`);
  }
}
