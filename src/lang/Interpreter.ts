import { Env } from "./env";
import { Parser } from "./parser";
import { SvCons, SvSymbol, SvAny, SvBool, SvNumber, Sv, SvBreakpoint, SvContinuable, SvProcedure } from "./sv";
import BaseEvaluator from "./base-evaluator";
import ApplicationEvaluator from "./application-evaluator";
import BeginEvaluator from "./begin-evaluator";
import BreakpointEvaluator from "./breakpoint-evaluator";
import CallCCEvaluator from "./call-cc-evaluator";
import CondEvaluator from "./cond-evaluator";
import DefineEvaluator from "./define-evaluator";
import IfEvaluator from "./if-evaluator";
import LambdaEvaluator from "./lambda-evaluator";
import LetEvaluator from "./let-evaluator";
import QuoteEvaluator from "./quote-evaluator";
import SelfEvaluator from "./self-evaluator";
import VariableEvaluator from "./variable-evaluator";
import AssignmentEvaluator from "./assignment-evaluator";

export class Interpreter {

    private evaluator: BaseEvaluator;

    public evaluateString(st: string, log: (st: string) => void) {
        let parser = new Parser();
        let exprs = parser.parse(st);
        let env = new Env(null);

        const makeProc = (name: string, body: (args: Sv) => Sv) => {
            env.define(name,
                new SvProcedure(
                    new SvSymbol(name),
                    (args, _, __, cont) => {
                        return new SvContinuable(cont, body(args))
                    }
                ));
        };

        makeProc('cons', (args: Sv) => new SvCons(SvCons.car(args), SvCons.cadr(args)));
        makeProc('null?', (args: Sv) => SvBool.fromBoolean(SvCons.isNil(SvCons.car(args))));
        makeProc('car', (args: Sv) => SvCons.car(SvCons.car(args)));
        makeProc('cadr', (args: Sv) => SvCons.cadr(SvCons.car(args)));
        makeProc('cdr', (args: Sv) => SvCons.cdr(SvCons.car(args)));
        makeProc('=', (args: Sv) => SvBool.fromBoolean(SvNumber.val(SvCons.car(args)) === SvNumber.val(SvCons.cadr(args))));
        makeProc('>', (args: Sv) => SvBool.fromBoolean(SvNumber.val(SvCons.car(args)) > SvNumber.val(SvCons.cadr(args))));
        makeProc('<', (args: Sv) => SvBool.fromBoolean(SvNumber.val(SvCons.car(args)) < SvNumber.val(SvCons.cadr(args))));
        makeProc('*', (args: Sv) => new SvNumber(SvNumber.val(SvCons.car(args)) * SvNumber.val(SvCons.cadr(args))));
        makeProc('-', (args: Sv) => new SvNumber(SvNumber.val(SvCons.car(args)) - SvNumber.val(SvCons.cadr(args))));
        makeProc('+', (args: Sv) => new SvNumber(SvNumber.val(SvCons.car(args)) + SvNumber.val(SvCons.cadr(args))));
        makeProc('/', (args: Sv) => new SvNumber(SvNumber.val(SvCons.car(args)) / SvNumber.val(SvCons.cadr(args))));
        makeProc('min', (args: Sv) => new SvNumber(Math.min(SvNumber.val(SvCons.car(args)), SvNumber.val(SvCons.cadr(args)))));
        makeProc('max', (args: Sv) => new SvNumber(Math.max(SvNumber.val(SvCons.car(args)), SvNumber.val(SvCons.cadr(args)))));
        makeProc('abs', (args: Sv) => new SvNumber(Math.abs(SvNumber.val(SvCons.car(args)))));
        makeProc('zero?', (args: Sv) => SvBool.fromBoolean(SvNumber.val(SvCons.car(args)) === 0));
        makeProc('length', (args: Sv) => SvCons.lengthI(SvCons.car(args)));
        makeProc('not', (args: Sv) => SvBool.not(SvCons.car(args)));
        makeProc('and', (args: Sv) => SvBool.and(args));
        makeProc('or', (args: Sv) => SvBool.or(args));
        makeProc('display', (args: Sv) => {
            while (!SvCons.isNil(args)) {
                log(SvCons.car(args).toDisplayString());
                args = SvCons.cdr(args);
            }
            return SvCons.Nil;
        });

        makeProc('ask', (args: Sv) => {
            let msg = "";
            while (!SvCons.isNil(args)) {
                msg += SvCons.car(args).toDisplayString();
                args = SvCons.cdr(args);
            }

            log("> " + msg + " ");
            const answer = parseInt(prompt(msg), 10);
            log(answer + "\n");
            return new SvNumber(answer);
        });

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
            sv = sv.val()();
            while (SvContinuable.matches(sv))
                sv = SvContinuable.call(sv);
        }

        return SvBreakpoint.matches(sv) ? sv : null;
    }

}