import React from 'react';
import { StackFrame } from "../lang/env";
import { SvBreakpoint } from "../lang/sv";
import { DebuggerState } from "./debugger-state";

export type StacktraceProps = {
    debuggerState: DebuggerState,
    onStackFrameSelect: (i: number) => void
}

export const Stacktrace: React.FC<StacktraceProps> = (props) => {
    const debuggerState = props.debuggerState;
    if (debuggerState.kind !== "paused" || !SvBreakpoint.matches(debuggerState.sv)) {
        return  <div className="sicp-stack-frame">
            <p>not paused</p>
        </div>;
    }

    const sv = debuggerState.sv;
    let stackFrame = new StackFrame(sv, sv.env());
    let stackFrameIndex = 0;
    let frameElements: React.ReactElement[] = [];
    while (stackFrame) {
        const currentStackFrame = stackFrameIndex;
        let env = stackFrame.env();
        while (env != null && env.getSvSymbolProcedure() == null)
            env = env.getEnvParent();

        let msg = "(«lambda»)";
        if (env != null){
            msg = '('+env.getSvSymbolProcedure().toString();
            for(let param of env.getNames()) {
                msg += ' ' + env.get(param).toString()
            }
            msg += ')'
        }
        const classes = 'sicp-stack-frame ' + ((currentStackFrame === debuggerState.currentStackFrameIndex) ? 'sicp-stack-frame-current' : '');
        frameElements.push(
            <div className={classes} key={stackFrameIndex} onClick={() => props.onStackFrameSelect(currentStackFrame)}>
                <p>{msg}</p>
            </div>
        );
        stackFrame = stackFrame.parent();
        stackFrameIndex++;
    }

    return <div>{frameElements}</div>;
}