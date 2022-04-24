export default class Logger {
    output: string;
    clear() {
        this.output = "";
    }
    log = (st: string) => {
        this.output += st;
    }
}
