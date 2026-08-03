import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SourcesModule } from './modules/sources/sources.module';
import { AppHealthModule } from './modules/health/health.module';

@Module({
  imports: [
    // Environment variables — loaded from .env at repo root
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../.env', '.env'],
    }),

    // PostgreSQL — primary relational database
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres' as const,
        host: process.env.POSTGRES_HOST ?? 'localhost',
        port: parseInt(process.env.POSTGRES_PORT ?? '5432', 10),
        username: process.env.POSTGRES_USER ?? 'rouaa',
        password: process.env.POSTGRES_PASSWORD ?? 'rouaa_dev',
        database: process.env.POSTGRES_DB ?? 'rouaa',
        autoLoadEntities: true,
        synchronize: false, // Migrations only — never synchronize in production
        logging: process.env.NODE_ENV === 'development',
        migrations: ['dist/migrations/*.js'],
        migrationsRun: false,
      }),
    }),

    // Feature modules
    AppHealthModule,
    SourcesModule,
  ],
})
export class AppModule {}
