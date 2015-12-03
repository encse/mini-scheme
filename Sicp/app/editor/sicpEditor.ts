module Editor {
    export class SicpEditor
    {
        editor: AceAjax.Editor;
        outputElement: HTMLElement;
        currentMarker = null;
        currentTimeout = null;

        isRunning:boolean = false;
        sv: Sicp.Lang.Sv;
        interpreter = new Sicp.Lang.Interpreter();
        Range: any;

        constructor(private editorId: string, private outputId: string) {
           
            require(['ace/ace'], (ace) => {
                this.Range = ace.require("ace/range").Range;
               
                
                this.editor = ace.edit("editor");
                this.editor.setTheme('ace/theme/clouds_midnight');
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
                this.outputElement = document.getElementById(outputId);
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
            }
        }
        clearMarker() {
            if (this.currentMarker !== null)
                this.editor.getSession().removeMarker(this.currentMarker);
        }

        step() {
            
            try {
                if (!this.sv)
                    this.sv = this.interpreter.evaluateString(this.editor.getValue(), this.log.bind(this));
                else
                    this.sv = this.interpreter.step(this.sv, this.isRunning ? 100 : 1);

                
                          
            } catch (ex) {
                this.log(ex);
                this.sv = null;
            }

            if (this.sv == null)
                this.isRunning = false;

            if (!this.isRunning)
                this.setMarker(this.sv);
            else
                this.currentTimeout = window.setTimeout(this.step.bind(this), 0);
        }

        stop() {
            this.sv = null;
            this.isRunning = false;
            this.clearMarker();
            this.clearOutput();
            clearTimeout(this.currentTimeout);
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

