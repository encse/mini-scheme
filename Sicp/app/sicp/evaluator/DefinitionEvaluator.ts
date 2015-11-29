module Sicp.Evaluator {
    export class DefinitionEvaluator implements Lang.IEvaluator {
        constructor(private evaluator: Sicp.Evaluator.BaseEvaluator) {  }

        public matches(node: Sicp.Lang.Sv): boolean {
            return this.evaluator.isTaggedList(node, 'define');
        }

        public evaluate(node: Sicp.Lang.Sv, env: Sicp.Lang.Env): Sicp.Lang.Sv {
            env.define(
                Sicp.Lang.SvSymbol.val(this.getVariable(node)),
                this.evaluator.evaluate(this.getValue(node), env));
            return Sicp.Lang.SvCons.Nil;
        }

        getVariable(node: Sicp.Lang.Sv): Sicp.Lang.Sv { return Sicp.Lang.SvCons.cadr(node); }
        getValue(node: Sicp.Lang.Sv): Sicp.Lang.Sv { return Sicp.Lang.SvCons.caddr(node); }
    }
}