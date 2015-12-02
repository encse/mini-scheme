module Editor {
    export class SicpEditor
    {
        editor: AceAjax.Editor;
        outputElement: HTMLElement;
        prevMarker = null;
        constructor(private editorId: string, private outputId: string) {
           
            require(['ace/ace'], (ace) => {
                var Range = ace.require("ace/range").Range;
                let sv: Sicp.Lang.Sv;
                let interpreter = new Sicp.Lang.Interpreter();

                this.editor = ace.edit("editor");
                this.editor.setTheme('ace/theme/clouds_midnight');
                this.editor.getSession().setMode('ace/mode/sicp');
                this.editor.commands.addCommand({
                    name: 'Evaluate',
                    bindKey: { win: 'Ctrl-E', mac: 'Command-E' },
                    exec: editor => {
                        var st = "";
                        var log = (stT) => {
                            st += stT + "\n";
                            this.setOutput(st);
                        }

                        try {
                            if (!sv)
                                sv = interpreter.evaluateString(editor.getValue(), log);
                            else
                                sv = interpreter.step(sv);

                            if (this.prevMarker !== null)
                                editor.getSession().removeMarker(this.prevMarker);
                            this.prevMarker = editor.getSession().addMarker(new Range(sv.ilineStart, sv.icolStart, sv.ilineEnd, sv.icolEnd), "errorHighlight", "text", false);
                            log(sv.toString());
                        } catch (ex) {
                            log(ex);
                            sv = null;

                        }

                          
                       
                       

                    }
                });

                this.outputElement = document.getElementById(outputId);
            });
        }

        setOutput(st: string) {
            this.outputElement.innerText = st;
        }

    }
}

