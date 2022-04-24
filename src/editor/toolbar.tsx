import React from 'react';
import { SampleProps, Samples } from "./samples";

export type ToolbarProps = SampleProps & {
    onRun?: () => void;
    onPause?: () => void;
    onStop?: () => void;
    onStep?: () => void;
    onContinue?: () => void;
}

export class Toolbar extends React.PureComponent<ToolbarProps> {

    onRun = () => {this.props.onRun();}
    onPause = () => {this.props.onPause();}
    onStop = () => {this.props.onStop();}
    onStep = () => {this.props.onStep();}
    onContinue = () => {this.props.onContinue();}
    onSampleSelected = (i: number) => {this.props.onSampleSelected(i);}

    render(){
        return <div className="sicp-editor-toolbar">
            {this.props.onRun && <button className="sicp-editor-button" onClick={this.onRun}>run</button>}
            {this.props.onPause && <button className="sicp-editor-button" onClick={this.onPause}>pause</button>}
            {this.props.onStop && <button className="sicp-editor-button" onClick={this.onStop}>stop</button>}
            {this.props.onStep && <button className="sicp-editor-button" onClick={this.onStep}>step</button>}
            {this.props.onContinue && <button className="sicp-editor-button" onClick={this.onContinue}>continue</button>}
            <Samples samples={this.props.samples} onSampleSelected={this.onSampleSelected} />
        </div>
    }
}
