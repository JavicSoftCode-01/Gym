import { SystemUser } from "../../domain/entities";

export interface ISystemUserRepository {
    findByContact(contact: string): SystemUser | undefined;
    create(data: { contact: string; passwordHash: string; role?: string }): SystemUser;
}
