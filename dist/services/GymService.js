"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GymService = void 0;
class GymService {
    constructor(serviceRepository) {
        this.serviceRepository = serviceRepository;
    }
    getAllServices() {
        return this.serviceRepository.findAll();
    }
    getServiceById(id) {
        return this.serviceRepository.findById(id);
    }
    createService(data, userId) {
        if (!data.title) {
            throw new Error("El título del servicio es obligatorio.");
        }
        return this.serviceRepository.create(data, userId); // 🌟 pasa userId
    }
    updateService(id, data, userId) {
        return this.serviceRepository.update(id, data, userId); // 🌟 pasa userId
    }
    deleteService(id, userId) {
        return this.serviceRepository.delete(id, userId); // 🌟 pasa userId
    }
}
exports.GymService = GymService;
//# sourceMappingURL=GymService.js.map