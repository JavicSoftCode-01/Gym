import db from "../../database/database";
import { Supplier } from "../../domain/entities";
import { ISupplierRepository } from "../interfaces/ISupplierRepository";
import { AuditRepository } from "./AuditRepository";

export class SupplierRepository implements ISupplierRepository {
    findAll(): Supplier[] {
        return db.prepare(`
            SELECT id, name, identification, contact_name as contactName, phone, email, address, notes,
                   created_at as createdAt, updated_at as updatedAt
            FROM suppliers
            ORDER BY name ASC
        `).all() as Supplier[];
    }

    findById(id: number): Supplier | undefined {
        return db.prepare(`
            SELECT id, name, identification, contact_name as contactName, phone, email, address, notes,
                   created_at as createdAt, updated_at as updatedAt
            FROM suppliers
            WHERE id = ?
        `).get(id) as Supplier | undefined;
    }

    create(data: Omit<Supplier, "id" | "createdAt" | "updatedAt">, userId: number): Supplier {
        const now = new Date().toISOString();
        const stmt = db.prepare(`
            INSERT INTO suppliers (name, identification, contact_name, phone, email, address, notes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            data.name.trim(),
            data.identification?.trim() || null,
            data.contactName?.trim() || null,
            data.phone?.trim() || null,
            data.email?.trim() || null,
            data.address?.trim() || null,
            data.notes?.trim() || null,
            now,
            now
        );

        const newId = result.lastInsertRowid as number;
        AuditRepository.log(userId, "CREATE", "suppliers", newId, data);
        return this.findById(newId)!;
    }

    update(id: number, data: Partial<Omit<Supplier, "id" | "createdAt" | "updatedAt">>, userId: number): Supplier | undefined {
        const existing = this.findById(id);
        if (!existing) return undefined;

        const now = new Date().toISOString();
        db.prepare(`
            UPDATE suppliers
            SET name = COALESCE(?, name),
                identification = COALESCE(?, identification),
                contact_name = COALESCE(?, contact_name),
                phone = COALESCE(?, phone),
                email = COALESCE(?, email),
                address = COALESCE(?, address),
                notes = COALESCE(?, notes),
                updated_at = ?
            WHERE id = ?
        `).run(
            data.name?.trim() || null,
            data.identification !== undefined ? data.identification : null,
            data.contactName !== undefined ? data.contactName : null,
            data.phone !== undefined ? data.phone : null,
            data.email !== undefined ? data.email : null,
            data.address !== undefined ? data.address : null,
            data.notes !== undefined ? data.notes : null,
            now,
            id
        );

        AuditRepository.log(userId, "UPDATE", "suppliers", id, data);
        return this.findById(id);
    }

    delete(id: number, userId: number): boolean {
        const existing = this.findById(id);
        if (!existing) return false;

        db.prepare(`DELETE FROM suppliers WHERE id = ?`).run(id);
        AuditRepository.log(userId, "DELETE", "suppliers", id, existing);
        return true;
    }
}
