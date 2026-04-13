stateDiagram-v2
  [*] --> active
  active --> deleted: delete
  suspended --> active: reactivate
  active --> suspended: suspend
