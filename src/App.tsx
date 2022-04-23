import React from 'react';
import logo from './logo.svg';
import { render } from "react-dom";
import AceEditor from "react-ace";
import './App.css';

import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/ext-language_tools";

function onChange(newValue: any) {
  console.log("change", newValue);
}
import AceEditor from "react-ace";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <AceEditor
            mode="java"
            theme="github"
            onChange={onChange}
            name="UNIQUE_ID_OF_DIV"
            editorProps={{ $blockScrolling: true }}
        />
      </header>
    </div>
  );
}

export default App;
