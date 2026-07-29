import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsURL,
  IsObject,
  IsIn,
  Max,
  Min,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';
import { SourceType } from '../entities/source.entity';

/**
 * DTO for creating a new Source.
 *
 * Required fields: name, code, type, country, jurisdiction
 * Optional fields: everything else
 *
 * The 'code' field is the canonical short identifier used in URLs, logs, and
 * cross-references. It must be uppercase letters + numbers, 2-16 chars.
 */
export class CreateSourceDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @IsString()
  @Matches(/^[A-Z][A-Z0-9]{1,15}$/, {
    message: 'code must be 2-16 uppercase letters/numbers, starting with a letter (e.g., FED, ECB, IMF)',
  })
  code: string;

  @IsEnum(SourceType)
  type: SourceType;

  @IsString()
  @MinLength(2)
  @MaxLength(16)
  country: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  jurisdiction: string;

  @IsOptional()
  @IsIn(['primary', 'secondary'])
  authorityLevel?: 'primary' | 'secondary';

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4)
  trustTier?: number;

  @IsOptional()
  @IsURL()
  websiteUrl?: string;

  @IsOptional()
  @IsURL()
  feedUrl?: string;

  @IsOptional()
  @IsURL()
  apiUrl?: string;

  @IsOptional()
  @IsIn(['direct_api', 'document_monitoring', 'scheduled_polling', 'manual'])
  ingestionPattern?: 'direct_api' | 'document_monitoring' | 'scheduled_polling' | 'manual';

  @IsOptional()
  @IsInt()
  @Min(30) // Floor: 30 seconds — never poll faster than that
  @Max(86400) // Ceiling: 1 day
  pollingIntervalSec?: number;

  @IsOptional()
  @IsIn(['active', 'paused', 'deprecated', 'candidate'])
  status?: 'active' | 'paused' | 'deprecated' | 'candidate';

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
