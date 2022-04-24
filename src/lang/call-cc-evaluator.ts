import { Env, StackFrame } from "./env";
import { IEvaluator, Cont } from "./ievaluator";
import { Sv, SvCons, SvSymbol, SvAny } from "./sv";
import ApplicationEvaluator from "./application-evaluator";
import BaseEvaluator from "./base-evaluator";

export default class CallCCEvaluator implements IEvaluator {

    constructor(private evaluator: BaseEvaluator) { }
    
    public matches(sv: Sv): boolean {
        return BaseEvaluator.isTaggedList(sv, 'call-with-current-continuation');
    }

    public evaluate(sv: Sv, env: Env, cont: Cont): Sv {
        /* (call-with-current-continuation (lambda (hop) ...)) */
        return this.evaluator.evaluate(this.getLambda(sv), env, lambda => {
            var args = SvCons.listFromRvs(CallCCEvaluator.createCcProcedure(cont));
            return ApplicationEvaluator.evalCall(lambda, args, new StackFrame(sv, env), cont, this.evaluator);
        });
    }

    getLambda(sv: Sv) { return SvCons.cadr(sv); }

    private static createCcProcedure(cont: Cont): Sv {
        return new SvCons(new SvSymbol('captured-continuation'), new SvAny(cont));
    }
}