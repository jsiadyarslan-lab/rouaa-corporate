import { PartialType } from '@nestjs/mapped-types';
import { CreateSourceDto } from './create-source.dto';

/**
 * DTO for updating a Source — all fields optional.
 * ID, createdAt, updatedAt are not patchable.
 */
export class UpdateSourceDto extends PartialType(CreateSourceDto) {}
