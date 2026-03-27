export type ShiftAssignmentProps = {
  id: string;
  memberId: string;
  positionId: string;
  startDate: string;
  startTime: string;
  endTime: string;
  breakMinutes?: number;
  memberId: string; // belongsTo ScheduleMember
  positionId: string; // belongsTo SchedulePosition
};
