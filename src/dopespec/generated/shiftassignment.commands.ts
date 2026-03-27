export type ShiftAssignmentCreateCommand = {
  type: 'ShiftAssignmentCreate';
  payload: { memberId: string; positionId: string; startDate: string };
};

export type ShiftAssignmentCommand = ShiftAssignmentCreateCommand;
