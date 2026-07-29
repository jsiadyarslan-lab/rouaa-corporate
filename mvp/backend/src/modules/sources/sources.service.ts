import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike, FindOptionsOrder } from 'typeorm';
import { Source, SourceType } from './entities/source.entity';
import { SourceHealth } from './entities/source-health.entity';
import { CreateSourceDto } from './dto/create-source.dto';
import { UpdateSourceDto } from './dto/update-source.dto';
import { QuerySourcesDto } from './dto/query-sources.dto';

/**
 * SourcesService — business logic for the Source Registry.
 *
 * Implements Epic 03 / TASK-020 (CRUD API) + TASK-021 (Classification) +
 * partial TASK-022 (Health System — entity + creation; monitoring worker
 * will be added in Sprint 2 per Epic 04).
 */
@Injectable()
export class SourcesService {
  private readonly logger = new Logger(SourcesService.name);

  constructor(
    @InjectRepository(Source)
    private readonly sourcesRepository: Repository<Source>,
    @InjectRepository(SourceHealth)
    private readonly healthRepository: Repository<SourceHealth>,
  ) {}

  /**
   * Create a new Source. Throws ConflictException if code or name already exists.
   * Also creates an initial SourceHealth record (status: unknown, score: 1.0).
   */
  async create(dto: CreateSourceDto): Promise<Source> {
    // Uniqueness checks
    const existingByCode = await this.sourcesRepository.findOne({ where: { code: dto.code } });
    if (existingByCode) {
      throw new ConflictException(`Source with code "${dto.code}" already exists`);
    }
    const existingByName = await this.sourcesRepository.findOne({ where: { name: dto.name } });
    if (existingByName) {
      throw new ConflictException(`Source with name "${dto.name}" already exists`);
    }

    // Create the source
    const source = this.sourcesRepository.create({
      ...dto,
      authorityLevel: dto.authorityLevel ?? 'primary',
      trustTier: dto.trustTier ?? 1,
      ingestionPattern: dto.ingestionPattern ?? 'scheduled_polling',
      pollingIntervalSec: dto.pollingIntervalSec ?? 300,
      status: dto.status ?? 'candidate',
      metadata: dto.metadata ?? {},
    });

    const saved = await this.sourcesRepository.save(source);

    // Initialize health record
    const health = this.healthRepository.create({
      sourceId: saved.id,
      status: 'unknown',
      reliabilityScore: 1.0,
      consecutiveFailures: 0,
      totalSuccessfulFetches: 0,
      totalFailedFetches: 0,
    });
    await this.healthRepository.save(health);

    this.logger.log(`Created source ${saved.code} (${saved.name}) — type=${saved.type}, country=${saved.country}`);
    return saved;
  }

  /**
   * Find all sources with optional filters + pagination.
   */
  async findAll(query: QuerySourcesDto): Promise<{
    data: Source[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: FindOptionsWhere<Source> = {};
    if (query.type) where.type = query.type;
    if (query.country) where.country = query.country;
    if (query.status) where.status = query.status;
    if (query.trustTier) where.trustTier = query.trustTier;

    // Search across name + code + description using ILIKE
    const qb = this.sourcesRepository.createQueryBuilder('source');

    if (query.type) qb.andWhere('source.type = :type', { type: query.type });
    if (query.country) qb.andWhere('source.country = :country', { country: query.country });
    if (query.status) qb.andWhere('source.status = :status', { status: query.status });
    if (query.trustTier) qb.andWhere('source.trustTier = :trustTier', { trustTier: query.trustTier });
    if (query.search) {
      qb.andWhere(
        '(source.name ILIKE :search OR source.code ILIKE :search OR source.description ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    // Sorting
    const sortField = query.sort?.split(':')[0] ?? 'createdAt';
    const sortDir = (query.sort?.split(':')[1] ?? 'desc') as 'asc' | 'desc';
    const allowedSortFields = ['name', 'code', 'createdAt', 'updatedAt', 'trustTier', 'country'];
    const safeField = allowedSortFields.includes(sortField) ? sortField : 'createdAt';
    qb.orderBy(`source.${safeField}`, sortDir);

    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find a single source by ID. Throws NotFoundException if missing.
   */
  async findOne(id: string): Promise<Source> {
    const source = await this.sourcesRepository.findOne({
      where: { id },
      relations: ['health'],
    });
    if (!source) {
      throw new NotFoundException(`Source with id "${id}" not found`);
    }
    return source;
  }

  /**
   * Find a source by its short code (e.g., "FED").
   */
  async findByCode(code: string): Promise<Source | null> {
    return this.sourcesRepository.findOne({
      where: { code: code.toUpperCase() },
      relations: ['health'],
    });
  }

  /**
   * Update a source. Throws NotFoundException if missing.
   */
  async update(id: string, dto: UpdateSourceDto): Promise<Source> {
    const source = await this.findOne(id);

    // If updating code, check uniqueness
    if (dto.code && dto.code !== source.code) {
      const existing = await this.sourcesRepository.findOne({ where: { code: dto.code } });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Source with code "${dto.code}" already exists`);
      }
    }

    Object.assign(source, dto);
    const saved = await this.sourcesRepository.save(source);
    this.logger.log(`Updated source ${saved.code}`);
    return saved;
  }

  /**
   * Soft-delete by setting status to 'deprecated'.
   * Hard-delete is forbidden — sources are part of the audit trail.
   */
  async deprecate(id: string): Promise<{ id: string; status: string }> {
    const source = await this.findOne(id);
    source.status = 'deprecated';
    await this.sourcesRepository.save(source);
    this.logger.warn(`Deprecated source ${source.code} (id=${id}) — soft delete, retained in audit trail`);
    return { id: source.id, status: source.status };
  }

  /**
   * Get statistics — counts by type, country, status, trust tier.
   * Used by the Source Registry dashboard.
   */
  async getStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    byCountry: Record<string, number>;
    byStatus: Record<string, number>;
    byTrustTier: Record<string, number>;
  }> {
    const total = await this.sourcesRepository.count();

    const byTypeRows = await this.sourcesRepository
      .createQueryBuilder('source')
      .select('source.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('source.type')
      .getRawAndEntities();

    // Use raw query for aggregation — cleaner than querybuilder group-by
    const rows = await this.sourcesRepository.query(`
      SELECT type, country, status, trust_tier, COUNT(*) as count
      FROM sources
      GROUP BY type, country, status, trust_tier
    `);

    const byType: Record<string, number> = {};
    const byCountry: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const byTrustTier: Record<string, number> = {};

    for (const row of rows) {
      byType[row.type] = (byType[row.type] ?? 0) + Number(row.count);
      byCountry[row.country] = (byCountry[row.country] ?? 0) + Number(row.count);
      byStatus[row.status] = (byStatus[row.status] ?? 0) + Number(row.count);
      byTrustTier[`tier_${row.trust_tier}`] =
        (byTrustTier[`tier_${row.trust_tier}`] ?? 0) + Number(row.count);
    }

    return { total, byType, byCountry, byStatus, byTrustTier };
  }

  /**
   * Bulk seed sources — used by the seed script (TASK-012, TASK-023).
   * Skips sources that already exist (by code). Returns insert count.
   */
  async bulkSeed(sources: CreateSourceDto[]): Promise<{ inserted: number; skipped: number }> {
    let inserted = 0;
    let skipped = 0;

    for (const dto of sources) {
      const existing = await this.sourcesRepository.findOne({ where: { code: dto.code } });
      if (existing) {
        skipped++;
        continue;
      }
      try {
        await this.create(dto);
        inserted++;
      } catch (err) {
        this.logger.error(`Failed to seed source ${dto.code}: ${(err as Error).message}`);
        skipped++;
      }
    }

    this.logger.log(`Bulk seed complete — inserted=${inserted}, skipped=${skipped}`);
    return { inserted, skipped };
  }
}
