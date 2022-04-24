import { Env } from "./Env";
import { IEvaluator, Cont } from "./IEvaluator";
import { Sv, SvBreakpoint, SvThunk } from "./Sv";
import BaseEvaluator from "./BaseEvaluator";

    
export default class BreakpointEvaluator implements IEvaluator {
    
    constructor(private evaluator: BaseEvaluator) { }
    
    public matches(sv: Sv): boolean {
        return SvBreakpoint.matches(sv);
    }

    public evaluate(sv: Sv, env: Env, cont: Cont): Sv {
        return new SvThunk(cont, SvBreakpoint.cast(sv).val()());
    }
}