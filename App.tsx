import React from 'react';
import AceEditor from "react-ace";

import "./App.css";
import "brace/mode/typescript";
import "brace/theme/tomorrow_night";
import { Interpreter } from './sicp/Interpreter';
import { Sv, SvBreakpoint } from './sicp/lang/Sv';
import { IMarker } from 'react-ace/lib/types';
import { StackFrame } from './sicp/Env';

type SampleProps = {
    samples: string[],
    onSampleSelected: (index: number) => void;
}

type ToolbarProps = SampleProps & {
    onRun?: () => void;
    onPause?: () => void;
    onStop?: () => void;
    onStep?: () => void;
    onContinue?: () => void;
}

const Toolbar = (props: ToolbarProps) => {
    return <div className="sicp-editor-toolbar">
        {props.onRun && <button className="sicp-editor-button" onClick={props.onRun}>run</button>}
        {props.onPause && <button className="sicp-editor-button" onClick={props.onPause}>pause</button>}
        {props.onStop && <button className="sicp-editor-button" onClick={props.onStop}>stop</button>}
        {props.onStep && <button className="sicp-editor-button" onClick={props.onStep}>step</button>}
        {props.onContinue && <button className="sicp-editor-button" onClick={props.onContinue}>continue</button>}
        <Samples samples={props.samples} onSampleSelected={props.onSampleSelected} />
    </div>
}

const Samples: React.FC<SampleProps> = (props: SampleProps) => {

    const options = props.samples.map(sample => {
        let text = sample.split('\n')[0].trim().replace(/^; /, '');
        return <option key={sample}>{text}</option>
    });

    const onChange: React.ChangeEventHandler<HTMLSelectElement> = (event) => {
        props.onSampleSelected(event.target.selectedIndex);
    };
    return <select
        className="sicp-editor-select-sample"
        onChange={onChange}>
        {options}
    </select>
}

type DebuggerState = {
    kind: "stopped"
} | {
    kind: "running" | "step",
    sv: Sv
} | {
    kind: "paused",
    sv: SvBreakpoint,
    currentStackFrameIndex: number
};


function getCurrentStackFrame(debuggerState: DebuggerState): StackFrame {
    if (debuggerState.kind !== "paused") {
        return null;
    }

    let stackFrame = new StackFrame(debuggerState.sv, debuggerState.sv.env());
    for (let i = 0; stackFrame && i < debuggerState.currentStackFrameIndex; i++) {
        stackFrame = stackFrame.parent();
    }
    return stackFrame;
}

class Logger {
    output: string;
    clear() {
        this.output = "";
    }
    log = (st: string) => {
        this.output += st;
    }
}

type NewLineTextProps = {
    text: string
}

const NewLineText: React.FC<NewLineTextProps> = (props) => {
    if(!props.text) {
        return <div/>;
    }

    const text = props.text;
    const newText = text.split('\n').map(str => <div>{str}</div>);
    return <div>{newText}</div>;
}

type StackTraceViewerProps = {
    debuggerState: DebuggerState,
    onStackFrameSelect: (i: number) => void
}

const StackTraceViewer: React.FC<StackTraceViewerProps> = (props) => {
    const debuggerState = props.debuggerState;
    if (debuggerState.kind != "paused" || !SvBreakpoint.matches(debuggerState.sv)) {
        return <div />
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

        const classes = 'sicp-stack-frame ' + ((currentStackFrame == debuggerState.currentStackFrameIndex) ? 'sicp-stack-frame-current' : '');
        frameElements.push(
            <div className={classes} key={stackFrameIndex} onClick={() => props.onStackFrameSelect(currentStackFrame)}>
                <p>{!env ? "« not in procedure »" : env.getSvSymbolProcedure().toString()}</p>
            </div>
        );
        stackFrame = stackFrame.parent();
        stackFrameIndex++;
    }

    return <div>{frameElements}</div>;
}

type ScopeViewerProps = {
    debuggerState: DebuggerState,
}

const ScopeViewer: React.FC<ScopeViewerProps> = (props) => {

    const debuggerState = props.debuggerState;
    let stackFrame = getCurrentStackFrame(debuggerState)
    if (stackFrame == null) {
        return <div />;
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
                                <div className="sicp-variable-value">{env.get(name).toString()}</div>
                            </div>
                        )
                    }
                </div>
            }
            {env.getNames().length === 0 && <p className="sicp-scope-empty">« empty »</p>}
        </div>
        );
        env = env.getEnvParent();
    }
    return <div>{scopes}</div>
}

const Editor = () => {
    const [samples, setSamples] = React.useState<string[]>([]);
    const [currentSampleIndex, setCurrentSampleIndex] = React.useState<number>(0);
    const [logger] = React.useState<Logger>(new Logger);
    const [interpreter] = React.useState<Interpreter>(new Interpreter());
    const [debuggerState, setDebuggerState] = React.useState<DebuggerState>({ kind: "stopped" });
    const editorRef = React.useRef<AceEditor>();
    React.useEffect(() => {
        const fetchSamples = async () => {
            const urls = [
                'samples/factorial.ms',
                'samples/odd-or-even.ms',
                'samples/counting-change.ms',
                'samples/hanoi.ms',
                'samples/n-queens.ms',
                'samples/return-with-callcc.ms',
                'samples/lazy-generator.ms',
                'samples/yin-yang.ms'
            ];

            const results: string[] = [];
            for (let url of urls) {
                const response = await fetch(url);
                results.push(await response.text());
            }
            return results;
        }
        fetchSamples().then(setSamples);
    }, []);

    React.useEffect(() => {
        if (debuggerState.kind == "running" || debuggerState.kind === "step") {
            try {
                let sv = debuggerState.sv;
                if (sv == null) {
                    const prog: string = editorRef.current?.editor.getValue();
                    if (prog) {
                        stop();
                        logger.clear();
                        sv = interpreter.evaluateString(prog, logger.log);
                    }
                } else {
                    sv = interpreter.step(debuggerState.sv, debuggerState.kind == "running" ? 10000 : 1);
                }

                if (sv == null) {
                    setDebuggerState({ kind: "stopped" });
                } else if (debuggerState.kind == "running") {
                    setDebuggerState({ kind: "running", sv });
                } else if (SvBreakpoint.matches(sv)) {
                    setDebuggerState({ kind: "paused", sv, currentStackFrameIndex: 0 });
                } else {
                    setDebuggerState({ kind: "stopped" });
                }
            } catch (ex) {
                console.log(ex);
                logger.log("\nan error occured");
                setDebuggerState({ kind: "stopped" });
            }
        }
    }, [debuggerState]);

    const setSampleIndex = (index: number) => {
        stop();
        setCurrentSampleIndex(index);
    };

    const run = () => {
        setDebuggerState({ kind: "running", sv: null });
    }

    const stop = () => {
        setDebuggerState({ kind: "stopped" });
    };

    const step = () => {
        if (debuggerState.kind == "paused") {
            setDebuggerState({ ...debuggerState, kind: "step" });
        } else if (debuggerState.kind == "stopped") {
            setDebuggerState({ kind: "step", sv: null });
        }
    };

    const cont = () => {
        if (debuggerState.kind == "paused") {
            setDebuggerState({ ...debuggerState, kind: "running" });
        }
    };

    const pause = () => {
        if (debuggerState.kind == "running" && SvBreakpoint.matches(debuggerState.sv)) {
            setDebuggerState({
                kind: "paused",
                sv: debuggerState.sv, 
                currentStackFrameIndex: 0 
            });
        }
    };

    const setStackFrameIndex = (index: number) => {
        if (debuggerState.kind == "paused") {
            setDebuggerState({ ...debuggerState, kind: "paused", currentStackFrameIndex: index });
        }
    };

    const markers: IMarker[] = [];

    if (debuggerState.kind == "paused") {
        markers.push({
            startRow: debuggerState.sv.ilineStart,
            endRow: debuggerState.sv.ilineEnd,
            startCol: debuggerState.sv.icolStart,
            endCol: debuggerState.sv.icolEnd,
            className: "current-statement",
            type: "text"
        })
        editorRef.current?.editor.gotoLine(debuggerState.sv.ilineStart);
    }

    return (
        <div id="editor-wrap">
            <div id="editor">
                <Toolbar
                    samples={samples}
                    onSampleSelected={setSampleIndex}
                    onRun={debuggerState.kind == "stopped" ? run : null}
                    onStop={debuggerState.kind == "paused" || debuggerState.kind == "running" ? stop : null}
                    onPause={debuggerState.kind == "running" ? pause : null}
                    onStep={debuggerState.kind == "paused" || debuggerState.kind == "stopped" ? step : null}
                    onContinue={debuggerState.kind == "paused" ? cont : null}
                />
                <AceEditor
                    ref={editorRef}
                    className="editorWindow"
                    mode="typescript"
                    theme="tomorrow_night"
                    name="ace-editor"
                    editorProps={{ $blockScrolling: false }}
                    value={samples[currentSampleIndex] ?? ""}
                    showGutter={true}
                    width="auto"
                    height="auto"
                    markers={markers}
                />
            </div>
            <div id="editor-bottom">
                <div className="sicp-box">
                    <p className="sicp-box-tab-title">Output</p>
                    <div id="output-content" className="sicp-box-tab-content"><NewLineText text={logger.output} /></div>
                </div>
                <div className="sicp-box">
                    <p className="sicp-box-tab-title">Stacktrace</p>
                    <div id="stacktrace-content" className="sicp-box-tab-content">
                        <StackTraceViewer debuggerState={debuggerState} onStackFrameSelect={setStackFrameIndex} />
                    </div>
                </div>
                <div className="sicp-box">
                    <p className="sicp-box-tab-title">Variables</p>
                    <div id="variables-content" className="sicp-box-tab-content">
                        <ScopeViewer debuggerState={debuggerState} />
                    </div>
                </div>
            </div>
        </div>
    );
}

function App() {
    return (
        <>
            <div id="header">
                <h2>Mini scheme</h2>
                <p>by <a href="https://csokavar.hu">encse</a></p>
            </div>
            <Editor />
            <div id="footer">Copyright 2015, source is available on <a href="https://github.com/encse/sicp">GitHub</a></div>
        </>
    );
}

export default App;
