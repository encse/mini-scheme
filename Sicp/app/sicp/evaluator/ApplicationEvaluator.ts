
module Sicp.Evaluator {
   
     export class ApplicationEvaluator implements Sicp.Lang.IEvaluator {
        constructor(private evaluator: Sicp.Evaluator.BaseEvaluator) {}
        
        public matches(sv: Sicp.Lang.Sv): boolean {
            return Sicp.Lang.SvCons.matches(sv);
        }

        public evaluate(rv: Sicp.Lang.Sv, env: Sicp.Lang.Env): Sicp.Lang.Sv {
            let operator = this.evaluator.evaluate(this.getOperator(rv), env);
            if (!this.isPrimitiveProcedure(operator) && !this.isCompoundProcedure(operator))
                throw 'undefined procedure' + operator.toString();

            var args = this.evaluateArgs(this.getArguments(rv), env);
            if (this.isPrimitiveProcedure(operator)) {
                return this.getPrimitiveProcedureDelegate(operator)(args);
            } else {
                let newEnv = new Sicp.Lang.Env(this.getProcedureEnv(operator));
                let params = this.getProcedureParameters(operator);

                while (!Sicp.Lang.SvCons.isNil(args) || !Sicp.Lang.SvCons.isNil(params)) {
                    if (Sicp.Lang.SvCons.isNil(args))
                        throw 'not enough argument';
                    if (Sicp.Lang.SvCons.isNil(params))
                        throw 'too many argument';

                    const parameter = Sicp.Lang.SvSymbol.val(Sicp.Lang.SvCons.car(params));
                    const arg = Sicp.Lang.SvCons.car(args);
                    newEnv.define(parameter, arg);

                    params = Sicp.Lang.SvCons.cdr(params);
                    args = Sicp.Lang.SvCons.cdr(args);
                }

                return this.evaluator.evaluateList(this.getProcedureBody(operator), newEnv);
            }
        }

        isCompoundProcedure(expr: Sicp.Lang.Sv) { return this.evaluator.isTaggedList(expr, 'procedure'); }
        isPrimitiveProcedure(expr: Sicp.Lang.Sv) { return this.evaluator.isTaggedList(expr, 'primitive'); }

        getProcedureParameters(expr: Sicp.Lang.Sv) { return Sicp.Lang.SvCons.cadr(expr); }
        getProcedureBody(expr: Sicp.Lang.Sv) { return Sicp.Lang.SvCons.caddr(expr); }
        getProcedureEnv(expr: Sicp.Lang.Sv): Sicp.Lang.Env { return Sicp.Lang.SvAny.val(Sicp.Lang.SvCons.cadddr(expr)); }
        getPrimitiveProcedureDelegate(expr: Sicp.Lang.Sv) { return Sicp.Lang.SvAny.val(Sicp.Lang.SvCons.cdr(expr)); }
        getOperator(expr: Sicp.Lang.Sv) { return Sicp.Lang.SvCons.car(expr); }
        getArguments(expr: Sicp.Lang.Sv) { return Sicp.Lang.SvCons.cdr(expr); }

        evaluateArgs(args: Sicp.Lang.Sv, env: Sicp.Lang.Env): Sicp.Lang.Sv {
            let evaluatedArgs: Sicp.Lang.Sv[] = [];

            while (!Sicp.Lang.SvCons.isNil(args)) {
                evaluatedArgs.push(this.evaluator.evaluate(Sicp.Lang.SvCons.car(args), env));
                args = Sicp.Lang.SvCons.cdr(args);
            }
            return Sicp.Lang.SvCons.listFromRvArray(evaluatedArgs);
        }
    }
}