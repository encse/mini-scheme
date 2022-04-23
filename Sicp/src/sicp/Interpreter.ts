import { Env } from "./Env";
import { Parser } from "./lang/Parser";
import { SvCons, SvSymbol, SvAny, SvBool, SvNumber, Sv, SvBreakpoint, SvThunk } from "./lang/Sv";
import BaseEvaluator from "./evaluator/BaseEvaluator";
import ApplicationEvaluator from "./evaluator/ApplicationEvaluator";
import BeginEvaluator from "./evaluator/BeginEvaluator";
import BreakpointEvaluator from "./evaluator/BreakpointEvaluator";
import CallCCEvaluator from "./evaluator/CallCCEvaluator";
import CondEvaluator from "./evaluator/CondEvaluator";
import DefineEvaluator from "./evaluator/DefineEvaluator";
import IfEvaluator from "./evaluator/IfEvaluator";
import LambdaEvaluator from "./evaluator/LambdaEvaluator";
import LetEvaluator from "./evaluator/LetEvaluator";
import QuoteEvaluator from "./evaluator/QuoteEvaluator";
import SelfEvaluator from "./evaluator/SelfEvaluator";
import VariableEvaluator from "./evaluator/VariableEvaluator";
import AssignmentEvaluator from "./evaluator/AssignmentEvaluator";

export class Interpreter {

    private evaluator: BaseEvaluator;

    public evaluateString(st: string, log: (st: string) => void) {
        let parser = new Parser();
        let exprs = parser.parse(st);
        let env = new Env(null);
        env.define('cons', new SvCons(new SvSymbol('primitive'), new SvAny((args: any) => new SvCons(SvCons.car(args), SvCons.cadr(args)))));
        env.define('null?', new SvCons(new SvSymbol('primitive'), new SvAny((args: any) => SvBool.fromBoolean(SvCons.isNil(SvCons.car(args))))));
        env.define('car', new SvCons(new SvSymbol('primitive'), new SvAny((args: any) => SvCons.car(SvCons.car(args)))));
        env.define('cadr', new SvCons(new SvSymbol('primitive'), new SvAny((args: any) => SvCons.cadr(SvCons.car(args)))));
        env.define('cdr', new SvCons(new SvSymbol('primitive'), new SvAny((args: any) => SvCons.cdr(SvCons.car(args)))));
        env.define('=', new SvCons(new SvSymbol('primitive'), new SvAny((args: any) => SvBool.fromBoolean(SvNumber.val(SvCons.car(args)) === SvNumber.val(SvCons.cadr(args))))));
        env.define('>', new SvCons(new SvSymbol('primitive'), new SvAny((args: any) => SvBool.fromBoolean(SvNumber.val(SvCons.car(args)) > SvNumber.val(SvCons.cadr(args))))));
        env.define('<', new SvCons(new SvSymbol('primitive'), new SvAny((args: any) => SvBool.fromBoolean(SvNumber.val(SvCons.car(args)) < SvNumber.val(SvCons.cadr(args))))));
        env.define('*', new SvCons(new SvSymbol('primitive'), new SvAny((args: any) => new SvNumber(SvNumber.val(SvCons.car(args)) * SvNumber.val(SvCons.cadr(args))))));
        env.define('-', new SvCons(new SvSymbol('primitive'), new SvAny((args: any) => new SvNumber(SvNumber.val(SvCons.car(args)) - SvNumber.val(SvCons.cadr(args))))));
        env.define('+', new SvCons(new SvSymbol('primitive'), new SvAny((args: any) => new SvNumber(SvNumber.val(SvCons.car(args)) + SvNumber.val(SvCons.cadr(args))))));
        env.define('/', new SvCons(new SvSymbol('primitive'), new SvAny((args: any) => new SvNumber(SvNumber.val(SvCons.car(args)) / SvNumber.val(SvCons.cadr(args))))));
        env.define('min', new SvCons(new SvSymbol('primitive'), new SvAny((args: any) => new SvNumber(Math.min(SvNumber.val(SvCons.car(args)), SvNumber.val(SvCons.cadr(args)))))));
        env.define('max', new SvCons(new SvSymbol('primitive'), new SvAny((args: any) => new SvNumber(Math.max(SvNumber.val(SvCons.car(args)), SvNumber.val(SvCons.cadr(args)))))));
        env.define('abs', new SvCons(new SvSymbol('primitive'), new SvAny((args: any) => new SvNumber(Math.abs(SvNumber.val(SvCons.car(args)))))));
        env.define('zero?', new SvCons(new SvSymbol('primitive'), new SvAny((args: any) => SvBool.fromBoolean(SvNumber.val(SvCons.car(args)) === 0))));
        env.define('length', new SvCons(new SvSymbol('primitive'), new SvAny((args: any) => SvCons.lengthI(SvCons.car(args)))));
        env.define('not', new SvCons(new SvSymbol('primitive'), new SvAny((args: any) => SvBool.not(SvCons.car(args)))));
        env.define('and', new SvCons(new SvSymbol('primitive'), new SvAny((args: any) => SvBool.and(args))));
        env.define('or', new SvCons(new SvSymbol('primitive'), new SvAny((args: any) => SvBool.or(args))));
        env.define('display', new SvCons(new SvSymbol('primitive'), new SvAny((args: any) => {
            while (!SvCons.isNil(args)) {
                log(SvCons.car(args).toDisplayString());
                args = SvCons.cdr(args);
            }
            return SvCons.Nil;
        })));
        env.define('newline', new SvCons(new SvSymbol('primitive'), new SvAny((args: any) => {
            log('\n');
            return SvCons.Nil;
        })));
        this.evaluator = new BaseEvaluator();
        this.evaluator.setEvaluators([
            new BreakpointEvaluator(this.evaluator),
            new SelfEvaluator(),
            new VariableEvaluator(),
            new LetEvaluator(this.evaluator),
            new QuoteEvaluator(this.evaluator),
            new CondEvaluator(this.evaluator),
            new DefineEvaluator(this.evaluator),
            new AssignmentEvaluator(this.evaluator),
            new IfEvaluator(this.evaluator),
            new BeginEvaluator(this.evaluator),
            new LambdaEvaluator(this.evaluator),
            new CallCCEvaluator(this.evaluator),
            new ApplicationEvaluator(this.evaluator)
        ]);

        return this.evaluator.evaluateList(exprs, new Env(env), sv => {
            //log(sv.toString());
            return sv;
        });
    }

    public step(sv: Sv, stepCount: number): Sv {
    
        this.evaluator.setStepCount(stepCount);

        if (SvBreakpoint.matches(sv)) {
            sv = SvBreakpoint.cast(sv).val()();
            while (SvThunk.matches(sv))
                sv = SvThunk.call(sv);
        }
    
        return SvBreakpoint.matches(sv) ? sv : null;
    }

}