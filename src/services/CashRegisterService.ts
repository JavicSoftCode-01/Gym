import db from "../database/database";

export class CashRegisterService {

    // 1. Ver cómo va la caja en el día (antes de cerrar)
    getTodayExpected(date: string) {
        const payments = db.prepare(`
            SELECT pm.name as methodName, SUM(p.amount) as total
            FROM payments p
                     LEFT JOIN payment_methods pm ON pm.id = p.payment_method_id
            WHERE DATE(p.paid_at) = ?
            GROUP BY pm.name
        `).all(date) as { methodName: string | null; total: number }[];

        let expectedCash = 0;
        let expectedDeposit = 0;

        const isCashLike = (name: string) => {
            const n = name.toLowerCase();
            return n.includes("efectivo") || n.includes("cash") || n.includes("reembolso");
        };

        payments.forEach(p => {
            const name = (p.methodName || "").trim();
            if (!name) return;
            if (isCashLike(name)) expectedCash += p.total;
            else expectedDeposit += p.total;
        });

        return {
            expectedCash,
            expectedDeposit,
            totalExpected: expectedCash + expectedDeposit
        };
    }

    // 2. Cerrar la caja y guardar histórico
    closeRegister(
        userId: number,
        date: string,
        actualCash: number,
        actualDeposit: number
    ) {
        // Validar si ya se cerró la caja para esta fecha
        const alreadyClosed = db.prepare(
            `SELECT id FROM cash_registers WHERE date = ?`
        ).get(date);

        if (alreadyClosed) {
            throw new Error("La caja ya fue cerrada para esta fecha.");
        }

        // Obtener lo esperado según los pagos registrados
        const { expectedCash, expectedDeposit, totalExpected } =
            this.getTodayExpected(date);

        const totalActual = actualCash + actualDeposit;
        const difference = totalActual - totalExpected;

        // Obtener el gran total acumulado del cierre anterior
        const lastClosing = db.prepare(
            `SELECT grand_total FROM cash_registers ORDER BY id DESC LIMIT 1`
        ).get() as { grand_total: number } | undefined;

        const previousGrandTotal = lastClosing ? lastClosing.grand_total : 0;
        // 🌟 Se acumula solo el total esperado (lo que realmente entró al gym)
        const newGrandTotal = previousGrandTotal + totalExpected;

        // Guardar el cierre de caja
        db.prepare(`
            INSERT INTO cash_registers
                (user_id, date, expected_cash, expected_deposit,
                 actual_cash, actual_deposit, difference, daily_total, grand_total)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            userId,
            date,
            expectedCash,
            expectedDeposit,
            actualCash,
            actualDeposit,
            difference,
            totalExpected,
            newGrandTotal
        );

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
        return db.prepare(`
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
