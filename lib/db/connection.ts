import { query as pgQuery } from '@/lib/dbPg';

// Convert MySQL query to PostgreSQL
function convertMySQLToPostgreSQL(sqlQuery: string, params?: any[]): { query: string; pgParams: any[] } {
    let pgQuery = sqlQuery;
    const pgParams: any[] = [];

    // Count question marks in the query
    const questionMarkCount = (sqlQuery.match(/\?/g) || []).length;

    if (params && params.length > 0) {
        // Ensure we have enough parameters
        if (params.length !== questionMarkCount) {
            console.warn(`⚠️ Parameter count mismatch: ${questionMarkCount} placeholders but ${params.length} parameters`);
        }

        let paramIndex = 1;
        pgQuery = sqlQuery.replace(/\?/g, () => {
            const value = params[pgParams.length];
            // Convert boolean to proper PostgreSQL boolean (not 0/1)
            if (typeof value === 'boolean') {
                pgParams.push(value);
            } else {
                pgParams.push(value);
            }
            return `$${paramIndex++}`;
        });
    } else if (questionMarkCount > 0) {
        // If there are placeholders but no params, that's an error
        console.error(`❌ Query has ${questionMarkCount} placeholders but params is empty or undefined`);
    }

    // Remove MySQL backticks and replace with PostgreSQL double quotes
    // PostgreSQL uses double quotes for identifiers, and "order" is a reserved word
    pgQuery = pgQuery.replace(/`([^`]+)`/g, '"$1"');

    // Convert MySQL-specific functions
    pgQuery = pgQuery.replace(/DATABASE\(\)/gi, 'current_database()');

    // Convert MySQL boolean comparisons (active = 1/0) to PostgreSQL boolean
    pgQuery = pgQuery.replace(/\bactive\s*=\s*1\b/gi, 'active = TRUE');
    pgQuery = pgQuery.replace(/\bactive\s*=\s*0\b/gi, 'active = FALSE');
    pgQuery = pgQuery.replace(/\bactive\s*=\s*TRUE\b/gi, 'active = TRUE');

    return { query: pgQuery, pgParams };
}

// Execute a query
export async function query<T = any>(
    sqlQuery: string,
    params?: any[]
): Promise<T[]> {
    let pgSQL = "";
    let pgParams: any[] = [];

    try {
        const converted = convertMySQLToPostgreSQL(sqlQuery, params);
        pgSQL = converted.query;
        pgParams = converted.pgParams;

        // Execute query using the pool from dbPg
        const { rows } = await pgQuery(pgSQL, pgParams);

        // If query expects insertId (MySQL pattern), add it to the result
        // This handles cases where code expects { insertId: number } in the result
        if (pgSQL.trim().toUpperCase().startsWith('INSERT') && rows.length > 0) {
            // Check if result has 'id' field (from RETURNING id)
            const mappedRows = rows.map((row: any) => {
                if (row.id !== undefined) {
                    return { ...row, insertId: row.id };
                }
                return row;
            });
            return mappedRows as T[];
        }

        return rows as T[];
    } catch (error: any) {
        console.error('❌ Database Query Error:', {
            message: error?.message,
            code: error?.code,
            sql: sqlQuery.slice(0, 200) + (sqlQuery.length > 200 ? '...' : ''),
            paramCount: params?.length || 0,
            pgParamsCount: pgParams?.length || 0,
            stack: error?.stack?.split('\n').slice(0, 3).join('\n') // Just top of stack
        });
        throw error;
    }
}

// Execute a query and return the first result
export async function queryOne<T = any>(
    sqlQuery: string,
    params?: any[]
): Promise<T | null> {
    const results = await query<T>(sqlQuery, params);
    return results.length > 0 ? results[0] : null;
}

// Execute insert and return the inserted ID (PostgreSQL style)
export async function insertAndGetId(
    sqlQuery: string,
    params?: any[]
): Promise<number> {
    try {
        // Add RETURNING id to the query (at the END, after VALUES clause)
        let insertQuery = sqlQuery.trim();
        if (!insertQuery.toUpperCase().includes('RETURNING')) {
            // Add RETURNING id at the end of the INSERT statement
            insertQuery = insertQuery.replace(/;?\s*$/i, '') + ' RETURNING id';
        }

        let pgSQL = "";
        let pgParams: any[] = [];

        const converted = convertMySQLToPostgreSQL(insertQuery, params);
        pgSQL = converted.query;
        pgParams = converted.pgParams;

        const { rows } = await pgQuery(pgSQL.trim(), pgParams);

        if (rows && rows.length > 0) {
            return rows[0].id;
        }
        return 0;
    } catch (error: any) {
        console.error('Insert error:', {
            sql: sqlQuery.substring(0, 100),
            message: error?.message,
        });
        throw error;
    }
}
