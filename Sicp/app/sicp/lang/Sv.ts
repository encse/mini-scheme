namespace Sicp.Lang {
    export class Sv {
        marker() {};
    }
    
    export class SvAtom extends Sv {
        public static matches(node: Sv) { return !SvCons.matches(node); }
    }

    export class SvThunk extends Sv {
        public constructor(public _val: () => Sv) { super(); }

        public static matches(node: Sv) { return node instanceof SvThunk; }

        public static val(node: Sv): () => Sv {
            if (!SvThunk.matches(node)) throw "Thunk expected";
            return (<SvThunk>node)._val;
        }

        public toString(): string {
            return "T(" + this._val.toString()+")";
        }
    }

    export class SvCons extends Sv {
        public constructor(private _car: Sv, private _cdr: Sv) { super(); }

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

        public static matches(node: Sv) { return node instanceof SvCons; }

        public static isNil(node: Sv) {
            return node === SvCons.Nil || (SvCons.matches(node) && SvCons.car(node) === null && SvCons.cdr(node) === null);
        }

        public static car(node: Sv) {
            if (!SvCons.matches(node)) throw "Cons expected";
            return (<SvCons>node)._car;
        }

        public static cdr(node: Sv) {
            if (!SvCons.matches(node)) throw "Cons expected";
            return (<SvCons>node)._cdr;
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

        public static cadddr(node: Sv) {
            return this.car(this.cdddr(node));
        }

        public toString(): string {
            let st = '(';
            let first = true;

            var rv: Sv = this;
            while (!SvCons.isNil(rv)) {
                if (!first)
                    st += " ";
                first = false;

                if (SvCons.matches(rv)) {
                    st += SvCons.car(rv).toString();
                    rv = SvCons.cdr(rv);
                    if (SvAtom.matches(rv)) {
                        st += " . " + rv.toString();
                        break;
                    }
                } else {
                    st += rv.toString();
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

        public static val(node: Sv) {
            if (!SvAny.matches(node)) throw "SvAny expected";
            return (<SvAny>node)._val;
        }

        public toString(): string {
            return this._val.toString();
        }
    }

    export class SvBool extends Sv {
        public constructor(public _val: boolean) { super(); }

        public static matches(node: Sv) { return node instanceof SvBool; }

        public static isTrue(node: Sv) {
            return SvBool.matches(node) && SvBool.val(node);
        }

        public static isFalse(node: Sv) {
            return SvBool.matches(node) && !SvBool.val(node);
        }

        public static val(node: Sv) {
            if (!SvBool.matches(node)) throw "bool expected";
            return (<SvBool>node)._val;
        }

        public toString(): string {
            return this._val ? "#t" : "#f";
        }
    }

    export class SvString extends Sv {
        public constructor(public _val: string) { super(); }

        public static matches(node: Sv) { return node instanceof SvString; }

        public static val(node: Sv) {
            if (!SvString.matches(node)) throw "string expected";
            return (<SvString>node)._val;
        }

        public toString(): string {
            return JSON.stringify(this._val);
        }
    }

    export class SvNumber extends Sv {
        public constructor(public _val: number) { super(); }

        public static matches(node: Sv) { return node instanceof SvNumber; }

        public static val(node: Sv) {
            if (!SvNumber.matches(node)) throw "Number expected";
            return (<SvNumber>node)._val;
        }

        public toString(): string {
            return "" + this._val;
        }
    }

    export class SvSymbol extends Sv {
        public constructor(public _val: string) { super(); }

        public static matches(node: Sv) { return node instanceof SvSymbol; }

        public static val(node: Sv) {
            if (!SvSymbol.matches(node)) throw "Symbol expected";
            return (<SvSymbol>node)._val;
        }

        public toString(): string {
            return this._val;
        }
    }

}