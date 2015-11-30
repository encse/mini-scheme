var Editor;
(function (Editor) {
    var SicpEditor = (function () {
        function SicpEditor(editorId, outputId) {
            var _this = this;
            this.editorId = editorId;
            this.outputId = outputId;
            require(['ace/ace'], function (ace) {
                _this.editor = ace.edit("editor");
                _this.editor.setTheme('ace/theme/clouds_midnight');
                _this.editor.getSession().setMode('ace/mode/sicp');
                _this.editor.commands.addCommand({
                    name: 'Evaluate',
                    bindKey: { win: 'Ctrl-E', mac: 'Command-E' },
                    exec: function (editor) {
                        try {
                            _this.setOutput(new Sicp.Lang.Interpreter().evaluateString(editor.getValue()));
                        }
                        catch (ex) {
                            _this.setOutput(ex);
                        }
                    }
                });
                _this.outputElement = document.getElementById(outputId);
            });
        }
        SicpEditor.prototype.setOutput = function (st) {
            this.outputElement.innerText = st;
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
                    return Lang.SvCons.Nil;
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
            ApplicationEvaluator.prototype.evaluate = function (sv, env, cont) {
                var _this = this;
                return this.evaluator.evaluate(this.getOperator(sv), env, function (operator) {
                    if (!_this.isPrimitiveProcedure(operator) && !_this.isCompoundProcedure(operator) && !_this.isContinuation(operator))
                        throw 'undefined procedure' + operator.toString();
                    return _this.evaluateArgs(_this.getArguments(sv), env, function (args) {
                        if (_this.isPrimitiveProcedure(operator)) {
                            return [_this.getPrimitiveProcedureDelegate(operator)(args), cont];
                        }
                        else if (_this.isContinuation(operator)) {
                            var arg = Sicp.Lang.SvCons.Nil;
                            if (!Sicp.Lang.SvCons.isNil(args)) {
                                if (!Sicp.Lang.SvCons.isNil(Sicp.Lang.SvCons.cdr(args)))
                                    throw 'too many argument';
                                arg = Sicp.Lang.SvCons.car(args);
                            }
                            return [arg, _this.getContinuationFromCapturedContinuation(operator)];
                        }
                        else {
                            var newEnv = new Sicp.Lang.Env(_this.getProcedureEnv(operator));
                            var params = _this.getProcedureParameters(operator);
                            while (!Sicp.Lang.SvCons.isNil(args) || !Sicp.Lang.SvCons.isNil(params)) {
                                if (Sicp.Lang.SvCons.isNil(args))
                                    throw 'not enough argument';
                                if (Sicp.Lang.SvCons.isNil(params))
                                    throw 'too many argument';
                                var parameter = Sicp.Lang.SvSymbol.val(Sicp.Lang.SvCons.car(params));
                                var arg_1 = Sicp.Lang.SvCons.car(args);
                                newEnv.define(parameter, arg_1);
                                params = Sicp.Lang.SvCons.cdr(params);
                                args = Sicp.Lang.SvCons.cdr(args);
                            }
                            return _this.evaluator.evaluateList(_this.getProcedureBody(operator), newEnv, cont);
                        }
                    });
                });
            };
            ApplicationEvaluator.prototype.isCompoundProcedure = function (expr) { return this.evaluator.isTaggedList(expr, 'procedure'); };
            ApplicationEvaluator.prototype.isPrimitiveProcedure = function (expr) { return this.evaluator.isTaggedList(expr, 'primitive'); };
            ApplicationEvaluator.prototype.isContinuation = function (expr) { return this.evaluator.isTaggedList(expr, 'captured-continuation'); };
            ApplicationEvaluator.prototype.getContinuationFromCapturedContinuation = function (expr) { return Sicp.Lang.SvAny.val(Sicp.Lang.SvCons.cadr(expr)); };
            ApplicationEvaluator.prototype.getProcedureParameters = function (expr) { return Sicp.Lang.SvCons.cadr(expr); };
            ApplicationEvaluator.prototype.getProcedureBody = function (expr) { return Sicp.Lang.SvCons.caddr(expr); };
            ApplicationEvaluator.prototype.getProcedureEnv = function (expr) { return Sicp.Lang.SvAny.val(Sicp.Lang.SvCons.cadddr(expr)); };
            ApplicationEvaluator.prototype.getPrimitiveProcedureDelegate = function (expr) { return Sicp.Lang.SvAny.val(Sicp.Lang.SvCons.cdr(expr)); };
            ApplicationEvaluator.prototype.getOperator = function (expr) { return Sicp.Lang.SvCons.car(expr); };
            ApplicationEvaluator.prototype.getArguments = function (expr) { return Sicp.Lang.SvCons.cdr(expr); };
            ApplicationEvaluator.prototype.evaluateArgs = function (args, env, cont) {
                var _this = this;
                var evaluatedArgs = [];
                var loop = function (args) {
                    if (Sicp.Lang.SvCons.isNil(args))
                        return [Sicp.Lang.SvCons.listFromRvArray(evaluatedArgs), cont];
                    return _this.evaluator.evaluate(Sicp.Lang.SvCons.car(args), env, function (evaluatedArg) {
                        evaluatedArgs.push(evaluatedArg);
                        return [Sicp.Lang.SvCons.cdr(args), loop];
                    });
                };
                return [args, loop];
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
                return this.evaluator.isTaggedList(sv, 'set!');
            };
            AssignmentEvaluator.prototype.evaluate = function (sv, env, cont) {
                var _this = this;
                return this.evaluator.evaluate(this.getValue(sv), env, function (svValue) {
                    env.set(Sicp.Lang.SvSymbol.val(_this.getVariable(sv)), svValue);
                    return [svValue, cont];
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
                for (var i = 0; i < this.evaluators.length; i++) {
                    if (this.evaluators[i].matches(sv))
                        return this.evaluators[i].evaluate(sv, env, cont);
                }
                throw 'cannot evaluate ' + sv.toString();
            };
            BaseEvaluator.prototype.evaluateList = function (exprs, env, cont) {
                var _this = this;
                var lastSv = Sicp.Lang.SvCons.Nil;
                var loop = function (exprs) {
                    if (Sicp.Lang.SvCons.isNil(exprs))
                        return [lastSv, cont];
                    return _this.evaluate(Sicp.Lang.SvCons.car(exprs), env, function (sv) {
                        lastSv = sv;
                        return [Sicp.Lang.SvCons.cdr(exprs), loop];
                    });
                };
                return [exprs, loop];
            };
            BaseEvaluator.prototype.isTaggedList = function (node, tag) {
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
                return this.evaluator.isTaggedList(node, 'begin');
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
                return this.evaluator.isTaggedList(sv, 'call-with-current-continuation');
            };
            CallCCEvaluator.prototype.evaluate = function (sv, env, cont) {
                var _this = this;
                /* (call-with-current-continuation (lambda (hop) ...)) */
                return this.evaluator.evaluate(this.getLambda(sv), env, function (lambda) {
                    var newEnv = new Sicp.Lang.Env(env);
                    var params = Evaluator.LambdaEvaluator.getLambdaParameters(lambda);
                    if (!Sicp.Lang.SvCons.isNil(Sicp.Lang.SvCons.cdr(params)))
                        throw 'not enough argument';
                    newEnv.define(Sicp.Lang.SvSymbol.val(Sicp.Lang.SvCons.car(params)), Sicp.Lang.SvCons.listFromRvs(new Sicp.Lang.SvSymbol('captured-continuation'), new Sicp.Lang.SvAny(cont)));
                    //TODO: itt ne kelljen mar car
                    return _this.evaluator.evaluateList(Sicp.Lang.SvCons.car(Evaluator.LambdaEvaluator.getLambdaBody(lambda)), newEnv, cont);
                });
            };
            CallCCEvaluator.prototype.getLambda = function (sv) { return Sicp.Lang.SvCons.cadr(sv); };
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
                return this.evaluator.isTaggedList(node, 'cond');
            };
            CondEvaluator.prototype.getCondClauses = function (cond) { return Sicp.Lang.SvCons.cdr(cond); };
            CondEvaluator.prototype.isCondElseClause = function (clause) { return this.evaluator.isTaggedList(clause, "else"); };
            CondEvaluator.prototype.getCondPredicate = function (clause) { return Sicp.Lang.SvCons.car(clause); };
            CondEvaluator.prototype.getCondActions = function (clause) { return Sicp.Lang.SvCons.cdr(clause); };
            CondEvaluator.prototype.evaluate = function (sv, env, cont) {
                var _this = this;
                var loop = function (clauses) {
                    if (Sicp.Lang.SvCons.isNil(clauses))
                        return [clauses, cont];
                    var clause = Sicp.Lang.SvCons.car(clauses);
                    if (_this.isCondElseClause(clause))
                        return _this.evaluator.evaluateList(_this.getCondActions(clause), env, cont);
                    return _this.evaluator.evaluate(Sicp.Lang.SvCons.car(clause), env, function (svCond) {
                        if (Sicp.Lang.SvBool.isTrue(svCond))
                            return _this.evaluator.evaluateList(_this.getCondActions(clause), env, cont);
                        else
                            return [Sicp.Lang.SvCons.cdr(clauses), loop];
                    });
                };
                return [this.getCondClauses(sv), loop];
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
        var DefinitionEvaluator = (function () {
            function DefinitionEvaluator(evaluator) {
                this.evaluator = evaluator;
            }
            DefinitionEvaluator.prototype.matches = function (node) {
                return this.evaluator.isTaggedList(node, 'define');
            };
            DefinitionEvaluator.prototype.evaluate = function (sv, env, cont) {
                var _this = this;
                return this.evaluator.evaluate(this.getValue(sv), env, function (svValue) {
                    env.define(Sicp.Lang.SvSymbol.val(_this.getVariable(sv)), svValue);
                    return [svValue, cont];
                });
            };
            DefinitionEvaluator.prototype.getVariable = function (sv) { return Sicp.Lang.SvCons.cadr(sv); };
            DefinitionEvaluator.prototype.getValue = function (sv) { return Sicp.Lang.SvCons.caddr(sv); };
            return DefinitionEvaluator;
        })();
        Evaluator.DefinitionEvaluator = DefinitionEvaluator;
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
                return this.evaluator.isTaggedList(node, 'if');
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
                return this.evaluator.isTaggedList(node, 'lambda');
            };
            LambdaEvaluator.prototype.evaluate = function (sv, env, cont) {
                return [Sicp.Lang.SvCons.listFromRvs(new Sicp.Lang.SvSymbol('procedure'), LambdaEvaluator.getLambdaParameters(sv), LambdaEvaluator.getLambdaBody(sv), new Sicp.Lang.SvAny(env)),
                    cont];
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
        var QuoteEvaluator = (function () {
            function QuoteEvaluator(evaluator) {
                this.evaluator = evaluator;
            }
            QuoteEvaluator.prototype.matches = function (node) {
                return this.evaluator.isTaggedList(node, 'quote');
            };
            QuoteEvaluator.prototype.evaluate = function (sv, env, cont) {
                return [Sicp.Lang.SvCons.cdr(sv), cont];
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
                return [sv, cont];
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
        var VariableEvaluator = (function () {
            function VariableEvaluator() {
            }
            VariableEvaluator.prototype.matches = function (node) {
                return Sicp.Lang.SvSymbol.matches(node);
            };
            VariableEvaluator.prototype.evaluate = function (sv, env, cont) {
                return [env.get(Sicp.Lang.SvSymbol.val(sv)), cont];
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
            Interpreter.prototype.evaluateString = function (st) {
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
                var evaluator = new Sicp.Evaluator.BaseEvaluator();
                evaluator.setEvaluators([
                    new Sicp.Evaluator.SelfEvaluator(),
                    new Sicp.Evaluator.VariableEvaluator(),
                    new Sicp.Evaluator.QuoteEvaluator(evaluator),
                    new Sicp.Evaluator.CondEvaluator(evaluator),
                    new Sicp.Evaluator.DefinitionEvaluator(evaluator),
                    new Sicp.Evaluator.AssignmentEvaluator(evaluator),
                    new Sicp.Evaluator.IfEvaluator(evaluator),
                    new Sicp.Evaluator.BeginEvaluator(evaluator),
                    new Sicp.Evaluator.LambdaEvaluator(evaluator),
                    new Sicp.Evaluator.CallCCEvaluator(evaluator),
                    new Sicp.Evaluator.ApplicationEvaluator(evaluator)
                ]);
                var done = false;
                var res;
                var svcont = evaluator.evaluateList(exprs, new Lang.Env(env), function (sv) {
                    res = sv;
                    done = true;
                    return null;
                });
                while (!done)
                    svcont = svcont[1](svcont[0]);
                return res.toString();
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
                this.itoken = 0;
            }
            Parser.prototype.parse = function (st) {
                this.tokens = this.getTokens(st).filter(function (token) { return token.kind !== TokenKind.WhiteSpace; });
                this.tokens.push(new Token(TokenKind.EOF, null));
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
                if (this.accept(TokenKind.Quote))
                    return new Lang.SvCons(new Lang.SvSymbol("quote"), this.parseExpression());
                if (this.accept(TokenKind.Symbol))
                    return new Lang.SvSymbol(token.st);
                if (this.accept(TokenKind.BooleanLit))
                    return new Lang.SvBool(token.st === "#t");
                if (this.accept(TokenKind.NumberLit))
                    return new Lang.SvNumber(eval(token.st));
                if (this.accept(TokenKind.StringLit))
                    return new Lang.SvString(eval(token.st));
                if (this.accept(TokenKind.LParen)) {
                    var exprs = [];
                    while (!this.accept(TokenKind.RParen)) {
                        if (this.accept(TokenKind.EOF))
                            throw "unexpected end of input";
                        exprs.push(this.parseExpression());
                    }
                    return Lang.SvCons.listFromRvArray(exprs);
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
