module Sicp.Evaluator {

    export class VariableEvaluator implements Lang.IEvaluator {
        public matches(node: Lang.Sv): boolean {
            return Lang.SvSymbol.matches(node);
        }

        public evaluate(sv: Lang.Sv, env: Lang.Env, cont: Lang.Cont): Lang.SvCont {
            return [env.get(Lang.SvSymbol.val(sv)), cont];
        }
    }
}