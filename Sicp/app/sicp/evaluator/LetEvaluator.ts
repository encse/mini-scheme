module Sicp.Evaluator {
    export class LetEvaluator implements Lang.IEvaluator {
        constructor(private evaluator: Sicp.Evaluator.BaseEvaluator) { }

        public matches(node: Lang.Sv): boolean {
            return LetEvaluator.isLet(node) || LetEvaluator.isLetStar(node) || LetEvaluator.isLetrec(node);
        }

        public evaluate(sv: Lang.Sv, env: Lang.Env, cont: Lang.Cont): Lang.Sv {
            const defs = LetEvaluator.getDefs(sv);
            let loop: Lang.Cont;
            let newEnv = new Lang.Env(env);

            if (LetEvaluator.isLet(sv)) {
                var toBeDefined:[[Lang.Sv, Lang.Sv]] = <[[Lang.Sv, Lang.Sv]]>[];
                loop = (defs: Lang.Sv) => {
                    if (Lang.SvCons.isNil(defs)) {
                        toBeDefined.forEach(([svSymbol, svValue]: [Lang.Sv, Lang.Sv]) => {
                            newEnv.define(Lang.SvSymbol.val(svSymbol), svValue);
                        });
                        return this.evaluator.evaluateList(LetEvaluator.getBody(sv), newEnv, cont);
                    } else {
                        const def = Lang.SvCons.car(defs);
                        var svSymbol = Lang.SvCons.car(def);
                        return this.evaluator.evaluate(Lang.SvCons.cadr(def), env, (svVal) => {
                            toBeDefined.push([svSymbol, svVal]);
                            var newDefs = Lang.SvCons.cdr(defs);
                            return new Lang.SvThunk(() => loop(newDefs));
                        });
                    }
                };
            }
            else if (LetEvaluator.isLetStar(sv)) {
                loop = (defs: Lang.Sv) => {
                    if (Lang.SvCons.isNil(defs)) {
                        return this.evaluator.evaluateList(LetEvaluator.getBody(sv), newEnv, cont);
                    } else {
                        const def = Lang.SvCons.car(defs);
                        var svSymbol = Lang.SvCons.car(def);
                        return this.evaluator.evaluate(Lang.SvCons.cadr(def), newEnv, (svVal) => {
                            newEnv = new Lang.Env(newEnv);
                            newEnv.define(Lang.SvSymbol.val(svSymbol), svVal);
                            var newDefs = Lang.SvCons.cdr(defs);
                            return new Lang.SvThunk(() => loop(newDefs));
                        });
                    }
                };
            }
            else if (LetEvaluator.isLetrec(sv)) {
                let defsT = defs;
                while (!Lang.SvCons.isNil(defsT)) {
                    let def = Lang.SvCons.car(defsT);
                    newEnv.define(Lang.SvSymbol.val(Lang.SvCons.car(def)), Lang.SvCons.Nil);
                    defsT = Lang.SvCons.cdr(defsT);
                }

                loop = (defs: Lang.Sv) => {
                    if (Lang.SvCons.isNil(defs)) {
                        return this.evaluator.evaluateList(LetEvaluator.getBody(sv), newEnv, cont);
                    } else {
                        const def = Lang.SvCons.car(defs);
                        var svSymbol = Lang.SvCons.car(def);
                        return this.evaluator.evaluate(Lang.SvCons.cadr(def), newEnv, (svVal) => {
                            newEnv.set(Lang.SvSymbol.val(svSymbol), svVal);
                            var newDefs = Lang.SvCons.cdr(defs);
                            return new Lang.SvThunk(() => loop(newDefs));
                        });
                    }
                };
            }
            else
                throw 'uknown let kind';

            return new Lang.SvThunk(() => loop(defs));
            
        }

        static isLet(node: Sicp.Lang.Sv): boolean { return BaseEvaluator.isTaggedList(node, 'let'); }
        static isLetStar(node: Sicp.Lang.Sv): boolean { return BaseEvaluator.isTaggedList(node, 'let*'); }
        static isLetrec(node: Sicp.Lang.Sv): boolean { return BaseEvaluator.isTaggedList(node, 'letrec'); }

        static getDefs(sv: Lang.Sv) {
            return Lang.SvCons.cadr(sv);
        }

        static getBody(sv: Sicp.Lang.Sv): Sicp.Lang.Sv { return Lang.SvCons.cddr(sv); }
    }
}