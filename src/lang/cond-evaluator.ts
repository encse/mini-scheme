import { Env } from "./env";
import { IEvaluator, Cont } from "./ievaluator";
import { Sv, SvCons, SvThunk, SvBool } from "./sv";
import BaseEvaluator from "./base-evaluator";

export default class CondEvaluator implements IEvaluator {
    constructor(private evaluator: BaseEvaluator) { }

    public matches(node: Sv): boolean {
        return BaseEvaluator.isTaggedList(node, 'cond');
    }

    private getCondClauses(cond: Sv) { return SvCons.cdr(cond); }
    private isCondElseClause(clause: Sv) { return BaseEvaluator.isTaggedList(clause, "else"); }
    private getCondPredicate(clause: Sv) { return SvCons.car(clause); }
    private getCondActions(clause: Sv) { return SvCons.cdr(clause); }

    public evaluate(sv: Sv, env: Env, cont: Cont): Sv {

        var loop = (clauses: Sv): Sv => {
            if (SvCons.isNil(clauses))
                return new SvThunk(cont, clauses);

            var clause = SvCons.car(clauses);
            if (this.isCondElseClause(clause))
                return this.evaluator.evaluateList(this.getCondActions(clause), env, cont);

            return this.evaluator.evaluate(SvCons.car(clause), env, (svCond: Sv) => {
                if (SvBool.isTrue(svCond))
                    return this.evaluator.evaluateList(this.getCondActions(clause), env, cont);
                else {
                    var nextClauses = SvCons.cdr(clauses);
                    return loop(nextClauses);
                }
            });
        };

        var clauses = this.getCondClauses(sv);
        return loop(clauses);
    }
}