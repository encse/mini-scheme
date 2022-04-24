import { Env } from "./env";
import { Cont } from "./ievaluator";
import { ISourceInfo } from "./parser";

export class Sv implements ISourceInfo {

    ilineStart: number;
    icolStart: number;
    ilineEnd: number;
    icolEnd: number;

    public toDisplayString(): string {
        return this.toString();
    }

    public withSourceInfo(first: ISourceInfo, last: ISourceInfo):Sv {
        this.ilineStart = first.ilineStart;
        this.icolStart = first.icolStart;
        this.ilineEnd = last.ilineEnd;
        this.icolEnd = last.icolEnd;
        return this;
    }
}

export class SvAtom extends Sv {
    public static matches(node: Sv) { return !SvCons.matches(node); }
}

export class SvThunk extends Sv {
    public constructor(private cont: Cont, private val: Sv) { super(); }

    public static matches(node: Sv) { return node instanceof SvThunk; }

    public static cast(sv: Sv): SvThunk {
        if (!SvThunk.matches(sv)) throw new Error("Breakpoint expected");
        return sv as SvThunk;
    }
    public static call(sv: Sv) {
        return SvThunk.cast(sv).cont((sv as SvThunk).val);
    }
}
export class SvBreakpoint extends Sv {
    public constructor(public _val: () => Sv, private _env:Env) { super(); }

    public static matches(node: Sv): node is SvBreakpoint { return node instanceof SvBreakpoint; }

    public static cast(sv: Sv): SvBreakpoint {
        if (!SvBreakpoint.matches(sv)) throw new Error("Breakpoint expected");
        return sv as SvBreakpoint;
    }

    public env(): Env {
        return this._env;
    } 
    public val(): () => Sv {
        return this._val;
    }

    public toString(): string {
        return "T(" + this._val.toString()+")";
    }

    public toDisplayString(): string {
        return '';
    }
}

export class SvCons extends Sv {
    public constructor(private _car: Sv, private _cdr: Sv) { super(); }

    public static cons(car:Sv, cdr:Sv) { return new SvCons(car, cdr); }
    public static Nil = new SvCons(null, null);

    public static listFromRvs(...rvs: Sv[]): Sv {
        return SvCons.listFromRvArray(rvs);
    }

    public static listFromRvArray(rvs: Sv[]) {
        let res = SvCons.Nil;
        for (let j = rvs.length - 1; j >= 0; j--)
            res = new SvCons(rvs[j], res);
        return res;
    }

    public static matches(node: Sv) {
            return node instanceof SvCons;
    }

    public static isNil(node: Sv) {
        return node === SvCons.Nil || (SvCons.matches(node) && SvCons.car(node) === null && SvCons.cdr(node) === null);
    }

    public static val(sv: Sv) {
        return SvAny.cast(sv)._val;
    }

    public static cast(sv: Sv): SvCons {
        if (!SvCons.matches(sv)) throw new Error("Cons expected");
        return sv as SvCons;
    }

    public static car(node: Sv) {
        return SvCons.cast(node)._car;
    }

    public static cdr(node: Sv) {
        return SvCons.cast(node)._cdr;
    }

    static setCar(cons: Sv, newCar: Sv) {
        SvCons.cast(cons)._car = newCar;
        return cons;
    }

    static setCdr(cons: Sv, newCdr: Sv) {
        SvCons.cast(cons)._cdr = newCdr;
        return cons;
    }
    public static cadr(node: Sv) {
        return this.car(this.cdr(node));
    }

    public static cddr(node: Sv) {
        return this.cdr(this.cdr(node));
    }

    public static caddr(node: Sv) {
        return this.car(this.cddr(node));
    }

    public static cdddr(node: Sv) {
        return this.cdr(this.cddr(node));
    }

    public static cddddr(node: Sv) {
        return this.cdr(this.cdddr(node));
    }

    public static cadddr(node: Sv) {
        return this.car(this.cdddr(node));
    }
    public static caddddr(node: Sv) {
        return this.car(this.cddddr(node));
    }
    public static lengthI(lst: Sv) {
        let l = 0;
        while (!this.isNil(lst)) {
            l++;
            lst = this.cdr(lst);
        }
        return new SvNumber(l);
    }

    public toDisplayString(): string {
        return this.toStringI(sv => sv.toDisplayString());
    }

    public toString(): string {
        return this.toStringI(sv => sv.toString());
    }

    public toStringI(dgDisplay:(sv:Sv)=>string): string {
        let st = '(';
        let first = true;

        var rv: Sv = this;
        while (!SvCons.isNil(rv)) {
            if (!first)
                st += " ";
            first = false;

            if (SvCons.matches(rv)) {
                st += dgDisplay(SvCons.car(rv));
                rv = SvCons.cdr(rv);
                if (SvAtom.matches(rv)) {
                    st += " . " + dgDisplay(rv);
                    break;
                }
            } else {
                st += dgDisplay(rv);
                break;
            }
        }
        st += ')';
        return st;
    }

}

export class SvAny extends Sv {
    public constructor(public _val: any) { super(); }

    public static matches(node: Sv) { return node instanceof SvAny; }

    public static val(sv: Sv) {
        return SvAny.cast(sv)._val;
    }

    public static cast(sv: Sv): SvAny {
        if (!SvAny.matches(sv)) throw new Error("any expected");
        return sv as SvAny;
    }

    public toDisplayString(): string {
        return '[any]';
    }
    public toString(): string {
        return this._val.toString();
    }
}

export class SvBool extends Sv {
    public static True = new SvBool(true);
    public static False = new SvBool(false);
    constructor(public _val: boolean) { super(); }

    public static matches(node: Sv) { return node instanceof SvBool; }

    public static isTrue(node: Sv) {
        return SvBool.matches(node) && SvBool.val(node);
    }

    public static isFalse(node: Sv) {
        return SvBool.matches(node) && !SvBool.val(node);
    }

    public static val(sv: Sv) {
        return SvBool.cast(sv)._val;
    }

    public static cast(sv: Sv): SvBool {
        if (!SvBool.matches(sv)) throw new Error("bool expected");
        return sv as SvBool;
    }

    public toDisplayString(): string {
        return this.toString();
    }

    public toString(): string {
        return this._val ? "#t" : "#f";
    }

    static not(car: Sv) {
        return this.isTrue(car) ? SvBool.False : SvBool.True;
    }

    static and(lst: Sv) {
        while (!SvCons.isNil(lst)) {
            if (!this.isTrue(SvCons.car(lst)))
                return SvBool.False;

            lst = SvCons.cdr(lst);
        }

        return SvBool.True;
    }

    static or(lst: Sv) {
        while (!SvCons.isNil(lst)) {
            if (this.isTrue(SvCons.car(lst)))
                return SvBool.True;

            lst = SvCons.cdr(lst);
        }

        return SvBool.False;
    }

    public static fromBoolean(f: boolean) {
        return f ? SvBool.True : SvBool.False;
    }
}

export class SvString extends Sv {
    public constructor(public _val: string) { super(); }

    public static matches(node: Sv) { return node instanceof SvString; }

    public static val(sv: Sv) {
        return SvString.cast(sv)._val;
    }

    public static cast(sv: Sv): SvString {
        if (!SvString.matches(sv)) throw new Error("string expected");
        return sv as SvString;
    }

    public toDisplayString(): string {
        return this._val;
    }

    public toString(): string {
        return JSON.stringify(this._val);
    }
}

export class SvNumber extends Sv {
    public constructor(public _val: number) { super(); }

    public static matches(node: Sv) { return node instanceof SvNumber; }

    public static val(node: Sv) {
        return SvNumber.cast(node)._val;
    }

    public static cast(sv: Sv): SvNumber {
        if (!SvNumber.matches(sv)) throw new Error("Number expected");
        return sv as SvNumber;
    }

    public toDisplayString(): string {
        return this.toString();
    }


    public toString(): string {
        return "" + this._val;
    }
}

export class SvSymbol extends Sv {
    public constructor(public _val: string) { super(); }

    public static matches(node: Sv) { return node instanceof SvSymbol; }

    public static val(node: Sv) {
        return SvSymbol.cast(node)._val;
    }

    public static cast(sv: Sv): SvSymbol {
        if (!SvSymbol.matches(sv)) throw new Error("Symbol expected");
        return sv as SvSymbol;
    }

    public toDisplayString(): string {
        return this.toString();
    }

    public toString(): string {
        return this._val;
    }

    
}