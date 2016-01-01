module Sicp.Lang {

    export class Env {
        private obj: {[id: string] : Sv} = {};
        private envParent: Env = null;
        private svSymbolProcedure: SvSymbol;
        private envParentStackFrame: Env = null;

        constructor(envParent: Env, svSymbolProcedure: SvSymbol = null, envParentStackFrame: Env = null) {
            this.envParent = envParent;
            this.svSymbolProcedure = svSymbolProcedure;
            this.envParentStackFrame = envParentStackFrame;
        }

        public getNames(): string[] {
            const res: string[] = [];
            for (let key in this.obj) {
                if (this.obj.hasOwnProperty(key))
                    res.push(key);
            }
            return res;
        }

        public getEnvParent(): Env {
            return this.envParent;
        }

        public getSvSymbolProcedure(): SvSymbol{
            return this.svSymbolProcedure;
        }

        public getEnvParentStackFrame(): Env {
            return this.envParentStackFrame;
        }

        public get(name: string):Sv {
            if (name in this.obj)
                return this.obj[name];
            if (this.envParent == null)
                throw "no binding for " + name;
            return this.envParent.get(name);
        }

        public set(name: string, rv: Sv) {
            if (name in this.obj)
                this.obj[name] = rv;
            else if (this.envParent == null)
                throw name + " is not declared";
            else
                this.envParent.set(name, rv);
        }

        public define(name: string, value: Sv) {
            if (name in this.obj)
                throw name + ' is already defined';
            this.obj[name] = value;
        }

        setOrDefine(name: string, value: Sv) {
            this.obj[name] = value; 
        }
    }
}