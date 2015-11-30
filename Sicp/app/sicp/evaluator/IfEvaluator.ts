module Sicp.Evaluator {
    
    export class IfEvaluator implements Lang.IEvaluator {
        constructor(private evaluator: Evaluator.BaseEvaluator) {  }

        public matches(node: Lang.Sv): boolean {
            return this.evaluator.isTaggedList(node, 'if');
        }

        public evaluate(sv: Lang.Sv, env: Lang.Env, cont: Lang.Cont): Lang.Pcont {
            return this.evaluator.evaluate(this.getIfPredicate(sv), env, (svCond: Lang.Sv) => {
                return Lang.SvBool.isTrue(svCond) ?
                    this.evaluator.evaluate(this.getIfConsequent(sv), env, cont):
                    this.evaluator.evaluate(this.getIfAlternative(sv), env, cont);
            });
        }

        getIfPredicate(expr: any) { return Sicp.Lang.SvCons.cadr(expr); }
        getIfConsequent(expr: any) { return Sicp.Lang.SvCons.caddr(expr); }
        getIfAlternative(expr: any) { return !Sicp.Lang.SvCons.isNil(Sicp.Lang.SvCons.cdddr(expr)) ? Sicp.Lang.SvCons.cadddr(expr) : Sicp.Lang.SvCons.Nil; }

    }
}