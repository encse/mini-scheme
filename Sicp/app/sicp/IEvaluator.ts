module Sicp.Lang {
    export interface IEvaluator {
        matches(sv:Sv):boolean;
        evaluate(sv: Sv, env: Env): Sv;
    }
}