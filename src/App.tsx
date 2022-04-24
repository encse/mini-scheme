import React from 'react';

import "./app.css";
import {Editor} from './editor/editor';

const samples = [
    'samples/factorial.ms',
    'samples/odd-or-even.ms',
    'samples/counting-change.ms',
    'samples/hanoi.ms',
    'samples/n-queens.ms',
    'samples/return-with-callcc.ms',
    'samples/lazy-generator.ms',
    'samples/yin-yang.ms'
]

function App() {
    return (
        <>
            <div id="header">
                <h2>Mini scheme</h2>
                <p>by <a href="https://csokavar.hu">encse</a></p>
            </div>
            <Editor sampleUrls={samples}/>
            <div id="footer">Copyright 2015, source is available on <a href="https://github.com/encse/sicp">GitHub</a></div>
        </>
    );
}

export default App;
