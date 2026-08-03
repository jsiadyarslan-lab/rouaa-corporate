import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { SourcesService } from './sources.service';
import { CreateSourceDto } from './dto/create-source.dto';
import { UpdateSourceDto } from './dto/update-source.dto';
import { QuerySourcesDto } from './dto/query-sources.dto';

/**
 * SourcesController — REST API for the Source Registry.
 *
 * Base path: /api/v1/sources
 *
 * Per docs/execution/05 TASK-020:
 *   GET    /api/v1/sources          — list with filters + pagination
 *   GET    /api/v1/sources/:id      — get one by UUID
 *   POST   /api/v1/sources          — create
 *   PUT    /api/v1/sources/:id      — update
 *   DELETE /api/v1/sources/:id      — soft-delete (deprecate)
 *
 * Plus:
 *   GET    /api/v1/sources/code/:code  — get by short code (FED, ECB, etc.)
 *   GET    /api/v1/sources/stats       — registry statistics for dashboard
 */
@Controller('sources')
export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(@Query() query: QuerySourcesDto) {
    return this.sourcesService.findAll(query);
  }

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  getStats() {
    return this.sourcesService.getStats();
  }

  @Get('code/:code')
  @HttpCode(HttpStatus.OK)
  findByCode(@Param('code') code: string) {
    return this.sourcesService.findByCode(code.toUpperCase());
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.sourcesService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateSourceDto) {
    return this.sourcesService.create(dto);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateSourceDto) {
    return this.sourcesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.sourcesService.deprecate(id);
  }
}
