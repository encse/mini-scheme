import { Env } from "./env";
import { IEvaluator, Cont } from "./ievaluator";
import { Sv, SvBreakpoint, SvCons, SvThunk, SvSymbol } from "./sv";

export default class BaseEvaluator implements IEvaluator {
    private stepCount: number = 1;
    private step:number = 0 ;
    private evaluators: IEvaluator[];

    public setEvaluators(evaluators: IEvaluator[]) {
        this.evaluators = evaluators;
    }

    public setStepCount(stepCount: number) {
        this.stepCount = stepCount;
        this.step = 0;
    }

    public matches(node: Sv): boolean {
        return true;
    }

    public evaluate(sv: Sv, env: Env, cont: Cont): Sv {

        for (var i = 0; i < this.evaluators.length;i++) {
            if (this.evaluators[i].matches(sv)) {
                this.step++;
                if (this.step % this.stepCount === 0)
                    return new SvBreakpoint(() => this.evaluators[i].evaluate(sv, env, cont), env).withSourceInfo(sv, sv);
                else
                    return this.evaluators[i].evaluate(sv, env, cont);

            }
        }
        throw new Error('cannot evaluate ' + sv.toString());
    }

    public evaluateList(exprs: Sv, env: Env, cont: Cont): Sv {

        var lastSv: Sv = SvCons.Nil;
        var loop = (exprs: Sv): Sv => {
            if (SvCons.isNil(exprs))
                return new SvThunk(cont, lastSv);

            return this.evaluate(SvCons.car(exprs), env, (sv: Sv) => {
                lastSv = sv;
                var nextExprs = SvCons.cdr(exprs);
                return loop(nextExprs);
            });
        };

        return loop(exprs);
    }

    public static isTaggedList(node: Sv, tag: string) {
        if (!SvCons.matches(node)) return false;
        var car = SvCons.car(node);
        return SvSymbol.matches(car) && SvSymbol.val(car) === tag;
    }
}