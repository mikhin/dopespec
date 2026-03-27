export const policyIndex = {
  PinnedShift: {
    deleteOccurrence: ['NoPastWeekModificationOnDeleteOccurrence'],
    editAllFuture: ['MaxMaterializationCapOnEditAllFuture', 'NoPastWeekModificationOnEditAllFuture'],
    editThisOnly: ['NoPastWeekModificationOnEditThisOnly'],
    pin: ['NoTerminatedMemberPin'],
    unpin: ['MaxMaterializationCapOnUnpin', 'NoPastWeekModificationOnUnpin'],
  },
} as const;
