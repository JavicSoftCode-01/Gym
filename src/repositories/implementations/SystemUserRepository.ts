import db from "../../database/database";
import { SystemUser } from "../../domain/entities";

export class SystemUserRepository {
    findByContact(contact: string): SystemUser | undefined {
        return db.prepare(`
            SELECT id, contact, password_hash as passwordHash, role, created_at as createdAt, updated_at as updatedAt 
            FROM system_users WHERE contact = ?
        `).get(contact) as SystemUser | undefined;
    }

    create(data: { contact: string; passwordHash: string; role?: string }): SystemUser {
        const now = new Date().toISOString();
        const role = data.role || 'admin';
        const result = db.prepare(`
            INSERT INTO system_users (contact, password_hash, role, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
        `).run(data.contact, data.passwordHash, role, now, now);

        return this.findByContact(data.contact)!;
    }
}