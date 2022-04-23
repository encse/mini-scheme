import { Env } from "../Env";
import { IEvaluator, Cont } from "../IEvaluator";
import { Sv, SvCons, SvSymbol } from "../lang/Sv";
import BaseEvaluator from "./BaseEvaluator";

export default class LetEvaluator implements IEvaluator {
    constructor(private evaluator: BaseEvaluator) { }

    public matches(node: Sv): boolean {
        return LetEvaluator.isLet(node) || LetEvaluator.isLetStar(node) || LetEvaluator.isLetrec(node);
    }

    public evaluate(sv: Sv, env: Env, cont: Cont): Sv {

        if (LetEvaluator.isLet(sv)) {
            const loop = (letEnv: Env, defs: Sv): Sv => {
                if (SvCons.isNil(defs)) 
                    return this.evaluator.evaluateList(LetEvaluator.getBody(sv), letEnv, cont);
                
                const def = SvCons.car(defs);
                const svSymbol = SvCons.car(def);
                return this.evaluator.evaluate(SvCons.cadr(def), env, (svValue) => {
                    letEnv.define(SvSymbol.val(svSymbol), svValue);
                    return loop(letEnv, SvCons.cdr(defs));
                });
            };
            return loop(new Env(env), LetEvaluator.getDefs(sv));

        }
        else if (LetEvaluator.isLetStar(sv)) {
            const loop = (letEnv:Env, defs: Sv): Sv => {
                if (SvCons.isNil(defs)) 
                    return this.evaluator.evaluateList(LetEvaluator.getBody(sv), letEnv, cont);
                
                const def = SvCons.car(defs);
                const svSymbol = SvCons.car(def);
                return this.evaluator.evaluate(SvCons.cadr(def), letEnv, (svValue) => {
                    letEnv = new Env(letEnv);
                    letEnv.setOrDefine(SvSymbol.val(svSymbol), svValue);
                    return loop(letEnv, SvCons.cdr(defs));
                });
            };
            return loop(env, LetEvaluator.getDefs(sv));
        }
        else if (LetEvaluator.isLetrec(sv)) {
            const newEnv = new Env(env); 
            let defsT = LetEvaluator.getDefs(sv);
            while (!SvCons.isNil(defsT)) {
                const def = SvCons.car(defsT);
                newEnv.define(SvSymbol.val(SvCons.car(def)), SvCons.Nil);
                defsT = SvCons.cdr(defsT);
            }

            const loop = (letEnv: Env, defs: Sv): Sv => {
                if (SvCons.isNil(defs))
                    return this.evaluator.evaluateList(LetEvaluator.getBody(sv), letEnv, cont);
                
                const def = SvCons.car(defs);
                const svSymbol = SvCons.car(def);
                return this.evaluator.evaluate(SvCons.cadr(def), letEnv, (svValue) => {
                    letEnv.set(SvSymbol.val(svSymbol), svValue);
                    return loop(letEnv, SvCons.cdr(defs));
                });
            };

            return loop(newEnv, LetEvaluator.getDefs(sv));
        }
        else
            throw 'uknown let kind';

        
    }

    static isLet(node: Sv): boolean { return BaseEvaluator.isTaggedList(node, 'let'); }
    static isLetStar(node: Sv): boolean { return BaseEvaluator.isTaggedList(node, 'let*'); }
    static isLetrec(node: Sv): boolean { return BaseEvaluator.isTaggedList(node, 'letrec'); }

    static getDefs(sv: Sv) {
        return SvCons.cadr(sv);
    }

    static getBody(sv: Sv): Sv { return SvCons.cddr(sv); }
}