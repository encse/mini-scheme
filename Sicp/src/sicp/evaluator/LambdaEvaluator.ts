import { Env } from "../Env";
import { IEvaluator, Cont } from "../IEvaluator";
import { Sv, SvSymbol, SvThunk, SvCons, SvAny } from "../lang/Sv";
import BaseEvaluator from "./BaseEvaluator";

export default class LambdaEvaluator implements IEvaluator {
    constructor(private evaluator: BaseEvaluator) {  }

    public matches(node: Sv): boolean {
        return BaseEvaluator.isTaggedList(node, 'lambda');
    }

    public evaluate(sv: Sv, env: Env, cont: Cont): Sv {
        var proc = LambdaEvaluator.createCompoundProcedure(
            new SvSymbol("lambda"),
            LambdaEvaluator.getLambdaParameters(sv),
            LambdaEvaluator.getLambdaBody(sv),
            env);
        return new SvThunk(cont, proc);
    }

    public static createCompoundProcedure(name:SvSymbol, params: Sv, body: Sv, env: Env):Sv {
        return SvCons.listFromRvs(
            new SvSymbol('procedure'),
            name,
            params,
            body,
            new SvAny(env));
    }
    public static getLambdaParameters(expr: Sv) { return SvCons.cadr(expr); }
    public static getLambdaBody(expr: Sv) { return SvCons.cddr(expr); }

}