import { Env } from "./env";
import { IEvaluator, Cont } from "./ievaluator";
import { Sv, SvBool, SvCons } from "./sv2";
import BaseEvaluator from "./base-evaluator";

export default class IfEvaluator implements IEvaluator {
    constructor(private evaluator: BaseEvaluator) {  }

    public matches(node: Sv): boolean {
        return BaseEvaluator.isTaggedList(node, 'if');
    }

    public evaluate(sv: Sv, env: Env, cont: Cont): Sv {
        return this.evaluator.evaluate(this.getIfPredicate(sv), env, (svCond: Sv) => {
            return SvBool.isTrue(svCond) ?
                this.evaluator.evaluate(this.getIfConsequent(sv), env, cont):
                this.evaluator.evaluate(this.getIfAlternative(sv), env, cont);
        });
    }

    getIfPredicate(expr: any) { return SvCons.cadr(expr); }
    getIfConsequent(expr: any) { return SvCons.caddr(expr); }
    getIfAlternative(expr: any) { return !SvCons.isNil(SvCons.cdddr(expr)) ? SvCons.cadddr(expr) : SvCons.Nil; }

}