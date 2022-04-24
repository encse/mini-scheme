import { Env } from "./env";
import { IEvaluator, Cont } from "./ievaluator";
import { Sv, SvSymbol, SvContinuable, SvCons } from "./sv";
import BaseEvaluator from "./base-evaluator";
import DefineEvaluator from "./define-evaluator";

export default class LambdaEvaluator implements IEvaluator {
    constructor(private evaluator: BaseEvaluator) {  }

    public matches(node: Sv): boolean {
        return BaseEvaluator.isTaggedList(node, 'lambda');
    }

    public evaluate(sv: Sv, env: Env, cont: Cont): Sv {
        var proc = DefineEvaluator.makeProc(
            new SvSymbol("lambda"),
            env, 
            LambdaEvaluator.getLambdaParameters(sv),
            LambdaEvaluator.getLambdaBody(sv),
        );
        return new SvContinuable(cont, proc);
    }

    
    public static getLambdaParameters(expr: Sv) { return SvCons.cadr(expr); }
    public static getLambdaBody(expr: Sv) { return SvCons.cddr(expr); }

}