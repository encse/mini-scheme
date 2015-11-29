
module Sicp.Evaluator {

    export class AssignmentEvaluator implements Sicp.Lang.IEvaluator {
        constructor(private evaluator: Sicp.Evaluator.BaseEvaluator) {  }

        public matches(sv: Sicp.Lang.Sv): boolean {
            return this.evaluator.isTaggedList(sv, 'set!');
        }

        public evaluate(sv: Sicp.Lang.Sv, env: Sicp.Lang.Env): Sicp.Lang.Sv {
            env.set(
                Sicp.Lang.SvSymbol.val(this.getVariable(sv)),
                this.evaluator.evaluate(this.getValue(sv), env));
            return Sicp.Lang.SvCons.Nil;
        }

        getVariable(node: Sicp.Lang.Sv): Sicp.Lang.Sv { return Sicp.Lang.SvCons.cadr(node); }
        getValue(node: Sicp.Lang.Sv): Sicp.Lang.Sv { return Sicp.Lang.SvCons.caddr(node); }
    }
}