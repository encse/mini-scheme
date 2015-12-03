module Sicp.Evaluator {
    export class LetEvaluator implements Lang.IEvaluator {
        constructor(private evaluator: Sicp.Evaluator.BaseEvaluator) { }

        public matches(node: Lang.Sv): boolean {
            return LetEvaluator.isLet(node) || LetEvaluator.isLetStar(node) || LetEvaluator.isLetrec(node);
        }

        public evaluate(sv: Lang.Sv, env: Lang.Env, cont: Lang.Cont): Lang.Sv {

            if (LetEvaluator.isLet(sv)) {
                const loop = (letEnv: Lang.Env, defs: Lang.Sv) => {
                    if (Lang.SvCons.isNil(defs)) 
                        return this.evaluator.evaluateList(LetEvaluator.getBody(sv), letEnv, cont);
                    
                    const def = Lang.SvCons.car(defs);
                    const svSymbol = Lang.SvCons.car(def);
                    return this.evaluator.evaluate(Lang.SvCons.cadr(def), env, (svValue) => {
                        letEnv.define(Lang.SvSymbol.val(svSymbol), svValue);
                        return loop(letEnv, Lang.SvCons.cdr(defs));
                    });
                };
                return loop(new Lang.Env(env), LetEvaluator.getDefs(sv));

            }
            else if (LetEvaluator.isLetStar(sv)) {
                const loop = (letEnv:Lang.Env, defs: Lang.Sv) => {
                    if (Lang.SvCons.isNil(defs)) 
                        return this.evaluator.evaluateList(LetEvaluator.getBody(sv), letEnv, cont);
                    
                    const def = Lang.SvCons.car(defs);
                    const svSymbol = Lang.SvCons.car(def);
                    return this.evaluator.evaluate(Lang.SvCons.cadr(def), letEnv, (svValue) => {
                        letEnv = new Lang.Env(letEnv);
                        letEnv.setOrDefine(Lang.SvSymbol.val(svSymbol), svValue);
                        return loop(letEnv, Lang.SvCons.cdr(defs));
                    });
                };
                return loop(env, LetEvaluator.getDefs(sv));
            }
            else if (LetEvaluator.isLetrec(sv)) {
                const newEnv = new Lang.Env(env); 
                let defsT = LetEvaluator.getDefs(sv);
                while (!Lang.SvCons.isNil(defsT)) {
                    const def = Lang.SvCons.car(defsT);
                    newEnv.define(Lang.SvSymbol.val(Lang.SvCons.car(def)), Lang.SvCons.Nil);
                    defsT = Lang.SvCons.cdr(defsT);
                }

                const loop = (letEnv: Lang.Env, defs: Lang.Sv) => {
                    if (Lang.SvCons.isNil(defs))
                        return this.evaluator.evaluateList(LetEvaluator.getBody(sv), letEnv, cont);
                  
                    const def = Lang.SvCons.car(defs);
                    const svSymbol = Lang.SvCons.car(def);
                    return this.evaluator.evaluate(Lang.SvCons.cadr(def), letEnv, (svValue) => {
                        letEnv.set(Lang.SvSymbol.val(svSymbol), svValue);
                        return loop(letEnv, Lang.SvCons.cdr(defs));
                    });
                };

                return loop(newEnv, LetEvaluator.getDefs(sv));
            }
            else
                throw 'uknown let kind';

            
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