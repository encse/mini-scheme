module Sicp.Evaluator {
    export class LambdaEvaluator implements Lang.IEvaluator {
        constructor(private evaluator: Sicp.Evaluator.BaseEvaluator) {  }

        public matches(node: Sicp.Lang.Sv): boolean {
            return this.evaluator.isTaggedList(node, 'lambda');
        }

        public evaluate(node: Sicp.Lang.Sv, env: Sicp.Lang.Env): Sicp.Lang.Sv {
            return Sicp.Lang.SvCons.listFromRvs(new Sicp.Lang.SvSymbol('procedure'), this.getLambdaParameters(node), this.getLambdaBody(node), new Sicp.Lang.SvAny(env));
        }

        getLambdaParameters(expr: Sicp.Lang.Sv) { return Sicp.Lang.SvCons.cadr(expr); }
        getLambdaBody(expr: Sicp.Lang.Sv) { return Sicp.Lang.SvCons.cddr(expr); }

    }
}