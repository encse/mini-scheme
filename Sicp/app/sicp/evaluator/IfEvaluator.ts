module Sicp.Evaluator {
    export class IfEvaluator implements Lang.IEvaluator {
        constructor(private evaluator: Sicp.Evaluator.BaseEvaluator) {  }

        public matches(node: Sicp.Lang.Sv): boolean {
            return this.evaluator.isTaggedList(node, 'if');
        }

        public evaluate(node: Sicp.Lang.Sv, env: Sicp.Lang.Env): Sicp.Lang.Sv {
            return Sicp.Lang.SvBool.isTrue(this.evaluator.evaluate(this.getIfPredicate(node), env)) ?
                this.evaluator.evaluate(this.getIfConsequent(node), env) :
                this.evaluator.evaluate(this.getIfAlternative(node), env);
        }

        getIfPredicate(expr: any) { return Sicp.Lang.SvCons.cadr(expr); }
        getIfConsequent(expr: any) { return Sicp.Lang.SvCons.caddr(expr); }
        getIfAlternative(expr: any) { return !Sicp.Lang.SvCons.isNil(Sicp.Lang.SvCons.cdddr(expr)) ? Sicp.Lang.SvCons.cadddr(expr) : Sicp.Lang.SvCons.Nil; }

    }
}