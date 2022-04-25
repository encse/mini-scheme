import { Env } from "./env";
import { IEvaluator, Cont } from "./ievaluator";
import { Sv, SvSymbol, SvContinuable, SvCons } from "./sv2";
import BaseEvaluator from "./base-evaluator";

export default class AssignmentEvaluator implements IEvaluator {
    constructor(private evaluator: BaseEvaluator) {  }

    public matches(sv: Sv): boolean {
        return BaseEvaluator.isTaggedList(sv, 'set!');
    }

    public evaluate(sv: Sv, env: Env, cont: Cont): Sv {

        return this.evaluator.evaluate(this.getValue(sv), env, (svValue) => {
            env.set(
                SvSymbol.val(this.getVariable(sv)),
                svValue);
            return new SvContinuable(cont, svValue);
        });
    }

    getVariable(node: Sv): Sv { return SvCons.cadr(node); }
    getValue(node: Sv): Sv { return SvCons.caddr(node); }
}