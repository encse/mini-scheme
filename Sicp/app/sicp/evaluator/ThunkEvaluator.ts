module Sicp.Evaluator {
    
     export class ThunkEvaluator implements Sicp.Lang.IEvaluator {
      
        constructor(private evaluator: Sicp.Evaluator.BaseEvaluator) { }
        
        public matches(sv: Lang.Sv): boolean {
            return Lang.SvThunk.matches(sv);
        }

        public evaluate(sv: Lang.Sv, env: Lang.Env, cont: Lang.Cont): Lang.Sv {
            var thunkRes = Lang.SvThunk.val(sv)();
            return cont(thunkRes);
        }
    }
}