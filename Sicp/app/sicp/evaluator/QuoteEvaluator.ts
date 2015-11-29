module Sicp.Evaluator {
    export class QuoteEvaluator implements Lang.IEvaluator {
        constructor(private evaluator: Sicp.Evaluator.BaseEvaluator) { }
        public matches(node: Sicp.Lang.Sv): boolean {
            return this.evaluator.isTaggedList(node, 'quote');
        }

        public evaluate(node: Sicp.Lang.Sv, env: Sicp.Lang.Env): Sicp.Lang.Sv {
            return Sicp.Lang.SvCons.cdr(node);
        }
    }
}