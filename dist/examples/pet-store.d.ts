declare const Customer: import("../schema/model.js").ModelDef<"Customer", {
    readonly email: import("../schema/props.js").StringProp;
    readonly name: import("../schema/props.js").StringProp;
    readonly status: import("../schema/props.js").LifecycleProp<readonly ["active", "suspended", "deleted"]>;
}, {
    readonly updateEmail: import("../schema/actions.js").ActionDef<{
        email: string;
    }>;
}, Record<string, never>, {
    delete: import("../schema/transitions.js").TransitionBuilder<"active", "deleted", {
        readonly email: string;
        readonly name: string;
        readonly status: "active" | "suspended" | "deleted";
    }, "active" | "suspended" | "deleted">;
    reactivate: import("../schema/transitions.js").TransitionBuilder<"suspended", "active", {
        readonly email: string;
        readonly name: string;
        readonly status: "active" | "suspended" | "deleted";
    }, "active" | "suspended" | "deleted">;
    suspend: import("../schema/transitions.js").TransitionBuilder<"active", "suspended", {
        readonly email: string;
        readonly name: string;
        readonly status: "active" | "suspended" | "deleted";
    }, "active" | "suspended" | "deleted">;
}, Record<string, never>>;
declare const Pet: import("../schema/model.js").ModelDef<"Pet", {
    readonly name: import("../schema/props.js").StringProp;
    readonly nickname: import("../schema/props.js").OptionalPropDef<import("../schema/props.js").StringProp>;
    readonly price: import("../schema/props.js").NumberProp;
    readonly species: import("../schema/props.js").OneOfProp<readonly ["dog", "cat", "bird", "fish"]>;
    readonly status: import("../schema/props.js").LifecycleProp<readonly ["available", "reserved", "sold"]>;
    readonly vaccinated: import("../schema/props.js").BooleanProp;
}, {
    readonly updatePrice: import("../schema/actions.js").ActionDef<{
        price: number;
    }>;
    readonly vaccinate: import("../schema/actions.js").ActionDef<{
        date: string;
    }>;
}, Record<string, never>, {
    release: import("../schema/transitions.js").TransitionBuilder<"reserved", "available", {
        readonly nickname?: string;
        readonly name: string;
        readonly price: number;
        readonly species: "dog" | "cat" | "bird" | "fish";
        readonly status: "available" | "reserved" | "sold";
        readonly vaccinated: boolean;
    }, "available" | "reserved" | "sold">;
    reserve: import("../schema/transitions.js").TransitionBuilder<"available", "reserved", {
        readonly nickname?: string;
        readonly name: string;
        readonly price: number;
        readonly species: "dog" | "cat" | "bird" | "fish";
        readonly status: "available" | "reserved" | "sold";
        readonly vaccinated: boolean;
    }, "available" | "reserved" | "sold">;
    sell: import("../schema/transitions.js").TransitionBuilder<"reserved", "sold", {
        readonly nickname?: string;
        readonly name: string;
        readonly price: number;
        readonly species: "dog" | "cat" | "bird" | "fish";
        readonly status: "available" | "reserved" | "sold";
        readonly vaccinated: boolean;
    }, "available" | "reserved" | "sold">;
}, {
    nicknameTooLong: import("../schema/constraints.js").ConstraintBuilder<{
        readonly nickname?: string;
        readonly name: string;
        readonly price: number;
        readonly species: "dog" | "cat" | "bird" | "fish";
        readonly status: "available" | "reserved" | "sold";
        readonly vaccinated: boolean;
    }, "updatePrice" | "vaccinate">;
}>;
declare const Order: import("../schema/model.js").ModelDef<"Order", {
    readonly createdAt: import("../schema/props.js").DateProp;
    readonly status: import("../schema/props.js").LifecycleProp<readonly ["pending", "paid", "shipped", "delivered", "cancelled"]>;
    readonly total: import("../schema/props.js").NumberProp;
}, {
    readonly addItem: import("../schema/actions.js").ActionDef<{
        productId: string;
        quantity: number;
    }>;
    readonly removeItem: import("../schema/actions.js").ActionDef<{
        itemId: string;
    }>;
}, {
    readonly customer: import("../schema/relations.js").RelationDef<"belongsTo">;
    readonly item: import("../schema/relations.js").RelationDef<"hasMany">;
}, {
    cancel: import("../schema/transitions.js").TransitionBuilder<"pending", "cancelled", {
        readonly createdAt: Date;
        readonly status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
        readonly total: number;
    }, "pending" | "paid" | "shipped" | "delivered" | "cancelled">;
    deliver: import("../schema/transitions.js").TransitionBuilder<"shipped", "delivered", {
        readonly createdAt: Date;
        readonly status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
        readonly total: number;
    }, "pending" | "paid" | "shipped" | "delivered" | "cancelled">;
    pay: import("../schema/transitions.js").TransitionBuilder<"pending", "paid", {
        readonly createdAt: Date;
        readonly status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
        readonly total: number;
    }, "pending" | "paid" | "shipped" | "delivered" | "cancelled">;
    ship: import("../schema/transitions.js").TransitionBuilder<"paid", "shipped", {
        readonly createdAt: Date;
        readonly status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
        readonly total: number;
    }, "pending" | "paid" | "shipped" | "delivered" | "cancelled">;
}, {
    cannotAddWhenCancelled: import("../schema/constraints.js").ConstraintBuilder<{
        readonly createdAt: Date;
        readonly status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
        readonly total: number;
    }, "addItem" | "removeItem">;
    cannotRemoveWhenEmpty: import("../schema/constraints.js").ConstraintBuilder<{
        readonly createdAt: Date;
        readonly status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
        readonly total: number;
    }, "addItem" | "removeItem">;
}>;
declare const CreditTier: import("../schema/decisions.js").DecisionDef<"CreditTier", {
    readonly amount: import("../schema/props.js").NumberProp;
    readonly extraItemId: import("../schema/props.js").StringProp;
}, {
    readonly credits: import("../schema/props.js").NumberProp;
}>;
declare const PetAdoptionFee: import("../schema/decisions.js").DecisionDef<"PetAdoptionFee", {
    readonly species: import("../schema/props.js").OneOfProp<readonly ["dog", "cat", "bird", "fish"]>;
    readonly vaccinated: import("../schema/props.js").BooleanProp;
}, {
    readonly fee: import("../schema/props.js").NumberProp;
}>;
declare const NoSuspendedCustomerOrders: import("../schema/policy.js").PolicyDef<"NoSuspendedCustomerOrders">;
export { CreditTier, Customer, NoSuspendedCustomerOrders, Order, Pet, PetAdoptionFee, };
//# sourceMappingURL=pet-store.d.ts.map