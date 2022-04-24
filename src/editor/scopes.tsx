import React from 'react';
import { DebuggerState, getCurrentStackFrame } from "./debugger-state";

export type ScopesProps = {
    debuggerState: DebuggerState,
}

export const Scopes: React.FC<ScopesProps> = (props) => {

    const debuggerState = props.debuggerState;
    let stackFrame = getCurrentStackFrame(debuggerState)
    if (stackFrame == null) {
        return <div className="sicp-stack-frame"><p>not paused</p></div>;
    }

    let env = stackFrame.env();
    let scopes: React.ReactElement[] = [];
    while (env) {
        //                 $(pTitle).click(() => { $(divScope).toggleClass('sicp-tree-node-collapsed'); });

        scopes.push(<div>
            <p className="sicp-tree-node-title">Scope</p>
            {env.getNames().length > 0 &&
                <div className="sicp-tree-node-content">
                    {
                        env.getNames().map(name =>
                            <div key={name}>
                                <div className="sicp-variable-name">{name}</div>
                                <div className="sicp-variable-value">{env.get(name).toDisplayString()}</div>
                            </div>
                        )
                    }
                </div>
            }
            {env.getNames().length === 0 && <p className="sicp-scope-empty">«empty»</p>}
        </div>
        );
        env = env.getEnvParent();
    }
    return <div>{scopes}</div>
}