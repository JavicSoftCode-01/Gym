// src/repositories/implementations/CustomerRepository.ts
import db from "../../database/database";
import {Customer} from "../../domain/entities";
import {ICustomerRepository} from "../interfaces/ICustomerRepository";
import {AuditRepository} from "./AuditRepository"; // 🌟 Auditoría

export class CustomerRepository implements ICustomerRepository {

    findAll(): Customer[] {
        return db.prepare(`
            SELECT id,
                   full_name as fullName,
                   contact,
                   inscription_id as inscriptionId,
                   created_at as createdAt,
                   updated_at as updatedAt
            FROM customers
            ORDER BY full_name ASC
        `).all() as Customer[];
    }

    findById(id: number): Customer | undefined {
        return db.prepare(`
            SELECT id,
                   full_name as fullName,
                   contact,
                   inscription_id as inscriptionId,
                   created_at as createdAt,
                   updated_at as updatedAt
            FROM customers
            WHERE id = ?
        `).get(id) as Customer | undefined;
    }

    create(data: { fullName: string; contact: string; inscriptionId?: number | null }, userId: number): Customer {
        const now = new Date().toISOString();
        const result = db.prepare(`
            INSERT INTO customers (full_name, contact, inscription_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
        `).run(data.fullName, data.contact, data.inscriptionId ?? null, now, now);

        const newId = result.lastInsertRowid as number;

        // 🌟 Registrar auditoría
        AuditRepository.log(userId, "CREATE", "customers", newId, data);

        return this.findById(newId)!;
    }

    update(id: number, data: Partial<{ fullName: string; contact: string; inscriptionId?: number | null }>, userId: number): Customer | undefined {
        const current = this.findById(id);
        if (!current) return undefined;

        const now = new Date().toISOString();
        db.prepare(`
            UPDATE customers
            SET full_name  = ?,
                contact    = ?,
                inscription_id = ?,
                updated_at = ?
            WHERE id = ?
        `).run(
            data.fullName ?? current.fullName,
            data.contact ?? current.contact,
            data.inscriptionId ?? current.inscriptionId ?? null,
            now,
            id
        );

        // 🌟 Registrar auditoría
        AuditRepository.log(userId, "UPDATE", "customers", id, data);

        return this.findById(id);
    }

    delete(id: number, userId: number): boolean {
        // 🌟 Guardar datos antes de borrar para tenerlos en el log
        const current = this.findById(id);
        const result = db.prepare(`DELETE FROM customers WHERE id = ?`).run(id);
        if (result.changes > 0 && current) {
            AuditRepository.log(userId, "DELETE", "customers", id, current);
        }
        return result.changes > 0;
    }
}