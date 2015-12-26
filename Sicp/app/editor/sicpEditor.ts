module Editor {
    export class SicpEditor
    {
        editor: AceAjax.Editor;
        outputElement: HTMLElement;
        currentMarker = null;
        currentTimeout = null;
        btnRun: HTMLButtonElement;
        btnBreak: HTMLButtonElement;
        btnStop: HTMLButtonElement;
        btnStep: HTMLButtonElement;
        btnContinue: HTMLButtonElement;

        isRunning:boolean = false;
        sv: Sicp.Lang.Sv;
        interpreter = new Sicp.Lang.Interpreter();
        Range: any;

        constructor(private editorDiv: HTMLElement, private samples:string[]) {
           
            require(['ace/ace'], (ace) => {
                this.Range = ace.require("ace/range").Range;

                var divToolbar = document.createElement('div');
                divToolbar.classList.add("sicp-editor-toolbar");
                editorDiv.appendChild(divToolbar);
                this.btnRun = document.createElement('button');
                this.btnRun.classList.add("sicp-editor-button");
                this.btnRun.innerText = "run";
                this.btnRun.onclick = () => this.run();
                divToolbar.appendChild(this.btnRun);

                this.btnBreak = document.createElement('button');
                this.btnBreak.classList.add("sicp-editor-button");
                this.btnBreak.innerText = "break";
                this.btnBreak.onclick = () => this.break();
                divToolbar.appendChild(this.btnBreak);

                this.btnStop = document.createElement('button');
                this.btnStop.classList.add("sicp-editor-button");
                this.btnStop.innerText = "stop";
                this.btnStop.onclick = () => this.stop();
                divToolbar.appendChild(this.btnStop);

                this.btnStep = document.createElement('button');
                this.btnStep.classList.add("sicp-editor-button");
                this.btnStep.innerText = "step";
                this.btnStep.onclick = () => this.step();
                divToolbar.appendChild(this.btnStep);

                this.btnContinue = document.createElement('button');
                this.btnContinue.classList.add("sicp-editor-button");
                this.btnContinue.innerText = "continue";
                this.btnContinue.onclick = () => this.continue();
                divToolbar.appendChild(this.btnContinue);

             
                var editorWindow = document.createElement('div');
                editorWindow.classList.add("editorWindow");
                editorDiv.appendChild(editorWindow);

                this.outputElement = document.createElement('div');
                editorDiv.appendChild(this.outputElement);

                this.editor = ace.edit(editorWindow);
                this.editor.setTheme('ace/theme/chrome');
                this.editor.getSession().setMode('ace/mode/sicp');
                this.editor.commands.addCommand({
                    name: 'Run',
                    bindKey: { win: 'Ctrl-R', mac: 'Command-R' },
                    exec: editor => {
                        this.run();
                    }
                });
                this.editor.commands.addCommand({
                    name: 'Next',
                    bindKey: { win: 'Ctrl-E', mac: 'Command-E' },
                    exec: editor => {
                        this.step();
                    }
                });


                if (samples) {
                    var selectSample: HTMLSelectElement = document.createElement('select');
                    selectSample.classList.add("sicp-editor-select-sample");
                    divToolbar.appendChild(selectSample);
                    samples.forEach(sample => {
                        const option = document.createElement('option');
                        option.text = sample.split('\n')[0].trim();
                        option.value = sample;
                        selectSample.appendChild(option);

                    });
                    selectSample.onchange = () => {
                         this.stop();
                         this.editor.setValue(selectSample.options[selectSample.selectedIndex].value, -1);
                    };
                    selectSample.onchange(null);
                }


                this.updateUI();
            });
        }

        clearOutput() {
            this.outputElement.innerText = "";
        }

        log(st: string) {
            this.outputElement.innerText = this.outputElement.innerText === "" ? st : this.outputElement.innerText + "\n" + st;
        }

        setMarker(sv: Sicp.Lang.Sv) {
            this.clearMarker();
            if (sv) {
                this.currentMarker = this.editor.getSession().addMarker(
                    new this.Range(sv.ilineStart, sv.icolStart, sv.ilineEnd, sv.icolEnd), "errorHighlight", "text", false);
                this.editor.gotoLine(sv.ilineStart);
            }
        }
        clearMarker() {
            if (this.currentMarker !== null)
                this.editor.getSession().removeMarker(this.currentMarker);
        }

        updateUI() {
            this.editor.setReadOnly(this.sv != null);
            this.btnRun.style.display = this.sv == null ? "inline" : "none";
            this.btnBreak.style.display = this.isRunning ? "inline" : "none";
            this.btnContinue.style.display = !this.isRunning && this.sv != null ? "inline" : "none";
            this.btnStop.style.display = !this.isRunning && this.sv != null ? "inline" : "none";
            this.btnStep.style.display = !this.isRunning ? "inline" : "none";
        }

        step() {
            
            this.clearMarker();
            try {
                if (!this.sv)
                    this.sv = this.interpreter.evaluateString(this.editor.getValue(), this.log.bind(this));
                else
                    this.sv = this.interpreter.step(this.sv, this.isRunning ? 1000 : 1);
                          
            } catch (ex) {
                this.log(ex);
                this.sv = null;
            }

            if (this.sv == null)
                this.isRunning = false;

            if (!this.isRunning) {
                this.setMarker(this.sv);
            } else
                this.currentTimeout = window.setTimeout(this.step.bind(this), 1);

            this.updateUI();
        }

        stop() {
            this.sv = null;
            this.isRunning = false;
            this.clearMarker();
            this.clearOutput();
            clearTimeout(this.currentTimeout);
            this.updateUI();
        }

        run() {
            this.stop();
            this.continue();
        }
        continue() {
            this.isRunning = true;
            this.step();
        }
        break() {
            this.isRunning = false;
        }
    }
}

