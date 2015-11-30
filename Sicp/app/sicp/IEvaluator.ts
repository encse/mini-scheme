module Sicp.Lang {
    export type Cont = (sv: Sv) => Pcont;
    export type Pcont = [Sv, Cont];

    export interface IEvaluator {
        matches(sv:Sv):boolean;
        evaluate(sv: Sv, env: Env, cont: Cont): Pcont;
    }
}