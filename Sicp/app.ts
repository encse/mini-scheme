
class TodoCtrl {
    scope: any;

    constructor($scope: ng.IScope) {

        this.scope = $scope;
        this.scope.name = `(define fact
    (lambda(x)
        (cond
            ((= x 1) 1)
            (else (* x (fact (- x 1))))))))
(fact 5)
(fact 4)
`;
        
        this.scope.clickMe = event => {
            if (event.shiftKey && event.keyCode === 13) {
                try {
                    this.scope.clickEvent = new Scheme.Evaluator().evaluateString(this.scope.name);
                } catch (event) {
                    this.scope.clickEvent = event;
                }
                event.preventDefault();
            } else {
                this.foo(<HTMLTextAreaElement>event.srcElement, event);
            }

        };

    }

    private isMultiLine(el): boolean {
        // Extract the selection
        var snippet = el.value.slice(el.selectionStart, el.selectionEnd);
        var nlRegex = /\n/;

        if (nlRegex.test(snippet)) return true;
        else return false;
    }

    private findStartIndices(el): number[] {
        var text = el.value,
            startIndices = [],
            offset = 0;

        while (text.match(/\n/) && text.match(/\n/).length > 0) {
            offset = (startIndices.length > 0 ? startIndices[startIndices.length - 1] : 0);
            var lineEnd = text.search("\n");
            startIndices.push(lineEnd + offset + 1);
            text = text.substring(lineEnd + 1);
        }
        startIndices.unshift(0);

        return startIndices;
    }

    private foo(element: HTMLTextAreaElement, event: KeyboardEvent): void {

        var tab = '    ';
        var tabWidth = tab.length;
        if (event.keyCode === 9) {
            event.preventDefault();
            var currentStart = element.selectionStart,
                currentEnd = element.selectionEnd;
            if (event.shiftKey === false) {
                // Normal Tab Behaviour
                if (!this.isMultiLine(element)) {
                    // Add tab before selection, maintain highlighted text selection
                    element.value = element.value.slice(0, currentStart) + tab + element.value.slice(currentStart);
                    element.selectionStart = currentStart + tabWidth;
                    element.selectionEnd = currentEnd + tabWidth;
                } else {
                    // Iterating through the startIndices, if the index falls within selectionStart and selectionEnd, indent it there.
                    var startIndices = this.findStartIndices(element),
                        l = startIndices.length,
                        newStart = undefined,
                        newEnd = undefined,
                        affectedRows = 0;

                    while (l--) {
                        var lowerBound = startIndices[l];
                        if (startIndices[l + 1] && currentStart != startIndices[l + 1]) lowerBound = startIndices[l + 1];

                        if (lowerBound >= currentStart && startIndices[l] < currentEnd) {
                            element.value = element.value.slice(0, startIndices[l]) + tab + element.value.slice(startIndices[l]);

                            newStart = startIndices[l];
                            if (!newEnd) newEnd = (startIndices[l + 1] ? startIndices[l + 1] - 1 : 'end');
                            affectedRows++;
                        }
                    }

                    element.selectionStart = newStart;
                    element.selectionEnd = (newEnd !== 'end' ? newEnd + (tabWidth * affectedRows) : element.value.length);
                }
            } else {
                // Shift-Tab Behaviour
                if (!this.isMultiLine(element)) {
                    if (element.value.substr(currentStart - tabWidth, tabWidth) == tab) {
                        // If there's a tab before the selectionStart, remove it
                        element.value = element.value.substr(0, currentStart - tabWidth) + element.value.substr(currentStart);
                        element.selectionStart = currentStart - tabWidth;
                        element.selectionEnd = currentEnd - tabWidth;
                    } else if (element.value.substr(currentStart - 1, 1) == "\n" && element.value.substr(currentStart, tabWidth) == tab) {
                        // However, if the selection is at the start of the line, and the first character is a tab, remove it
                        element.value = element.value.substring(0, currentStart) + element.value.substr(currentStart + tabWidth);
                        element.selectionStart = currentStart;
                        element.selectionEnd = currentEnd - tabWidth;
                    }
                } else {
                    // Iterating through the startIndices, if the index falls within selectionStart and selectionEnd, remove an indent from that row
                    var startIndices = this.findStartIndices(element),
                        l = startIndices.length,
                        newStart = undefined,
                        newEnd = undefined,
                        affectedRows = 0;

                    while (l--) {
                        var lowerBound = startIndices[l];
                        if (startIndices[l + 1] && currentStart != startIndices[l + 1]) lowerBound = startIndices[l + 1];

                        if (lowerBound >= currentStart && startIndices[l] < currentEnd) {
                            if (element.value.substr(startIndices[l], tabWidth) == tab) {
                                // Remove a tab
                                element.value = element.value.slice(0, startIndices[l]) + element.value.slice(startIndices[l] + tabWidth);
                                affectedRows++;
                            } else {
                            } // Do nothing

                            newStart = startIndices[l];
                            if (!newEnd) newEnd = (startIndices[l + 1] ? startIndices[l + 1] - 1 : 'end');
                        }
                    }

                    element.selectionStart = newStart;
                    element.selectionEnd = (newEnd !== 'end' ? newEnd - (affectedRows * tabWidth) : element.value.length);
                }
            }
        } else if (event.keyCode === 13 && event.shiftKey === false) { // Enter
            var self = this,
                cursorPos = element.selectionStart,
                startIndices = self.findStartIndices(element),
                numStartIndices = startIndices.length,
                startIndex = 0,
                endIndex = 0,
                tabMatch = new RegExp("^" + tab.replace('\t', '\\t').replace(/ /g, '\\s') + "+", 'g'),
                lineText = '';
            var tabs = null;

            for (var x = 0; x < numStartIndices; x++) {
                if (startIndices[x + 1] && (cursorPos >= startIndices[x]) && (cursorPos < startIndices[x + 1])) {
                    startIndex = startIndices[x];
                    endIndex = startIndices[x + 1] - 1;
                    break;
                } else {
                    startIndex = startIndices[numStartIndices - 1];
                    endIndex = element.value.length;
                }
            }

            lineText = element.value.slice(startIndex, endIndex);
            tabs = lineText.match(tabMatch);
            if (tabs !== null) {
                event.preventDefault();
                var indentText = tabs[0];
                var indentWidth = indentText.length;
                var inLinePos = cursorPos - startIndex;
                if (indentWidth > inLinePos) {
                    indentWidth = inLinePos;
                    indentText = indentText.slice(0, inLinePos);
                }

                element.value = element.value.slice(0, cursorPos) + "\n" + indentText + element.value.slice(cursorPos);
                element.selectionStart = cursorPos + indentWidth + 1;
                element.selectionEnd = element.selectionStart;
            }
        }
    }
}


var todomvc = angular.module('sicp', [])
    .controller('TodoCtrl', TodoCtrl);
