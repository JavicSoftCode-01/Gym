import db from "../../database/database";
import {Customer} from "../../domain/entities";
import {ICustomerRepository} from "../interfaces/ICustomerRepository";

export class CustomerRepository implements ICustomerRepository {

    findAll(): Customer[] {
        return db.prepare(`
            SELECT id, full_name as fullName, contact, created_at as createdAt, updated_at as updatedAt
            FROM customers
            ORDER BY full_name ASC
        `).all() as Customer[];
    }

    findById(id: number): Customer | undefined {
        return db.prepare(`
            SELECT id, full_name as fullName, contact, created_at as createdAt, updated_at as updatedAt
            FROM customers
            WHERE id = ?
        `).get(id) as Customer | undefined;
    }

    create(data: { fullName: string; contact: string }): Customer {
        const now = new Date().toISOString();
        const result = db.prepare(`
            INSERT INTO customers (full_name, contact, created_at, updated_at)
            VALUES (?, ?, ?, ?)
        `).run(data.fullName, data.contact, now, now);

        return this.findById(result.lastInsertRowid as number)!;
    }

    update(id: number, data: Partial<{ fullName: string; contact: string }>): Customer | undefined {
        const current = this.findById(id);
        if (!current) return undefined;

        const now = new Date().toISOString();
        db.prepare(`
            UPDATE customers
            SET full_name  = ?,
                contact    = ?,
                updated_at = ?
            WHERE id = ?
        `).run(
            data.fullName ?? current.fullName,
            data.contact ?? current.contact,
            now,
            id
        );

        return this.findById(id);
    }

    delete(id: number): boolean {
        const result = db.prepare(`DELETE
                                   FROM customers
                                   WHERE id = ?`).run(id);
        return result.changes > 0;
    }
}