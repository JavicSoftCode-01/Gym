import {IServiceRepository} from "../repositories/interfaces/IServiceRepository";
import {Service} from "../domain/entities";

export class GymService {
    constructor(private readonly serviceRepository: IServiceRepository) {}

    getAllServices(): Service[] {
        return this.serviceRepository.findAll();
    }

    getServiceById(id: number): Service | undefined {
        return this.serviceRepository.findById(id);
    }

    createService(data: { title: string }, userId: number): Service {
        if (!data.title) {
            throw new Error("El título del servicio es obligatorio.");
        }
        return this.serviceRepository.create(data, userId); // 🌟 pasa userId
    }

    updateService(id: number, data: Partial<{ title: string }>, userId: number): Service | undefined {
        return this.serviceRepository.update(id, data, userId); // 🌟 pasa userId
    }

    deleteService(id: number, userId: number): boolean {
        return this.serviceRepository.delete(id, userId); // 🌟 pasa userId
    }
}