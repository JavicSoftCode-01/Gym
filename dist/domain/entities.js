"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CashRegister = exports.AuditLog = exports.SystemUser = exports.Payment = exports.PaymentMethod = exports.CustomerPlan = exports.CustomerPlanStatus = exports.PlanSchedule = exports.Plan = exports.PlanType = exports.Schedule = exports.Service = exports.Inscription = exports.Customer = exports.BaseEntity = void 0;
// src/domain/entities.ts
class BaseEntity {
}
exports.BaseEntity = BaseEntity;
// 👤 Customer
class Customer extends BaseEntity {
}
exports.Customer = Customer;
// 🎽 Inscription (Catálogo de uniformes)
class Inscription extends BaseEntity {
}
exports.Inscription = Inscription;
// 🏷️ Service
class Service extends BaseEntity {
}
exports.Service = Service;
// 📅 Schedule
class Schedule extends BaseEntity {
}
exports.Schedule = Schedule;
// 💰 Plan
var PlanType;
(function (PlanType) {
    PlanType["DAILY"] = "daily";
    PlanType["MONTHLY"] = "monthly";
})(PlanType || (exports.PlanType = PlanType = {}));
class Plan extends BaseEntity {
}
exports.Plan = Plan;
// 🔗 PlanSchedule (N:M)
class PlanSchedule extends BaseEntity {
}
exports.PlanSchedule = PlanSchedule;
// 📊 CustomerPlanStatus
var CustomerPlanStatus;
(function (CustomerPlanStatus) {
    CustomerPlanStatus["PENDING"] = "pending";
    CustomerPlanStatus["PARTIAL"] = "partial";
    CustomerPlanStatus["PAID"] = "paid";
    CustomerPlanStatus["EXPIRED"] = "expired";
})(CustomerPlanStatus || (exports.CustomerPlanStatus = CustomerPlanStatus = {}));
// 🧾 CustomerPlan
class CustomerPlan {
}
exports.CustomerPlan = CustomerPlan;
// 💳 PaymentMethod (Para que el usuario registre los suyos)
class PaymentMethod extends BaseEntity {
}
exports.PaymentMethod = PaymentMethod;
// 💵 Payment
class Payment extends BaseEntity {
}
exports.Payment = Payment;
// 🛡️ SystemUser (Administradores / Staff)
class SystemUser extends BaseEntity {
}
exports.SystemUser = SystemUser;
// 🕵️ AuditLog (Auditoría)
class AuditLog extends BaseEntity {
}
exports.AuditLog = AuditLog;
// 💵 CashRegister (Cuadre de Caja)
class CashRegister extends BaseEntity {
}
exports.CashRegister = CashRegister;
//# sourceMappingURL=entities.js.map