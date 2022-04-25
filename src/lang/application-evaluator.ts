import { StackFrame, Env } from "./env";
import { IEvaluator, Cont } from "./ievaluator";
import { Sv, SvCons, SvContinuable, SvProcedure } from "./sv2";
import BaseEvaluator from "./base-evaluator";

export default class ApplicationEvaluator implements IEvaluator {

    constructor(private evaluator: BaseEvaluator) { }

    public matches(sv: Sv): boolean {
        return SvCons.matches(sv);
    }

    public static evalCall(operator: Sv, args: Sv, stackFrameCurrent: StackFrame, cont: Cont, evaluator: BaseEvaluator): Sv {
        if (SvProcedure.matches(operator)) {
            return operator.delegate(args, stackFrameCurrent, evaluator, cont);
        } else {
            throw new Error('undefined procedure ' + operator.toString());
        }
    }

    public evaluate(sv: Sv, env: Env, cont: Cont): Sv {
        return this.evaluator.evaluate(ApplicationEvaluator.getOperator(sv), env, (operator: Sv) => {
            if (!SvProcedure.matches(operator)) {
                throw new Error('undefined procedure ' + ApplicationEvaluator.getOperator(sv).toString());
            }

            return this.evaluateArgs(ApplicationEvaluator.getArguments(sv), env,
                args => ApplicationEvaluator.evalCall(operator, args, new StackFrame(sv, env), cont, this.evaluator));
        });
    }

    private static getOperator(expr: Sv) { return SvCons.car(expr); }
    private static getArguments(expr: Sv) { return SvCons.cdr(expr); }

    evaluateArgs(args0: Sv, env: Env, cont: Cont): Sv {
        const evaluatedArgs = new SvCons(null, null);
        const loop = (evaluatedArgsLast: Sv, args: Sv): Sv => {
            if (SvCons.isNil(args)) {
                return new SvContinuable(cont, evaluatedArgs);
            }
            return this.evaluator.evaluate(SvCons.car(args), env, (evaluatedArg: Sv) => {
                SvCons.setCar(evaluatedArgsLast, evaluatedArg);
                SvCons.setCdr(evaluatedArgsLast, new SvCons(null, null));
                return loop(SvCons.cdr(evaluatedArgsLast), SvCons.cdr(args));
            });
        };
        return loop(evaluatedArgs, args0);
    }
}