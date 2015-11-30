module Sicp.Evaluator {
    
    export class LambdaEvaluator implements Lang.IEvaluator {
        constructor(private evaluator: Evaluator.BaseEvaluator) {  }

        public matches(node: Lang.Sv): boolean {
            return this.evaluator.isTaggedList(node, 'lambda');
        }

        public evaluate(sv: Lang.Sv, env: Lang.Env, cont: Lang.Cont): Lang.SvCont {
            return [Lang.SvCons.listFromRvs(
                        new Lang.SvSymbol('procedure'),
                        this.getLambdaParameters(sv),
                        this.getLambdaBody(sv),
                        new Lang.SvAny(env))
                    ,cont];
        }

        getLambdaParameters(expr: Lang.Sv) { return Lang.SvCons.cadr(expr); }
        getLambdaBody(expr: Lang.Sv) { return Lang.SvCons.cddr(expr); }

    }
}