import { Env, StackFrame } from "./env";
import { IEvaluator, Cont } from "./ievaluator";
import { Sv, SvCons, SvSymbol, SvContinuable, SvProcedure } from "./sv";
import BaseEvaluator from "./base-evaluator";

export default class DefineEvaluator implements IEvaluator {
    constructor(private evaluator: BaseEvaluator) {  }

    public matches(node: Sv): boolean {
        return BaseEvaluator.isTaggedList(node, 'define');
    }

    public static makeProc(name: SvSymbol, envClosure: Env, params: Sv, body: Sv ){
        return new SvProcedure(
            name, 
            (args: Sv, stackFrame: StackFrame, evaluator: BaseEvaluator, cont: Cont) => {
                const newEnv = new Env(envClosure, name, stackFrame);
                let paramsT = params;

                while (!SvCons.isNil(args) || !SvCons.isNil(paramsT)) {
                    if (SvCons.isNil(args))
                        throw new Error('not enough argument');
                    if (SvCons.isNil(paramsT))
                        throw new Error('too many arguments');
                    const parameter = SvSymbol.val(SvCons.car(paramsT));
                    const arg = SvCons.car(args);
                    newEnv.define(parameter, arg);

                    paramsT = SvCons.cdr(paramsT);
                    args = SvCons.cdr(args);
                }

                return evaluator.evaluateList(body, newEnv, cont);
            }
        );
    }
    public evaluate(sv: Sv, env: Env, cont: Cont): Sv {

        if (SvCons.matches(this.getHead(sv))) {
            const name = SvSymbol.cast(this.getFunctionName(sv));
            const lambda = DefineEvaluator.makeProc(
                name, 
                env, 
                this.getLambdaParameters(sv), 
                this.getLambdaBody(sv)
            )
            env.define(name._val, lambda);
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