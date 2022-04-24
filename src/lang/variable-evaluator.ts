import { Env } from "./env";
import { IEvaluator, Cont } from "./ievaluator";
import { Sv, SvSymbol, SvContinuable } from "./sv";

export default class VariableEvaluator implements IEvaluator {
    public matches(node: Sv): boolean {
        return SvSymbol.matches(node);
    }

    public evaluate(sv: Sv, env: Env, cont: Cont): Sv {
        var res = env.get(SvSymbol.val(sv));
        return new SvContinuable(cont, res);
    }
}