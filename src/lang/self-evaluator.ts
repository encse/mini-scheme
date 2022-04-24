import { Env } from "./env";
import { IEvaluator, Cont } from "./ievaluator";
import { Sv, SvString, SvBool, SvNumber, SvCons, SvThunk } from "./sv";

export default class SelfEvaluator implements IEvaluator {
    public matches(node: Sv): boolean {
        return SvString.matches(node) || SvBool.matches(node) ||
            SvNumber.matches(node) || SvCons.isNil(node);
    }

    public evaluate(sv: Sv, env: Env, cont: Cont): Sv {
        return new SvThunk(cont, sv);
    }
}