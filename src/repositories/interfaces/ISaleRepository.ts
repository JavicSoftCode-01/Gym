import { Sale, SaleItem } from "../../domain/entities";

export interface CreateSaleDTO {
    userId: number;
    cashRegisterId: number;
    customerId?: number | null;
    paymentMethodId: number;
    notes?: string | null;
    items: {
        itemType: 'product' | 'plan';
        productId?: number | null;
        planId?: number | null;
        name: string;
        quantity: number;
        unitPrice: number;
        unitCost: number;
        discountApplied: number;
        discountId?: number | null;
        subtotal: number;
    }[];
    subtotal: number;
    discountTotal: number;
    total: number;
}

export interface ISaleRepository {
    findAll(): Sale[];
    findById(id: number): Sale | undefined;
    findBySaleNumber(saleNumber: string): Sale | undefined;
    createSaleTransaction(dto: CreateSaleDTO): Sale;
    getTodaySalesTotal(date: string): { methodName: string | null; total: number }[];
    cancelSale(id: number, userId: number, reason?: string): boolean;
}
