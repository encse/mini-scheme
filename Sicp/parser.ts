 module Scheme {
    class Rv {
       
    }

    class RvAtom extends Rv {
        public static matches(node: Rv) { return !RvCons.matches(node); }
    }

    class RvCons extends Rv {
        public constructor(private _car: Rv, private _cdr: Rv) { super(); }
        public static Nil = new RvCons(null, null);

        public static listFromRvs(...rvs: Rv[]): Rv {
            return RvCons.listFromRvArray(rvs);
        }

        public static listFromRvArray(rvs: Rv[]) {
            let res = RvCons.Nil;
            for (let j = rvs.length - 1; j >= 0; j--)
                res = new RvCons(rvs[j], res);
            return res;
        }

        public static matches(node: Rv) { return node instanceof RvCons;}

        public static isNil(node: Rv) {
            return node === RvCons.Nil || (RvCons.matches(node) && RvCons.car(node) === null && RvCons.cdr(node) === null);
        }

        public static car(node: Rv) {
            if (!RvCons.matches(node)) throw "Cons expected";
            return (<RvCons>node)._car;
        }

        public static cdr(node: Rv) {
            if (!RvCons.matches(node)) throw "Cons expected";
            return (<RvCons>node)._cdr;
        }

        public static cadr(node: Rv) {
            return this.car(this.cdr(node));
        }

        public static cddr(node: Rv) {
            return this.cdr(this.cdr(node));
        }

        public static caddr(node: Rv) {
            return this.car(this.cddr(node));
        }

        public static cdddr(node: Rv) {
            return this.cdr(this.cddr(node));
        }

        public static cadddr(node: Rv) {
            return this.car(this.cdddr(node));
        }

        public toString(): string {
            let st = '(';
            let first = true;

            var rv:Rv = this;
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
                } else {
                    st += rv.toString();
                    break;
                }
            }
            st += ')';
            return st;
        }
    }

    class RvAny extends Rv {
        public constructor(public _val: any) { super(); }
        public static matches(node: Rv) { return node instanceof RvAny; }
        public static val(node: Rv) {
            if (!RvAny.matches(node)) throw "RvAny expected";
            return (<RvAny>node)._val;
        }

        public toString(): string {
            return this._val.toString();
        }
    }

    class RvBool extends Rv {
        public constructor(public _val: boolean) { super(); }

        public static matches(node: Rv) { return node instanceof RvBool; }

        public static isTrue(node: Rv) {
            return RvBool.matches(node) && RvBool.val(node);
        }

        public static isFalse(node: Rv) {
            return RvBool.matches(node) && !RvBool.val(node);
        }

        public static val(node: Rv) {
            if (!RvBool.matches(node)) throw "bool expected";
            return (<RvBool>node)._val;
        }

        public toString(): string {
            return this._val ? "#t" :"#f";
        }
    }

    class RvString extends Rv {
        public constructor(public _val: string) { super(); }
        public static matches(node: Rv) { return node instanceof RvString; }
        public static val(node: Rv) {
            if (!RvString.matches(node)) throw "string expected";
            return (<RvString>node)._val;
        }

        public toString(): string {
            return JSON.stringify(this._val);
        }
    }

    class RvNumber extends Rv {
        public constructor(public _val: number) { super(); }
        public static matches(node: Rv) { return node instanceof RvNumber; }
        public static val(node: Rv) {
            if (!RvNumber.matches(node)) throw "Number expected";
            return (<RvNumber>node)._val;
        }

        public toString(): string {
            return "" + this._val;
        }
    }

    class RvSymbol extends Rv {
        public constructor(public _val: string) { super(); }
        public static matches(node: Rv) { return node instanceof RvSymbol; }
        public static val(node: Rv) {
            if (!RvSymbol.matches(node)) throw "Symbol expected";
            return (<RvSymbol>node)._val;
        }

        public toString(): string {
            return this._val;
        }
    }

    export class Evaluator {
        evaluators:Evaluator[];

        public evaluateString(st: string) {
            let parser = new Parser();
            let exprs = parser.parse(st);
            let env = new Env(null);
            env.define('cons', new RvCons (new RvSymbol('primitive'), new RvAny((args: any) => new RvCons(RvCons.car(args), RvCons.cadr(args)))));
            env.define('null?', new RvCons(new RvSymbol('primitive'), new RvAny((args: any) => RvCons.isNil(RvCons.car(args)))));
            env.define('car', new RvCons  (new RvSymbol('primitive'), new RvAny((args: any) => RvCons.car(RvCons.car(args)))));
            env.define('cdr', new RvCons  (new RvSymbol('primitive'), new RvAny((args: any) => RvCons.cdr(RvCons.car(args)))));
            env.define('=', new RvCons(new RvSymbol('primitive'), new RvAny((args: any) => new RvBool(RvNumber.val(RvCons.car(args)) === RvNumber.val(RvCons.cadr(args))) )));
            env.define('*', new RvCons(new RvSymbol('primitive'), new RvAny((args: any) =>   new RvNumber(RvNumber.val(RvCons.car(args)) * RvNumber.val(RvCons.cadr(args))) )));
            env.define('-', new RvCons(new RvSymbol('primitive'), new RvAny((args: any) => new RvNumber(RvNumber.val(RvCons.car(args)) - RvNumber.val(RvCons.cadr(args))))));
            env.define('+', new RvCons(new RvSymbol('primitive'), new RvAny((args: any) => new RvNumber(RvNumber.val(RvCons.car(args)) - RvNumber.val(RvCons.cadr(args))))));
            env.define('/', new RvCons(new RvSymbol('primitive'), new RvAny((args: any) => new RvNumber(RvNumber.val(RvCons.car(args)) / RvNumber.val(RvCons.cadr(args))))));

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
        }

        public matches(node: Rv): boolean {
            return true;
        }

        public evaluate(rv: Rv, env: Env): Rv {

            for (let i = 0; i < this.evaluators.length; i++) {
                if (this.evaluators[i].matches(rv))
                    return this.evaluators[i].evaluate(rv, env);
            }
            throw 'cannot evaluate ' + rv.toString();
        }

        public evaluateList(exprs: Rv, env: Env): Rv {
            let res:Rv = RvCons.Nil;

            while (!RvCons.isNil(exprs)) {
                res = this.evaluate(RvCons.car(exprs), env);
                exprs = RvCons.cdr(exprs);
            }
            return res;
        }

        public isTaggedList(node: Rv, tag: string) {
            if (!RvCons.matches(node)) return false;
            const car = RvCons.car(node);
            return RvSymbol.matches(car) && RvSymbol.val(car) === tag;
        }
    }

    class SelfEvaluator extends Evaluator {
        public matches(node: Rv): boolean {
            return RvString.matches(node) || RvBool.matches(node) || RvNumber.matches(node) || RvCons.isNil(node);
        }

        public evaluate(node: Rv, env: Env): Rv {
            return node;
        }
    }

    class VariableEvaluator extends Evaluator {
        public matches(node: Rv): boolean {
            return RvSymbol.matches(node);
        }

        public evaluate(node: Rv, env: Env): Rv {
            return env.get(RvSymbol.val(node));
        }
    }

    class QuoteEvaluator extends Evaluator {
        public matches(node: Rv): boolean {
            return this.isTaggedList(node, 'quote');
        }

        public evaluate(node: Rv, env: Env): Rv {
            return RvCons.cdr(node);
        }
    }

    class CondEvaluator extends Evaluator {
        constructor(private evaluator: Evaluator) { super(); }

        public matches(node: Rv): boolean {
            return this.isTaggedList(node, 'cond'); 
        }

        private getCondClauses(cond:Rv) { return RvCons.cdr(cond); }
        private isCondElseClause(clause:Rv) { return this.isTaggedList(clause, "else"); }
        private getCondPredicate(clause:Rv) { return RvCons.car(clause); }
        private getCondActions(clause:Rv) { return RvCons.cdr(clause); }

        public evaluate(node: Rv, env: Env):Rv {
            let clauses = this.getCondClauses(node);
            while (!RvCons.isNil(clauses)) {
                let clause = RvCons.car(clauses);
                if (this.isCondElseClause(clause) || RvBool.isTrue(this.evaluator.evaluate(RvCons.car(clause), env)))
                    return this.evaluator.evaluateList(this.getCondActions(clause), env);
                clauses = RvCons.cdr(clauses);
            }
            return RvCons.Nil;
        }
    }

    class DefinitionEvaluator extends Evaluator {
        constructor(private evaluator: Evaluator) { super(); }

        public matches(node: Rv): boolean {
            return this.isTaggedList(node, 'define');
        }

        public evaluate(node: Rv, env: Env): Rv {
            env.define(
                RvSymbol.val(this.getVariable(node)),
                this.evaluator.evaluate(this.getValue(node), env));
            return RvCons.Nil;
        }

        getVariable(node: Rv): Rv { return RvCons.cadr(node); }
        getValue(node: Rv): Rv { return RvCons.caddr(node); }
    }

    class AssignmentEvaluator extends Evaluator {
        constructor(private evaluator: Evaluator) { super(); }

        public matches(node: Rv): boolean {
            return this.isTaggedList(node, 'set!');
        }

        public evaluate(node: Rv, env: Env): Rv {
            env.set(
                RvSymbol.val(this.getVariable(node)),
                this.evaluator.evaluate(this.getValue(node), env));
            return RvCons.Nil;
        }

        getVariable(node: Rv): Rv { return RvCons.cadr(node); }
        getValue(node: Rv): Rv { return RvCons.caddr(node); }
    }

    class IfEvaluator extends Evaluator {
        constructor(private evaluator: Evaluator) { super(); }

        public matches(node: Rv): boolean {
            return this.isTaggedList(node, 'if');
        }

        public evaluate(node: Rv, env: Env): Rv {
            return RvBool.isTrue(this.evaluator.evaluate(this.getIfPredicate(node), env)) ?
                this.evaluator.evaluate(this.getIfConsequent(node), env) :
                this.evaluator.evaluate(this.getIfAlternative(node), env);
        }

        getIfPredicate(expr: any) { return RvCons.cadr(expr); }
        getIfConsequent(expr: any) { return RvCons.caddr(expr); }
        getIfAlternative(expr: any) { return !RvCons.isNil(RvCons.cdddr(expr)) ? RvCons.cadddr(expr) : RvCons.Nil; }

    }

    class BeginEvaluator extends Evaluator {
        constructor(private evaluator: Evaluator) { super(); }

        public matches(node: Rv): boolean {
            return this.isTaggedList(node, 'begin');
        }

        public evaluate(node: Rv, env: Env): Rv {
            return this.evaluator.evaluateList(this.getBeginActions(node), env);
        }

        getBeginActions(expr:Rv) { return RvCons.cdr(expr); }
    }

    class LambdaEvaluator extends Evaluator {
        constructor(private evaluator: Evaluator) { super(); }

        public matches(node: Rv): boolean {
            return this.isTaggedList(node, 'lambda');
        }

        public evaluate(node: Rv, env: Env): Rv {
            return RvCons.listFromRvs(new RvSymbol('procedure'), this.getLambdaParameters(node), this.getLambdaBody(node), new RvAny(env));
        }

        getLambdaParameters(expr: Rv) { return RvCons.cadr(expr); }
        getLambdaBody(expr: Rv) { return RvCons.cddr(expr); }

    }

    class ApplicationEvaluator extends Evaluator {
        constructor(private evaluator: Evaluator) { super(); }

        public matches(node: Rv): boolean {
            return RvCons.matches(node);
        }

        public evaluate(node: Rv, env: Env): Rv {
            let operator = this.evaluator.evaluate(this.getOperator(node), env);
            if (!this.isPrimitiveProcedure(operator) && !this.isCompoundProcedure(operator))
                throw 'undefined procedure' + operator.toString();

            var args = this.evaluateArgs(this.getArguments(node), env);
            if (this.isPrimitiveProcedure(operator)) {
                return this.getPrimitiveProcedureDelegate(operator)(args);
            } else {
                let newEnv = new Env(this.getProcedureEnv(operator));
                let params = this.getProcedureParameters(operator);

                while (!RvCons.isNil(args) || !RvCons.isNil(params)) {
                    if (RvCons.isNil(args))
                        throw 'not enough argument';
                    if (RvCons.isNil(params))
                        throw 'too many argument';

                    const parameter = RvSymbol.val(RvCons.car(params));
                    const arg = RvCons.car(args);
                    newEnv.define(parameter, arg);

                    params = RvCons.cdr(params);
                    args = RvCons.cdr(args);
                }

                return this.evaluator.evaluateList(this.getProcedureBody(operator), newEnv);
            }
        }

        isCompoundProcedure(expr: Rv) { return this.isTaggedList(expr, 'procedure'); }
        isPrimitiveProcedure(expr: Rv) { return this.isTaggedList(expr, 'primitive'); }
       

        getProcedureParameters(expr: Rv) { return RvCons.cadr(expr); }
        getProcedureBody(expr: Rv) { return RvCons.caddr(expr); }
        getProcedureEnv(expr: Rv):Env { return RvAny.val(RvCons.cadddr(expr)); }
        getPrimitiveProcedureDelegate(expr: Rv) { return RvAny.val(RvCons.cdr(expr)); }
        getOperator(expr: Rv) { return RvCons.car(expr); }
        getArguments(expr: Rv) { return RvCons.cdr(expr); }

        evaluateArgs(args: Rv, env:Env):Rv {
            let evaluatedArgs:Rv[] = [];

            while (!RvCons.isNil(args)) {
                evaluatedArgs.push(this.evaluator.evaluate(RvCons.car(args), env));
                args = RvCons.cdr(args);
            }
            return RvCons.listFromRvArray(evaluatedArgs);
        }

    }


    class Env {
        private obj:any= {};
        private envParent: Env = null;

        constructor(envParent: Env) {
            this.envParent = envParent;
        }

        public get(name: string):Rv {
            if (name in this.obj)
                return this.obj[name];
            if (this.envParent == null)
                return RvCons.Nil;
            return this.envParent.get(name);
        }

        public set(name: string, rv: Rv) {
            if (name in this.obj)
                this.obj[name] = rv;
            else if (this.envParent == null)
                throw "variable is not declared";
            else
                this.envParent.set(name, rv);
        }

        public define(name: string, value: any) {
            this.obj[name] = value;
        }

    }

 
    class Parser {
        private regexSymbol = /^[^\s()',]+/;
        private regexNumber = /^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?/;
        private regexString = /^"([^\\\"]+|\\.)*"/;
        private regexWhiteSpace = /^\s*/;
        private regexBoolean = /^#t|^#f/;

        private tokens: Token[];
        private itoken = 0;


        public parse(st: string): RvCons {
            this.tokens = this.getTokens(st).filter(token => token.kind !== TokenKind.WhiteSpace);
            this.tokens.push(new Token(TokenKind.EOF, null));
            this.itoken = 0;

            var rvs:Rv[] = [];
            while (!this.accept(TokenKind.EOF))
                rvs.push(this.parseExpression());

            return RvCons.listFromRvArray(rvs);
        }

        private nextToken() {
            if (this.itoken < this.tokens.length - 1)
                this.itoken++;
        }

        private currentToken(): Token {
            return this.tokens[this.itoken];
        }

        private accept(tokenKind: TokenKind) {
            if (this.currentToken().kind === tokenKind) {

                this.nextToken();
                return true;
            }
            return false;
        }

        private expect(tokenKind: TokenKind) {
            if (this.accept(tokenKind))
                return true;
            else
                throw 'expected ' + tokenKind + ' found ' + this.currentToken().kind;
        }

        public parseExpression(): any {
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
                let exprs:Rv[] = [];

                while (!this.accept(TokenKind.RParen)) {

                    if (this.accept(TokenKind.EOF))
                        throw "unexpected end of input";

                    exprs.push(this.parseExpression());
                }

                return RvCons.listFromRvArray(exprs);
            }

            throw "invalid token " + token;
        }

        private getTokens(st: string): Token[] {
            let tokens: Token[] = [];

            while (st.length > 0) {
                let ch = st[0];
                let token: Token;

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
        }

    }

    enum TokenKind {
        WhiteSpace,
        BooleanLit,
        LParen,
        RParen,
        Symbol,
        NumberLit,
        Quote,
        StringLit,
        EOF
    }

    class Token {
        constructor(public kind: TokenKind, public st: string) {
            this.kind = kind;
            this.st = st;
        }
    }
}