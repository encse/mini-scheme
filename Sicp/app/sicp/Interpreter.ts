module Sicp.Lang {

    export class Interpreter {

        private evaluator: Evaluator.BaseEvaluator;

        public evaluateString(st: string, log: (st: string) => void) {
            let parser = new Lang.Parser();
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
            this.evaluator = new Evaluator.BaseEvaluator();
            this.evaluator.setEvaluators([
                new Evaluator.BreakpointEvaluator(this.evaluator),
                new Evaluator.SelfEvaluator(),
                new Evaluator.VariableEvaluator(),
                new Evaluator.LetEvaluator(this.evaluator),
                new Evaluator.QuoteEvaluator(this.evaluator),
                new Evaluator.CondEvaluator(this.evaluator),
                new Evaluator.DefineEvaluator(this.evaluator),
                new Evaluator.AssignmentEvaluator(this.evaluator),
                new Evaluator.IfEvaluator(this.evaluator),
                new Evaluator.BeginEvaluator(this.evaluator),
                new Evaluator.LambdaEvaluator(this.evaluator),
                new Evaluator.CallCCEvaluator(this.evaluator),
                new Evaluator.ApplicationEvaluator(this.evaluator)
            ]);

            return this.evaluator.evaluateList(exprs, new Env(env), sv => {
                //log(sv.toString());
                return sv;
            });
        }

        public step(sv: Sv, stepCount: number): Sv {
            this.evaluator.setStepCount(stepCount);

            if (Lang.SvBreakpoint.matches(sv)) {
                sv = Lang.SvBreakpoint.cast(sv).val()();
                while (Lang.SvThunk.matches(sv))
                    sv = Lang.SvThunk.call(sv);
            }
        
            return Lang.SvBreakpoint.matches(sv) ? sv : null;
        }

    }
}