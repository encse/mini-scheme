var Editor;
(function (Editor) {
    var SicpEditor = (function () {
        function SicpEditor(editorId, outputId) {
            var _this = this;
            this.editorId = editorId;
            this.outputId = outputId;
            this.currentMarker = null;
            this.currentTimeout = null;
            this.isRunning = false;
            this.interpreter = new Sicp.Lang.Interpreter();
            require(['ace/ace'], function (ace) {
                _this.Range = ace.require("ace/range").Range;
                _this.editor = ace.edit("editor");
                _this.editor.setTheme('ace/theme/clouds_midnight');
                _this.editor.getSession().setMode('ace/mode/sicp');
                _this.editor.commands.addCommand({
                    name: 'Run',
                    bindKey: { win: 'Ctrl-R', mac: 'Command-R' },
                    exec: function (editor) {
                        _this.run();
                    }
                });
                _this.editor.commands.addCommand({
                    name: 'Next',
                    bindKey: { win: 'Ctrl-E', mac: 'Command-E' },
                    exec: function (editor) {
                        _this.step();
                    }
                });
                _this.outputElement = document.getElementById(outputId);
            });
        }
        SicpEditor.prototype.clearOutput = function () {
            this.outputElement.innerText = "";
        };
        SicpEditor.prototype.log = function (st) {
            this.outputElement.innerText = this.outputElement.innerText === "" ? st : this.outputElement.innerText + "\n" + st;
        };
        SicpEditor.prototype.setMarker = function (sv) {
            this.clearMarker();
            if (sv) {
                this.currentMarker = this.editor.getSession().addMarker(new this.Range(sv.ilineStart, sv.icolStart, sv.ilineEnd, sv.icolEnd), "errorHighlight", "text", false);
            }
        };
        SicpEditor.prototype.clearMarker = function () {
            if (this.currentMarker !== null)
                this.editor.getSession().removeMarker(this.currentMarker);
        };
        SicpEditor.prototype.step = function () {
            try {
                if (!this.sv)
                    this.sv = this.interpreter.evaluateString(this.editor.getValue(), this.log.bind(this));
                else
                    this.sv = this.interpreter.step(this.sv, this.isRunning ? 100 : 1);
            }
            catch (ex) {
                this.log(ex);
                this.sv = null;
            }
            if (this.sv == null)
                this.isRunning = false;
            if (!this.isRunning)
                this.setMarker(this.sv);
            else
                this.currentTimeout = window.setTimeout(this.step.bind(this), 0);
        };
        SicpEditor.prototype.stop = function () {
            this.sv = null;
            this.isRunning = false;
            this.clearMarker();
            this.clearOutput();
            clearTimeout(this.currentTimeout);
        };
        SicpEditor.prototype.run = function () {
            this.stop();
            this.continue();
        };
        SicpEditor.prototype.continue = function () {
            this.isRunning = true;
            this.step();
        };
        SicpEditor.prototype.break = function () {
            this.isRunning = false;
        };
        return SicpEditor;
    })();
    Editor.SicpEditor = SicpEditor;
})(Editor || (Editor = {}));
var Sicp;
(function (Sicp) {
    var Lang;
    (function (Lang) {
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
                    throw "no binding for " + name;
                return this.envParent.get(name);
            };
            Env.prototype.set = function (name, rv) {
                if (name in this.obj)
                    this.obj[name] = rv;
                else if (this.envParent == null)
                    throw name + " is not declared";
                else
                    this.envParent.set(name, rv);
            };
            Env.prototype.define = function (name, value) {
                if (name in this.obj)
                    throw name + ' is already defined';
                this.obj[name] = value;
            };
            Env.prototype.setOrDefine = function (name, value) {
                this.obj[name] = value;
            };
            return Env;
        })();
        Lang.Env = Env;
    })(Lang = Sicp.Lang || (Sicp.Lang = {}));
})(Sicp || (Sicp = {}));
var Sicp;
(function (Sicp) {
    var Evaluator;
    (function (Evaluator) {
        var ApplicationEvaluator = (function () {
            function ApplicationEvaluator(evaluator) {
                this.evaluator = evaluator;
            }
            ApplicationEvaluator.prototype.matches = function (sv) {
                return Sicp.Lang.SvCons.matches(sv);
            };
            ApplicationEvaluator.evalCall = function (operator, args, cont, evaluator) {
                if (this.isPrimitiveProcedure(operator)) {
                    return cont(this.getPrimitiveProcedureDelegate(operator)(args));
                }
                else if (this.isContinuation(operator)) {
                    var arg = Sicp.Lang.SvCons.Nil;
                    if (!Sicp.Lang.SvCons.isNil(args)) {
                        if (!Sicp.Lang.SvCons.isNil(Sicp.Lang.SvCons.cdr(args)))
                            throw 'too many argument';
                        arg = Sicp.Lang.SvCons.car(args);
                    }
                    return this.getContinuationFromCapturedContinuation(operator)(arg);
                }
                else if (this.isCompoundProcedure(operator)) {
                    var newEnv = new Sicp.Lang.Env(this.getProcedureEnv(operator));
                    var params = this.getProcedureParameters(operator);
                    while (!Sicp.Lang.SvCons.isNil(args) || !Sicp.Lang.SvCons.isNil(params)) {
                        if (Sicp.Lang.SvCons.isNil(args))
                            throw 'not enough argument';
                        if (Sicp.Lang.SvCons.isNil(params))
                            throw 'too many argument';
                        var parameter = Sicp.Lang.SvSymbol.val(Sicp.Lang.SvCons.car(params));
                        var arg = Sicp.Lang.SvCons.car(args);
                        newEnv.define(parameter, arg);
                        params = Sicp.Lang.SvCons.cdr(params);
                        args = Sicp.Lang.SvCons.cdr(args);
                    }
                    return evaluator.evaluateList(this.getProcedureBody(operator), newEnv, cont);
                }
                else
                    throw 'undefined procedure' + operator.toString();
            };
            ApplicationEvaluator.prototype.evaluate = function (sv, env, cont) {
                var _this = this;
                return this.evaluator.evaluate(ApplicationEvaluator.getOperator(sv), env, function (operator) {
                    if (!ApplicationEvaluator.isPrimitiveProcedure(operator) &&
                        !ApplicationEvaluator.isCompoundProcedure(operator) &&
                        !ApplicationEvaluator.isContinuation(operator))
                        throw 'undefined procedure ' + ApplicationEvaluator.getOperator(sv).toString();
                    return _this.evaluateArgs(ApplicationEvaluator.getArguments(sv), env, function (args) { return ApplicationEvaluator.evalCall(operator, args, cont, _this.evaluator); });
                });
            };
            ApplicationEvaluator.isCompoundProcedure = function (expr) {
                return Evaluator.BaseEvaluator.isTaggedList(expr, 'procedure');
            };
            ApplicationEvaluator.isPrimitiveProcedure = function (expr) {
                return Evaluator.BaseEvaluator.isTaggedList(expr, 'primitive');
            };
            ApplicationEvaluator.isContinuation = function (expr) {
                return Evaluator.BaseEvaluator.isTaggedList(expr, 'captured-continuation');
            };
            ApplicationEvaluator.getContinuationFromCapturedContinuation = function (expr) {
                return Sicp.Lang.SvAny.val(Sicp.Lang.SvCons.cdr(expr));
            };
            ApplicationEvaluator.getProcedureParameters = function (expr) { return Sicp.Lang.SvCons.cadr(expr); };
            ApplicationEvaluator.getProcedureBody = function (expr) { return Sicp.Lang.SvCons.caddr(expr); };
            ApplicationEvaluator.getProcedureEnv = function (expr) { return Sicp.Lang.SvAny.val(Sicp.Lang.SvCons.cadddr(expr)); };
            ApplicationEvaluator.getPrimitiveProcedureDelegate = function (expr) { return Sicp.Lang.SvAny.val(Sicp.Lang.SvCons.cdr(expr)); };
            ApplicationEvaluator.getOperator = function (expr) { return Sicp.Lang.SvCons.car(expr); };
            ApplicationEvaluator.getArguments = function (expr) { return Sicp.Lang.SvCons.cdr(expr); };
            ApplicationEvaluator.prototype.evaluateArgs = function (args0, env, cont) {
                var _this = this;
                var evaluatedArgs = new Sicp.Lang.SvCons(null, null);
                var loop = function (evaluatedArgsLast, args) {
                    if (Sicp.Lang.SvCons.isNil(args)) {
                        return cont(evaluatedArgs);
                    }
                    return _this.evaluator.evaluate(Sicp.Lang.SvCons.car(args), env, function (evaluatedArg) {
                        Sicp.Lang.SvCons.setCar(evaluatedArgsLast, evaluatedArg);
                        Sicp.Lang.SvCons.setCdr(evaluatedArgsLast, new Sicp.Lang.SvCons(null, null));
                        return loop(Sicp.Lang.SvCons.cdr(evaluatedArgsLast), Sicp.Lang.SvCons.cdr(args));
                    });
                };
                return loop(evaluatedArgs, args0);
            };
            return ApplicationEvaluator;
        })();
        Evaluator.ApplicationEvaluator = ApplicationEvaluator;
    })(Evaluator = Sicp.Evaluator || (Sicp.Evaluator = {}));
})(Sicp || (Sicp = {}));
var Sicp;
(function (Sicp) {
    var Evaluator;
    (function (Evaluator) {
        var AssignmentEvaluator = (function () {
            function AssignmentEvaluator(evaluator) {
                this.evaluator = evaluator;
            }
            AssignmentEvaluator.prototype.matches = function (sv) {
                return Evaluator.BaseEvaluator.isTaggedList(sv, 'set!');
            };
            AssignmentEvaluator.prototype.evaluate = function (sv, env, cont) {
                var _this = this;
                return this.evaluator.evaluate(this.getValue(sv), env, function (svValue) {
                    env.set(Sicp.Lang.SvSymbol.val(_this.getVariable(sv)), svValue);
                    return cont(svValue);
                });
            };
            AssignmentEvaluator.prototype.getVariable = function (node) { return Sicp.Lang.SvCons.cadr(node); };
            AssignmentEvaluator.prototype.getValue = function (node) { return Sicp.Lang.SvCons.caddr(node); };
            return AssignmentEvaluator;
        })();
        Evaluator.AssignmentEvaluator = AssignmentEvaluator;
    })(Evaluator = Sicp.Evaluator || (Sicp.Evaluator = {}));
})(Sicp || (Sicp = {}));
var Sicp;
(function (Sicp) {
    var Evaluator;
    (function (Evaluator) {
        var BaseEvaluator = (function () {
            function BaseEvaluator() {
            }
            BaseEvaluator.prototype.setEvaluators = function (evaluators) {
                this.evaluators = evaluators;
            };
            BaseEvaluator.prototype.matches = function (node) {
                return true;
            };
            BaseEvaluator.prototype.evaluate = function (sv, env, cont) {
                var _this = this;
                for (var i = 0; i < this.evaluators.length; i++) {
                    if (this.evaluators[i].matches(sv))
                        return new Sicp.Lang.SvThunk(function () { return _this.evaluators[i].evaluate(sv, env, cont); }).withSourceInfo(sv, sv);
                }
                throw 'cannot evaluate ' + sv.toString();
            };
            BaseEvaluator.prototype.evaluateList = function (exprs, env, cont) {
                var _this = this;
                var lastSv = Sicp.Lang.SvCons.Nil;
                var loop = function (exprs) {
                    if (Sicp.Lang.SvCons.isNil(exprs))
                        return cont(lastSv);
                    return _this.evaluate(Sicp.Lang.SvCons.car(exprs), env, function (sv) {
                        lastSv = sv;
                        var nextExprs = Sicp.Lang.SvCons.cdr(exprs);
                        return loop(nextExprs);
                    });
                };
                return loop(exprs);
            };
            BaseEvaluator.isTaggedList = function (node, tag) {
                if (!Sicp.Lang.SvCons.matches(node))
                    return false;
                var car = Sicp.Lang.SvCons.car(node);
                return Sicp.Lang.SvSymbol.matches(car) && Sicp.Lang.SvSymbol.val(car) === tag;
            };
            return BaseEvaluator;
        })();
        Evaluator.BaseEvaluator = BaseEvaluator;
    })(Evaluator = Sicp.Evaluator || (Sicp.Evaluator = {}));
})(Sicp || (Sicp = {}));
var Sicp;
(function (Sicp) {
    var Evaluator;
    (function (Evaluator) {
        var BeginEvaluator = (function () {
            function BeginEvaluator(evaluator) {
                this.evaluator = evaluator;
            }
            BeginEvaluator.prototype.matches = function (node) {
                return Evaluator.BaseEvaluator.isTaggedList(node, 'begin');
            };
            BeginEvaluator.prototype.evaluate = function (sv, env, cont) {
                return this.evaluator.evaluateList(this.getBeginActions(sv), env, cont);
            };
            BeginEvaluator.prototype.getBeginActions = function (expr) { return Sicp.Lang.SvCons.cdr(expr); };
            return BeginEvaluator;
        })();
        Evaluator.BeginEvaluator = BeginEvaluator;
    })(Evaluator = Sicp.Evaluator || (Sicp.Evaluator = {}));
})(Sicp || (Sicp = {}));
var Sicp;
(function (Sicp) {
    var Evaluator;
    (function (Evaluator) {
        var CallCCEvaluator = (function () {
            function CallCCEvaluator(evaluator) {
                this.evaluator = evaluator;
            }
            CallCCEvaluator.prototype.matches = function (sv) {
                return Evaluator.BaseEvaluator.isTaggedList(sv, 'call-with-current-continuation');
            };
            CallCCEvaluator.prototype.evaluate = function (sv, env, cont) {
                var _this = this;
                /* (call-with-current-continuation (lambda (hop) ...)) */
                return this.evaluator.evaluate(this.getLambda(sv), env, function (lambda) {
                    var args = Sicp.Lang.SvCons.listFromRvs(CallCCEvaluator.createCcProcedure(cont));
                    return Evaluator.ApplicationEvaluator.evalCall(lambda, args, cont, _this.evaluator);
                });
            };
            CallCCEvaluator.prototype.getLambda = function (sv) { return Sicp.Lang.SvCons.cadr(sv); };
            CallCCEvaluator.createCcProcedure = function (cont) {
                return new Sicp.Lang.SvCons(new Sicp.Lang.SvSymbol('captured-continuation'), new Sicp.Lang.SvAny(cont));
            };
            return CallCCEvaluator;
        })();
        Evaluator.CallCCEvaluator = CallCCEvaluator;
    })(Evaluator = Sicp.Evaluator || (Sicp.Evaluator = {}));
})(Sicp || (Sicp = {}));
var Sicp;
(function (Sicp) {
    var Evaluator;
    (function (Evaluator) {
        var CondEvaluator = (function () {
            function CondEvaluator(evaluator) {
                this.evaluator = evaluator;
            }
            CondEvaluator.prototype.matches = function (node) {
                return Evaluator.BaseEvaluator.isTaggedList(node, 'cond');
            };
            CondEvaluator.prototype.getCondClauses = function (cond) { return Sicp.Lang.SvCons.cdr(cond); };
            CondEvaluator.prototype.isCondElseClause = function (clause) { return Evaluator.BaseEvaluator.isTaggedList(clause, "else"); };
            CondEvaluator.prototype.getCondPredicate = function (clause) { return Sicp.Lang.SvCons.car(clause); };
            CondEvaluator.prototype.getCondActions = function (clause) { return Sicp.Lang.SvCons.cdr(clause); };
            CondEvaluator.prototype.evaluate = function (sv, env, cont) {
                var _this = this;
                var loop = function (clauses) {
                    if (Sicp.Lang.SvCons.isNil(clauses))
                        return cont(clauses);
                    var clause = Sicp.Lang.SvCons.car(clauses);
                    if (_this.isCondElseClause(clause))
                        return _this.evaluator.evaluateList(_this.getCondActions(clause), env, cont);
                    return _this.evaluator.evaluate(Sicp.Lang.SvCons.car(clause), env, function (svCond) {
                        if (Sicp.Lang.SvBool.isTrue(svCond))
                            return _this.evaluator.evaluateList(_this.getCondActions(clause), env, cont);
                        else {
                            var nextClauses = Sicp.Lang.SvCons.cdr(clauses);
                            return loop(nextClauses);
                        }
                    });
                };
                var clauses = this.getCondClauses(sv);
                return loop(clauses);
            };
            return CondEvaluator;
        })();
        Evaluator.CondEvaluator = CondEvaluator;
    })(Evaluator = Sicp.Evaluator || (Sicp.Evaluator = {}));
})(Sicp || (Sicp = {}));
var Sicp;
(function (Sicp) {
    var Evaluator;
    (function (Evaluator) {
        var DefineEvaluator = (function () {
            function DefineEvaluator(evaluator) {
                this.evaluator = evaluator;
            }
            DefineEvaluator.prototype.matches = function (node) {
                return Evaluator.BaseEvaluator.isTaggedList(node, 'define');
            };
            DefineEvaluator.prototype.evaluate = function (sv, env, cont) {
                var _this = this;
                if (Sicp.Lang.SvCons.matches(this.getHead(sv))) {
                    //implicit lambda definition
                    var lambda = Evaluator.LambdaEvaluator.createCompoundProcedure(this.getLambdaParameters(sv), this.getLambdaBody(sv), env);
                    env.define(Sicp.Lang.SvSymbol.val(this.getFunctionName(sv)), lambda);
                    return cont(lambda);
                }
                else {
                    return this.evaluator.evaluate(this.getValue(sv), env, function (svValue) {
                        env.define(Sicp.Lang.SvSymbol.val(_this.getVariable(sv)), svValue);
                        return cont(svValue);
                    });
                }
            };
            DefineEvaluator.prototype.getHead = function (sv) { return Sicp.Lang.SvCons.cadr(sv); };
            DefineEvaluator.prototype.getVariable = function (sv) { return this.getHead(sv); };
            DefineEvaluator.prototype.getValue = function (sv) { return Sicp.Lang.SvCons.caddr(sv); };
            DefineEvaluator.prototype.getFunctionName = function (sv) { return Sicp.Lang.SvCons.car(this.getHead(sv)); };
            DefineEvaluator.prototype.getLambdaParameters = function (sv) { return Sicp.Lang.SvCons.cdr(this.getHead(sv)); };
            DefineEvaluator.prototype.getLambdaBody = function (sv) { return Sicp.Lang.SvCons.cddr(sv); };
            return DefineEvaluator;
        })();
        Evaluator.DefineEvaluator = DefineEvaluator;
    })(Evaluator = Sicp.Evaluator || (Sicp.Evaluator = {}));
})(Sicp || (Sicp = {}));
var Sicp;
(function (Sicp) {
    var Evaluator;
    (function (Evaluator) {
        var IfEvaluator = (function () {
            function IfEvaluator(evaluator) {
                this.evaluator = evaluator;
            }
            IfEvaluator.prototype.matches = function (node) {
                return Evaluator.BaseEvaluator.isTaggedList(node, 'if');
            };
            IfEvaluator.prototype.evaluate = function (sv, env, cont) {
                var _this = this;
                return this.evaluator.evaluate(this.getIfPredicate(sv), env, function (svCond) {
                    return Sicp.Lang.SvBool.isTrue(svCond) ?
                        _this.evaluator.evaluate(_this.getIfConsequent(sv), env, cont) :
                        _this.evaluator.evaluate(_this.getIfAlternative(sv), env, cont);
                });
            };
            IfEvaluator.prototype.getIfPredicate = function (expr) { return Sicp.Lang.SvCons.cadr(expr); };
            IfEvaluator.prototype.getIfConsequent = function (expr) { return Sicp.Lang.SvCons.caddr(expr); };
            IfEvaluator.prototype.getIfAlternative = function (expr) { return !Sicp.Lang.SvCons.isNil(Sicp.Lang.SvCons.cdddr(expr)) ? Sicp.Lang.SvCons.cadddr(expr) : Sicp.Lang.SvCons.Nil; };
            return IfEvaluator;
        })();
        Evaluator.IfEvaluator = IfEvaluator;
    })(Evaluator = Sicp.Evaluator || (Sicp.Evaluator = {}));
})(Sicp || (Sicp = {}));
var Sicp;
(function (Sicp) {
    var Evaluator;
    (function (Evaluator) {
        var LambdaEvaluator = (function () {
            function LambdaEvaluator(evaluator) {
                this.evaluator = evaluator;
            }
            LambdaEvaluator.prototype.matches = function (node) {
                return Evaluator.BaseEvaluator.isTaggedList(node, 'lambda');
            };
            LambdaEvaluator.prototype.evaluate = function (sv, env, cont) {
                var proc = LambdaEvaluator.createCompoundProcedure(LambdaEvaluator.getLambdaParameters(sv), LambdaEvaluator.getLambdaBody(sv), env);
                return cont(proc);
            };
            LambdaEvaluator.createCompoundProcedure = function (params, body, env) {
                return Sicp.Lang.SvCons.listFromRvs(new Sicp.Lang.SvSymbol('procedure'), params, body, new Sicp.Lang.SvAny(env));
            };
            LambdaEvaluator.getLambdaParameters = function (expr) { return Sicp.Lang.SvCons.cadr(expr); };
            LambdaEvaluator.getLambdaBody = function (expr) { return Sicp.Lang.SvCons.cddr(expr); };
            return LambdaEvaluator;
        })();
        Evaluator.LambdaEvaluator = LambdaEvaluator;
    })(Evaluator = Sicp.Evaluator || (Sicp.Evaluator = {}));
})(Sicp || (Sicp = {}));
var Sicp;
(function (Sicp) {
    var Evaluator;
    (function (Evaluator) {
        var LetEvaluator = (function () {
            function LetEvaluator(evaluator) {
                this.evaluator = evaluator;
            }
            LetEvaluator.prototype.matches = function (node) {
                return LetEvaluator.isLet(node) || LetEvaluator.isLetStar(node) || LetEvaluator.isLetrec(node);
            };
            LetEvaluator.prototype.evaluate = function (sv, env, cont) {
                var _this = this;
                if (LetEvaluator.isLet(sv)) {
                    var loop = function (letEnv, defs) {
                        if (Sicp.Lang.SvCons.isNil(defs))
                            return _this.evaluator.evaluateList(LetEvaluator.getBody(sv), letEnv, cont);
                        var def = Sicp.Lang.SvCons.car(defs);
                        var svSymbol = Sicp.Lang.SvCons.car(def);
                        return _this.evaluator.evaluate(Sicp.Lang.SvCons.cadr(def), env, function (svValue) {
                            letEnv.define(Sicp.Lang.SvSymbol.val(svSymbol), svValue);
                            return loop(letEnv, Sicp.Lang.SvCons.cdr(defs));
                        });
                    };
                    return loop(new Sicp.Lang.Env(env), LetEvaluator.getDefs(sv));
                }
                else if (LetEvaluator.isLetStar(sv)) {
                    var loop = function (letEnv, defs) {
                        if (Sicp.Lang.SvCons.isNil(defs))
                            return _this.evaluator.evaluateList(LetEvaluator.getBody(sv), letEnv, cont);
                        var def = Sicp.Lang.SvCons.car(defs);
                        var svSymbol = Sicp.Lang.SvCons.car(def);
                        return _this.evaluator.evaluate(Sicp.Lang.SvCons.cadr(def), letEnv, function (svValue) {
                            letEnv = new Sicp.Lang.Env(letEnv);
                            letEnv.setOrDefine(Sicp.Lang.SvSymbol.val(svSymbol), svValue);
                            return loop(letEnv, Sicp.Lang.SvCons.cdr(defs));
                        });
                    };
                    return loop(env, LetEvaluator.getDefs(sv));
                }
                else if (LetEvaluator.isLetrec(sv)) {
                    var newEnv = new Sicp.Lang.Env(env);
                    var defsT = LetEvaluator.getDefs(sv);
                    while (!Sicp.Lang.SvCons.isNil(defsT)) {
                        var def = Sicp.Lang.SvCons.car(defsT);
                        newEnv.define(Sicp.Lang.SvSymbol.val(Sicp.Lang.SvCons.car(def)), Sicp.Lang.SvCons.Nil);
                        defsT = Sicp.Lang.SvCons.cdr(defsT);
                    }
                    var loop = function (letEnv, defs) {
                        if (Sicp.Lang.SvCons.isNil(defs))
                            return _this.evaluator.evaluateList(LetEvaluator.getBody(sv), letEnv, cont);
                        var def = Sicp.Lang.SvCons.car(defs);
                        var svSymbol = Sicp.Lang.SvCons.car(def);
                        return _this.evaluator.evaluate(Sicp.Lang.SvCons.cadr(def), letEnv, function (svValue) {
                            letEnv.set(Sicp.Lang.SvSymbol.val(svSymbol), svValue);
                            return loop(letEnv, Sicp.Lang.SvCons.cdr(defs));
                        });
                    };
                    return loop(newEnv, LetEvaluator.getDefs(sv));
                }
                else
                    throw 'uknown let kind';
            };
            LetEvaluator.isLet = function (node) { return Evaluator.BaseEvaluator.isTaggedList(node, 'let'); };
            LetEvaluator.isLetStar = function (node) { return Evaluator.BaseEvaluator.isTaggedList(node, 'let*'); };
            LetEvaluator.isLetrec = function (node) { return Evaluator.BaseEvaluator.isTaggedList(node, 'letrec'); };
            LetEvaluator.getDefs = function (sv) {
                return Sicp.Lang.SvCons.cadr(sv);
            };
            LetEvaluator.getBody = function (sv) { return Sicp.Lang.SvCons.cddr(sv); };
            return LetEvaluator;
        })();
        Evaluator.LetEvaluator = LetEvaluator;
    })(Evaluator = Sicp.Evaluator || (Sicp.Evaluator = {}));
})(Sicp || (Sicp = {}));
var Sicp;
(function (Sicp) {
    var Evaluator;
    (function (Evaluator) {
        var QuoteEvaluator = (function () {
            function QuoteEvaluator(evaluator) {
                this.evaluator = evaluator;
            }
            QuoteEvaluator.prototype.matches = function (node) {
                return Evaluator.BaseEvaluator.isTaggedList(node, 'quote');
            };
            QuoteEvaluator.prototype.evaluate = function (sv, env, cont) {
                var res = Sicp.Lang.SvCons.cdr(sv);
                return cont(res);
            };
            return QuoteEvaluator;
        })();
        Evaluator.QuoteEvaluator = QuoteEvaluator;
    })(Evaluator = Sicp.Evaluator || (Sicp.Evaluator = {}));
})(Sicp || (Sicp = {}));
var Sicp;
(function (Sicp) {
    var Evaluator;
    (function (Evaluator) {
        var SelfEvaluator = (function () {
            function SelfEvaluator() {
            }
            SelfEvaluator.prototype.matches = function (node) {
                return Sicp.Lang.SvString.matches(node) || Sicp.Lang.SvBool.matches(node) ||
                    Sicp.Lang.SvNumber.matches(node) || Sicp.Lang.SvCons.isNil(node);
            };
            SelfEvaluator.prototype.evaluate = function (sv, env, cont) {
                return cont(sv);
            };
            return SelfEvaluator;
        })();
        Evaluator.SelfEvaluator = SelfEvaluator;
    })(Evaluator = Sicp.Evaluator || (Sicp.Evaluator = {}));
})(Sicp || (Sicp = {}));
var Sicp;
(function (Sicp) {
    var Evaluator;
    (function (Evaluator) {
        var ThunkEvaluator = (function () {
            function ThunkEvaluator(evaluator) {
                this.evaluator = evaluator;
            }
            ThunkEvaluator.prototype.matches = function (sv) {
                return Sicp.Lang.SvThunk.matches(sv);
            };
            ThunkEvaluator.prototype.evaluate = function (sv, env, cont) {
                var thunkRes = Sicp.Lang.SvThunk.val(sv)();
                return cont(thunkRes);
            };
            return ThunkEvaluator;
        })();
        Evaluator.ThunkEvaluator = ThunkEvaluator;
    })(Evaluator = Sicp.Evaluator || (Sicp.Evaluator = {}));
})(Sicp || (Sicp = {}));
var Sicp;
(function (Sicp) {
    var Evaluator;
    (function (Evaluator) {
        var VariableEvaluator = (function () {
            function VariableEvaluator() {
            }
            VariableEvaluator.prototype.matches = function (node) {
                return Sicp.Lang.SvSymbol.matches(node);
            };
            VariableEvaluator.prototype.evaluate = function (sv, env, cont) {
                var res = env.get(Sicp.Lang.SvSymbol.val(sv));
                return cont(res);
            };
            return VariableEvaluator;
        })();
        Evaluator.VariableEvaluator = VariableEvaluator;
    })(Evaluator = Sicp.Evaluator || (Sicp.Evaluator = {}));
})(Sicp || (Sicp = {}));
var Sicp;
(function (Sicp) {
    var Lang;
    (function (Lang) {
        var Interpreter = (function () {
            function Interpreter() {
            }
            Interpreter.prototype.evaluateString = function (st, log) {
                var parser = new Lang.Parser();
                var exprs = parser.parse(st);
                var env = new Lang.Env(null);
                env.define('cons', new Lang.SvCons(new Lang.SvSymbol('primitive'), new Lang.SvAny(function (args) { return new Lang.SvCons(Lang.SvCons.car(args), Lang.SvCons.cadr(args)); })));
                env.define('null?', new Lang.SvCons(new Lang.SvSymbol('primitive'), new Lang.SvAny(function (args) { return new Lang.SvBool(Lang.SvCons.isNil(Lang.SvCons.car(args))); })));
                env.define('car', new Lang.SvCons(new Lang.SvSymbol('primitive'), new Lang.SvAny(function (args) { return Lang.SvCons.car(Lang.SvCons.car(args)); })));
                env.define('cdr', new Lang.SvCons(new Lang.SvSymbol('primitive'), new Lang.SvAny(function (args) { return Lang.SvCons.cdr(Lang.SvCons.car(args)); })));
                env.define('=', new Lang.SvCons(new Lang.SvSymbol('primitive'), new Lang.SvAny(function (args) { return new Lang.SvBool(Lang.SvNumber.val(Lang.SvCons.car(args)) === Lang.SvNumber.val(Lang.SvCons.cadr(args))); })));
                env.define('*', new Lang.SvCons(new Lang.SvSymbol('primitive'), new Lang.SvAny(function (args) { return new Lang.SvNumber(Lang.SvNumber.val(Lang.SvCons.car(args)) * Lang.SvNumber.val(Lang.SvCons.cadr(args))); })));
                env.define('-', new Lang.SvCons(new Lang.SvSymbol('primitive'), new Lang.SvAny(function (args) { return new Lang.SvNumber(Lang.SvNumber.val(Lang.SvCons.car(args)) - Lang.SvNumber.val(Lang.SvCons.cadr(args))); })));
                env.define('+', new Lang.SvCons(new Lang.SvSymbol('primitive'), new Lang.SvAny(function (args) { return new Lang.SvNumber(Lang.SvNumber.val(Lang.SvCons.car(args)) + Lang.SvNumber.val(Lang.SvCons.cadr(args))); })));
                env.define('/', new Lang.SvCons(new Lang.SvSymbol('primitive'), new Lang.SvAny(function (args) { return new Lang.SvNumber(Lang.SvNumber.val(Lang.SvCons.car(args)) / Lang.SvNumber.val(Lang.SvCons.cadr(args))); })));
                env.define('zero?', new Lang.SvCons(new Lang.SvSymbol('primitive'), new Lang.SvAny(function (args) { return new Lang.SvBool(Lang.SvNumber.val(Lang.SvCons.car(args)) === 0); })));
                env.define('display', new Lang.SvCons(new Lang.SvSymbol('primitive'), new Lang.SvAny(function (args) {
                    log(args.toString());
                    return Lang.SvCons.Nil;
                })));
                var evaluator = new Sicp.Evaluator.BaseEvaluator();
                evaluator.setEvaluators([
                    new Sicp.Evaluator.ThunkEvaluator(evaluator),
                    new Sicp.Evaluator.SelfEvaluator(),
                    new Sicp.Evaluator.VariableEvaluator(),
                    new Sicp.Evaluator.LetEvaluator(evaluator),
                    new Sicp.Evaluator.QuoteEvaluator(evaluator),
                    new Sicp.Evaluator.CondEvaluator(evaluator),
                    new Sicp.Evaluator.DefineEvaluator(evaluator),
                    new Sicp.Evaluator.AssignmentEvaluator(evaluator),
                    new Sicp.Evaluator.IfEvaluator(evaluator),
                    new Sicp.Evaluator.BeginEvaluator(evaluator),
                    new Sicp.Evaluator.LambdaEvaluator(evaluator),
                    new Sicp.Evaluator.CallCCEvaluator(evaluator),
                    new Sicp.Evaluator.ApplicationEvaluator(evaluator)
                ]);
                return evaluator.evaluateList(exprs, new Lang.Env(env), function (sv) {
                    log(sv.toString());
                    return sv;
                });
            };
            Interpreter.prototype.step = function (sv, stepCount) {
                while (Lang.SvThunk.matches(sv) && stepCount > 0) {
                    sv = Lang.SvThunk.val(sv)();
                    stepCount--;
                }
                return Lang.SvThunk.matches(sv) ? sv : null;
            };
            return Interpreter;
        })();
        Lang.Interpreter = Interpreter;
    })(Lang = Sicp.Lang || (Sicp.Lang = {}));
})(Sicp || (Sicp = {}));
var Sicp;
(function (Sicp) {
    var Lang;
    (function (Lang) {
        var Parser = (function () {
            function Parser() {
                this.regexSymbol = /^[^\s()',]+/;
                this.regexNumber = /^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?/;
                this.regexString = /^"([^\\\"]+|\\.)*"/;
                this.regexWhiteSpace = /^\s*/;
                this.regexBoolean = /^#t|^#f/;
                this.regexComment = /^;[^\$\r\n]*/;
                this.itoken = 0;
            }
            Parser.prototype.parse = function (st) {
                this.tokens = this.getTokens(st)
                    .filter(function (token) { return token.kind !== TokenKind.WhiteSpace && token.kind !== TokenKind.Comment; });
                var lastToken = this.tokens.length ? this.tokens[this.tokens.length - 1] : null;
                this.tokens.push(lastToken ?
                    new Token(TokenKind.EOF, "", lastToken.ilineEnd, lastToken.icolEnd + 1) :
                    new Token(TokenKind.EOF, "", 0, 0));
                this.itoken = 0;
                var rvs = [];
                while (!this.accept(TokenKind.EOF))
                    rvs.push(this.parseExpression());
                return Lang.SvCons.listFromRvArray(rvs);
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
                if (this.accept(TokenKind.Quote)) {
                    var svBody = this.parseExpression();
                    return new Lang.SvCons(new Lang.SvSymbol("quote"), svBody).withSourceInfo(token, svBody);
                }
                if (this.accept(TokenKind.Symbol))
                    return new Lang.SvSymbol(token.st).withSourceInfo(token, token);
                if (this.accept(TokenKind.BooleanLit))
                    return new Lang.SvBool(token.st === "#t").withSourceInfo(token, token);
                if (this.accept(TokenKind.NumberLit))
                    return new Lang.SvNumber(eval(token.st)).withSourceInfo(token, token);
                if (this.accept(TokenKind.StringLit))
                    return new Lang.SvString(eval(token.st)).withSourceInfo(token, token);
                if (this.accept(TokenKind.LParen)) {
                    var tokenStart = token;
                    var exprs = [];
                    while (!this.accept(TokenKind.RParen)) {
                        if (this.accept(TokenKind.EOF))
                            throw "unexpected end of input";
                        exprs.push(this.parseExpression());
                    }
                    var tokenEnd = this.tokens[this.itoken - 1];
                    return Lang.SvCons.listFromRvArray(exprs).withSourceInfo(tokenStart, tokenEnd);
                }
                throw "invalid token " + token;
            };
            Parser.prototype.getTokens = function (st) {
                var tokens = [];
                var iline = 0;
                var icol = 0;
                while (st.length > 0) {
                    var ch = st[0];
                    var token = void 0;
                    if (ch === "(")
                        token = new Token(TokenKind.LParen, ch, iline, icol);
                    else if (ch === ")")
                        token = new Token(TokenKind.RParen, ch, iline, icol);
                    else if (ch === "'")
                        token = new Token(TokenKind.Quote, ch, iline, icol);
                    else if (this.regexNumber.test(st))
                        token = new Token(TokenKind.NumberLit, this.regexNumber.exec(st)[0], iline, icol);
                    else if (this.regexString.test(st))
                        token = new Token(TokenKind.StringLit, this.regexString.exec(st)[0], iline, icol);
                    else if (this.regexBoolean.test(st))
                        token = new Token(TokenKind.BooleanLit, this.regexBoolean.exec(st)[0], iline, icol);
                    else if (this.regexComment.test(st))
                        token = new Token(TokenKind.Comment, this.regexComment.exec(st)[0], iline, icol);
                    else if (this.regexSymbol.test(st))
                        token = new Token(TokenKind.Symbol, this.regexSymbol.exec(st)[0], iline, icol);
                    else if (this.regexWhiteSpace.test(st))
                        token = new Token(TokenKind.WhiteSpace, this.regexWhiteSpace.exec(st)[0], iline, icol);
                    else
                        throw "invalid token at '" + st + "'";
                    tokens.push(token);
                    if (token.st.length === 0)
                        throw "invalid token";
                    st = st.substr(token.st.length);
                    iline = token.ilineEnd;
                    icol = token.icolEnd;
                }
                return tokens;
            };
            return Parser;
        })();
        Lang.Parser = Parser;
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
            TokenKind[TokenKind["Comment"] = 8] = "Comment";
            TokenKind[TokenKind["EOF"] = 9] = "EOF";
        })(TokenKind || (TokenKind = {}));
        var Token = (function () {
            function Token(kind, st, ilineStart, icolStart) {
                this.kind = kind;
                this.st = st;
                this.ilineStart = ilineStart;
                this.icolStart = icolStart;
                var lines = st.replace("\r", "").split('\n');
                this.ilineEnd = this.ilineStart + lines.length - 1;
                if (this.ilineStart === this.ilineEnd)
                    this.icolEnd = icolStart + lines[0].length;
                else
                    this.icolEnd = lines[lines.length - 1].length;
            }
            return Token;
        })();
    })(Lang = Sicp.Lang || (Sicp.Lang = {}));
})(Sicp || (Sicp = {}));
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Sicp;
(function (Sicp) {
    var Lang;
    (function (Lang) {
        var Sv = (function () {
            function Sv() {
            }
            Sv.prototype.withSourceInfo = function (first, last) {
                this.ilineStart = first.ilineStart;
                this.icolStart = first.icolStart;
                this.ilineEnd = last.ilineEnd;
                this.icolEnd = last.icolEnd;
                return this;
            };
            return Sv;
        })();
        Lang.Sv = Sv;
        var SvAtom = (function (_super) {
            __extends(SvAtom, _super);
            function SvAtom() {
                _super.apply(this, arguments);
            }
            SvAtom.matches = function (node) { return !SvCons.matches(node); };
            return SvAtom;
        })(Sv);
        Lang.SvAtom = SvAtom;
        var SvThunk = (function (_super) {
            __extends(SvThunk, _super);
            function SvThunk(_val) {
                _super.call(this);
                this._val = _val;
            }
            SvThunk.matches = function (node) { return node instanceof SvThunk; };
            SvThunk.val = function (node) {
                if (!SvThunk.matches(node))
                    throw "Thunk expected";
                return node._val;
            };
            SvThunk.prototype.toString = function () {
                return "T(" + this._val.toString() + ")";
            };
            return SvThunk;
        })(Sv);
        Lang.SvThunk = SvThunk;
        var SvCons = (function (_super) {
            __extends(SvCons, _super);
            function SvCons(_car, _cdr) {
                _super.call(this);
                this._car = _car;
                this._cdr = _cdr;
            }
            SvCons.listFromRvs = function () {
                var rvs = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    rvs[_i - 0] = arguments[_i];
                }
                return SvCons.listFromRvArray(rvs);
            };
            SvCons.listFromRvArray = function (rvs) {
                var res = SvCons.Nil;
                for (var j = rvs.length - 1; j >= 0; j--)
                    res = new SvCons(rvs[j], res);
                return res;
            };
            SvCons.matches = function (node) { return node instanceof SvCons; };
            SvCons.isNil = function (node) {
                return node === SvCons.Nil || (SvCons.matches(node) && SvCons.car(node) === null && SvCons.cdr(node) === null);
            };
            SvCons.car = function (node) {
                if (!SvCons.matches(node))
                    throw "Cons expected";
                return node._car;
            };
            SvCons.cdr = function (node) {
                if (!SvCons.matches(node))
                    throw "Cons expected";
                return node._cdr;
            };
            SvCons.setCar = function (cons, newCar) {
                if (!SvCons.matches(cons))
                    throw "Cons expected";
                cons._car = newCar;
                return cons;
            };
            SvCons.setCdr = function (cons, newCdr) {
                if (!SvCons.matches(cons))
                    throw "Cons expected";
                cons._cdr = newCdr;
                return cons;
            };
            SvCons.cadr = function (node) {
                return this.car(this.cdr(node));
            };
            SvCons.cddr = function (node) {
                return this.cdr(this.cdr(node));
            };
            SvCons.caddr = function (node) {
                return this.car(this.cddr(node));
            };
            SvCons.cdddr = function (node) {
                return this.cdr(this.cddr(node));
            };
            SvCons.cadddr = function (node) {
                return this.car(this.cdddr(node));
            };
            SvCons.prototype.toString = function () {
                var st = '(';
                var first = true;
                var rv = this;
                while (!SvCons.isNil(rv)) {
                    if (!first)
                        st += " ";
                    first = false;
                    if (SvCons.matches(rv)) {
                        st += SvCons.car(rv).toString();
                        rv = SvCons.cdr(rv);
                        if (SvAtom.matches(rv)) {
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
            SvCons.Nil = new SvCons(null, null);
            return SvCons;
        })(Sv);
        Lang.SvCons = SvCons;
        var SvAny = (function (_super) {
            __extends(SvAny, _super);
            function SvAny(_val) {
                _super.call(this);
                this._val = _val;
            }
            SvAny.matches = function (node) { return node instanceof SvAny; };
            SvAny.val = function (node) {
                if (!SvAny.matches(node))
                    throw "SvAny expected";
                return node._val;
            };
            SvAny.prototype.toString = function () {
                return this._val.toString();
            };
            return SvAny;
        })(Sv);
        Lang.SvAny = SvAny;
        var SvBool = (function (_super) {
            __extends(SvBool, _super);
            function SvBool(_val) {
                _super.call(this);
                this._val = _val;
            }
            SvBool.matches = function (node) { return node instanceof SvBool; };
            SvBool.isTrue = function (node) {
                return SvBool.matches(node) && SvBool.val(node);
            };
            SvBool.isFalse = function (node) {
                return SvBool.matches(node) && !SvBool.val(node);
            };
            SvBool.val = function (node) {
                if (!SvBool.matches(node))
                    throw "bool expected";
                return node._val;
            };
            SvBool.prototype.toString = function () {
                return this._val ? "#t" : "#f";
            };
            return SvBool;
        })(Sv);
        Lang.SvBool = SvBool;
        var SvString = (function (_super) {
            __extends(SvString, _super);
            function SvString(_val) {
                _super.call(this);
                this._val = _val;
            }
            SvString.matches = function (node) { return node instanceof SvString; };
            SvString.val = function (node) {
                if (!SvString.matches(node))
                    throw "string expected";
                return node._val;
            };
            SvString.prototype.toString = function () {
                return JSON.stringify(this._val);
            };
            return SvString;
        })(Sv);
        Lang.SvString = SvString;
        var SvNumber = (function (_super) {
            __extends(SvNumber, _super);
            function SvNumber(_val) {
                _super.call(this);
                this._val = _val;
            }
            SvNumber.matches = function (node) { return node instanceof SvNumber; };
            SvNumber.val = function (node) {
                if (!SvNumber.matches(node))
                    throw "Number expected";
                return node._val;
            };
            SvNumber.prototype.toString = function () {
                return "" + this._val;
            };
            return SvNumber;
        })(Sv);
        Lang.SvNumber = SvNumber;
        var SvSymbol = (function (_super) {
            __extends(SvSymbol, _super);
            function SvSymbol(_val) {
                _super.call(this);
                this._val = _val;
            }
            SvSymbol.matches = function (node) { return node instanceof SvSymbol; };
            SvSymbol.val = function (node) {
                if (!SvSymbol.matches(node))
                    throw "Symbol expected";
                return node._val;
            };
            SvSymbol.prototype.toString = function () {
                return this._val;
            };
            return SvSymbol;
        })(Sv);
        Lang.SvSymbol = SvSymbol;
    })(Lang = Sicp.Lang || (Sicp.Lang = {}));
})(Sicp || (Sicp = {}));
