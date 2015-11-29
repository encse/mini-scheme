module Sicp.Lang {
    export class Interpreter {
        
        public evaluateString(st: string) {
            let parser = new Lang.Parser();
            let exprs = parser.parse(st);
            let env = new Env(null);
            env.define('cons', new SvCons (new SvSymbol('primitive'), new SvAny((args: any) => new SvCons(SvCons.car(args), SvCons.cadr(args)))));
            env.define('null?', new SvCons(new SvSymbol('primitive'), new SvAny((args: any) => SvCons.isNil(SvCons.car(args)))));
            env.define('car', new SvCons  (new SvSymbol('primitive'), new SvAny((args: any) => SvCons.car(SvCons.car(args)))));
            env.define('cdr', new SvCons  (new SvSymbol('primitive'), new SvAny((args: any) => SvCons.cdr(SvCons.car(args)))));
            env.define('=', new SvCons(new SvSymbol('primitive'), new SvAny((args: any) => new SvBool(SvNumber.val(SvCons.car(args)) === SvNumber.val(SvCons.cadr(args))) )));
            env.define('*', new SvCons(new SvSymbol('primitive'), new SvAny((args: any) =>   new SvNumber(SvNumber.val(SvCons.car(args)) * SvNumber.val(SvCons.cadr(args))) )));
            env.define('-', new SvCons(new SvSymbol('primitive'), new SvAny((args: any) => new SvNumber(SvNumber.val(SvCons.car(args)) - SvNumber.val(SvCons.cadr(args))))));
            env.define('+', new SvCons(new SvSymbol('primitive'), new SvAny((args: any) => new SvNumber(SvNumber.val(SvCons.car(args)) - SvNumber.val(SvCons.cadr(args))))));
            env.define('/', new SvCons(new SvSymbol('primitive'), new SvAny((args: any) => new SvNumber(SvNumber.val(SvCons.car(args)) / SvNumber.val(SvCons.cadr(args))))));

            var evaluator = new Sicp.Evaluator.BaseEvaluator();
            evaluator.setEvaluators([
                new Sicp.Evaluator.SelfEvaluator(),
                new Evaluator.VariableEvaluator(),
                new Sicp.Evaluator.QuoteEvaluator(evaluator),
                new Sicp.Evaluator.CondEvaluator(evaluator),
                new Sicp.Evaluator.DefinitionEvaluator(evaluator),
                new Sicp.Evaluator.AssignmentEvaluator(evaluator),
                new Sicp.Evaluator.IfEvaluator(evaluator),
                new Sicp.Evaluator.BeginEvaluator(evaluator),
                new Sicp.Evaluator.LambdaEvaluator(evaluator),
                new Sicp.Evaluator.ApplicationEvaluator(evaluator)
            ]);
            var res = evaluator.evaluateList(exprs, new Env(env));
            return res.toString();
        }

    }
}