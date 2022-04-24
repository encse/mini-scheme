import { Env } from "./Env";
import { Sv } from "./Sv";

export type Cont = (sv: Sv) => Sv;

export interface IEvaluator {
    matches(sv:Sv):boolean;
    evaluate(sv: Sv, env: Env, cont: Cont): Sv;
}