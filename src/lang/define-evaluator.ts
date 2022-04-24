import { Env } from "./env";
import { IEvaluator, Cont } from "./ievaluator";
import { Sv, SvCons, SvSymbol, SvContinuable } from "./sv";
import BaseEvaluator from "./base-evaluator";
import LambdaEvaluator from "./lambda-evaluator";

export default class DefineEvaluator implements IEvaluator {
    constructor(private evaluator: BaseEvaluator) {  }

    public matches(node: Sv): boolean {
        return BaseEvaluator.isTaggedList(node, 'define');
    }

    public evaluate(sv: Sv, env: Env, cont: Cont): Sv {

        if (SvCons.matches(this.getHead(sv))) {
            //implicit lambda definition
            var lambda = LambdaEvaluator.createCompoundProcedure(
                this.getFunctionName(sv) as SvSymbol, this.getLambdaParameters(sv), this.getLambdaBody(sv), env);
            env.define(
                SvSymbol.val(this.getFunctionName(sv)),
                lambda);
            return new SvContinuable(cont, lambda);
        }
        else {
            return this.evaluator.evaluate(this.getValue(sv), env, (svValue: Sv):Sv => {
                env.define(
                    SvSymbol.val(this.getVariable(sv)),
                    svValue);
                return new SvContinuable(cont, svValue);
            });
        }
    }

    getHead(sv: Sv): Sv { return SvCons.cadr(sv); }
    getVariable(sv: Sv): Sv { return this.getHead(sv); }
    getValue(sv: Sv): Sv { return SvCons.caddr(sv); }

    getFunctionName(sv: Sv): Sv { return SvCons.car(this.getHead(sv)); }
    getLambdaParameters(sv: Sv) { return SvCons.cdr(this.getHead(sv)); }
    getLambdaBody(sv: Sv) { return SvCons.cddr(sv); }
}