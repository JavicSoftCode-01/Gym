"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CashRegisterService = void 0;
const database_1 = __importDefault(require("../database/database"));
class CashRegisterService {
    // 1. Ver cómo va la caja en el día (antes de cerrar)
    getTodayExpected(date) {
        const payments = database_1.default.prepare(`
            SELECT pm.name as methodName, SUM(p.amount) as total
            FROM payments p
                     LEFT JOIN payment_methods pm ON pm.id = p.payment_method_id
            WHERE DATE(p.paid_at) = ?
            GROUP BY pm.name
        `).all(date);
        let expectedCash = 0;
        let expectedDeposit = 0;
        const isCashLike = (name) => {
            const n = name.toLowerCase();
            return n.includes("efectivo") || n.includes("cash");
        };
        payments.forEach(p => {
            const name = (p.methodName || "").trim();
            if (!name)
                return;
            if (isCashLike(name))
                expectedCash += p.total;
            else
                expectedDeposit += p.total;
        });
        return {
            expectedCash,
            expectedDeposit,
            totalExpected: expectedCash + expectedDeposit
        };
    }
    // 2. Cerrar la caja y guardar histórico
    closeRegister(userId, date, actualCash, actualDeposit) {
        // Validar si ya se cerró la caja para esta fecha
        const alreadyClosed = database_1.default.prepare(`SELECT id FROM cash_registers WHERE date = ?`).get(date);
        if (alreadyClosed) {
            throw new Error("La caja ya fue cerrada para esta fecha.");
        }
        // Obtener lo esperado según los pagos registrados
        const { expectedCash, expectedDeposit, totalExpected } = this.getTodayExpected(date);
        const totalActual = actualCash + actualDeposit;
        const difference = totalActual - totalExpected;
        // Obtener el gran total acumulado del cierre anterior
        const lastClosing = database_1.default.prepare(`SELECT grand_total FROM cash_registers ORDER BY id DESC LIMIT 1`).get();
        const previousGrandTotal = lastClosing ? lastClosing.grand_total : 0;
        // 🌟 Se acumula solo el total esperado (lo que realmente entró al gym)
        const newGrandTotal = previousGrandTotal + totalExpected;
        // Guardar el cierre de caja
        database_1.default.prepare(`
            INSERT INTO cash_registers
                (user_id, date, expected_cash, expected_deposit,
                 actual_cash, actual_deposit, difference, daily_total, grand_total)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(userId, date, expectedCash, expectedDeposit, actualCash, actualDeposit, difference, totalExpected, newGrandTotal);
        return {
            message: "Caja cerrada correctamente",
            date,
            expectedCash,
            expectedDeposit,
            actualCash,
            actualDeposit,
            dailyTotal: totalExpected,
            difference,
            grandTotal: newGrandTotal
        };
    }
    // 3. Historial de cierres de caja
    getHistory() {
        return database_1.default.prepare(`
            SELECT cr.id,
                   cr.date,
                   cr.expected_cash   AS expectedCash,
                   cr.expected_deposit AS expectedDeposit,
                   cr.actual_cash     AS actualCash,
                   cr.actual_deposit  AS actualDeposit,
                   cr.difference,
                   cr.daily_total     AS dailyTotal,
                   cr.grand_total     AS grandTotal,
                   su.contact         AS closedBy,
                   cr.created_at      AS createdAt
            FROM cash_registers cr
                     LEFT JOIN system_users su ON su.id = cr.user_id
            ORDER BY cr.id DESC
        `).all();
    }
}
exports.CashRegisterService = CashRegisterService;
//# sourceMappingURL=CashRegisterService.js.map