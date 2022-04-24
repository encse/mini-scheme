import React from 'react';
import { SampleProps, Samples } from "./samples";

export type ToolbarProps = SampleProps & {
    onRun?: () => void;
    onPause?: () => void;
    onStop?: () => void;
    onStep?: () => void;
    onContinue?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = (props) => {
    return <div className="sicp-editor-toolbar">
        {props.onRun && <button className="sicp-editor-button" onClick={props.onRun}>run</button>}
        {props.onPause && <button className="sicp-editor-button" onClick={props.onPause}>pause</button>}
        {props.onStop && <button className="sicp-editor-button" onClick={props.onStop}>stop</button>}
        {props.onStep && <button className="sicp-editor-button" onClick={props.onStep}>step</button>}
        {props.onContinue && <button className="sicp-editor-button" onClick={props.onContinue}>continue</button>}
        <Samples samples={props.samples} onSampleSelected={props.onSampleSelected} />
    </div>
}
