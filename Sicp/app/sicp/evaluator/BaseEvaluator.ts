module Sicp.Evaluator {
   
    export class BaseEvaluator implements Sicp.Lang.IEvaluator {

        private evaluators: Sicp.Lang.IEvaluator[];

        public setEvaluators(evaluators: Sicp.Lang.IEvaluator[]) {
            this.evaluators = evaluators;
        }

        public matches(node: Lang.Sv): boolean {
            return true;
        }

        public evaluate(sv: Lang.Sv, env: Sicp.Lang.Env, cont: Sicp.Lang.Cont): Lang.Sv {

            for (var i = 0; i < this.evaluators.length;i++) {
                if (this.evaluators[i].matches(sv))
                    return this.evaluators[i].evaluate(sv, env, cont);
            }
            throw 'cannot evaluate ' + sv.toString();
        }

        public evaluateList(exprs: Lang.Sv, env: Sicp.Lang.Env, cont: Sicp.Lang.Cont): Lang.Sv {

            var lastSv: Lang.Sv = Lang.SvCons.Nil;
            var loop = (exprs: Lang.Sv) => {
                if (Lang.SvCons.isNil(exprs))
                    return new Lang.SvThunk( () => cont(lastSv));

                return this.evaluate(Sicp.Lang.SvCons.car(exprs), env, (sv: Lang.Sv) => {
                    lastSv = sv;
                    var nextExprs = Lang.SvCons.cdr(exprs);
                    return new Lang.SvThunk(() => loop(nextExprs));
                });
            };

            return new Lang.SvThunk( () => loop(exprs));
        }

        public static isTaggedList(node: Lang.Sv, tag: string) {
            if (!Lang.SvCons.matches(node)) return false;
            var car = Lang.SvCons.car(node);
            return Lang.SvSymbol.matches(car) && Lang.SvSymbol.val(car) === tag;
        }
    }
}