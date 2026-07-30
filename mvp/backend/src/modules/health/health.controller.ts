import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/**
 * HealthController — simple liveness + readiness checks.
 *
 * GET /api/v1/health       — liveness (process is up)
 * GET /api/v1/health/ready — readiness (DB reachable)
 */
@Controller('health')
export class HealthController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  liveness() {
    return {
      status: 'ok',
      service: 'rouaa-backend',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get('ready')
  @HttpCode(HttpStatus.OK)
  async readiness() {
    try {
      await this.dataSource.query('SELECT 1');
      return {
        status: 'ok',
        service: 'rouaa-backend',
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return {
        status: 'degraded',
        service: 'rouaa-backend',
        database: 'disconnected',
        error: (err as Error).message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
