module Sicp.Evaluator {
    
     export class ApplicationEvaluator implements Sicp.Lang.IEvaluator {
      

        constructor(private evaluator: Sicp.Evaluator.BaseEvaluator) { }
        
        public matches(sv: Lang.Sv): boolean {
            return Lang.SvCons.matches(sv);
        }

        public evaluate(sv: Lang.Sv, env: Lang.Env, cont: Lang.Cont): Lang.Pcont {
            return this.evaluator.evaluate(this.getOperator(sv), env, (operator: Lang.Sv) => {
                
                if (!this.isPrimitiveProcedure(operator) && !this.isCompoundProcedure(operator) && !this.isContinuation(operator))
                    throw 'undefined procedure' + operator.toString();

                return this.evaluateArgs(this.getArguments(sv), env, (args: Lang.Sv) => {
                    if (this.isPrimitiveProcedure(operator))
                    {
                        return <Lang.Pcont>[this.getPrimitiveProcedureDelegate(operator)(args), cont];
                    }
                    else if (this.isContinuation(operator)) {
                        var arg:Lang.Sv = Lang.SvCons.Nil;
                        if (!Lang.SvCons.isNil(args)) {
                            if(!Lang.SvCons.isNil(Lang.SvCons.cdr(args)))
                                throw 'too many argument';
                            arg = Lang.SvCons.car(args);
                        }
                        return <Lang.Pcont>[arg, this.getContinuationFromCapturedContinuation(operator)];
                    }
                    else
                    {
                        let newEnv = new Lang.Env(this.getProcedureEnv(operator));
                        let params = this.getProcedureParameters(operator);

                        while (!Lang.SvCons.isNil(args) || !Lang.SvCons.isNil(params)) {
                            if (Lang.SvCons.isNil(args))
                                throw 'not enough argument';
                            if (Lang.SvCons.isNil(params))
                                throw 'too many argument';

                            const parameter = Sicp.Lang.SvSymbol.val(Lang.SvCons.car(params));
                            const arg = Lang.SvCons.car(args);
                            newEnv.define(parameter, arg);

                            params = Lang.SvCons.cdr(params);
                            args = Lang.SvCons.cdr(args);
                        }

                        return this.evaluator.evaluateList(this.getProcedureBody(operator), newEnv, cont);
                    }

                });
                
            });
            
        }

        isCompoundProcedure(expr: Lang.Sv) { return this.evaluator.isTaggedList(expr, 'procedure'); }
        isPrimitiveProcedure(expr: Lang.Sv) { return this.evaluator.isTaggedList(expr, 'primitive'); }
        isContinuation(expr: Lang.Sv) { return this.evaluator.isTaggedList(expr, 'captured-continuation'); }
        getContinuationFromCapturedContinuation(expr: Lang.Sv): Lang.Cont { return Lang.SvAny.val(Lang.SvCons.cadr(expr)); }

        getProcedureParameters(expr: Lang.Sv) { return Lang.SvCons.cadr(expr); }
        getProcedureBody(expr: Lang.Sv) { return Lang.SvCons.caddr(expr); }
        getProcedureEnv(expr: Lang.Sv): Lang.Env { return Lang.SvAny.val(Lang.SvCons.cadddr(expr)); }
        getPrimitiveProcedureDelegate(expr: Lang.Sv) { return Lang.SvAny.val(Lang.SvCons.cdr(expr)); }
        getOperator(expr: Lang.Sv) { return Lang.SvCons.car(expr); }
        getArguments(expr: Lang.Sv) { return Lang.SvCons.cdr(expr); }

        evaluateArgs(args: Lang.Sv, env: Lang.Env, cont: Lang.Cont): Lang.Pcont {
            let evaluatedArgs: Lang.Sv[] = [];

            var loop = (args: Lang.Sv) => {
                if (Lang.SvCons.isNil(args))
                    return <Lang.Pcont>[Lang.SvCons.listFromRvArray(evaluatedArgs), cont];

                return this.evaluator.evaluate(Lang.SvCons.car(args), env, (evaluatedArg: Lang.Sv) => {
                    evaluatedArgs.push(evaluatedArg);
                    return <Lang.Pcont>[Lang.SvCons.cdr(args), loop];
                });
            };
            return [args, loop];
        }
    }
}