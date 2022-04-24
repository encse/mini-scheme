import { Env } from "./env";
import { IEvaluator, Cont } from "./ievaluator";
import { Sv, SvBreakpoint, SvThunk } from "./sv";
import BaseEvaluator from "./base-evaluator";

    
export default class BreakpointEvaluator implements IEvaluator {
    
    constructor(private evaluator: BaseEvaluator) { }
    
    public matches(sv: Sv): boolean {
        return SvBreakpoint.matches(sv);
    }

    public evaluate(sv: Sv, env: Env, cont: Cont): Sv {
        return new SvThunk(cont, SvBreakpoint.cast(sv).val()());
    }
}