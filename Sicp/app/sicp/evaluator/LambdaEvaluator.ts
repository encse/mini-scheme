module Sicp.Evaluator {
    
    export class LambdaEvaluator implements Lang.IEvaluator {
        constructor(private evaluator: Evaluator.BaseEvaluator) {  }

        public matches(node: Lang.Sv): boolean {
            return Evaluator.BaseEvaluator.isTaggedList(node, 'lambda');
        }

        public evaluate(sv: Lang.Sv, env: Lang.Env, cont: Lang.Cont): Lang.Pcont {
            return [Lang.SvCons.listFromRvs(
                        new Lang.SvSymbol('procedure'),
                        LambdaEvaluator.getLambdaParameters(sv),
                        LambdaEvaluator.getLambdaBody(sv),
                        new Lang.SvAny(env))
                    ,cont];
        }

        public static getLambdaParameters(expr: Lang.Sv) { return Lang.SvCons.cadr(expr); }
        public static getLambdaBody(expr: Lang.Sv) { return Lang.SvCons.cddr(expr); }

    }
}