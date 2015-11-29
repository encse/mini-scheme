namespace Sicp.Lang {

    export class Parser {
        private regexSymbol = /^[^\s()',]+/;
        private regexNumber = /^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?/;
        private regexString = /^"([^\\\"]+|\\.)*"/;
        private regexWhiteSpace = /^\s*/;
        private regexBoolean = /^#t|^#f/;

        private tokens: Token[];
        private itoken = 0;

        public parse(st: string): SvCons {
            this.tokens = this.getTokens(st).filter(token => token.kind !== TokenKind.WhiteSpace);
            this.tokens.push(new Token(TokenKind.EOF, null));
            this.itoken = 0;

            var rvs:Sv[] = [];
            while (!this.accept(TokenKind.EOF))
                rvs.push(this.parseExpression());

            return SvCons.listFromRvArray(rvs);
        }

        private nextToken() {
            if (this.itoken < this.tokens.length - 1)
                this.itoken++;
        }

        private currentToken(): Token {
            return this.tokens[this.itoken];
        }

        private accept(tokenKind: TokenKind) {
            if (this.currentToken().kind === tokenKind) {

                this.nextToken();
                return true;
            }
            return false;
        }

        private expect(tokenKind: TokenKind) {
            if (this.accept(tokenKind))
                return true;
            else
                throw 'expected ' + tokenKind + ' found ' + this.currentToken().kind;
        }

        public parseExpression(): any {
            var token = this.currentToken();

            if (this.accept(TokenKind.Quote))
                return new SvCons(new SvSymbol("quote"), this.parseExpression());
            if (this.accept(TokenKind.Symbol))
                return new SvSymbol(token.st);
            if (this.accept(TokenKind.BooleanLit)) 
                return new SvBool(token.st === "#t");
            if (this.accept(TokenKind.NumberLit))
                return new SvNumber(eval(token.st));
            if (this.accept(TokenKind.StringLit))
                return new SvString(eval(token.st));
            if (this.accept(TokenKind.LParen)) {
                let exprs:Sv[] = [];

                while (!this.accept(TokenKind.RParen)) {

                    if (this.accept(TokenKind.EOF))
                        throw "unexpected end of input";

                    exprs.push(this.parseExpression());
                }

                return SvCons.listFromRvArray(exprs);
            }

            throw "invalid token " + token;
        }

        private getTokens(st: string): Token[] {
            let tokens: Token[] = [];

            while (st.length > 0) {
                let ch = st[0];
                let token: Token;

                if (ch === "(")
                    token = new Token(TokenKind.LParen, ch);
                else if (ch === ")")
                    token = new Token(TokenKind.RParen, ch);
                else if (ch === "'")
                    token = new Token(TokenKind.Quote, ch);
                else if (this.regexNumber.test(st))
                    token = new Token(TokenKind.NumberLit, this.regexNumber.exec(st)[0]);
                else if (this.regexString.test(st))
                    token = new Token(TokenKind.StringLit, this.regexString.exec(st)[0]);
                else if (this.regexBoolean.test(st))
                    token = new Token(TokenKind.BooleanLit, this.regexBoolean.exec(st)[0]);
                else if (this.regexSymbol.test(st))
                    token = new Token(TokenKind.Symbol, this.regexSymbol.exec(st)[0]);
                else if (this.regexWhiteSpace.test(st))
                    token = new Token(TokenKind.WhiteSpace, this.regexWhiteSpace.exec(st)[0]);
                else
                    throw "invalid token at '" + st + "'";
                tokens.push(token);

                if (token.st.length === 0)
                    throw "invalid token";
                st = st.substr(token.st.length);
            }

            return tokens;
        }

    }

    enum TokenKind {
        WhiteSpace,
        BooleanLit,
        LParen,
        RParen,
        Symbol,
        NumberLit,
        Quote,
        StringLit,
        EOF
    }

    class Token {
        constructor(public kind: TokenKind, public st: string) {
            this.kind = kind;
            this.st = st;
        }
    }
}