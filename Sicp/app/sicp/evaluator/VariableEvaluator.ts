module Sicp.Evaluator {
    export class VariableEvaluator implements Lang.IEvaluator {
        public matches(node: Sicp.Lang.Sv): boolean {
            return Sicp.Lang.SvSymbol.matches(node);
        }

        public evaluate(node: Sicp.Lang.Sv, env: Sicp.Lang.Env): Sicp.Lang.Sv {
            return env.get(Sicp.Lang.SvSymbol.val(node));
        }
    }
}