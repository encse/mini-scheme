import { Env } from "./env";
import { IEvaluator, Cont } from "./ievaluator";
import { Sv, SvCons } from "./sv2";
import BaseEvaluator from "./base-evaluator";

export default class BeginEvaluator implements IEvaluator {
    constructor(private evaluator: BaseEvaluator) { }

    public matches(node: Sv): boolean {
        return BaseEvaluator.isTaggedList(node, 'begin');
    }

    public evaluate(sv: Sv, env: Env, cont: Cont): Sv {
        return this.evaluator.evaluateList(this.getBeginActions(sv), env, cont);
    }

    getBeginActions(expr: Sv) { return SvCons.cdr(expr); }
}