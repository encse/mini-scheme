module Sicp.Evaluator {
    
    export class LambdaEvaluator implements Lang.IEvaluator {
        constructor(private evaluator: Evaluator.BaseEvaluator) {  }

        public matches(node: Lang.Sv): boolean {
            return Evaluator.BaseEvaluator.isTaggedList(node, 'lambda');
        }

        public evaluate(sv: Lang.Sv, env: Lang.Env, cont: Lang.Cont): Lang.Pcont {
            return [LambdaEvaluator.createCompoundProcedure(
                        LambdaEvaluator.getLambdaParameters(sv),
                        LambdaEvaluator.getLambdaBody(sv),
                        env)
                    ,cont];
        }

        public static createCompoundProcedure(params: Lang.Sv, body: Lang.Sv, env: Lang.Env):Lang.Sv {
            return Lang.SvCons.listFromRvs(
                new Lang.SvSymbol('procedure'),
                params,
                body,
                new Lang.SvAny(env));
        }
        public static getLambdaParameters(expr: Lang.Sv) { return Lang.SvCons.cadr(expr); }
        public static getLambdaBody(expr: Lang.Sv) { return Lang.SvCons.cddr(expr); }

    }
}