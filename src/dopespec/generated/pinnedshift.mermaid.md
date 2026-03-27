stateDiagram-v2
  [*] --> active
  active --> active: editAllFuture
  active --> active: editThisOnly
  active --> active: deleteOccurrence
  active --> deleted: unpin
  active --> deleted: delete
