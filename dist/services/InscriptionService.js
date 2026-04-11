"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InscriptionService = void 0;
class InscriptionService {
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
exports.InscriptionService = InscriptionService;
//# sourceMappingURL=InscriptionService.js.map