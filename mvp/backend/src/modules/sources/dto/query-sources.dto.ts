import { IsEnum, IsInt, IsOptional, IsString, IsIn, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { SourceType } from '../entities/source.entity';

/**
 * DTO for querying Sources with filters + pagination.
 *
 * Example query strings:
 *   /api/v1/sources?type=central_bank&country=US&status=active&page=1&limit=20
 *   /api/v1/sources?trustTier=1&sort=name:asc
 */
export class QuerySourcesDto {
  @IsOptional()
  @IsEnum(SourceType)
  type?: SourceType;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsIn(['active', 'paused', 'deprecated', 'candidate'])
  status?: 'active' | 'paused' | 'deprecated' | 'candidate';

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4)
  @Type(() => Number)
  trustTier?: number;

  @IsOptional()
  @IsString()
  search?: string; // Searches across name, code, description

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  sort?: string; // Format: "field:direction" e.g. "name:asc", "createdAt:desc"
}
