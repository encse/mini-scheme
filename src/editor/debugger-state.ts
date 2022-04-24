import { StackFrame } from "../lang/env";
import { Sv, SvBreakpoint } from "../lang/sv";

export type DebuggerState = {
    kind: "stopped"
} | {
    kind: "running" | "step",
    sv: Sv
} | {
    kind: "paused",
    sv: SvBreakpoint,
    currentStackFrameIndex: number
};

export function getCurrentStackFrame(debuggerState: DebuggerState): StackFrame {
    if (debuggerState.kind !== "paused") {
        return null;
    }

    let stackFrame = new StackFrame(debuggerState.sv, debuggerState.sv.env());
    for (let i = 0; stackFrame && i < debuggerState.currentStackFrameIndex; i++) {
        stackFrame = stackFrame.parent();
    }
    return stackFrame;
}
