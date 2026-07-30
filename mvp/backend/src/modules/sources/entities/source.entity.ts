import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { SourceHealth } from './source-health.entity';

/**
 * Source — represents an official financial source monitored by ROUAA.
 *
 * Per docs/foundation/29-DATA-MODEL-v1.md and docs/execution/03-ROUAA-ENGINEERING-SPECIFICATION-v1.md §5.
 *
 * A Source is the origin point of Layer 01 (Official Source Registry) in the
 * 7-Layer Intelligence Architecture. Every Fact, Event, Document, and Evidence
 * chain in the system traces back to a Source — and the Source's tier governs
 * how downstream facts are scored.
 *
 * Examples:
 *   - Federal Reserve (central_bank, US, tier 1)
 *   - European Central Bank (central_bank, EU, tier 1)
 *   - SEC (regulator, US, tier 1)
 *   - IMF (international_org, multinational, tier 1)
 */
@Entity('sources')
@Index(['type', 'country'])
@Index(['status'])
@Index(['trustTier'])
export class Source {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Canonical name (e.g., "Federal Reserve", "European Central Bank") */
  @Column({ type: 'text', unique: true })
  name: string;

  /** Short code for internal use (e.g., "FED", "ECB", "IMF") */
  @Column({ type: 'varchar', length: 16, unique: true })
  code: string;

  /** Source category — see SourceType enum */
  @Column({ type: 'enum', enum: SourceType, default: SourceType.CENTRAL_BANK })
  type: SourceType;

  /** ISO 3166-1 alpha-2 country code, or 'multinational' for international bodies */
  @Column({ type: 'varchar', length: 16 })
  country: string;

  /** Human-readable jurisdiction (e.g., "United States", "European Union") */
  @Column({ type: 'text' })
  jurisdiction: string;

  /** Authority level — 'primary' for official, 'secondary' for reputable derived */
  @Column({ type: 'enum', enum: ['primary', 'secondary'], default: 'primary' })
  authorityLevel: 'primary' | 'secondary';

  /**
   * Trust tier — governs confidence scoring.
   *   tier 1 = official primary (central banks, regulators, exchanges, statistical agencies)
   *   tier 2 = derived official (republished by official body)
   *   tier 3 = reputable secondary (financial media, established research)
   *   tier 4 = excluded by default
   *
   * See docs/foundation/12-DATA-GOVERNANCE-MODEL-v1.md for tier rules.
   */
  @Column({ type: 'smallint', default: 1 })
  trustTier: number;

  /** Primary publication URL — the source's main endpoint */
  @Column({ type: 'text', nullable: true })
  websiteUrl: string | null;

  /** RSS / Atom feed URL if available */
  @Column({ type: 'text', nullable: true })
  feedUrl: string | null;

  /** API endpoint if the source offers a structured API */
  @Column({ type: 'text', nullable: true })
  apiUrl: string | null;

  /** Monitoring pattern — how ROUAA ingests from this source */
  @Column({
    type: 'enum',
    enum: ['direct_api', 'document_monitoring', 'scheduled_polling', 'manual'],
    default: 'scheduled_polling',
  })
  ingestionPattern: 'direct_api' | 'document_monitoring' | 'scheduled_polling' | 'manual';

  /** Polling interval in seconds — calibrated per source */
  @Column({ type: 'integer', default: 300 })
  pollingIntervalSec: number;

  /** Source status — active sources are monitored; deprecated sources remain in audit trail */
  @Column({
    type: 'enum',
    enum: ['active', 'paused', 'deprecated', 'candidate'],
    default: 'candidate',
  })
  status: 'active' | 'paused' | 'deprecated' | 'candidate';

  /** Free-form metadata — JSONB for source-specific config (auth, headers, selectors) */
  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  /** Human-readable description of what the source publishes */
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  /** Optional 1:1 health record — created/updated by the source health monitor */
  @OneToOne(() => SourceHealth, (health) => health.source, {
    cascade: true,
    nullable: true,
  })
  @JoinColumn()
  health: SourceHealth | null;
}

/**
 * Source categories — per docs/foundation/29-DATA-MODEL-v1.md.
 * Six categories of monitored sources (see source-registry.html):
 *   1. Central banks
 *   2. Regulators
 *   3. Exchanges
 *   4. Statistical agencies
 *   5. Government bodies
 *   6. International bodies
 *
 * Plus 'company' for issuer filings (10-Ks, etc.) — added per docs/execution/05 TASK-021.
 */
export enum SourceType {
  CENTRAL_BANK = 'central_bank',
  REGULATOR = 'regulator',
  EXCHANGE = 'exchange',
  STATISTICS = 'statistics',
  GOVERNMENT = 'government',
  INTERNATIONAL_ORG = 'international_org',
  COMPANY = 'company',
}
