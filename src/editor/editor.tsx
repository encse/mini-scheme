import React from 'react';
import AceEditor from "react-ace";

import "brace/mode/typescript";
import "brace/theme/tomorrow_night";
import { Interpreter } from '../lang/interpreter';
import { SvBreakpoint } from '../lang/sv';
import { IMarker } from 'react-ace/lib/types';
import { DebuggerState, getCurrentStackFrame } from './debugger-state';
import { Toolbar } from './toolbar';
import { Scopes } from './scopes';
import { Stacktrace } from './stacktrace';
import Logger from './logger';
import { NewLineText } from './new-line-text';

export type EditorProps = {
    sampleUrls: string[]
}

export type EditorState = {
    samples: string[];
    program: string;
    currentSampleIndex: number;
    logger: Logger;
    interpreter: Interpreter;
    debuggerState: DebuggerState;
    editorRef: React.RefObject<AceEditor>;
}

export class Editor extends React.PureComponent<EditorProps, EditorState> {
    constructor(props: EditorProps) {
        super(props);

        this.state = {
            program: '',
            samples: [],
            currentSampleIndex: 0,
            logger: new Logger(),
            interpreter: new Interpreter(),
            debuggerState: { kind: "stopped" },
            editorRef: React.createRef()
        }

        const fetchSamples = async () => {
            const samples: string[] = [];
            for (let url of props.sampleUrls) {
                const response = await fetch(url);
                samples.push(await response.text());
            }
            return samples;
        }
        fetchSamples().then(
            (samples) => {
                this.setState({ samples: samples });
                this.setSampleIndex(0);
            }
        );
    }

    setSampleIndex = (index: number) => {
        this.stop();
        this.setState({
            program: this.state.samples[index] ?? "",
            currentSampleIndex: index,
        });
    };

    run = () => {
        this.setState({ debuggerState: { kind: "running", sv: null } });
    }

    stop = () => {
        if (this.state.debuggerState.kind !== "stopped") {
            this.setState({ debuggerState: { kind: "stopped" } });
        }
    };

    step = () => {
        const { debuggerState } = this.state;
        if (debuggerState.kind === "paused") {
            this.setState({ debuggerState: { ...debuggerState, kind: "step" } });
        } else if (debuggerState.kind === "stopped") {
            this.setState({ debuggerState: { kind: "step", sv: null } });
        }
    };

    cont = () => {
        const { debuggerState } = this.state;
        if (debuggerState.kind === "paused") {
            this.setState({ debuggerState: { ...debuggerState, kind: "running" } });
        }
    };

    pause = () => {
        const { debuggerState } = this.state;

        if (debuggerState.kind === "running" && SvBreakpoint.matches(debuggerState.sv)) {
            this.setState({
                debuggerState: {
                    kind: "paused",
                    sv: debuggerState.sv,
                    currentStackFrameIndex: 0
                }
            });
        }
    };

    setStackFrameIndex = (index: number) => {
        const { debuggerState } = this.state;
        if (debuggerState.kind === "paused") {
            this.setState({
                debuggerState: { ...debuggerState, kind: "paused", currentStackFrameIndex: index }
            });
        }
    };

    edit = (program: string) => {
        this.stop();
        this.setState({ program });
    }

    stepInterpreter = () => {
        const { debuggerState, interpreter, logger, program } = this.state;

        if (debuggerState.kind === "running" || debuggerState.kind === "step") {
            try {
                let sv = debuggerState.sv;
                if (sv == null) {
                    this.stop();
                    logger.clear();
                    sv = interpreter.evaluateString(program, logger.log);
                } else {
                    sv = interpreter.step(debuggerState.sv, debuggerState.kind === "running" ? 10000 : 1);
                }

                if (sv == null) {
                    this.setState({ debuggerState: { kind: "stopped" } });
                } else if (debuggerState.kind === "running") {
                    this.setState({ debuggerState: { kind: "running", sv } });
                } else if (SvBreakpoint.matches(sv)) {
                    this.setState({ debuggerState: { kind: "paused", sv, currentStackFrameIndex: 0 } });
                } else {
                    this.setState({ debuggerState: { kind: "stopped" } });
                }
            } catch (ex) {
                console.log(ex);
                logger.log("\n" + ex);
                this.setState({ debuggerState: { kind: "stopped" } });
            }
        }
    }

    render() {
        const { samples, debuggerState, editorRef, logger, program } = this.state;

        if (debuggerState.kind === "running" || debuggerState.kind === "step") {
            setTimeout(this.stepInterpreter, 0);
        }

        const markers: IMarker[] = [];

        const stackFrame = getCurrentStackFrame(debuggerState);
        if (debuggerState.kind === "paused" && stackFrame != null) {
            markers.push({
                startRow: stackFrame.sv().ilineStart,
                endRow: stackFrame.sv().ilineEnd,
                startCol: stackFrame.sv().icolStart,
                endCol: stackFrame.sv().icolEnd,
                className: "current-statement",
                type: "text"
            });
            editorRef.current?.editor.gotoLine(stackFrame.sv().ilineStart);
        }

        return (
            <div id="editor-wrap">
                <div id="editor">
                    <Toolbar
                        samples={samples}
                        onSampleSelected={this.setSampleIndex}
                        onRun={debuggerState.kind === "stopped" ? this.run : null}
                        onStop={debuggerState.kind === "paused" || debuggerState.kind === "running" ? this.stop : null}
                        onPause={debuggerState.kind === "running" ? this.pause : null}
                        onStep={debuggerState.kind === "paused" || debuggerState.kind === "stopped" ? this.step : null}
                        onContinue={debuggerState.kind === "paused" ? this.cont : null}
                    />
                    <AceEditor
                        ref={editorRef}
                        onChange={this.edit}
                        className="editorWindow"
                        mode="typescript"
                        theme="tomorrow_night"
                        name="ace-editor"
                        editorProps={{ $blockScrolling: false }}
                        value={program}
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
                        <p className="sicp-box-tab-title">Call Stack</p>
                        <div id="stacktrace-content" className="sicp-box-tab-content">
                            <Stacktrace debuggerState={debuggerState} onStackFrameSelect={this.setStackFrameIndex} />
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
}