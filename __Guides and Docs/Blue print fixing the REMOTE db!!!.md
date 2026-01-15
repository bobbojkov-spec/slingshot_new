# Blueprint: Fixing the Remote Database Connection

**Target Issue**: "Relation [table] does not exist" on first request, specifically on Remote/Railway environments.
**Root Cause**: Core Bootstrap Race Condition. The server starts listening for requests `app.listen()` *before* the Database connection/schema check `initDB()` completes.

## 1. The Core Fix (Server Side)

**File**: `server/index.js`

**Logic**:
Do NOT fire `app.listen()` until `initDB()` resolves. Use an async bootstrap function.

### ❌ WRONG (Race Condition)
```javascript
// This runs initDB() in background, then IMMEDIATELY starts listening
initDB();

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
```

### ✅ CORRECT (Awaited Bootstrap)
```javascript
const startServer = async () => {
    try {
        // 1. BLOCK until DB is ready
        await initDB();
        
        // 2. Only THEN start listening
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (err) {
        // If DB fails, do not start server
        console.error('❌ FATAL: Failed to start server:', err);
        process.exit(1);
    }
};

startServer();
```

## 2. The Railway SSL Fix (Database Config)

**File**: `server/db.js`

**Logic**:
Railway (and many cloud Postgres providers) requires SSL for external connections, but *rejects* self-signed certificates by default unless `rejectUnauthorized: false` is set.

### Code Pattern
```javascript
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Add this conditional SSL config
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
});
```

## 3. Verification Steps

1.  **Logs**: Ensure initialization log (`DB verified`) appears *before* `Server running`.
2.  **Endpoint**: Check a DB-dependent endpoint immediately after deploy (e.g. `/api/site_settings`).
3.  **Error Handling**: If `initDB()` fails, server should crash (exit 1) rather than hang or serve 500s.

---
**Status**: APPLIED & VERIFIED
**Version**: v1.3.3
