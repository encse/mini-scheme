module Sicp.Lang {
    export type Cont = (sv: Sv) => SvCont;
    export type SvCont = [Sv, Cont];

    export interface IEvaluator {
        matches(sv:Sv):boolean;
        evaluate(sv: Sv, env: Env, cont: Cont): SvCont;
    }
}