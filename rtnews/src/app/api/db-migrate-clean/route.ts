// Final fix: create ALL tables that don't exist yet (even empty ones)
// This ensures both apps have all their tables available
import { NextResponse } from 'next/server';
import { Client } from 'pg';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MIGRATION_KEY = 'migrate-clean-2026';
const OLD_DB_URL = 'postgresql://postgres:ECwmddGzeOxVuViSsKmjZXKnZTNNqVtm@postgres-clean.railway.internal:5432/railway';
const NEW_DB_URL = 'postgresql://postgres:ECwmddGzeOxVuViSsKmjZXKnZTNNqVtm@postgres-clean.railway.internal:5432/railway';

function quoteIdent(name: string): string {
  return '"' + name.replace(/"/g, '""') + '"';
}

function escapeValue(v: any): string {
  if (v === null || v === undefined) return 'NULL';
  if (v === true) return 'true';
  if (v === false) return 'false';
  if (typeof v === 'number') return v.toString();
  if (v instanceof Date) return "'" + v.toISOString() + "'";
  if (typeof v === 'object') return "'" + JSON.stringify(v).replace(/'/g, "''") + "'";
  return "'" + v.toString().replace(/'/g, "''") + "'";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const key = url.searchParams.get('key');
  const tableName = url.searchParams.get('name');
  const action = url.searchParams.get('action') || 'migrate';
  const limit = parseInt(url.searchParams.get('limit') || '5000');
  const offset = parseInt(url.searchParams.get('offset') || '0');
  
  if (key !== MIGRATION_KEY) {
    return NextResponse.json({ error: 'Invalid key' }, { status: 403 });
  }
  
  const oldClient = new Client({ connectionString: OLD_DB_URL, connectionTimeoutMillis: 30000, query_timeout: 60000 });
  const newClient = new Client({ connectionString: NEW_DB_URL, connectionTimeoutMillis: 30000, query_timeout: 60000 });
  
  try {
    await oldClient.connect();
    await oldClient.query('SET zero_damaged_pages = on');
    await newClient.connect();
    
    if (action === 'list') {
      const tables = await oldClient.query(`
        SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
      `);
      const result = [];
      for (const t of tables.rows) {
        const cnt = await oldClient.query(`SELECT count(*) FROM ${quoteIdent(t.tablename)}`).catch(()=>({rows:[{count:'?'}]}));
        const newCnt = await newClient.query(`SELECT count(*) FROM ${quoteIdent(t.tablename)}`).catch(()=>({rows:[{count:0}]}));
        result.push({
          name: t.tablename,
          old_count: parseInt(cnt.rows[0].count) || 0,
          new_count: parseInt(newCnt.rows[0].count) || 0,
          migrated: parseInt(newCnt.rows[0].count) > 0,
        });
      }
      return NextResponse.json({ tables: result, total: result.length });
    }
    
    // Create table + migrate a chunk (offset to offset+limit)
    if (action === 'migrate' && tableName) {
      const startTime = Date.now();
      
      // Get columns — use format_type() for proper enum type names
      // Use to_regclass with proper quoting for case-sensitive table names
      const regclassStr = `public.${quoteIdent(tableName)}`;
      const cols = await oldClient.query(`
        SELECT 
          a.attname as column_name,
          format_type(a.atttypid, a.atttypmod) as data_type,
          a.attnotnull as is_nullable,
          pg_get_expr(d.adbin, d.adrelid) as column_default,
          a.atttypmod as character_maximum_length,
          t.typname as udt_name,
          t.typtype as type_type
        FROM pg_attribute a
        LEFT JOIN pg_attrdef d ON a.attrelid = d.adrelid AND a.attnum = d.adnum
        LEFT JOIN pg_type t ON a.atttypid = t.oid
        WHERE a.attrelid = to_regclass($1)
          AND a.attnum > 0
          AND NOT a.attisdropped
        ORDER BY a.attnum
      `, [regclassStr]);
      
      if (cols.rows.length === 0) {
        return NextResponse.json({ error: 'Table not found', table: tableName }, { status: 404 });
      }
      
      // Check if table exists in new DB (use parameterized query for case-sensitive names)
      const existsCheck = await newClient.query(`
        SELECT to_regclass($1) as exists
      `, [`public.${quoteIdent(tableName)}`]);
      const tableExists = existsCheck.rows[0].exists !== null;
      
      // Create if doesn't exist
      if (!tableExists) {
        // First, create any enum types that this table needs
        const enumTypes = cols.rows.filter(c => c.type_type === 'e');
        for (const et of enumTypes) {
          try {
            // Get enum values from old DB
            const enumVals = await oldClient.query(`
              SELECT e.enumlabel 
              FROM pg_enum e 
              JOIN pg_type t ON e.enumtypid = t.oid 
              WHERE t.typname = $1
              ORDER BY e.enumsortorder
            `, [et.udt_name]);
            const labels = enumVals.rows.map(r => `'${r.enumlabel}'`).join(', ');
            if (labels) {
              await newClient.query(`CREATE TYPE ${quoteIdent(et.udt_name)} AS ENUM (${labels})`).catch(()=>{});
            }
          } catch (e) {}
        }
        
        const colDefs = cols.rows.map(c => {
          // format_type() already includes the full type (e.g. '"PositionStatus"', 'varchar(255)', 'text')
          let s = quoteIdent(c.column_name) + ' ' + c.data_type;
          if (c.is_nullable === true) s += ' NOT NULL'; // attnotnull=true means NOT NULL
          if (c.column_default) s += ' DEFAULT ' + c.column_default;
          return s;
        }).join(', ');
        
        await newClient.query(`CREATE TABLE ${quoteIdent(tableName)} (${colDefs})`);
      }
      
      // Copy a chunk (offset to offset+limit)
      const colNames = cols.rows.map(c => quoteIdent(c.column_name)).join(', ');
      
      const batch = await oldClient.query(`
        SELECT ${colNames} FROM ${quoteIdent(tableName)}
        ORDER BY ctid
        LIMIT $1 OFFSET $2
      `, [limit, offset]);
      
      let copied = 0;
      let skipped = 0;
      
      for (const row of batch.rows) {
        try {
          const vals = cols.rows.map(c => escapeValue(row[c.column_name])).join(', ');
          await newClient.query(`INSERT INTO ${quoteIdent(tableName)} (${colNames}) VALUES (${vals}) ON CONFLICT DO NOTHING`);
          copied++;
        } catch (e) {
          skipped++;
        }
      }
      
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      return NextResponse.json({
        success: true,
        table: tableName,
        offset,
        limit,
        rows_in_batch: batch.rows.length,
        copied,
        skipped,
        elapsed_seconds: parseFloat(elapsed),
      });
    }
    
    if (action === 'indexes') {
      const indexes = await oldClient.query(`
        SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname
      `);
      const created = [];
      const failed = [];
      for (const i of indexes.rows) {
        try {
          await newClient.query(i.indexdef);
          created.push(i.indexname);
        } catch (e: any) {
          failed.push({ name: i.indexname, error: e.message.slice(0, 100) });
        }
      }
      return NextResponse.json({ success: true, created_count: created.length, failed_count: failed.length, failed: failed.slice(0, 5) });
    }
    
    if (action === 'vacuum') {
      try {
        await newClient.query('VACUUM ANALYZE');
        return NextResponse.json({ success: true });
      } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
      }
    }
    
    if (action === 'verify') {
      const newsCnt = await newClient.query('SELECT count(*) FROM news_items').catch(()=>({rows:[{count:'ERR'}]}));
      const usersCnt = await newClient.query('SELECT count(*) FROM users').catch(()=>({rows:[{count:'ERR'}]}));
      const posCnt = await newClient.query('SELECT count(*) FROM "Position"').catch(()=>({rows:[{count:0}]}));
      const tradeCnt = await newClient.query('SELECT count(*) FROM "Trade"').catch(()=>({rows:[{count:0}]}));
      const sz = await newClient.query("SELECT pg_size_pretty(pg_database_size('railway')) as s").catch(()=>({rows:[{s:'ERR'}]}));
      const tableCnt = await newClient.query("SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'").catch(()=>({rows:[{count:0}]}));
      return NextResponse.json({
        success: true,
        new_db: {
          tables: tableCnt.rows[0].count,
          news_items: newsCnt.rows[0].count,
          users: usersCnt.rows[0].count,
          position: posCnt.rows[0].count,
          trade: tradeCnt.rows[0].count,
          db_size: sz.rows[0].s,
        }
      });
    }
    
    
    // Action: query - run a SELECT query on new DB
    if (action === 'query') {
      const sql = url.searchParams.get('sql');
      if (!sql) {
        return NextResponse.json({ error: 'Missing sql parameter' }, { status: 400 });
      }
      try {
        const r = await newClient.query(sql);
        return NextResponse.json({ success: true, rows: r.rows.slice(0, 20), count: r.rows.length });
      } catch (e: any) {
        return NextResponse.json({ error: e.message, sql }, { status: 500 });
      }
    }
    
    
    
    // Action: execute - run INSERT/DELETE/UPDATE on new DB
    if (action === 'execute') {
      const sql = url.searchParams.get('sql');
      if (!sql) {
        return NextResponse.json({ error: 'Missing sql parameter' }, { status: 400 });
      }
      try {
        const r = await newClient.query(sql);
        return NextResponse.json({ success: true, rowCount: r.rowCount });
      } catch (e: any) {
        return NextResponse.json({ error: e.message, sql }, { status: 500 });
      }
    }
    
    
    
    // Action: sync-schema — create ALL missing tables + indexes + FKs from old DB
    if (action === 'sync-schema') {
      const startTime = Date.now();
      const log: string[] = [];
      
      // Get ALL tables from old DB
      const oldTables = await oldClient.query(`
        SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
      `);
      log.push(`Old DB has ${oldTables.rows.length} tables`);
      
      let tablesCreated = 0;
      let tablesExisting = 0;
      let tablesFailed = 0;
      
      for (const t of oldTables.rows) {
        const tableName = t.tablename;
        const regclassStr = `public.${quoteIdent(tableName)}`;
        
        // Check if table exists in new DB
        const existsCheck = await newClient.query(`SELECT to_regclass($1) as exists`, [`public.${quoteIdent(tableName)}`]);
        if (existsCheck.rows[0].exists) {
          tablesExisting++;
          continue;
        }
        
        // Get columns from old DB
        const cols = await oldClient.query(`
          SELECT 
            a.attname as column_name,
            format_type(a.atttypid, a.atttypmod) as data_type,
            a.attnotnull as is_nullable,
            pg_get_expr(d.adbin, d.adrelid) as column_default,
            t.typname as udt_name,
            t.typtype as type_type
          FROM pg_attribute a
          LEFT JOIN pg_attrdef d ON a.attrelid = d.adrelid AND a.attnum = d.adnum
          LEFT JOIN pg_type t ON a.atttypid = t.oid
          WHERE a.attrelid = to_regclass($1)
            AND a.attnum > 0
            AND NOT a.attisdropped
          ORDER BY a.attnum
        `, [regclassStr]);
        
        if (cols.rows.length === 0) continue;
        
        // Create enum types first
        const enumTypes = cols.rows.filter(c => c.type_type === 'e');
        for (const et of enumTypes) {
          try {
            const enumVals = await oldClient.query(`
              SELECT e.enumlabel FROM pg_enum e
              JOIN pg_type t ON e.enumtypid = t.oid
              WHERE t.typname = $1 ORDER BY e.enumsortorder
            `, [et.udt_name]);
            const labels = enumVals.rows.map(r => `'${r.enumlabel}'`).join(', ');
            if (labels) {
              await newClient.query(`CREATE TYPE ${quoteIdent(et.udt_name)} AS ENUM (${labels})`).catch(()=>{});
            }
          } catch (e) {}
        }
        
        // Build CREATE TABLE
        const colDefs = cols.rows.map(c => {
          let s = quoteIdent(c.column_name) + ' ' + c.data_type;
          if (c.is_nullable === true) s += ' NOT NULL';
          if (c.column_default) s += ' DEFAULT ' + c.column_default;
          return s;
        }).join(', ');
        
        try {
          await newClient.query(`CREATE TABLE ${quoteIdent(tableName)} (${colDefs})`);
          tablesCreated++;
          log.push(`  ✓ Created: ${tableName}`);
        } catch (e: any) {
          tablesFailed++;
          log.push(`  ✗ ${tableName}: ${e.message.slice(0, 80)}`);
        }
      }
      
      log.push(`Tables: ${tablesCreated} created, ${tablesExisting} existing, ${tablesFailed} failed`);
      
      // Create ALL indexes
      const oldIdx = await oldClient.query(`
        SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname
      `);
      
      const newIdxRes = await newClient.query(`SELECT indexname FROM pg_indexes WHERE schemaname = 'public'`);
      const newIdxNames = new Set(newIdxRes.rows.map(r => r.indexname));
      
      let idxCreated = 0;
      let idxFailed = 0;
      
      for (const idx of oldIdx.rows) {
        if (newIdxNames.has(idx.indexname)) continue;
        try {
          await newClient.query(idx.indexdef);
          idxCreated++;
        } catch (e) {
          idxFailed++;
        }
      }
      
      log.push(`Indexes: ${idxCreated} created, ${idxFailed} failed`);
      
      // Create ALL FKs
      const oldFKs = await oldClient.query(`
        SELECT c.conname, n1.nspname || '.' || cl1.relname as table_name,
               pg_get_constraintdef(c.oid) as definition
        FROM pg_constraint c
        JOIN pg_class cl1 ON c.conrelid = cl1.oid
        JOIN pg_namespace n1 ON cl1.relnamespace = n1.oid
        WHERE c.contype = 'f' AND n1.nspname = 'public'
        ORDER BY c.conname
      `);
      
      const newFKRes = await newClient.query(`
        SELECT c.conname FROM pg_constraint c
        JOIN pg_namespace n ON c.connamespace = n.oid
        WHERE c.contype = 'f' AND n.nspname = 'public'
      `);
      const newFKNames = new Set(newFKRes.rows.map(r => r.conname));
      
      let fkCreated = 0;
      let fkFailed = 0;
      
      for (const fk of oldFKs.rows) {
        if (newFKNames.has(fk.conname)) continue;
        try {
          await newClient.query(`ALTER TABLE ${fk.table_name} ADD CONSTRAINT ${fk.conname} ${fk.definition}`);
          fkCreated++;
        } catch (e) {
          fkFailed++;
        }
      }
      
      log.push(`FKs: ${fkCreated} created, ${fkFailed} failed`);
      
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      log.push(`Done in ${elapsed}s`);
      
      // Final counts
      const finalTables = await newClient.query(`SELECT count(*) as c FROM pg_tables WHERE schemaname = 'public'`);
      const finalIdx = await newClient.query(`SELECT count(*) as c FROM pg_indexes WHERE schemaname = 'public'`);
      const finalFK = await newClient.query(`SELECT count(*) as c FROM pg_constraint c JOIN pg_namespace n ON c.connamespace = n.oid WHERE c.contype = 'f' AND n.nspname = 'public'`);
      
      return NextResponse.json({
        success: true,
        elapsed_seconds: parseFloat(elapsed),
        tables_created: tablesCreated,
        tables_existing: tablesExisting,
        tables_failed: tablesFailed,
        indexes_created: idxCreated,
        indexes_failed: idxFailed,
        fks_created: fkCreated,
        fks_failed: fkFailed,
        final: {
          tables: finalTables.rows[0].c,
          indexes: finalIdx.rows[0].c,
          fks: finalFK.rows[0].c,
        },
        logs: log,
      });
    }
    
    // Action: bulk-copy - copy ALL missing rows from old to new (internal, no HTTP)
    if (action === 'bulk-copy' && tableName) {
      const startTime = Date.now();
      const regclassStr = `public.${quoteIdent(tableName)}`;
      
      // Get columns (skip ones that might be corrupt)
      const cols = await oldClient.query(`
        SELECT 
          a.attname as column_name,
          format_type(a.atttypid, a.atttypmod) as data_type,
          a.attstorage
        FROM pg_attribute a
        WHERE a.attrelid = to_regclass($1)
          AND a.attnum > 0
          AND NOT a.attisdropped
        ORDER BY a.attnum
      `, [regclassStr]);
      
      if (cols.rows.length === 0) {
        return NextResponse.json({ error: 'Table not found' }, { status: 404 });
      }
      
      // Check which columns can be read TOGETHER (not individually)
      // Some columns work individually but fail in multi-column SELECT due to TOAST
      const workingCols = cols.rows;
      
      // Test: can we read ALL columns at once?
      const allColNames = cols.rows.map(c => quoteIdent(c.column_name)).join(', ');
      let canReadAll = false;
      try {
        await oldClient.query(`SELECT ${allColNames} FROM ${quoteIdent(tableName)} LIMIT 1`);
        canReadAll = true;
      } catch (e) {
        // Can't read all columns — try without known-problematic ones
        // Problematic columns: content, indicators, technicalData, tradeSetup, keyMetrics, sourceUrls
        const problematic = new Set(['content', 'indicators', 'technicalData', 'tradeSetup', 'keyMetrics', 'sourceUrls', 'relatedNewsIds', 'relatedReportIds']);
        const safeCols = cols.rows.filter(c => !problematic.has(c.column_name));
        const safeColNames = safeCols.map(c => quoteIdent(c.column_name)).join(', ');
        try {
          await oldClient.query(`SELECT ${safeColNames} FROM ${quoteIdent(tableName)} LIMIT 1`);
          workingCols.length = 0;
          workingCols.push(...safeCols);
        } catch (e2) {
          // Try minimal columns
          const minimal = cols.rows.filter(c => !problematic.has(c.column_name) && c.attstorage !== 'x' && c.attstorage !== 'e');
          workingCols.length = 0;
          workingCols.push(...minimal);
        }
      }
      
      const colNames = workingCols.map(c => quoteIdent(c.column_name)).join(', ');
      const idCol = 'id';
      
      // Get all IDs from old
      const oldIds = await oldClient.query(`SELECT ${quoteIdent(idCol)} as id FROM ${quoteIdent(tableName)}`);
      const oldIdSet = new Set(oldIds.rows.map(r => r.id));
      
      // Get all IDs from new
      let newIdSet = new Set();
      try {
        const newIds = await newClient.query(`SELECT ${quoteIdent(idCol)} as id FROM ${quoteIdent(tableName)}`);
        newIdSet = new Set(newIds.rows.map(r => r.id));
      } catch (e) {}
      
      const missingIds = oldIds.rows.filter(r => !newIdSet.has(r.id)).map(r => r.id);
      
      if (missingIds.length === 0) {
        return NextResponse.json({ success: true, table: tableName, missing: 0, message: 'No missing rows' });
      }
      
      // Copy in batches using cursor
      let copied = 0;
      let skipped = 0;
      const batchSize = 500;
      
      await oldClient.query('BEGIN');
      const cursorName = `bulk_copy_cur_${Date.now()}`;
      // Use only working columns (tested above) — broken columns are excluded
      const workingColNames = workingCols.map(c => quoteIdent(c.column_name)).join(', ');
      await oldClient.query(`DECLARE ${cursorName} CURSOR FOR SELECT ${workingColNames} FROM ${quoteIdent(tableName)} WHERE ${quoteIdent(idCol)} = ANY($1::text[])`, [missingIds]);
      
      while (true) {
        const batch = await oldClient.query(`FETCH ${batchSize} FROM ${cursorName}`);
        // batch already contains only working columns (from cursor declaration)
        if (batch.rows.length === 0) break;
        
        for (const row of batch.rows) {
          try {
            const vals = workingCols.map(c => escapeValue(row[c.column_name])).join(', ');
            const wColNames = workingCols.map(c => quoteIdent(c.column_name)).join(', ');
            await newClient.query(`INSERT INTO ${quoteIdent(tableName)} (${wColNames}) VALUES (${vals}) ON CONFLICT DO NOTHING`);
            copied++;
          } catch (e) {
            skipped++;
          }
        }
      }
      
      await oldClient.query(`CLOSE ${cursorName}`);
      await oldClient.query('COMMIT');
      
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      return NextResponse.json({
        success: true,
        table: tableName,
        old_count: oldIdSet.size,
        new_count_before: newIdSet.size,
        missing_count: missingIds.length,
        working_columns: workingCols.length,
        total_columns: cols.rows.length,
        copied,
        skipped,
        elapsed_seconds: parseFloat(elapsed),
      });
    }
    
    // Action: repopulate - copy missing rows from old DB (using ctid to avoid OFFSET issues)
    if (action === 'repopulate' && tableName) {
      const startTime = Date.now();
      
      // Get columns
      const regclassStr = `public.${quoteIdent(tableName)}`;
      const cols = await oldClient.query(`
        SELECT 
          a.attname as column_name,
          format_type(a.atttypid, a.atttypmod) as data_type,
          t.typname as udt_name,
          t.typtype as type_type
        FROM pg_attribute a
        LEFT JOIN pg_type t ON a.atttypid = t.oid
        WHERE a.attrelid = to_regclass($1)
          AND a.attnum > 0
          AND NOT a.attisdropped
        ORDER BY a.attnum
      `, [regclassStr]);
      
      if (cols.rows.length === 0) {
        return NextResponse.json({ error: 'Table not found' }, { status: 404 });
      }
      
      const colNames = cols.rows.map(c => quoteIdent(c.column_name)).join(', ');
      const idCol = cols.rows.find(c => c.column_name === 'id')?.column_name;
      
      if (!idCol) {
        return NextResponse.json({ error: 'No id column' }, { status: 400 });
      }
      
      // Get all IDs from old DB
      const oldIds = await oldClient.query(`SELECT ${quoteIdent(idCol)} as id FROM ${quoteIdent(tableName)}`);
      const oldIdSet = new Set(oldIds.rows.map(r => r.id));
      
      // Get all IDs from new DB
      let newIdSet = new Set();
      try {
        const newIds = await newClient.query(`SELECT ${quoteIdent(idCol)} as id FROM ${quoteIdent(tableName)}`);
        newIdSet = new Set(newIds.rows.map(r => r.id));
      } catch (e) {
        // Table doesn't exist in new DB
      }
      
      // Find missing IDs
      const missingIds = oldIds.rows.filter(r => !newIdSet.has(r.id)).map(r => r.id);
      
      if (missingIds.length === 0) {
        return NextResponse.json({ success: true, table: tableName, missing: 0, message: 'No missing rows' });
      }
      
      // Copy missing rows in batches
      let copied = 0;
      let skipped = 0;
      const batchSize = 500;
      
      for (let i = 0; i < missingIds.length; i += batchSize) {
        const batch = missingIds.slice(i, i + batchSize);
        const idList = batch.map(id => `'${id.toString().replace(/'/g, "''")}'`).join(', ');
        
        // Read rows one by one to handle corrupt TOAST data
        for (const missingId of batch) {
          try {
            const rowRes = await oldClient.query(`SELECT ${colNames} FROM ${quoteIdent(tableName)} WHERE ${quoteIdent(idCol)} = $1`, [missingId]);
            if (rowRes.rows.length === 0) { skipped++; continue; }
            const row = rowRes.rows[0];
            const vals = cols.rows.map(c => escapeValue(row[c.column_name])).join(', ');
            await newClient.query(`INSERT INTO ${quoteIdent(tableName)} (${colNames}) VALUES (${vals}) ON CONFLICT DO NOTHING`);
            copied++;
          } catch (e) {
            skipped++;
          }
        }
        
        if ((i / batchSize) % 10 === 0) {
          console.log(`[repopulate] ${tableName}: ${copied}/${missingIds.length} copied`);
        }
      }
      
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      return NextResponse.json({
        success: true,
        table: tableName,
        old_count: oldIdSet.size,
        new_count_before: newIdSet.size,
        missing_count: missingIds.length,
        copied,
        skipped,
        elapsed_seconds: parseFloat(elapsed),
      });
    }
    
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  } finally {
    try { await oldClient.end(); } catch(_){}
    try { await newClient.end(); } catch(_){}
  }
}
