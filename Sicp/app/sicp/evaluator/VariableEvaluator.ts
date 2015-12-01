module Sicp.Evaluator {

    export class VariableEvaluator implements Lang.IEvaluator {
        public matches(node: Lang.Sv): boolean {
            return Lang.SvSymbol.matches(node);
        }

        public evaluate(sv: Lang.Sv, env: Lang.Env, cont: Lang.Cont): Lang.Sv {
            var res = env.get(Lang.SvSymbol.val(sv));
            return new Lang.SvThunk( () => cont(res));
        }
    }
}