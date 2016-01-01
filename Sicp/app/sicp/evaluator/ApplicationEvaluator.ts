module Sicp.Evaluator {
    
     export class ApplicationEvaluator implements Sicp.Lang.IEvaluator {
      

        constructor(private evaluator: Sicp.Evaluator.BaseEvaluator) { }
        
        public matches(sv: Lang.Sv): boolean {
            return Lang.SvCons.matches(sv);
        }

        public static evalCall(operator:Lang.Sv, args: Lang.Sv, envCurrent:Lang.Env,cont:Lang.Cont, evaluator:Evaluator.BaseEvaluator):Lang.Sv {
             
            if (this.isPrimitiveProcedure(operator)) {
                return new Lang.SvThunk(cont, this.getPrimitiveProcedureDelegate(operator)(args));
            }
            else if (this.isContinuation(operator)) {
                let arg: Lang.Sv = Lang.SvCons.Nil;
                if (!Lang.SvCons.isNil(args)) {
                    if (!Lang.SvCons.isNil(Lang.SvCons.cdr(args)))
                        throw 'too many argument';
                    arg = Lang.SvCons.car(args);
                }
                return this.getContinuationFromCapturedContinuation(operator)(arg);
            }
            else if(this.isCompoundProcedure(operator)) {
                const newEnv = new Lang.Env(this.getProcedureEnv(operator), this.getProcedureSymbol(operator), envCurrent);
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
                return evaluator.evaluateList(this.getProcedureBody(operator), newEnv, cont);
            }
            else
                throw 'undefined procedure' + operator.toString();
        }
         

         public evaluate(sv: Lang.Sv, env: Lang.Env, cont: Lang.Cont): Lang.Sv {
             return this.evaluator.evaluate(ApplicationEvaluator.getOperator(sv), env, (operator: Lang.Sv) => {
                
                if (!ApplicationEvaluator.isPrimitiveProcedure(operator) &&
                    !ApplicationEvaluator.isCompoundProcedure(operator) &&
                    !ApplicationEvaluator.isContinuation(operator))
                    throw 'undefined procedure ' + ApplicationEvaluator.getOperator(sv).toString();

                return this.evaluateArgs(ApplicationEvaluator.getArguments(sv), env,
                    args => ApplicationEvaluator.evalCall(operator, args, env, cont, this.evaluator));
            });
            
        }

         private static isCompoundProcedure(expr: Lang.Sv) {
             return Evaluator.BaseEvaluator.isTaggedList(expr, 'procedure'); 
             
         }
         private static isPrimitiveProcedure(expr: Lang.Sv) {
             return Evaluator.BaseEvaluator.isTaggedList(expr, 'primitive'); 
             
         }
         private static isContinuation(expr: Lang.Sv) {
             return Evaluator.BaseEvaluator.isTaggedList(expr, 'captured-continuation'); 
             
         }
        private static getContinuationFromCapturedContinuation(expr: Lang.Sv): Lang.Cont {
            return Lang.SvAny.val(Lang.SvCons.cdr(expr)); 
        }

        private static getProcedureSymbol(expr: Lang.Sv):Lang.SvSymbol { return Lang.SvSymbol.cast(Lang.SvCons.cadr(expr)); }
        private static getProcedureParameters(expr: Lang.Sv) { return Lang.SvCons.caddr(expr); }
        private static getProcedureBody(expr: Lang.Sv) { return Lang.SvCons.cadddr(expr); }
        private static getProcedureEnv(expr: Lang.Sv): Lang.Env { return Lang.SvAny.val(Lang.SvCons.caddddr(expr)); }
        private static getPrimitiveProcedureDelegate(expr: Lang.Sv) { return Lang.SvAny.val(Lang.SvCons.cdr(expr)); }
        private static getOperator(expr: Lang.Sv) { return Lang.SvCons.car(expr); }
        private static getArguments(expr: Lang.Sv) { return Lang.SvCons.cdr(expr); }

        evaluateArgs(args0: Lang.Sv, env: Lang.Env, cont: Lang.Cont): Lang.Sv {
            const evaluatedArgs = new Lang.SvCons(null, null);
            const loop = (evaluatedArgsLast: Lang.Sv, args: Lang.Sv) :Lang.Sv => {
                if (Lang.SvCons.isNil(args)) {
                    return new Lang.SvThunk(cont, evaluatedArgs);
                }
                return this.evaluator.evaluate(Lang.SvCons.car(args), env, (evaluatedArg: Lang.Sv) => {
                    Lang.SvCons.setCar(evaluatedArgsLast, evaluatedArg);
                    Lang.SvCons.setCdr(evaluatedArgsLast, new Lang.SvCons(null, null));
                    return loop(Lang.SvCons.cdr(evaluatedArgsLast), Lang.SvCons.cdr(args));
                });
            };
            return loop(evaluatedArgs, args0);
        }
    }
}