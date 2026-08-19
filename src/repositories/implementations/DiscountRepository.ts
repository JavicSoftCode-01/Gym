import db from "../../database/database";
import { Discount, DiscountCalculationType, DiscountTargetType, DiscountType } from "../../domain/entities";
import { IDiscountRepository } from "../interfaces/IDiscountRepository";
import { AuditRepository } from "./AuditRepository";

export class DiscountRepository implements IDiscountRepository {
    findAll(includeInactive = true): Discount[] {
        const query = `
            SELECT id, name, type, discount_type as discountType, value, min_quantity as minQuantity,
                   target_type as targetType, target_id as targetId, start_date as startDate,
                   end_date as endDate, start_time as startTime, end_time as endTime,
                   days_of_week as daysOfWeek, is_active as isActive,
                   created_at as createdAt, updated_at as updatedAt
            FROM discounts
            ${includeInactive ? '' : 'WHERE is_active = 1'}
            ORDER BY id DESC
        `;

        const rows = db.prepare(query).all() as any[];
        return rows.map(r => ({
            ...r,
            isActive: Boolean(r.isActive),
            createdAt: new Date(r.createdAt),
            updatedAt: new Date(r.updatedAt)
        }));
    }

    findById(id: number): Discount | undefined {
        const r = db.prepare(`
            SELECT id, name, type, discount_type as discountType, value, min_quantity as minQuantity,
                   target_type as targetType, target_id as targetId, start_date as startDate,
                   end_date as endDate, start_time as startTime, end_time as endTime,
                   days_of_week as daysOfWeek, is_active as isActive,
                   created_at as createdAt, updated_at as updatedAt
            FROM discounts
            WHERE id = ?
        `).get(id) as any;

        if (!r) return undefined;
        return {
            ...r,
            isActive: Boolean(r.isActive),
            createdAt: new Date(r.createdAt),
            updatedAt: new Date(r.updatedAt)
        };
    }

    findActiveDiscounts(): Discount[] {
        return this.findAll(false);
    }

    create(data: Omit<Discount, "id" | "createdAt" | "updatedAt">, userId: number): Discount {
        const now = new Date().toISOString();
        const result = db.prepare(`
            INSERT INTO discounts (name, type, discount_type, value, min_quantity, target_type, target_id, start_date, end_date, start_time, end_time, days_of_week, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            data.name.trim(),
            data.type,
            data.discountType,
            data.value,
            data.minQuantity || 1,
            data.targetType,
            data.targetId || null,
            data.startDate || null,
            data.endDate || null,
            data.startTime || null,
            data.endTime || null,
            data.daysOfWeek || null,
            data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1,
            now,
            now
        );

        const newId = result.lastInsertRowid as number;
        AuditRepository.log(userId, "CREATE", "discounts", newId, data);
        return this.findById(newId)!;
    }

    update(id: number, data: Partial<Omit<Discount, "id" | "createdAt" | "updatedAt">>, userId: number): Discount | undefined {
        const existing = this.findById(id);
        if (!existing) return undefined;

        const now = new Date().toISOString();
        db.prepare(`
            UPDATE discounts
            SET name = COALESCE(?, name),
                type = COALESCE(?, type),
                discount_type = COALESCE(?, discount_type),
                value = COALESCE(?, value),
                min_quantity = COALESCE(?, min_quantity),
                target_type = COALESCE(?, target_type),
                target_id = COALESCE(?, target_id),
                start_date = COALESCE(?, start_date),
                end_date = COALESCE(?, end_date),
                start_time = COALESCE(?, start_time),
                end_time = COALESCE(?, end_time),
                days_of_week = COALESCE(?, days_of_week),
                is_active = COALESCE(?, is_active),
                updated_at = ?
            WHERE id = ?
        `).run(
            data.name?.trim() || null,
            data.type || null,
            data.discountType || null,
            data.value !== undefined ? data.value : null,
            data.minQuantity !== undefined ? data.minQuantity : null,
            data.targetType || null,
            data.targetId !== undefined ? data.targetId : null,
            data.startDate !== undefined ? data.startDate : null,
            data.endDate !== undefined ? data.endDate : null,
            data.startTime !== undefined ? data.startTime : null,
            data.endTime !== undefined ? data.endTime : null,
            data.daysOfWeek !== undefined ? data.daysOfWeek : null,
            data.isActive !== undefined ? (data.isActive ? 1 : 0) : null,
            now,
            id
        );

        AuditRepository.log(userId, "UPDATE", "discounts", id, data);
        return this.findById(id);
    }

    toggleActive(id: number, isActive: boolean, userId: number): boolean {
        db.prepare(`UPDATE discounts SET is_active = ?, updated_at = datetime('now') WHERE id = ?`).run(isActive ? 1 : 0, id);
        AuditRepository.log(userId, "UPDATE", "discounts", id, { isActive });
        return true;
    }

    delete(id: number, userId: number): boolean {
        const existing = this.findById(id);
        if (!existing) return false;

        db.prepare(`DELETE FROM discounts WHERE id = ?`).run(id);
        AuditRepository.log(userId, "DELETE", "discounts", id, existing);
        return true;
    }
}
