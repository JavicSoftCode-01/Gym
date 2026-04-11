// src/repositories/interfaces/IServiceRepository.ts
import {Service} from "../../domain/entities";

export interface IServiceRepository {
    findAll(): Service[];
    findById(id: number): Service | undefined;
    create(data: { title: string }, userId: number): Service;
    update(id: number, data: Partial<{ title: string }>, userId: number): Service | undefined;
    delete(id: number, userId: number): boolean;
}