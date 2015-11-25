var SicpEditor = (function () {
    function SicpEditor(editorId, outputId) {
        var _this = this;
        this.editorId = editorId;
        this.outputId = outputId;
        require(['ace/ace'], function (ace) {
            _this.editor = ace.edit("editor");
            _this.editor.setTheme('ace/theme/github');
            _this.editor.getSession().setMode('ace/mode/sicp');
            _this.editor.commands.addCommand({
                name: 'Evaluate',
                bindKey: { win: 'Ctrl-E', mac: 'Command-E' },
                exec: function (editor) {
                    try {
                        _this.setOutput(new Scheme.Evaluator().evaluateString(editor.getValue()));
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
///<reference path="./sicpEditor.ts"/>
new SicpEditor("editor", "output");
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
