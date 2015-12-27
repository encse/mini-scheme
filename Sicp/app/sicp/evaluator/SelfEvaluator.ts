module Sicp.Evaluator {
  
    export class SelfEvaluator implements Lang.IEvaluator {
        public matches(node: Lang.Sv): boolean {
            return Lang.SvString.matches(node) || Lang.SvBool.matches(node) ||
                Lang.SvNumber.matches(node) || Lang.SvCons.isNil(node);
        }

        public evaluate(sv: Lang.Sv, env: Lang.Env, cont: Lang.Cont): Lang.Sv {
            return new Lang.SvThunk(cont, sv);
        }
    }
}