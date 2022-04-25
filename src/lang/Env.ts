import { Sv, SvSymbol } from "./sv2";

export class StackFrame {
    constructor(private _sv: Sv, private _env: Env) {}
    public sv(): Sv { return this._sv; }
    public env(): Env { return this._env; }
    public parent(): StackFrame { return this._env.getParentStackFrame(); }
}

export class Env {
    private obj: {[id: string] : Sv} = {};
    private envParent: Env = null;
    private svSymbolProcedure: SvSymbol;
    private parentStackFrame: StackFrame;

    constructor(envParent: Env, svSymbolProcedure: SvSymbol = null, parentStackFrame: StackFrame = null) {
        this.envParent = envParent;
        this.svSymbolProcedure = svSymbolProcedure;
        this.parentStackFrame = parentStackFrame;
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

    public getParentStackFrame(): StackFrame {
        if (this.parentStackFrame)
            return this.parentStackFrame;
        if (this.envParent)
            return this.envParent.getParentStackFrame();
        return null;
    }

    public get(name: string):Sv {
        if (name in this.obj)
            return this.obj[name];
        if (this.envParent == null)
            throw new Error("no binding for " + name);
        return this.envParent.get(name);
    }

    public set(name: string, rv: Sv) {
        if (name in this.obj)
            this.obj[name] = rv;
        else if (this.envParent == null)
            throw new Error(name + " is not declared");
        else
            this.envParent.set(name, rv);
    }

    public define(name: string, value: Sv) {
        if (name in this.obj)
            throw new Error(name + ' is already defined');
        this.obj[name] = value;
    }

    setOrDefine(name: string, value: Sv) {
        this.obj[name] = value; 
    }
}