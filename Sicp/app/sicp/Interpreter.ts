module Sicp.Lang {
    export class Interpreter {
        
        public evaluateString(st: string, log:(st:string)=>void) {
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
            env.define('trace', new SvCons(new SvSymbol('primitive'), new SvAny((args: any) => { log(args.toString()); return SvCons.Nil; } )));

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
                new Sicp.Evaluator.CallCCEvaluator(evaluator),
                new Sicp.Evaluator.ApplicationEvaluator(evaluator)
            ]);

            var done = false;
            var res: Sv;
            var svcont: Pcont = evaluator.evaluateList(exprs, new Env(env), (sv: Sv) => {
                res = sv;
                done = true;
                return null;
            });
            while (!done) 
                svcont = svcont[1](svcont[0]);
            
            return res.toString();
        }

    }
}