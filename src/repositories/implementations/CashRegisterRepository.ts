import db from "../../database/database";
import {
    ICashRegisterRepository,
    ExpectedPaymentSummary,
} from "../interfaces/ICashRegisterRepository";
import { CashRegister } from "../../domain/entities";

export class CashRegisterRepository implements ICashRegisterRepository {
    
    getActiveRegister(userId: number): CashRegister | undefined {
        return db.prepare(`
            SELECT * FROM cash_registers 
            WHERE user_id = ? AND status = 'open' 
            ORDER BY id DESC LIMIT 1
        `).get(userId) as CashRegister | undefined;
    }

    openRegister(userId: number, openingBalance: number): CashRegister {
        const result = db.prepare(`
            INSERT INTO cash_registers (user_id, status, opening_balance, opened_at, created_at, updated_at)
            VALUES (?, 'open', ?, datetime('now'), datetime('now'), datetime('now'))
        `).run(userId, openingBalance);
        
        return db.prepare(`SELECT * FROM cash_registers WHERE id = ?`).get(result.lastInsertRowid) as CashRegister;
    }

    getExpectedSummary(cashRegisterId: number): ExpectedPaymentSummary[] {
        // Unificar pagos de suscripciones (payments) y ventas de productos/servicios POS (sales)
        // para la CAJA ACTIVA ESPECÍFICA
        return db.prepare(`
            WITH combined_income AS (
                SELECT p.payment_method_id, p.amount
                FROM payments p
                WHERE p.cash_register_id = ?
                
                UNION ALL
                
                SELECT s.payment_method_id, s.total as amount
                FROM sales s
                WHERE s.cash_register_id = ? AND s.status = 'completed'
            )
            SELECT pm.name as methodName, SUM(ci.amount) as total
            FROM combined_income ci
            LEFT JOIN payment_methods pm ON pm.id = ci.payment_method_id
            GROUP BY pm.name
        `).all(cashRegisterId, cashRegisterId) as ExpectedPaymentSummary[];
    }

    closeRegister(cashRegisterId: number, actualCash: number, actualDeposit: number, difference: number, dailyTotal: number, grandTotal: number): void {
        db.prepare(`
            UPDATE cash_registers
            SET status = 'closed',
                actual_cash = ?,
                actual_deposit = ?,
                difference = ?,
                daily_total = ?,
                grand_total = ?,
                closed_at = datetime('now'),
                updated_at = datetime('now')
            WHERE id = ?
        `).run(actualCash, actualDeposit, difference, dailyTotal, grandTotal, cashRegisterId);
    }

    getHistory(): CashRegister[] {
        return db.prepare(`
            SELECT cr.*, su.contact as closedBy
            FROM cash_registers cr
            LEFT JOIN system_users su ON su.id = cr.user_id
            ORDER BY cr.id DESC
        `).all() as CashRegister[];
    }
}
