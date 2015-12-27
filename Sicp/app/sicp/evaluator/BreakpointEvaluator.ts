module Sicp.Evaluator {
    
     export class BreakpointEvaluator implements Sicp.Lang.IEvaluator {
      
        constructor(private evaluator: Sicp.Evaluator.BaseEvaluator) { }
        
        public matches(sv: Lang.Sv): boolean {
            return Lang.SvBreakpoint.matches(sv);
        }

        public evaluate(sv: Lang.Sv, env: Lang.Env, cont: Lang.Cont): Lang.Sv {
            return new Lang.SvThunk(cont, Lang.SvBreakpoint.val(sv)());
        }
    }
}