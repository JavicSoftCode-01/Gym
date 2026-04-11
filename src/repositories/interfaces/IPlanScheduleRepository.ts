export interface IPlanScheduleRepository {
    assignScheduleToPlan(planId: number, scheduleId: number, userId: number): void;
    getSchedulesByPlanId(planId: number): any[];
}