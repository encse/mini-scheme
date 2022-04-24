import { Env } from "./env";
import { IEvaluator, Cont } from "./ievaluator";
import { Sv, SvBreakpoint, SvContinuable } from "./sv";
import BaseEvaluator from "./base-evaluator";

    
export default class BreakpointEvaluator implements IEvaluator {
    
    constructor(private evaluator: BaseEvaluator) { }
    
    public matches(sv: Sv): boolean {
        return SvBreakpoint.matches(sv);
    }

    public evaluate(sv: Sv, env: Env, cont: Cont): Sv {
        return new SvContinuable(cont, SvBreakpoint.cast(sv).val()());
    }
}