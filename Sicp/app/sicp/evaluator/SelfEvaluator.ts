module Sicp.Evaluator {

    export class SelfEvaluator implements Lang.IEvaluator {
        public matches(node: Sicp.Lang.Sv): boolean {
            return Sicp.Lang.SvString.matches(node) || Sicp.Lang.SvBool.matches(node) || Sicp.Lang.SvNumber.matches(node) || Sicp.Lang.SvCons.isNil(node);
        }

        public evaluate(node: Sicp.Lang.Sv, env: Sicp.Lang.Env): Sicp.Lang.Sv {
            return node;
        }
    }
}