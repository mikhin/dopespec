graph LR
  DailyPositionQuota -->|warn| Shiftassignment.create
  NoOverlappingShifts -->|prevent| Shiftassignment.create
  NoTerminatedFutureShifts -->|prevent| Shiftassignment.create
  WeeklyHoursLimit -->|warn| Shiftassignment.create
  ScheduleMember -->|belongsTo| Shiftassignment
  SchedulePosition -->|belongsTo| Shiftassignment
  ShiftAssignment -->|hasMany| Shiftassignment
