export type PinnedShiftDayOfWeek = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';
export type PinnedShiftStatus = 'active' | 'deleted';

export type PinnedShiftProps = {
  memberId: string;
  positionId: string;
  departmentId: string;
  shiftTypeId: string;
  dayOfWeek: PinnedShiftDayOfWeek;
  activeFrom: Date;
  breakMinutes: number;
  status: PinnedShiftStatus;
  memberId: string; // belongsTo Member
  departmentId: string; // belongsTo Department
  positionId: string; // belongsTo Position
  shiftTypeId: string; // belongsTo ShiftType
  materializedAssignmentsIds: string[]; // hasMany ShiftAssignment
};
