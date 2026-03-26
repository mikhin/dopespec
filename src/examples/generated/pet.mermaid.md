stateDiagram-v2
  [*] --> available
  reserved --> available: release
  available --> reserved: reserve [guarded]
  reserved --> sold: sell [guarded]
