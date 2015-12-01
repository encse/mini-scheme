module Sicp.Evaluator {
    
     export class ApplicationEvaluator implements Sicp.Lang.IEvaluator {
      

        constructor(private evaluator: Sicp.Evaluator.BaseEvaluator) { }
        
        public matches(sv: Lang.Sv): boolean {
            return Lang.SvCons.matches(sv);
        }

        public static evalCall(operator:Lang.Sv, args: Lang.Sv, cont:Lang.Cont, evaluator:Evaluator.BaseEvaluator):Lang.Sv {
             
            if (this.isPrimitiveProcedure(operator)) {
                var res = this.getPrimitiveProcedureDelegate(operator)(args);
                return new Lang.SvThunk(() => cont(res));
            }
            else if (this.isContinuation(operator)) {
                var arg: Lang.Sv = Lang.SvCons.Nil;
                if (!Lang.SvCons.isNil(args)) {
                    if (!Lang.SvCons.isNil(Lang.SvCons.cdr(args)))
                        throw 'too many argument';
                    arg = Lang.SvCons.car(args);
                }
                var newCond = this.getContinuationFromCapturedContinuation(operator);
                return new Lang.SvThunk(() => newCond(arg));
            }
            else if(this.isCompoundProcedure(operator)) {
                var newEnv = new Lang.Env(this.getProcedureEnv(operator));
                var params = this.getProcedureParameters(operator);

                while (!Lang.SvCons.isNil(args) || !Lang.SvCons.isNil(params)) {
                    if (Lang.SvCons.isNil(args))
                        throw 'not enough argument';
                    if (Lang.SvCons.isNil(params))
                        throw 'too many argument';

                    var parameter = Sicp.Lang.SvSymbol.val(Lang.SvCons.car(params));
                    var arg = Lang.SvCons.car(args);
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
                    args => ApplicationEvaluator.evalCall(operator, args, cont, this.evaluator));
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

        private static getProcedureParameters(expr: Lang.Sv) { return Lang.SvCons.cadr(expr); }
        private static getProcedureBody(expr: Lang.Sv) { return Lang.SvCons.caddr(expr); }
        private static getProcedureEnv(expr: Lang.Sv): Lang.Env { return Lang.SvAny.val(Lang.SvCons.cadddr(expr)); }
        private static getPrimitiveProcedureDelegate(expr: Lang.Sv) { return Lang.SvAny.val(Lang.SvCons.cdr(expr)); }
        private static getOperator(expr: Lang.Sv) { return Lang.SvCons.car(expr); }
        private static getArguments(expr: Lang.Sv) { return Lang.SvCons.cdr(expr); }

        evaluateArgs(args: Lang.Sv, env: Lang.Env, cont: Lang.Cont): Lang.Sv {
            var evaluatedArgs: Lang.Sv[] = [];

            var loop = (args: Lang.Sv) :Lang.Sv => {
                if (Lang.SvCons.isNil(args)) {
                    var res = Lang.SvCons.listFromRvArray(evaluatedArgs);
                    return new Lang.SvThunk(() => cont(res));
                }
                return this.evaluator.evaluate(Lang.SvCons.car(args), env, (evaluatedArg: Lang.Sv) => {
                    evaluatedArgs.push(evaluatedArg);
                    var nextArgs = Lang.SvCons.cdr(args);
                    return new Lang.SvThunk(() => loop(nextArgs));
                });
            };
            return new Lang.SvThunk(() => loop(args));
        }
    }
}