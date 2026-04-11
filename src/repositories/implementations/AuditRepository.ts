import db from "../../database/database";

export class AuditRepository {
    static log(userId: number, action: "CREATE" | "UPDATE" | "DELETE", tableName: string, recordId: number, details: any) {
        const stmt = db.prepare(`
            INSERT INTO audit_logs (user_id, action, table_name, record_id, details, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `);
        stmt.run(userId, action, tableName, recordId, JSON.stringify(details));
    }
}