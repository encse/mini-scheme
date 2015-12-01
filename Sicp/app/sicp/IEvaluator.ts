module Sicp.Lang {
    export type Cont = (sv: Sv) => Sv;

    export interface IEvaluator {
        matches(sv:Sv):boolean;
        evaluate(sv: Sv, env: Env, cont: Cont): Sv;
    }
}