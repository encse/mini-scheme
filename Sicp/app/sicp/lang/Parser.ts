namespace Sicp.Lang {

    export class Parser {
        private regexSymbol = /^[^\s()',]+/;
        private regexNumber = /^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?/;
        private regexString = /^"([^\\\"]+|\\.)*"/;
        private regexWhiteSpace = /^\s*/;
        private regexBoolean = /^#t|^#f/;
        private regexComment = /^;[^\$\r\n]*/;

        private tokens: Token[];
        private itoken = 0;

        public parse(st: string): SvCons {
            this.tokens = this.getTokens(st)
                .filter(token => token.kind !== TokenKind.WhiteSpace && token.kind !== TokenKind.Comment);
            var lastToken = this.tokens.length ? this.tokens[this.tokens.length - 1]: null;
            this.tokens.push(lastToken ?
                new Token(TokenKind.EOF, "", lastToken.ilineEnd, lastToken.icolEnd + 1) :
                new Token(TokenKind.EOF, "", 0,0) );
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

        public parseExpression(): Sv {
            var token = this.currentToken();

            if (this.accept(TokenKind.Quote)) {
                let svBody = this.parseExpression();
                return new SvCons(new SvSymbol("quote"), svBody).withSourceInfo(token, svBody);
            }
            if (this.accept(TokenKind.Symbol))
                return new SvSymbol(token.st).withSourceInfo(token, token);
            if (this.accept(TokenKind.BooleanLit)) 
                return SvBool.fromBoolean(token.st === "#t").withSourceInfo(token, token);
            if (this.accept(TokenKind.NumberLit))
                return new SvNumber(eval(token.st)).withSourceInfo(token, token);
            if (this.accept(TokenKind.StringLit))
                return new SvString(eval(token.st)).withSourceInfo(token, token);
            if (this.accept(TokenKind.LParen)) {
                let tokenStart = token;
                let exprs:Sv[] = [];

                while (!this.accept(TokenKind.RParen)) {

                    if (this.accept(TokenKind.EOF))
                        throw "unexpected end of input";

                    exprs.push(this.parseExpression());
                }

                let tokenEnd = this.tokens[this.itoken - 1];
                return SvCons.listFromRvArray(exprs).withSourceInfo(tokenStart, tokenEnd);
            }

            throw "invalid token " + token;
        }

        private getTokens(st: string): Token[] {
            let tokens: Token[] = [];
            let iline = 0;
            let icol = 0;
            while (st.length > 0) {
                let ch = st[0];
                let token: Token;

                if (ch === "(")
                    token = new Token(TokenKind.LParen, ch, iline, icol);
                else if (ch === ")")
                    token = new Token(TokenKind.RParen, ch, iline, icol);
                else if (ch === "'")
                    token = new Token(TokenKind.Quote, ch, iline, icol);
                else if (this.regexNumber.test(st))
                    token = new Token(TokenKind.NumberLit, this.regexNumber.exec(st)[0], iline, icol);
                else if (this.regexString.test(st))
                    token = new Token(TokenKind.StringLit, this.regexString.exec(st)[0], iline, icol);
                else if (this.regexBoolean.test(st))
                    token = new Token(TokenKind.BooleanLit, this.regexBoolean.exec(st)[0], iline, icol);
                else if (this.regexComment.test(st))
                    token = new Token(TokenKind.Comment, this.regexComment.exec(st)[0], iline, icol);
                else if (this.regexSymbol.test(st))
                    token = new Token(TokenKind.Symbol, this.regexSymbol.exec(st)[0], iline, icol);
                else if (this.regexWhiteSpace.test(st))
                    token = new Token(TokenKind.WhiteSpace, this.regexWhiteSpace.exec(st)[0], iline, icol);
                else
                    throw "invalid token at '" + st + "'";
                tokens.push(token);

                if (token.st.length === 0)
                    throw "invalid token";
                st = st.substr(token.st.length);
                iline = token.ilineEnd;
                icol = token.icolEnd;
            }

            return tokens;
        }

    }

    export interface ISourceInfo {
        ilineStart:number;
        icolStart:number;
        ilineEnd:number;
        icolEnd:number;
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
        Comment,
        EOF
    }

    class Token implements ISourceInfo {
        public ilineEnd: number;
        public icolEnd: number;

        constructor(public kind: TokenKind, public st: string,
            public ilineStart: number, public icolStart: number)
        {
            let lines = st.replace("\r", "").split('\n');
            this.ilineEnd = this.ilineStart + lines.length - 1;
            if (this.ilineStart === this.ilineEnd)
                this.icolEnd = icolStart + lines[0].length;
            else
                this.icolEnd = lines[lines.length-1].length;
        }
    }
}