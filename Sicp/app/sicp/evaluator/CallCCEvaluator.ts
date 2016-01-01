module Sicp.Evaluator {
    
     export class CallCCEvaluator implements Sicp.Lang.IEvaluator {
      

        constructor(private evaluator: Sicp.Evaluator.BaseEvaluator) { }
        
        public matches(sv: Lang.Sv): boolean {
            return Evaluator.BaseEvaluator.isTaggedList(sv, 'call-with-current-continuation');
        }

        public evaluate(sv: Lang.Sv, env: Lang.Env, cont: Lang.Cont): Lang.Sv {
            /* (call-with-current-continuation (lambda (hop) ...)) */
            return this.evaluator.evaluate(this.getLambda(sv), env, lambda => {
                var args = Lang.SvCons.listFromRvs(CallCCEvaluator.createCcProcedure(cont));
                return ApplicationEvaluator.evalCall(lambda, args, new Lang.StackFrame(sv, env), cont, this.evaluator);
            });
        }

        getLambda(sv: Lang.Sv) { return Lang.SvCons.cadr(sv); }

        private static createCcProcedure(cont: Lang.Cont): Lang.Sv {
            return new Lang.SvCons(new Lang.SvSymbol('captured-continuation'), new Lang.SvAny(cont));
        }
    }
}