import { StackFrame, Env } from "./env";
import { IEvaluator, Cont } from "./ievaluator";
import { Sv, SvCons, SvContinuable, SvSymbol, SvAny } from "./sv";
import BaseEvaluator from "./base-evaluator";

export default class ApplicationEvaluator implements IEvaluator {

    constructor(private evaluator: BaseEvaluator) { }

    public matches(sv: Sv): boolean {
        return SvCons.matches(sv);
    }

    public static evalCall(operator: Sv, args: Sv, stackFrameCurrent: StackFrame, cont: Cont, evaluator: BaseEvaluator): Sv {

        if (this.isPrimitiveProcedure(operator)) {
            return new SvContinuable(cont, this.getPrimitiveProcedureDelegate(operator)(args));
        }
        else if (this.isContinuation(operator)) {
            let arg: Sv = SvCons.Nil;
            if (!SvCons.isNil(args)) {
                if (!SvCons.isNil(SvCons.cdr(args)))
                    throw new Error('too many arguments');
                arg = SvCons.car(args);
            }
            return this.getContinuationFromCapturedContinuation(operator)(arg);
        }
        else if (this.isCompoundProcedure(operator)) {
            const newEnv = new Env(this.getProcedureEnv(operator), this.getProcedureSymbol(operator), stackFrameCurrent);
            let params = this.getProcedureParameters(operator);

            while (!SvCons.isNil(args) || !SvCons.isNil(params)) {
                if (SvCons.isNil(args))
                    throw new Error('not enough argument');
                if (SvCons.isNil(params))
                    throw new Error('too many arguments');
                const parameter = SvSymbol.val(SvCons.car(params));
                const arg = SvCons.car(args);
                newEnv.define(parameter, arg);

                params = SvCons.cdr(params);
                args = SvCons.cdr(args);
            }
            return evaluator.evaluateList(this.getProcedureBody(operator), newEnv, cont);
        }
        else
            throw new Error('undefined procedure ' + operator.toString());
    }


    public evaluate(sv: Sv, env: Env, cont: Cont): Sv {
        return this.evaluator.evaluate(ApplicationEvaluator.getOperator(sv), env, (operator: Sv) => {

            if (!ApplicationEvaluator.isPrimitiveProcedure(operator) &&
                !ApplicationEvaluator.isCompoundProcedure(operator) &&
                !ApplicationEvaluator.isContinuation(operator))
                throw new Error('undefined procedure ' + ApplicationEvaluator.getOperator(sv).toString());

            return this.evaluateArgs(ApplicationEvaluator.getArguments(sv), env,
                args => ApplicationEvaluator.evalCall(operator, args, new StackFrame(sv, env), cont, this.evaluator));
        });

    }

    private static isCompoundProcedure(expr: Sv) {
        return BaseEvaluator.isTaggedList(expr, 'procedure');

    }
    private static isPrimitiveProcedure(expr: Sv) {
        return BaseEvaluator.isTaggedList(expr, 'primitive');

    }
    private static isContinuation(expr: Sv) {
        return BaseEvaluator.isTaggedList(expr, 'captured-continuation');

    }
    private static getContinuationFromCapturedContinuation(expr: Sv): Cont {
        return SvAny.val(SvCons.cdr(expr));
    }

    private static getProcedureSymbol(expr: Sv): SvSymbol { return SvSymbol.cast(SvCons.cadr(expr)); }
    private static getProcedureParameters(expr: Sv) { return SvCons.caddr(expr); }
    private static getProcedureBody(expr: Sv) { return SvCons.cadddr(expr); }
    private static getProcedureEnv(expr: Sv): Env { return SvAny.val(SvCons.caddddr(expr)); }
    private static getPrimitiveProcedureDelegate(expr: Sv) { return SvAny.val(SvCons.cdr(expr)); }
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