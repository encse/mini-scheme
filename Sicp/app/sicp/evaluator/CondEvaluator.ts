module Sicp.Evaluator {
  

    export class CondEvaluator implements Lang.IEvaluator {
        constructor(private evaluator: Evaluator.BaseEvaluator) { }

        public matches(node: Lang.Sv): boolean {
            return Evaluator.BaseEvaluator.isTaggedList(node, 'cond');
        }

        private getCondClauses(cond: Lang.Sv) { return Lang.SvCons.cdr(cond); }
        private isCondElseClause(clause: Lang.Sv) { return Evaluator.BaseEvaluator.isTaggedList(clause, "else"); }
        private getCondPredicate(clause: Lang.Sv) { return Lang.SvCons.car(clause); }
        private getCondActions(clause: Lang.Sv) { return Lang.SvCons.cdr(clause); }

        public evaluate(sv: Lang.Sv, env: Lang.Env, cont: Lang.Cont): Lang.Sv {

            var loop = (clauses: Lang.Sv) => {
                if (Lang.SvCons.isNil(clauses))
                    return new Lang.SvThunk(cont, clauses);

                var clause = Lang.SvCons.car(clauses);
                if (this.isCondElseClause(clause))
                    return this.evaluator.evaluateList(this.getCondActions(clause), env, cont);

                return this.evaluator.evaluate(Lang.SvCons.car(clause), env, (svCond: Lang.Sv) => {
                    if (Lang.SvBool.isTrue(svCond))
                        return this.evaluator.evaluateList(this.getCondActions(clause), env, cont);
                    else {
                        var nextClauses = Lang.SvCons.cdr(clauses);
                        return loop(nextClauses);
                    }
                });
            };

            var clauses = this.getCondClauses(sv);
            return loop(clauses);
        }
    }
}