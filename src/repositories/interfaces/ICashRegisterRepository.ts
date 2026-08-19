import { CashRegister } from "../../domain/entities";

export interface ExpectedPaymentSummary {
    methodName: string | null;
    total: number;
}

export interface LiveCashRegisterStatus {
    cashRegisterId: number;
    openingBalance: number;
    expectedCash: number;
    expectedDeposit: number;
    totalExpected: number;
    openedAt: string | Date;
}

export interface ICashRegisterRepository {
    getActiveRegister(userId: number): CashRegister | undefined;
    openRegister(userId: number, openingBalance: number): CashRegister;
    getExpectedSummary(cashRegisterId: number): ExpectedPaymentSummary[];
    closeRegister(cashRegisterId: number, actualCash: number, actualDeposit: number, difference: number, dailyTotal: number, grandTotal: number): void;
    getHistory(): CashRegister[];
}
