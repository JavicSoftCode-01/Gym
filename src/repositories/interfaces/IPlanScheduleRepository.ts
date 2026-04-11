export interface IPlanScheduleRepository {
    findAll(): any[];
    assignScheduleToPlan(planId: number, scheduleId: number, userId: number): void;
    getSchedulesByPlanId(planId: number): any[];
}