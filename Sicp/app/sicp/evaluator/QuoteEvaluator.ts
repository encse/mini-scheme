module Sicp.Evaluator {

    export class QuoteEvaluator implements Lang.IEvaluator {
        constructor(private evaluator: Sicp.Evaluator.BaseEvaluator) { }
        public matches(node: Lang.Sv): boolean {
            return this.evaluator.isTaggedList(node, 'quote');
        }

        public evaluate(sv: Lang.Sv, env: Lang.Env, cont: Lang.Cont): Lang.Pcont {
            return [Lang.SvCons.cdr(sv), cont];
        }
    }
}