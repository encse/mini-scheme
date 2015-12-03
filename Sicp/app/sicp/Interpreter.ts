module Sicp.Lang {
    export class Interpreter {
        
        public evaluateString(st: string, log: (st: string) => void) {
            let parser = new Lang.Parser();
            let exprs = parser.parse(st);
            let env = new Env(null);
            env.define('cons', new SvCons (new SvSymbol('primitive'), new SvAny((args: any) => new SvCons(SvCons.car(args), SvCons.cadr(args)))));
            env.define('null?', new SvCons(new SvSymbol('primitive'), new SvAny((args: any) => new SvBool(SvCons.isNil(SvCons.car(args))))));
            env.define('car', new SvCons  (new SvSymbol('primitive'), new SvAny((args: any) => SvCons.car(SvCons.car(args)))));
            env.define('cdr', new SvCons  (new SvSymbol('primitive'), new SvAny((args: any) => SvCons.cdr(SvCons.car(args)))));
            env.define('=', new SvCons(new SvSymbol('primitive'), new SvAny((args: any) => new SvBool(SvNumber.val(SvCons.car(args)) === SvNumber.val(SvCons.cadr(args))) )));
            env.define('*', new SvCons(new SvSymbol('primitive'), new SvAny((args: any) =>   new SvNumber(SvNumber.val(SvCons.car(args)) * SvNumber.val(SvCons.cadr(args))) )));
            env.define('-', new SvCons(new SvSymbol('primitive'), new SvAny((args: any) => new SvNumber(SvNumber.val(SvCons.car(args)) - SvNumber.val(SvCons.cadr(args))))));
            env.define('+', new SvCons(new SvSymbol('primitive'), new SvAny((args: any) => new SvNumber(SvNumber.val(SvCons.car(args)) + SvNumber.val(SvCons.cadr(args))))));
            env.define('/', new SvCons(new SvSymbol('primitive'), new SvAny((args: any) => new SvNumber(SvNumber.val(SvCons.car(args)) / SvNumber.val(SvCons.cadr(args))))));
            env.define('zero?', new SvCons(new SvSymbol('primitive'), new SvAny((args: any) => new SvBool(SvNumber.val(SvCons.car(args)) === 0))));
            env.define('display', new SvCons(new SvSymbol('primitive'), new SvAny((args: any) => { log(args.toString()); return SvCons.Nil; } )));

            var evaluator = new Evaluator.BaseEvaluator();
            evaluator.setEvaluators([
                new Evaluator.ThunkEvaluator(evaluator),
                new Evaluator.SelfEvaluator(),
                new Evaluator.VariableEvaluator(),
                new Evaluator.LetEvaluator(evaluator),
                new Evaluator.QuoteEvaluator(evaluator),
                new Evaluator.CondEvaluator(evaluator),
                new Evaluator.DefineEvaluator(evaluator),
                new Evaluator.AssignmentEvaluator(evaluator),
                new Evaluator.IfEvaluator(evaluator),
                new Evaluator.BeginEvaluator(evaluator),
                new Evaluator.LambdaEvaluator(evaluator),
                new Evaluator.CallCCEvaluator(evaluator),
                new Evaluator.ApplicationEvaluator(evaluator)
            ]);

            return evaluator.evaluateList(exprs, new Env(env), sv => sv);


        }

        public step(sv: Sv): Sv {
            if (Lang.SvThunk.matches(sv))
                return Lang.SvThunk.val(sv)();
            return null;
            
        }

    }
}