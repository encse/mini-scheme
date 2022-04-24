import { Env } from "./env";
import { IEvaluator, Cont } from "./ievaluator";
import { Sv, SvCons, SvThunk } from "./sv";
import BaseEvaluator from "./base-evaluator";

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