"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Payment = exports.PaymentMethod = exports.CustomerPlan = exports.CustomerPlanStatus = exports.PlanSchedule = exports.Plan = exports.PlanType = exports.Registration = exports.RegistrationType = exports.Schedule = exports.Service = exports.Customer = exports.BaseEntity = void 0;
class BaseEntity {
}
exports.BaseEntity = BaseEntity;
// 👤 Customer
class Customer extends BaseEntity {
}
exports.Customer = Customer;
// 🏷️ Service
class Service extends BaseEntity {
}
exports.Service = Service;
// 📅 Schedule
class Schedule extends BaseEntity {
}
exports.Schedule = Schedule;
// 🎽 RegistrationType
class RegistrationType extends BaseEntity {
}
exports.RegistrationType = RegistrationType;
// 📝 Registration
class Registration extends BaseEntity {
}
exports.Registration = Registration;
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
// 💳 PaymentMethod
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CASH"] = "cash";
    PaymentMethod["DEPOSIT"] = "deposit";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
// 💵 Payment
class Payment extends BaseEntity {
}
exports.Payment = Payment;
//# sourceMappingURL=entities.js.map