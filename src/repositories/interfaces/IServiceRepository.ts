import {Service} from "../../domain/entities";

export interface IServiceRepository {
    findAll(): Service[];

    findById(id: number): Service | undefined;

    create(data: { title: string }): Service;

    update(id: number, data: Partial<{ title: string }>): Service | undefined;

    delete(id: number): boolean;
}