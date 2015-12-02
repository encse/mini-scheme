module Sicp.Evaluator {
  
    export class DefineEvaluator implements Lang.IEvaluator {
        constructor(private evaluator: Sicp.Evaluator.BaseEvaluator) {  }

        public matches(node: Lang.Sv): boolean {
            return Evaluator.BaseEvaluator.isTaggedList(node, 'define');
        }

        public evaluate(sv: Lang.Sv, env: Lang.Env, cont: Lang.Cont): Lang.Sv {

            if (Lang.SvCons.matches(this.getHead(sv))) {
                //implicit lambda definition
                var lambda = LambdaEvaluator.createCompoundProcedure(this.getLambdaParameters(sv), this.getLambdaBody(sv), env);
                env.define(
                    Lang.SvSymbol.val(this.getFunctionName(sv)),
                    lambda);
                return cont(lambda);
            }
            else {
                return this.evaluator.evaluate(this.getValue(sv), env, (svValue: Lang.Sv):Lang.Sv => {
                    env.define(
                        Lang.SvSymbol.val(this.getVariable(sv)),
                        svValue);
                    return cont(svValue);
                });
            }
        }

        getHead(sv: Lang.Sv): Lang.Sv { return Lang.SvCons.cadr(sv); }
        getVariable(sv: Lang.Sv): Lang.Sv { return this.getHead(sv); }
        getValue(sv: Lang.Sv): Lang.Sv { return Lang.SvCons.caddr(sv); }

        getFunctionName(sv: Lang.Sv): Lang.Sv { return Lang.SvCons.car(this.getHead(sv)); }
        getLambdaParameters(sv: Lang.Sv) { return Lang.SvCons.cdr(this.getHead(sv)); }
        getLambdaBody(sv: Lang.Sv) { return Lang.SvCons.cddr(sv); }
    }
}