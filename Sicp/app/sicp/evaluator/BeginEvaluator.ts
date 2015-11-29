module Sicp.Evaluator {
    export class BeginEvaluator implements Sicp.Lang.IEvaluator {
        constructor(private evaluator: Sicp.Evaluator.BaseEvaluator) { }

        public matches(node: Sicp.Lang.Sv): boolean {
            return this.evaluator.isTaggedList(node, 'begin');
        }

        public evaluate(sv: Sicp.Lang.Sv, env: Sicp.Lang.Env): Sicp.Lang.Sv {
            return this.evaluator.evaluateList(this.getBeginActions(sv), env);
        }

        getBeginActions(expr: Sicp.Lang.Sv) { return Sicp.Lang.SvCons.cdr(expr); }
    }
}