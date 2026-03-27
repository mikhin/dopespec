graph LR
  MaxMaterializationCapOnEditAllFuture -->|prevent| Pinnedshift.editAllFuture
  MaxMaterializationCapOnUnpin -->|prevent| Pinnedshift.unpin
  NoPastWeekModificationOnDeleteOccurrence -->|prevent| Pinnedshift.deleteOccurrence
  NoPastWeekModificationOnEditAllFuture -->|prevent| Pinnedshift.editAllFuture
  NoPastWeekModificationOnEditThisOnly -->|prevent| Pinnedshift.editThisOnly
  NoPastWeekModificationOnUnpin -->|prevent| Pinnedshift.unpin
  NoTerminatedMemberPin -->|prevent| Pinnedshift.pin
  Member -->|belongsTo| Pinnedshift
  ShiftAssignment -->|hasMany| Pinnedshift
