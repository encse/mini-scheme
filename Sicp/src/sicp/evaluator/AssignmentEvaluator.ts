import { Env } from "../Env";
import { IEvaluator, Cont } from "../IEvaluator";
import { Sv, SvSymbol, SvThunk, SvCons } from "../lang/Sv";
import BaseEvaluator from "./BaseEvaluator";

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
            return new SvThunk(cont, svValue);
        });
    }

    getVariable(node: Sv): Sv { return SvCons.cadr(node); }
    getValue(node: Sv): Sv { return SvCons.caddr(node); }
}