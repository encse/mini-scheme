module Sicp.Lang {
    export class Env {
        private obj:any= {};
        private envParent: Env = null;

        constructor(envParent: Env) {
            this.envParent = envParent;
        }

        public get(name: string):Sv {
            if (name in this.obj)
                return this.obj[name];
            if (this.envParent == null)
                return SvCons.Nil;
            return this.envParent.get(name);
        }

        public set(name: string, rv: Sv) {
            if (name in this.obj)
                this.obj[name] = rv;
            else if (this.envParent == null)
                throw "variable is not declared";
            else
                this.envParent.set(name, rv);
        }

        public define(name: string, value: any) {
            this.obj[name] = value;
        }

    }
}