import React from 'react';
import AceEditor from "react-ace";

import "brace/mode/typescript";
import "brace/theme/tomorrow_night";
import { Interpreter } from '../lang/Interpreter';
import { SvBreakpoint } from '../lang/Sv';
import { IMarker } from 'react-ace/lib/types';
import { DebuggerState } from './debugger-state';
import { Toolbar } from './toolbar';
import { Scopes } from './scopes';
import { Stacktrace } from './stacktrace';
import Logger from './logger';
import { NewLineText } from './new-line-text';

export type EditorProps = {
    samples: string[]
}

const Editor: React.FC<EditorProps> = (props) => {
    const [samples, setSamples] = React.useState<string[]>([]);
    const [currentSampleIndex, setCurrentSampleIndex] = React.useState<number>(0);
    const [logger] = React.useState<Logger>(new Logger);
    const [interpreter] = React.useState<Interpreter>(new Interpreter());
    const [debuggerState, setDebuggerState] = React.useState<DebuggerState>({ kind: "stopped" });
    const editorRef = React.useRef<AceEditor>();
    React.useEffect(() => {
        const fetchSamples = async () => {
            const results: string[] = [];
            for (let url of props.samples) {
                const response = await fetch(url);
                results.push(await response.text());
            }
            return results;
        }
        fetchSamples().then(setSamples);
    }, props.samples);

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
                        <Stacktrace debuggerState={debuggerState} onStackFrameSelect={setStackFrameIndex} />
                    </div>
                </div>
                <div className="sicp-box">
                    <p className="sicp-box-tab-title">Variables</p>
                    <div id="variables-content" className="sicp-box-tab-content">
                        <Scopes debuggerState={debuggerState} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Editor;