import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Source } from './source.entity';

/**
 * SourceHealth — runtime health record for a Source.
 *
 * Per docs/execution/05 TASK-022 — Source Health System:
 *   - Last successful fetch
 *   - Failure count
 *   - Reliability score
 *   - Status
 *
 * A separate entity (1:1 with Source) so health updates don't trigger
 * row rewrites on the Source table — which is read-heavy for joins.
 */
@Entity('source_health')
@Index(['status'])
@Index(['lastSuccessfulFetchAt'])
export class SourceHealth {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  sourceId: string;

  @OneToOne(() => Source, (source) => source.health, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sourceId' })
  source: Source;

  /** Last time ROUAA successfully fetched content from this source */
  @Column({ type: 'timestamptz', nullable: true })
  lastSuccessfulFetchAt: Date | null;

  /** Last time ROUAA attempted a fetch (success or failure) */
  @Column({ type: 'timestamptz', nullable: true })
  lastFetchAttemptAt: Date | null;

  /** Consecutive failure count — resets to 0 on success */
  @Column({ type: 'integer', default: 0 })
  consecutiveFailures: number;

  /** Total successful fetches since source registration */
  @Column({ type: 'integer', default: 0 })
  totalSuccessfulFetches: number;

  /** Total failed fetches since source registration */
  @Column({ type: 'integer', default: 0 })
  totalFailedFetches: number;

  /**
   * Reliability score — rolling window (last 100 fetches).
   * Range: 0.00 to 1.00. Sources below 0.80 trigger alerts; below 0.50 are auto-paused.
   */
  @Column({ type: 'double precision', default: 1.0 })
  reliabilityScore: number;

  /** Current health status — derived from reliability and failure count */
  @Column({
    type: 'enum',
    enum: ['healthy', 'degraded', 'failing', 'paused', 'unknown'],
    default: 'unknown',
  })
  status: 'healthy' | 'degraded' | 'failing' | 'paused' | 'unknown';

  /** Last error message if any — used by ops for diagnosis */
  @Column({ type: 'text', nullable: true })
  lastErrorMessage: string | null;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
