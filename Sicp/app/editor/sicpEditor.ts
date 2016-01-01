module Editor {

    export class SicpEditor
    {
        editor: AceAjax.Editor;
        outputElement: HTMLElement;
        variablesElement: HTMLElement;
        stackTraceElement: HTMLElement;
        currentMarker = null;
        currentTimeout = null;
        btnRun: HTMLButtonElement;
        btnBreak: HTMLButtonElement;
        btnStop: HTMLButtonElement;
        btnStep: HTMLButtonElement;
        btnContinue: HTMLButtonElement;

        isRunning:boolean = false;

        svBreakPoint:Sicp.Lang.SvBreakpoint;
        istackFrame:number;

        interpreter = new Sicp.Lang.Interpreter();
        Range: any;

        constructor(private editorDiv: HTMLElement, private outputDiv: HTMLElement, private variablesDiv: HTMLElement,
            private stackTraceDiv: HTMLElement, private samples: string[]) {
           
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
                this.stackTraceElement = stackTraceDiv;

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

                $('.sicp-box').each((_, box) => {
                    $(box).children('.sicp-box-tab').each((__, tab) => {
                        $(tab).children('.sicp-box-tab-title').click(() => {
                            $(box).children('.sicp-box-tab').removeClass('sicp-box-current-tab');
                            $(tab).addClass('sicp-box-current-tab');
                        });
                    });
                });

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

        private getFirstStackFrame(): Sicp.Lang.StackFrame {
            return !this.svBreakPoint ? null : new Sicp.Lang.StackFrame(this.svBreakPoint, this.svBreakPoint.env());

        }
        private getCurrentStackFrame():Sicp.Lang.StackFrame {
            var i = 0;
            var stackFrame = this.getFirstStackFrame();
            while (stackFrame && i < this.istackFrame) {
                stackFrame = stackFrame.parent();
                i++;
            }
            return stackFrame;
        }

        showCurrentStatement() {
            if (!this.isRunning) {
                this.clearMarker();
                var stackFrame = this.getCurrentStackFrame();
                if (stackFrame) {
                    var sv = stackFrame.sv();
                    this.currentMarker = this.editor.getSession().addMarker(
                        new this.Range(sv.ilineStart, sv.icolStart, sv.ilineEnd, sv.icolEnd), "errorHighlight", "text", false);
                    this.editor.gotoLine(sv.ilineStart);
                }
            }
        }
        clearMarker() {
            if (this.currentMarker !== null)
                this.editor.getSession().removeMarker(this.currentMarker);
        }

        updateUI() {
            this.editor.setReadOnly(this.svBreakPoint != null);
            this.btnRun.style.display = this.svBreakPoint == null ? "inline" : "none";
            this.btnBreak.style.display = this.isRunning ? "inline" : "none";
            this.btnContinue.style.display = !this.isRunning && this.svBreakPoint != null ? "inline" : "none";
            this.btnStop.style.display = !this.isRunning && this.svBreakPoint != null ? "inline" : "none";
            this.btnStep.style.display = !this.isRunning ? "inline" : "none";

            this.showCurrentStatement();
            this.showStackTrace();
            this.showVariables();

        }
        showStackTrace() {
            this.stackTraceElement.innerHTML = "";
            if (this.isRunning)
                return;
            var stackFrame = this.getFirstStackFrame();

            var i = 0;
            while (stackFrame) {
                var env = stackFrame.env();

                while (env != null && env.getSvSymbolProcedure() == null)
                    env = env.getEnvParent();

                ((self, selfI) => {
                    var divStackFrame = document.createElement('div');
                    divStackFrame.classList.add('sicp-stack-frame');

                    var pTitle = document.createElement('p');
                    if (!env)
                        pTitle.innerHTML = "&laquo; not in procedure &raquo;";
                    else
                        pTitle.innerHTML = env.getSvSymbolProcedure().toString();

                    $(pTitle).click(() => {
                        this.istackFrame = selfI;
                        this.updateUI();
                    });
                                   
                    if (selfI === this.istackFrame)
                        pTitle.classList.add('sicp-stack-frame-current');
                    divStackFrame.appendChild(pTitle);
                    self.stackTraceElement.appendChild(divStackFrame);

                })(this, i);
                stackFrame = stackFrame.parent();
                i++;
            }
        }
        showVariables() {
           
            this.variablesElement.innerHTML = "";

            if (this.isRunning)
                return;

            var stackFrame = this.getCurrentStackFrame();
            if (!stackFrame)
                return;

            var env = stackFrame.env();
            while (env) {
                (self => {
                    var divScope = document.createElement('div');
                    var pTitle = document.createElement('p');
                    pTitle.classList.add('sicp-tree-node-title');
                    $(pTitle).click(() => { $(divScope).toggleClass('sicp-tree-node-collapsed'); });
                    pTitle.innerHTML = 'Scope';
                  
                    divScope.appendChild(pTitle);
                    self.variablesElement.appendChild(divScope);
                    var table: HTMLElement;
                    env.getNames().forEach(name => {
                        if (!table) {
                            table = document.createElement('table');
                            table.classList.add('sicp-tree-node-content');
                            divScope.appendChild(table);
                        }
                        var tr = document.createElement('tr');
                        table.appendChild(tr);
                        var td1 = document.createElement('td');
                        td1.classList.add('sicp-variable-name');
                        td1.innerHTML = name;
                        var td2 = document.createElement('td');
                        td1.classList.add('sicp-variable-value');
                        td2.innerHTML = env.get(name).toString();
                        tr.appendChild(td1);
                        tr.appendChild(td2);
                    });

                    if (!table) {
                        var pNoContent = document.createElement('p');
                        pNoContent.innerHTML = '&laquo; empty &raquo;';
                        pNoContent.classList.add('sicp-scope-empty');
                        divScope.appendChild(pNoContent);
                    }
                })(this);
                
                env = env.getEnvParent();
            }
        }

        step() {
            
            this.clearMarker();
            var sv: Sicp.Lang.Sv = null;
            try {

                if (!this.svBreakPoint)
                    sv = this.interpreter.evaluateString(this.editor.getValue(), this.log.bind(this));
                else
                    sv = this.interpreter.step(this.svBreakPoint, this.isRunning ? 10000 : 1);
                          
            } catch (ex) {
                this.log(ex);
                sv = null;
            }

            if (sv != null && Sicp.Lang.SvBreakpoint.matches(sv)) {
                this.svBreakPoint = Sicp.Lang.SvBreakpoint.cast(sv);
                this.istackFrame = 0;
            } else {
                this.svBreakPoint = null;
                this.isRunning = false;
            }

            if (this.isRunning)
                this.currentTimeout = window.setTimeout(this.step.bind(this), 1);

            this.updateUI();
        }

        stop() {
            this.svBreakPoint = null;
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

