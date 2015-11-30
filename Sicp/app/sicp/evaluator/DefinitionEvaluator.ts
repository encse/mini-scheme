module Sicp.Evaluator {
  
    export class DefinitionEvaluator implements Lang.IEvaluator {
        constructor(private evaluator: Sicp.Evaluator.BaseEvaluator) {  }

        public matches(node: Lang.Sv): boolean {
            return this.evaluator.isTaggedList(node, 'define');
        }

        public evaluate(sv: Lang.Sv, env: Lang.Env, cont: Lang.Cont): Lang.Pcont {

            return this.evaluator.evaluate(this.getValue(sv), env, (svValue: Lang.Sv) => {
                env.define(
                    Lang.SvSymbol.val(this.getVariable(sv)),
                    svValue);
                return <Lang.Pcont>[svValue, cont];
            });
        }

        getVariable(sv: Lang.Sv): Lang.Sv { return Lang.SvCons.cadr(sv); }
        getValue(sv: Lang.Sv): Lang.Sv { return Lang.SvCons.caddr(sv); }
    }
}