var TodoCtrl = (function () {
    function TodoCtrl($scope) {
        var _this = this;
        this.scope = $scope;
        this.scope.name = "(define fact\n    (lambda(x)\n        (cond\n            ((= x 1) 1)\n            (else (* x (fact (- x 1))))))))\n(fact 5)\n(fact 4)\n";
        this.scope.clickMe = function (event) {
            if (event.shiftKey && event.keyCode === 13) {
                try {
                    _this.scope.clickEvent = new Scheme.Evaluator().evaluateString(_this.scope.name);
                }
                catch (event) {
                    _this.scope.clickEvent = event;
                }
                event.preventDefault();
            }
            else {
                _this.foo(event.srcElement, event);
            }
        };
    }
    TodoCtrl.prototype.isMultiLine = function (el) {
        // Extract the selection
        var snippet = el.value.slice(el.selectionStart, el.selectionEnd);
        var nlRegex = /\n/;
        if (nlRegex.test(snippet))
            return true;
        else
            return false;
    };
    TodoCtrl.prototype.findStartIndices = function (el) {
        var text = el.value, startIndices = [], offset = 0;
        while (text.match(/\n/) && text.match(/\n/).length > 0) {
            offset = (startIndices.length > 0 ? startIndices[startIndices.length - 1] : 0);
            var lineEnd = text.search("\n");
            startIndices.push(lineEnd + offset + 1);
            text = text.substring(lineEnd + 1);
        }
        startIndices.unshift(0);
        return startIndices;
    };
    TodoCtrl.prototype.foo = function (element, event) {
        var tab = '    ';
        var tabWidth = tab.length;
        if (event.keyCode === 9) {
            event.preventDefault();
            var currentStart = element.selectionStart, currentEnd = element.selectionEnd;
            if (event.shiftKey === false) {
                // Normal Tab Behaviour
                if (!this.isMultiLine(element)) {
                    // Add tab before selection, maintain highlighted text selection
                    element.value = element.value.slice(0, currentStart) + tab + element.value.slice(currentStart);
                    element.selectionStart = currentStart + tabWidth;
                    element.selectionEnd = currentEnd + tabWidth;
                }
                else {
                    // Iterating through the startIndices, if the index falls within selectionStart and selectionEnd, indent it there.
                    var startIndices = this.findStartIndices(element), l = startIndices.length, newStart = undefined, newEnd = undefined, affectedRows = 0;
                    while (l--) {
                        var lowerBound = startIndices[l];
                        if (startIndices[l + 1] && currentStart != startIndices[l + 1])
                            lowerBound = startIndices[l + 1];
                        if (lowerBound >= currentStart && startIndices[l] < currentEnd) {
                            element.value = element.value.slice(0, startIndices[l]) + tab + element.value.slice(startIndices[l]);
                            newStart = startIndices[l];
                            if (!newEnd)
                                newEnd = (startIndices[l + 1] ? startIndices[l + 1] - 1 : 'end');
                            affectedRows++;
                        }
                    }
                    element.selectionStart = newStart;
                    element.selectionEnd = (newEnd !== 'end' ? newEnd + (tabWidth * affectedRows) : element.value.length);
                }
            }
            else {
                // Shift-Tab Behaviour
                if (!this.isMultiLine(element)) {
                    if (element.value.substr(currentStart - tabWidth, tabWidth) == tab) {
                        // If there's a tab before the selectionStart, remove it
                        element.value = element.value.substr(0, currentStart - tabWidth) + element.value.substr(currentStart);
                        element.selectionStart = currentStart - tabWidth;
                        element.selectionEnd = currentEnd - tabWidth;
                    }
                    else if (element.value.substr(currentStart - 1, 1) == "\n" && element.value.substr(currentStart, tabWidth) == tab) {
                        // However, if the selection is at the start of the line, and the first character is a tab, remove it
                        element.value = element.value.substring(0, currentStart) + element.value.substr(currentStart + tabWidth);
                        element.selectionStart = currentStart;
                        element.selectionEnd = currentEnd - tabWidth;
                    }
                }
                else {
                    // Iterating through the startIndices, if the index falls within selectionStart and selectionEnd, remove an indent from that row
                    var startIndices = this.findStartIndices(element), l = startIndices.length, newStart = undefined, newEnd = undefined, affectedRows = 0;
                    while (l--) {
                        var lowerBound = startIndices[l];
                        if (startIndices[l + 1] && currentStart != startIndices[l + 1])
                            lowerBound = startIndices[l + 1];
                        if (lowerBound >= currentStart && startIndices[l] < currentEnd) {
                            if (element.value.substr(startIndices[l], tabWidth) == tab) {
                                // Remove a tab
                                element.value = element.value.slice(0, startIndices[l]) + element.value.slice(startIndices[l] + tabWidth);
                                affectedRows++;
                            }
                            else {
                            } // Do nothing
                            newStart = startIndices[l];
                            if (!newEnd)
                                newEnd = (startIndices[l + 1] ? startIndices[l + 1] - 1 : 'end');
                        }
                    }
                    element.selectionStart = newStart;
                    element.selectionEnd = (newEnd !== 'end' ? newEnd - (affectedRows * tabWidth) : element.value.length);
                }
            }
        }
        else if (event.keyCode === 13 && event.shiftKey === false) {
            var self = this, cursorPos = element.selectionStart, startIndices = self.findStartIndices(element), numStartIndices = startIndices.length, startIndex = 0, endIndex = 0, tabMatch = new RegExp("^" + tab.replace('\t', '\\t').replace(/ /g, '\\s') + "+", 'g'), lineText = '';
            var tabs = null;
            for (var x = 0; x < numStartIndices; x++) {
                if (startIndices[x + 1] && (cursorPos >= startIndices[x]) && (cursorPos < startIndices[x + 1])) {
                    startIndex = startIndices[x];
                    endIndex = startIndices[x + 1] - 1;
                    break;
                }
                else {
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
    };
    return TodoCtrl;
})();
var todomvc = angular.module('sicp', [])
    .controller('TodoCtrl', TodoCtrl);
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Scheme;
(function (Scheme) {
    var Rv = (function () {
        function Rv() {
        }
        return Rv;
    })();
    var RvAtom = (function (_super) {
        __extends(RvAtom, _super);
        function RvAtom() {
            _super.apply(this, arguments);
        }
        RvAtom.matches = function (node) { return !RvCons.matches(node); };
        return RvAtom;
    })(Rv);
    var RvCons = (function (_super) {
        __extends(RvCons, _super);
        function RvCons(_car, _cdr) {
            _super.call(this);
            this._car = _car;
            this._cdr = _cdr;
        }
        RvCons.listFromRvs = function () {
            var rvs = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                rvs[_i - 0] = arguments[_i];
            }
            return RvCons.listFromRvArray(rvs);
        };
        RvCons.listFromRvArray = function (rvs) {
            var res = RvCons.Nil;
            for (var j = rvs.length - 1; j >= 0; j--)
                res = new RvCons(rvs[j], res);
            return res;
        };
        RvCons.matches = function (node) { return node instanceof RvCons; };
        RvCons.isNil = function (node) {
            return node === RvCons.Nil || (RvCons.matches(node) && RvCons.car(node) === null && RvCons.cdr(node) === null);
        };
        RvCons.car = function (node) {
            if (!RvCons.matches(node))
                throw "Cons expected";
            return node._car;
        };
        RvCons.cdr = function (node) {
            if (!RvCons.matches(node))
                throw "Cons expected";
            return node._cdr;
        };
        RvCons.cadr = function (node) {
            return this.car(this.cdr(node));
        };
        RvCons.cddr = function (node) {
            return this.cdr(this.cdr(node));
        };
        RvCons.caddr = function (node) {
            return this.car(this.cddr(node));
        };
        RvCons.cdddr = function (node) {
            return this.cdr(this.cddr(node));
        };
        RvCons.cadddr = function (node) {
            return this.car(this.cdddr(node));
        };
        RvCons.prototype.toString = function () {
            var st = '(';
            var first = true;
            var rv = this;
            while (!RvCons.isNil(rv)) {
                if (!first)
                    st += " ";
                first = false;
                if (RvCons.matches(rv)) {
                    st += RvCons.car(rv).toString();
                    rv = RvCons.cdr(rv);
                    if (RvAtom.matches(rv)) {
                        st += " . " + rv.toString();
                        break;
                    }
                }
                else {
                    st += rv.toString();
                    break;
                }
            }
            st += ')';
            return st;
        };
        RvCons.Nil = new RvCons(null, null);
        return RvCons;
    })(Rv);
    var RvAny = (function (_super) {
        __extends(RvAny, _super);
        function RvAny(_val) {
            _super.call(this);
            this._val = _val;
        }
        RvAny.matches = function (node) { return node instanceof RvAny; };
        RvAny.val = function (node) {
            if (!RvAny.matches(node))
                throw "RvAny expected";
            return node._val;
        };
        RvAny.prototype.toString = function () {
            return this._val.toString();
        };
        return RvAny;
    })(Rv);
    var RvBool = (function (_super) {
        __extends(RvBool, _super);
        function RvBool(_val) {
            _super.call(this);
            this._val = _val;
        }
        RvBool.matches = function (node) { return node instanceof RvBool; };
        RvBool.isTrue = function (node) {
            return RvBool.matches(node) && RvBool.val(node);
        };
        RvBool.isFalse = function (node) {
            return RvBool.matches(node) && !RvBool.val(node);
        };
        RvBool.val = function (node) {
            if (!RvBool.matches(node))
                throw "bool expected";
            return node._val;
        };
        RvBool.prototype.toString = function () {
            return this._val ? "#t" : "#f";
        };
        return RvBool;
    })(Rv);
    var RvString = (function (_super) {
        __extends(RvString, _super);
        function RvString(_val) {
            _super.call(this);
            this._val = _val;
        }
        RvString.matches = function (node) { return node instanceof RvString; };
        RvString.val = function (node) {
            if (!RvString.matches(node))
                throw "string expected";
            return node._val;
        };
        RvString.prototype.toString = function () {
            return JSON.stringify(this._val);
        };
        return RvString;
    })(Rv);
    var RvNumber = (function (_super) {
        __extends(RvNumber, _super);
        function RvNumber(_val) {
            _super.call(this);
            this._val = _val;
        }
        RvNumber.matches = function (node) { return node instanceof RvNumber; };
        RvNumber.val = function (node) {
            if (!RvNumber.matches(node))
                throw "Number expected";
            return node._val;
        };
        RvNumber.prototype.toString = function () {
            return "" + this._val;
        };
        return RvNumber;
    })(Rv);
    var RvSymbol = (function (_super) {
        __extends(RvSymbol, _super);
        function RvSymbol(_val) {
            _super.call(this);
            this._val = _val;
        }
        RvSymbol.matches = function (node) { return node instanceof RvSymbol; };
        RvSymbol.val = function (node) {
            if (!RvSymbol.matches(node))
                throw "Symbol expected";
            return node._val;
        };
        RvSymbol.prototype.toString = function () {
            return this._val;
        };
        return RvSymbol;
    })(Rv);
    var Evaluator = (function () {
        function Evaluator() {
        }
        Evaluator.prototype.evaluateString = function (st) {
            var parser = new Parser();
            var exprs = parser.parse(st);
            var env = new Env(null);
            env.define('cons', new RvCons(new RvSymbol('primitive'), new RvAny(function (args) { return new RvCons(RvCons.car(args), RvCons.cadr(args)); })));
            env.define('null?', new RvCons(new RvSymbol('primitive'), new RvAny(function (args) { return RvCons.isNil(RvCons.car(args)); })));
            env.define('car', new RvCons(new RvSymbol('primitive'), new RvAny(function (args) { return RvCons.car(RvCons.car(args)); })));
            env.define('cdr', new RvCons(new RvSymbol('primitive'), new RvAny(function (args) { return RvCons.cdr(RvCons.car(args)); })));
            env.define('=', new RvCons(new RvSymbol('primitive'), new RvAny(function (args) { return new RvBool(RvNumber.val(RvCons.car(args)) === RvNumber.val(RvCons.cadr(args))); })));
            env.define('*', new RvCons(new RvSymbol('primitive'), new RvAny(function (args) { return new RvNumber(RvNumber.val(RvCons.car(args)) * RvNumber.val(RvCons.cadr(args))); })));
            env.define('-', new RvCons(new RvSymbol('primitive'), new RvAny(function (args) { return new RvNumber(RvNumber.val(RvCons.car(args)) - RvNumber.val(RvCons.cadr(args))); })));
            env.define('+', new RvCons(new RvSymbol('primitive'), new RvAny(function (args) { return new RvNumber(RvNumber.val(RvCons.car(args)) - RvNumber.val(RvCons.cadr(args))); })));
            env.define('/', new RvCons(new RvSymbol('primitive'), new RvAny(function (args) { return new RvNumber(RvNumber.val(RvCons.car(args)) / RvNumber.val(RvCons.cadr(args))); })));
            this.evaluators = [
                new SelfEvaluator(),
                new VariableEvaluator(),
                new QuoteEvaluator(),
                new CondEvaluator(this),
                new DefinitionEvaluator(this),
                new AssignmentEvaluator(this),
                new IfEvaluator(this),
                new BeginEvaluator(this),
                new LambdaEvaluator(this),
                new ApplicationEvaluator(this)
            ];
            return this.evaluateList(exprs, new Env(env)).toString();
        };
        Evaluator.prototype.matches = function (node) {
            return true;
        };
        Evaluator.prototype.evaluate = function (rv, env) {
            for (var i = 0; i < this.evaluators.length; i++) {
                if (this.evaluators[i].matches(rv))
                    return this.evaluators[i].evaluate(rv, env);
            }
            throw 'cannot evaluate ' + rv.toString();
        };
        Evaluator.prototype.evaluateList = function (exprs, env) {
            var res = RvCons.Nil;
            while (!RvCons.isNil(exprs)) {
                res = this.evaluate(RvCons.car(exprs), env);
                exprs = RvCons.cdr(exprs);
            }
            return res;
        };
        Evaluator.prototype.isTaggedList = function (node, tag) {
            if (!RvCons.matches(node))
                return false;
            var car = RvCons.car(node);
            return RvSymbol.matches(car) && RvSymbol.val(car) === tag;
        };
        return Evaluator;
    })();
    Scheme.Evaluator = Evaluator;
    var SelfEvaluator = (function (_super) {
        __extends(SelfEvaluator, _super);
        function SelfEvaluator() {
            _super.apply(this, arguments);
        }
        SelfEvaluator.prototype.matches = function (node) {
            return RvString.matches(node) || RvBool.matches(node) || RvNumber.matches(node) || RvCons.isNil(node);
        };
        SelfEvaluator.prototype.evaluate = function (node, env) {
            return node;
        };
        return SelfEvaluator;
    })(Evaluator);
    var VariableEvaluator = (function (_super) {
        __extends(VariableEvaluator, _super);
        function VariableEvaluator() {
            _super.apply(this, arguments);
        }
        VariableEvaluator.prototype.matches = function (node) {
            return RvSymbol.matches(node);
        };
        VariableEvaluator.prototype.evaluate = function (node, env) {
            return env.get(RvSymbol.val(node));
        };
        return VariableEvaluator;
    })(Evaluator);
    var QuoteEvaluator = (function (_super) {
        __extends(QuoteEvaluator, _super);
        function QuoteEvaluator() {
            _super.apply(this, arguments);
        }
        QuoteEvaluator.prototype.matches = function (node) {
            return this.isTaggedList(node, 'quote');
        };
        QuoteEvaluator.prototype.evaluate = function (node, env) {
            return RvCons.cdr(node);
        };
        return QuoteEvaluator;
    })(Evaluator);
    var CondEvaluator = (function (_super) {
        __extends(CondEvaluator, _super);
        function CondEvaluator(evaluator) {
            _super.call(this);
            this.evaluator = evaluator;
        }
        CondEvaluator.prototype.matches = function (node) {
            return this.isTaggedList(node, 'cond');
        };
        CondEvaluator.prototype.getCondClauses = function (cond) { return RvCons.cdr(cond); };
        CondEvaluator.prototype.isCondElseClause = function (clause) { return this.isTaggedList(clause, "else"); };
        CondEvaluator.prototype.getCondPredicate = function (clause) { return RvCons.car(clause); };
        CondEvaluator.prototype.getCondActions = function (clause) { return RvCons.cdr(clause); };
        CondEvaluator.prototype.evaluate = function (node, env) {
            var clauses = this.getCondClauses(node);
            while (!RvCons.isNil(clauses)) {
                var clause = RvCons.car(clauses);
                if (this.isCondElseClause(clause) || RvBool.isTrue(this.evaluator.evaluate(RvCons.car(clause), env)))
                    return this.evaluator.evaluateList(this.getCondActions(clause), env);
                clauses = RvCons.cdr(clauses);
            }
            return RvCons.Nil;
        };
        return CondEvaluator;
    })(Evaluator);
    var DefinitionEvaluator = (function (_super) {
        __extends(DefinitionEvaluator, _super);
        function DefinitionEvaluator(evaluator) {
            _super.call(this);
            this.evaluator = evaluator;
        }
        DefinitionEvaluator.prototype.matches = function (node) {
            return this.isTaggedList(node, 'define');
        };
        DefinitionEvaluator.prototype.evaluate = function (node, env) {
            env.define(RvSymbol.val(this.getVariable(node)), this.evaluator.evaluate(this.getValue(node), env));
            return RvCons.Nil;
        };
        DefinitionEvaluator.prototype.getVariable = function (node) { return RvCons.cadr(node); };
        DefinitionEvaluator.prototype.getValue = function (node) { return RvCons.caddr(node); };
        return DefinitionEvaluator;
    })(Evaluator);
    var AssignmentEvaluator = (function (_super) {
        __extends(AssignmentEvaluator, _super);
        function AssignmentEvaluator(evaluator) {
            _super.call(this);
            this.evaluator = evaluator;
        }
        AssignmentEvaluator.prototype.matches = function (node) {
            return this.isTaggedList(node, 'set!');
        };
        AssignmentEvaluator.prototype.evaluate = function (node, env) {
            env.set(RvSymbol.val(this.getVariable(node)), this.evaluator.evaluate(this.getValue(node), env));
            return RvCons.Nil;
        };
        AssignmentEvaluator.prototype.getVariable = function (node) { return RvCons.cadr(node); };
        AssignmentEvaluator.prototype.getValue = function (node) { return RvCons.caddr(node); };
        return AssignmentEvaluator;
    })(Evaluator);
    var IfEvaluator = (function (_super) {
        __extends(IfEvaluator, _super);
        function IfEvaluator(evaluator) {
            _super.call(this);
            this.evaluator = evaluator;
        }
        IfEvaluator.prototype.matches = function (node) {
            return this.isTaggedList(node, 'if');
        };
        IfEvaluator.prototype.evaluate = function (node, env) {
            return RvBool.isTrue(this.evaluator.evaluate(this.getIfPredicate(node), env)) ?
                this.evaluator.evaluate(this.getIfConsequent(node), env) :
                this.evaluator.evaluate(this.getIfAlternative(node), env);
        };
        IfEvaluator.prototype.getIfPredicate = function (expr) { return RvCons.cadr(expr); };
        IfEvaluator.prototype.getIfConsequent = function (expr) { return RvCons.caddr(expr); };
        IfEvaluator.prototype.getIfAlternative = function (expr) { return !RvCons.isNil(RvCons.cdddr(expr)) ? RvCons.cadddr(expr) : RvCons.Nil; };
        return IfEvaluator;
    })(Evaluator);
    var BeginEvaluator = (function (_super) {
        __extends(BeginEvaluator, _super);
        function BeginEvaluator(evaluator) {
            _super.call(this);
            this.evaluator = evaluator;
        }
        BeginEvaluator.prototype.matches = function (node) {
            return this.isTaggedList(node, 'begin');
        };
        BeginEvaluator.prototype.evaluate = function (node, env) {
            return this.evaluator.evaluateList(this.getBeginActions(node), env);
        };
        BeginEvaluator.prototype.getBeginActions = function (expr) { return RvCons.cdr(expr); };
        return BeginEvaluator;
    })(Evaluator);
    var LambdaEvaluator = (function (_super) {
        __extends(LambdaEvaluator, _super);
        function LambdaEvaluator(evaluator) {
            _super.call(this);
            this.evaluator = evaluator;
        }
        LambdaEvaluator.prototype.matches = function (node) {
            return this.isTaggedList(node, 'lambda');
        };
        LambdaEvaluator.prototype.evaluate = function (node, env) {
            return RvCons.listFromRvs(new RvSymbol('procedure'), this.getLambdaParameters(node), this.getLambdaBody(node), new RvAny(env));
        };
        LambdaEvaluator.prototype.getLambdaParameters = function (expr) { return RvCons.cadr(expr); };
        LambdaEvaluator.prototype.getLambdaBody = function (expr) { return RvCons.cddr(expr); };
        return LambdaEvaluator;
    })(Evaluator);
    var ApplicationEvaluator = (function (_super) {
        __extends(ApplicationEvaluator, _super);
        function ApplicationEvaluator(evaluator) {
            _super.call(this);
            this.evaluator = evaluator;
        }
        ApplicationEvaluator.prototype.matches = function (node) {
            return RvCons.matches(node);
        };
        ApplicationEvaluator.prototype.evaluate = function (node, env) {
            var operator = this.evaluator.evaluate(this.getOperator(node), env);
            if (!this.isPrimitiveProcedure(operator) && !this.isCompoundProcedure(operator))
                throw 'undefined procedure' + operator.toString();
            var args = this.evaluateArgs(this.getArguments(node), env);
            if (this.isPrimitiveProcedure(operator)) {
                return this.getPrimitiveProcedureDelegate(operator)(args);
            }
            else {
                var newEnv = new Env(this.getProcedureEnv(operator));
                var params = this.getProcedureParameters(operator);
                while (!RvCons.isNil(args) || !RvCons.isNil(params)) {
                    if (RvCons.isNil(args))
                        throw 'not enough argument';
                    if (RvCons.isNil(params))
                        throw 'too many argument';
                    var parameter = RvSymbol.val(RvCons.car(params));
                    var arg = RvCons.car(args);
                    newEnv.define(parameter, arg);
                    params = RvCons.cdr(params);
                    args = RvCons.cdr(args);
                }
                return this.evaluator.evaluateList(this.getProcedureBody(operator), newEnv);
            }
        };
        ApplicationEvaluator.prototype.isCompoundProcedure = function (expr) { return this.isTaggedList(expr, 'procedure'); };
        ApplicationEvaluator.prototype.isPrimitiveProcedure = function (expr) { return this.isTaggedList(expr, 'primitive'); };
        ApplicationEvaluator.prototype.getProcedureParameters = function (expr) { return RvCons.cadr(expr); };
        ApplicationEvaluator.prototype.getProcedureBody = function (expr) { return RvCons.caddr(expr); };
        ApplicationEvaluator.prototype.getProcedureEnv = function (expr) { return RvAny.val(RvCons.cadddr(expr)); };
        ApplicationEvaluator.prototype.getPrimitiveProcedureDelegate = function (expr) { return RvAny.val(RvCons.cdr(expr)); };
        ApplicationEvaluator.prototype.getOperator = function (expr) { return RvCons.car(expr); };
        ApplicationEvaluator.prototype.getArguments = function (expr) { return RvCons.cdr(expr); };
        ApplicationEvaluator.prototype.evaluateArgs = function (args, env) {
            var evaluatedArgs = [];
            while (!RvCons.isNil(args)) {
                evaluatedArgs.push(this.evaluator.evaluate(RvCons.car(args), env));
                args = RvCons.cdr(args);
            }
            return RvCons.listFromRvArray(evaluatedArgs);
        };
        return ApplicationEvaluator;
    })(Evaluator);
    var Env = (function () {
        function Env(envParent) {
            this.obj = {};
            this.envParent = null;
            this.envParent = envParent;
        }
        Env.prototype.get = function (name) {
            if (name in this.obj)
                return this.obj[name];
            if (this.envParent == null)
                return RvCons.Nil;
            return this.envParent.get(name);
        };
        Env.prototype.set = function (name, rv) {
            if (name in this.obj)
                this.obj[name] = rv;
            else if (this.envParent == null)
                throw "variable is not declared";
            else
                this.envParent.set(name, rv);
        };
        Env.prototype.define = function (name, value) {
            this.obj[name] = value;
        };
        return Env;
    })();
    var Parser = (function () {
        function Parser() {
            this.regexSymbol = /^[^\s()',]+/;
            this.regexNumber = /^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?/;
            this.regexString = /^"([^\\\"]+|\\.)*"/;
            this.regexWhiteSpace = /^\s*/;
            this.regexBoolean = /^#t|^#f/;
            this.itoken = 0;
        }
        Parser.prototype.parse = function (st) {
            this.tokens = this.getTokens(st).filter(function (token) { return token.kind !== TokenKind.WhiteSpace; });
            this.tokens.push(new Token(TokenKind.EOF, null));
            this.itoken = 0;
            var rvs = [];
            while (!this.accept(TokenKind.EOF))
                rvs.push(this.parseExpression());
            return RvCons.listFromRvArray(rvs);
        };
        Parser.prototype.nextToken = function () {
            if (this.itoken < this.tokens.length - 1)
                this.itoken++;
        };
        Parser.prototype.currentToken = function () {
            return this.tokens[this.itoken];
        };
        Parser.prototype.accept = function (tokenKind) {
            if (this.currentToken().kind === tokenKind) {
                this.nextToken();
                return true;
            }
            return false;
        };
        Parser.prototype.expect = function (tokenKind) {
            if (this.accept(tokenKind))
                return true;
            else
                throw 'expected ' + tokenKind + ' found ' + this.currentToken().kind;
        };
        Parser.prototype.parseExpression = function () {
            var token = this.currentToken();
            if (this.accept(TokenKind.Quote))
                return new RvCons(new RvSymbol("quote"), this.parseExpression());
            if (this.accept(TokenKind.Symbol))
                return new RvSymbol(token.st);
            if (this.accept(TokenKind.BooleanLit))
                return new RvBool(token.st === "#t");
            if (this.accept(TokenKind.NumberLit))
                return new RvNumber(eval(token.st));
            if (this.accept(TokenKind.StringLit))
                return new RvString(eval(token.st));
            if (this.accept(TokenKind.LParen)) {
                var exprs = [];
                while (!this.accept(TokenKind.RParen)) {
                    if (this.accept(TokenKind.EOF))
                        throw "unexpected end of input";
                    exprs.push(this.parseExpression());
                }
                return RvCons.listFromRvArray(exprs);
            }
            throw "invalid token " + token;
        };
        Parser.prototype.getTokens = function (st) {
            var tokens = [];
            while (st.length > 0) {
                var ch = st[0];
                var token = void 0;
                if (ch === "(")
                    token = new Token(TokenKind.LParen, ch);
                else if (ch === ")")
                    token = new Token(TokenKind.RParen, ch);
                else if (ch === "'")
                    token = new Token(TokenKind.Quote, ch);
                else if (this.regexNumber.test(st))
                    token = new Token(TokenKind.NumberLit, this.regexNumber.exec(st)[0]);
                else if (this.regexString.test(st))
                    token = new Token(TokenKind.StringLit, this.regexString.exec(st)[0]);
                else if (this.regexBoolean.test(st))
                    token = new Token(TokenKind.BooleanLit, this.regexBoolean.exec(st)[0]);
                else if (this.regexSymbol.test(st))
                    token = new Token(TokenKind.Symbol, this.regexSymbol.exec(st)[0]);
                else if (this.regexWhiteSpace.test(st))
                    token = new Token(TokenKind.WhiteSpace, this.regexWhiteSpace.exec(st)[0]);
                else
                    throw "invalid token at '" + st + "'";
                tokens.push(token);
                if (token.st.length === 0)
                    throw "invalid token";
                st = st.substr(token.st.length);
            }
            return tokens;
        };
        return Parser;
    })();
    var TokenKind;
    (function (TokenKind) {
        TokenKind[TokenKind["WhiteSpace"] = 0] = "WhiteSpace";
        TokenKind[TokenKind["BooleanLit"] = 1] = "BooleanLit";
        TokenKind[TokenKind["LParen"] = 2] = "LParen";
        TokenKind[TokenKind["RParen"] = 3] = "RParen";
        TokenKind[TokenKind["Symbol"] = 4] = "Symbol";
        TokenKind[TokenKind["NumberLit"] = 5] = "NumberLit";
        TokenKind[TokenKind["Quote"] = 6] = "Quote";
        TokenKind[TokenKind["StringLit"] = 7] = "StringLit";
        TokenKind[TokenKind["EOF"] = 8] = "EOF";
    })(TokenKind || (TokenKind = {}));
    var Token = (function () {
        function Token(kind, st) {
            this.kind = kind;
            this.st = st;
            this.kind = kind;
            this.st = st;
        }
        return Token;
    })();
})(Scheme || (Scheme = {}));
//# sourceMappingURL=main.js.map