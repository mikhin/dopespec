stateDiagram-v2
[*] --> pending
pending --> cancelled: cancel
shipped --> delivered: deliver
pending --> paid: pay [guarded]
paid --> shipped: ship
