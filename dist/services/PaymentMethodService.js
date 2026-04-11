"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentMethodService = void 0;
class PaymentMethodService {
    constructor(repo) {
        this.repo = repo;
    }
    getAll() {
        return this.repo.findAll();
    }
    create(data, userId) {
        return this.repo.create(data, userId);
    }
    update(id, data, userId) {
        this.repo.update(id, data, userId);
    }
    delete(id, userId) {
        this.repo.delete(id, userId);
    }
}
exports.PaymentMethodService = PaymentMethodService;
//# sourceMappingURL=PaymentMethodService.js.map