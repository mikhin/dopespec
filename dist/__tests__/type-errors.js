import { action, belongsTo, decisions, hasMany, lifecycle, model, number, oneOf, string, } from "../schema/index.js";
const states = ["on", "off"];
// --- from() must only accept valid lifecycle states ---
model("BadFrom", {
    props: { status: lifecycle(states) },
    transitions: ({ from }) => ({
        // @ts-expect-error: 'invalid' is not a member of 'on' | 'off'
        t: from("invalid").to("off"),
    }),
});
model("BadTo", {
    props: { status: lifecycle(states) },
    transitions: ({ from }) => ({
        // @ts-expect-error: 'broken' is not a member of 'on' | 'off'
        t: from("on").to("broken"),
    }),
});
// --- prevent() must only accept action keys ---
model("BadPrevent", {
    actions: { doStuff: action() },
    constraints: ({ rule }) => ({
        // @ts-expect-error: 'nonexistent' is not 'doStuff'
        c: rule().prevent("nonexistent"),
    }),
    props: { status: lifecycle(states) },
});
// --- scenario expected must be a valid state ---
model("BadScenarioState", {
    props: { count: number(), status: lifecycle(states) },
    transitions: ({ from }) => ({
        // @ts-expect-error: 'invalid' is not a member of 'on' | 'off'
        t: from("off").to("on").scenario({ count: 1 }, "invalid"),
    }),
});
// --- scenario given must match prop types ---
model("BadScenarioGiven", {
    props: { count: number(), status: lifecycle(states) },
    transitions: ({ from }) => ({
        // @ts-expect-error: 'notANumber' is not assignable to number
        t: from("off").to("on").scenario({ count: "notANumber" }, "on"),
    }),
});
// --- when() ctx is typed, not any ---
model("BadWhenProp", {
    props: { count: number(), status: lifecycle(states) },
    transitions: ({ from }) => ({
        t: from("off")
            .to("on")
            // @ts-expect-error: 'nonexistent' does not exist on ctx
            .when((ctx) => ctx.nonexistent > 0),
    }),
});
// --- oneOf values must NOT be valid lifecycle states in from/to ---
const priorities = ["low", "high"];
model("OneOfNotLifecycle", {
    props: {
        priority: oneOf(priorities),
        status: lifecycle(states),
    },
    transitions: ({ from }) => ({
        // @ts-expect-error: 'low' is not a lifecycle state ('on' | 'off')
        t: from("low").to("on"),
    }),
});
// --- hasMany/belongsTo must only accept model outputs or ref(), not plain objects ---
// @ts-expect-error: plain object is not a branded ModelRef
hasMany({ kind: "model", name: "Foo" });
// @ts-expect-error: plain object is not a branded ModelRef
belongsTo({ kind: "model", name: "Bar" });
// --- Multiple lifecycle() props should make from() uncallable ---
const phases = ["init", "done"];
model("DualLifecycle", {
    props: {
        phase: lifecycle(phases),
        status: lifecycle(states),
    },
    transitions: ({ from }) => ({
        // @ts-expect-error: multiple lifecycle() props → StatesOf is never → from() rejects all strings
        t: from("on").to("off"),
    }),
});
// --- lifecycle.states() must constrain from/to just like as const arrays ---
const namedStates = lifecycle.states("on", "off");
model("BadFromNamed", {
    props: { status: lifecycle(namedStates) },
    transitions: ({ from }) => ({
        // @ts-expect-error: 'invalid' is not a member of 'on' | 'off'
        t: from("invalid").to("off"),
    }),
});
model("BadToNamed", {
    props: { status: lifecycle(namedStates) },
    transitions: ({ from }) => ({
        // @ts-expect-error: 'broken' is not a member of 'on' | 'off'
        t: from(namedStates.on).to("broken"),
    }),
});
// --- action() fields must match Payload when generic is specified ---
// @ts-expect-error: fields key 'wrong' does not match Payload key 'name'
action({ wrong: string() });
// @ts-expect-error: fields value number() does not match Payload type string → StringProp
action({ name: number() });
// --- decisions() with model-linked props must reject invalid values ---
const _petProps = { species: oneOf(["dog", "cat"]) };
decisions("TypeTestDecision", {
    inputs: { species: _petProps.species },
    outputs: { fee: number() },
    rules: [
        // @ts-expect-error: 'typo' is not 'dog' | 'cat'
        { then: { fee: 0 }, when: { species: "typo" } },
    ],
});
// --- IfProvided: model() return type makes provided fields required ---
const _withProps = model("WithProps", {
    actions: { go: action({ x: string() }) },
    props: { count: number() },
});
// props and actions are required — direct access compiles without ?.
_withProps.props.count.kind;
_withProps.actions.go.kind;
const _withoutProps = model("WithoutProps", {});
// @ts-expect-error: props is optional when not provided — Object is possibly 'undefined'
_withoutProps.props.toString();
// @ts-expect-error: actions is optional when not provided — Object is possibly 'undefined'
_withoutProps.actions.toString();
// @ts-expect-error: props is optional on unparameterized ModelDef
_wide.props.toString();
//# sourceMappingURL=type-errors.js.map