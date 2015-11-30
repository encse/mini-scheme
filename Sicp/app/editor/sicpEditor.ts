module Editor {
    export class SicpEditor
    {
        editor: AceAjax.Editor;
        outputElement: HTMLElement;

        constructor(private editorId: string, private outputId: string) {

            require(['ace/ace'], ace => {

                this.editor = ace.edit("editor");
                this.editor.setTheme('ace/theme/clouds_midnight');
                this.editor.getSession().setMode('ace/mode/sicp');
                this.editor.commands.addCommand({
                    name: 'Evaluate',
                    bindKey: { win: 'Ctrl-E', mac: 'Command-E' },
                    exec: editor => {
                        try {
                            this.setOutput(new Sicp.Lang.Interpreter().evaluateString(editor.getValue()));
                        } catch (ex) {
                            this.setOutput(ex);
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

