"use strict";
// src/models/entities.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerPlan = exports.PlanSchedule = exports.Plan = exports.PlanType = exports.Registration = exports.RegistrationType = exports.Schedule = exports.Service = exports.Customer = exports.BaseEntity = void 0;
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
// 🧾 CustomerPlan
class CustomerPlan {
}
exports.CustomerPlan = CustomerPlan;
//# sourceMappingURL=entities.js.map