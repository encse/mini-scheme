module Sicp.Evaluator {
    
     export class CallCCEvaluator implements Sicp.Lang.IEvaluator {
      

        constructor(private evaluator: Sicp.Evaluator.BaseEvaluator) { }
        
        public matches(sv: Lang.Sv): boolean {
            return this.evaluator.isTaggedList(sv, 'call-with-current-continuation');
        }

        public evaluate(sv: Lang.Sv, env: Lang.Env, cont: Lang.Cont): Lang.Pcont {
            /* (call-with-current-continuation (lambda (hop) ...)) */
            return this.evaluator.evaluate(this.getLambda(sv), env, lambda => {

                const newEnv = new Lang.Env(env);
                const params = LambdaEvaluator.getLambdaParameters(lambda);

                if (!Lang.SvCons.isNil(Lang.SvCons.cdr(params)))
                    throw 'not enough argument';
                newEnv.define(
                    Lang.SvSymbol.val(Lang.SvCons.car(params)),
                    Lang.SvCons.listFromRvs(new Lang.SvSymbol('captured-continuation'), new Lang.SvAny(cont))
                );

                //TODO: itt ne kelljen mar car
                return this.evaluator.evaluateList(Lang.SvCons.car(LambdaEvaluator.getLambdaBody(lambda)), newEnv, cont);
            });
        }

        getLambda(sv: Lang.Sv) { return Lang.SvCons.cadr(sv); }
    }
}