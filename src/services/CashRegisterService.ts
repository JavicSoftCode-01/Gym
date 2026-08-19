import { ICashRegisterRepository } from "../repositories/interfaces/ICashRegisterRepository";

export class CashRegisterService {
    constructor(private readonly cashRegisterRepo: ICashRegisterRepository) {}

    // 0. Abrir caja
    openRegister(userId: number, openingBalance: number) {
        if (openingBalance < 0) throw new Error("El monto de apertura no puede ser negativo.");
        
        const activeRegister = this.cashRegisterRepo.getActiveRegister(userId);
        if (activeRegister) {
            throw new Error(`Ya tienes una caja abierta desde ${activeRegister.openedAt}. Debes cerrarla antes de abrir una nueva.`);
        }

        return this.cashRegisterRepo.openRegister(userId, openingBalance);
    }

    // 1. Ver cómo va la caja en el día (antes de cerrar)
    getTodayExpected(userId: number) {
        const activeRegister = this.cashRegisterRepo.getActiveRegister(userId);
        if (!activeRegister) {
            throw new Error("No tienes un turno de caja abierto.");
        }

        const payments = this.cashRegisterRepo.getExpectedSummary(activeRegister.id);

        let expectedCash = activeRegister.openingBalance;
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
            cashRegisterId: activeRegister.id,
            openingBalance: activeRegister.openingBalance,
            expectedCash,
            expectedDeposit,
            totalExpected: expectedCash + expectedDeposit,
            openedAt: activeRegister.openedAt
        };
    }

    // 2. Cerrar la caja y guardar histórico
    closeRegister(
        userId: number,
        actualCash: number,
        actualDeposit: number
    ) {
        // Validar si ya se cerró la caja para esta fecha
        const activeRegister = this.cashRegisterRepo.getActiveRegister(userId);
        if (!activeRegister) {
            throw new Error("No tienes un turno de caja abierto para cerrar.");
        }

        // Obtener lo esperado según los pagos registrados
        const { expectedCash, expectedDeposit, totalExpected } = this.getTodayExpected(userId);

        const totalActual = actualCash + actualDeposit;
        const difference = totalActual - totalExpected;

        // Aquí podríamos acumular el grandTotal obteniendo el histórico, pero dado el modelo nuevo
        // es mejor solo basarnos en dailyTotal (lo que ingresó HOY - monto inicial).
        const dailyIncome = totalExpected - activeRegister.openingBalance;
        
        const history = this.cashRegisterRepo.getHistory();
        const lastClosed = history.find(cr => cr.status === 'closed');
        const previousGrandTotal = lastClosed ? lastClosed.grandTotal : 0;
        const newGrandTotal = previousGrandTotal + dailyIncome;

        // Guardar el cierre de caja a través del repositorio
        this.cashRegisterRepo.closeRegister(
            activeRegister.id,
            actualCash,
            actualDeposit,
            difference,
            dailyIncome,
            newGrandTotal
        );

        return {
            message: "Caja cerrada correctamente",
            expectedCash,
            expectedDeposit,
            actualCash,
            actualDeposit,
            dailyIncome,
            difference,
            grandTotal: newGrandTotal
        };
    }

    // 3. Historial de cierres de caja
    getHistory() {
        return this.cashRegisterRepo.getHistory();
    }
}
