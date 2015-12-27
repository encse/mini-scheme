module Editor {
    export class SicpEditor
    {
        editor: AceAjax.Editor;
        outputElement: HTMLElement;
        variablesElement: HTMLElement;
        currentMarker = null;
        currentTimeout = null;
        btnRun: HTMLButtonElement;
        btnBreak: HTMLButtonElement;
        btnStop: HTMLButtonElement;
        btnStep: HTMLButtonElement;
        btnContinue: HTMLButtonElement;

        isRunning:boolean = false;
        sv: Sicp.Lang.Sv;
        env: Sicp.Lang.Env;
        interpreter = new Sicp.Lang.Interpreter();
        Range: any;

        constructor(private editorDiv: HTMLElement, private outputDiv:HTMLElement, private variablesDiv:HTMLElement, private samples:string[]) {
           
            require(['ace/ace'], (ace) => {
                this.Range = ace.require("ace/range").Range;

                var divToolbar = document.createElement('div');
                divToolbar.classList.add("sicp-editor-toolbar");
             
                editorDiv.appendChild(divToolbar);
                this.btnRun = document.createElement('button');
                this.btnRun.classList.add("sicp-editor-button");
                this.btnRun.innerHTML = "run";
                this.btnRun.onclick = () => this.run();
                divToolbar.appendChild(this.btnRun);

                this.btnBreak = document.createElement('button');
                this.btnBreak.classList.add("sicp-editor-button");
                this.btnBreak.innerHTML = "break";
                this.btnBreak.onclick = () => this.break();
                divToolbar.appendChild(this.btnBreak);

                this.btnStop = document.createElement('button');
                this.btnStop.classList.add("sicp-editor-button");
                this.btnStop.innerHTML = "stop";
                this.btnStop.onclick = () => this.stop();
                divToolbar.appendChild(this.btnStop);

                this.btnStep = document.createElement('button');
                this.btnStep.classList.add("sicp-editor-button");
                this.btnStep.innerHTML = "step";
                this.btnStep.onclick = () => this.step();
                divToolbar.appendChild(this.btnStep);

                this.btnContinue = document.createElement('button');
                this.btnContinue.classList.add("sicp-editor-button");
                this.btnContinue.innerHTML = "continue";
                this.btnContinue.onclick = () => this.continue();
                divToolbar.appendChild(this.btnContinue);

             
                var editorWindow = document.createElement('div');
                editorWindow.classList.add("editorWindow");
                editorDiv.appendChild(editorWindow);

                this.outputElement = outputDiv;
                this.variablesElement = variablesDiv;

                this.editor = ace.edit(editorWindow);
                this.editor.setTheme('ace/theme/chrome');
                this.editor.getSession().setMode('ace/mode/sicp');

                if (samples) {
                    var selectSample: HTMLSelectElement = document.createElement('select');
                    selectSample.classList.add("sicp-editor-select-sample");
                    divToolbar.appendChild(selectSample);
                    samples.forEach(sample => {
                        const option = document.createElement('option');
                        option.text = sample.split('\n')[0].trim();
                        option.text = option.text.replace(/^; /, '');
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
            this.outputElement.innerHTML = "";
        }

        log(st: string) {
            st = st.replace('\n', '<br />');
            this.outputElement.innerHTML = this.outputElement.innerHTML === "" ? st : this.outputElement.innerHTML + st;
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

            this.showVariables();

        }

        showVariables() {
           
            this.variablesElement.innerHTML = "";

            if (this.isRunning)
                return;


            if (this.env) {
                var table = document.createElement('table');
                this.variablesElement.appendChild(table);
                this.env.getNames().forEach(name => {
                    var tr = document.createElement('tr');
                    table.appendChild(tr);
                    var td1 = document.createElement('td');
                    td1.classList.add('sicp-variable-name');
                    td1.innerHTML = name;
                    var td2 = document.createElement('td');
                    td1.classList.add('sicp-variable-value');
                    td2.innerHTML = this.env.get(name).toString();
                    tr.appendChild(td1);
                    tr.appendChild(td2);
                });
            }
        }

        step() {
            
            this.clearMarker();
            try {
                if (!this.sv)
                    this.sv = this.interpreter.evaluateString(this.editor.getValue(), this.log.bind(this));
                else
                    this.sv = this.interpreter.step(this.sv, this.isRunning ? 10000 : 1);
                          
            } catch (ex) {
                this.log(ex);
                this.sv = null;
            }


            if (this.sv == null) {
                this.isRunning = false;
                this.env = null;
            } else {
                this.env = Sicp.Lang.SvBreakpoint.env(this.sv);
            }

            if (!this.isRunning) {
                this.setMarker(this.sv);
            } else
                this.currentTimeout = window.setTimeout(this.step.bind(this), 1);

            this.updateUI();
        }

        stop() {
            this.sv = null;
            this.env = null;
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

