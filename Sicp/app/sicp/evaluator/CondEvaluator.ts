module Sicp.Evaluator {
    export class CondEvaluator implements Sicp.Lang.IEvaluator {
        constructor(private evaluator: Sicp.Evaluator.BaseEvaluator) { }

        public matches(node: Sicp.Lang.Sv): boolean {
            return this.evaluator.isTaggedList(node, 'cond');
        }

        private getCondClauses(cond: Sicp.Lang.Sv) { return Sicp.Lang.SvCons.cdr(cond); }
        private isCondElseClause(clause: Sicp.Lang.Sv) { return this.evaluator.isTaggedList(clause, "else"); }
        private getCondPredicate(clause: Sicp.Lang.Sv) { return Sicp.Lang.SvCons.car(clause); }
        private getCondActions(clause: Sicp.Lang.Sv) { return Sicp.Lang.SvCons.cdr(clause); }

        public evaluate(node: Sicp.Lang.Sv, env: Sicp.Lang.Env): Sicp.Lang.Sv {
            let clauses = this.getCondClauses(node);
            while (!Sicp.Lang.SvCons.isNil(clauses)) {
                let clause = Sicp.Lang.SvCons.car(clauses);
                if (this.isCondElseClause(clause) || Sicp.Lang.SvBool.isTrue(this.evaluator.evaluate(Sicp.Lang.SvCons.car(clause), env)))
                    return this.evaluator.evaluateList(this.getCondActions(clause), env);
                clauses = Sicp.Lang.SvCons.cdr(clauses);
            }
            return Sicp.Lang.SvCons.Nil;
        }
    }
}