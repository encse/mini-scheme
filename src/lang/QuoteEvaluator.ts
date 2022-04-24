import { Env } from "./Env";
import { IEvaluator, Cont } from "./IEvaluator";
import { Sv, SvCons, SvThunk } from "./Sv";
import BaseEvaluator from "./BaseEvaluator";

export default class QuoteEvaluator implements IEvaluator {
    constructor(private evaluator: BaseEvaluator) { }
    public matches(node: Sv): boolean {
        return BaseEvaluator.isTaggedList(node, 'quote');
    }

    public evaluate(sv: Sv, env: Env, cont: Cont): Sv {
        var res = SvCons.cdr(sv);
        return new SvThunk(cont, res);
    }
}