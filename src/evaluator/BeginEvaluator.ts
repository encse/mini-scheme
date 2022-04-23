import { Env } from "../Env";
import { IEvaluator, Cont } from "../IEvaluator";
import { Sv, SvCons } from "../lang/Sv";
import BaseEvaluator from "./BaseEvaluator";

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