module Sicp.Evaluator {
    export class BaseEvaluator implements Sicp.Lang.IEvaluator {

        private evaluators: Sicp.Lang.IEvaluator[];

        public setEvaluators(evaluators: Sicp.Lang.IEvaluator[]) {
            this.evaluators = evaluators;
        }

        public matches(node: Sicp.Lang.Sv): boolean {
            return true;
        }

        public evaluate(sv: Sicp.Lang.Sv, env: Sicp.Lang.Env): Sicp.Lang.Sv {

            for (let i = 0; i < this.evaluators.length; i++) {
                if (this.evaluators[i].matches(sv))
                    return this.evaluators[i].evaluate(sv, env);
            }
            throw 'cannot evaluate ' + sv.toString();
        }

        public evaluateList(exprs: Sicp.Lang.Sv, env: Sicp.Lang.Env): Sicp.Lang.Sv {
            let res: Sicp.Lang.Sv = Sicp.Lang.SvCons.Nil;

            while (!Sicp.Lang.SvCons.isNil(exprs)) {
                res = this.evaluate(Sicp.Lang.SvCons.car(exprs), env);
                exprs = Sicp.Lang.SvCons.cdr(exprs);
            }
            return res;
        }

        public isTaggedList(node: Sicp.Lang.Sv, tag: string) {
            if (!Sicp.Lang.SvCons.matches(node)) return false;
            const car = Sicp.Lang.SvCons.car(node);
            return Sicp.Lang.SvSymbol.matches(car) && Sicp.Lang.SvSymbol.val(car) === tag;
        }
    }
}