define("ace/mode/sicp_highlight_rules", ["require", "exports", "module", "ace/lib/oop", "ace/mode/text_highlight_rules"], function (require, exports, module) {
    "use strict";

    var oop = require("../lib/oop");
    var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

    var SicpHighlightRules = function () {
        var keywordControl = "define|case|if|else";
        var keywordOperator = ""; //"eq|neq|and|or";
        var constantLanguage = ""; //"null|nil";
        var supportFunctions = "cons|car|cdr|cond|lambda|set!|quote";

        var keywordMapper = this.createKeywordMapper({
            "keyword.control": keywordControl,
            "keyword.operator": keywordOperator,
            "constant.language": constantLanguage,
            "support.function": supportFunctions
        }, "identifier", true);

        this.$rules =
            {
                "start": [
                    {
                        token: "comment",
                        regex: ";.*$"
                    },
                    {
                        token: ["storage.type.function-type.sicp", "text", "entity.name.function.sicp"],
                        regex: "(?:\\b(?:(defun|defmethod|defmacro))\\b)(\\s+)((?:\\w|\\-|\\!|\\?)*)"
                    },
                    {
                        token: ["punctuation.definition.constant.character.sicp", "constant.character.sicp"],
                        regex: "(#)((?:\\w|[\\\\+-=<>'\"&#])+)"
                    },
                    {
                        token: ["punctuation.definition.variable.sicp", "variable.other.global.sicp", "punctuation.definition.variable.sicp"],
                        regex: "(\\*)(\\S*)(\\*)"
                    },
                    {
                        token: "constant.numeric", // hex
                        regex: "0[xX][0-9a-fA-F]+(?:L|l|UL|ul|u|U|F|f|ll|LL|ull|ULL)?\\b"
                    },
                    {
                        token: "constant.numeric", // float
                        regex: "[+-]?\\d+(?:(?:\\.\\d*)?(?:[eE][+-]?\\d+)?)?(?:L|l|UL|ul|u|U|F|f|ll|LL|ull|ULL)?\\b"
                    },
                    {
                        token: keywordMapper,
                        regex: "[a-zA-Z_$][a-zA-Z0-9_$]*\\b"
                    },
                    {
                        token: "string",
                        regex: '"(?=.)',
                        next: "qqstring"
                    }
                ],
                "qqstring": [
                    {
                        token: "constant.character.escape.sicp",
                        regex: "\\\\."
                    },
                    {
                        token: "string",
                        regex: '[^"\\\\]+'
                    }, {
                        token: "string",
                        regex: "\\\\$",
                        next: "qqstring"
                    }, {
                        token: "string",
                        regex: '"|$',
                        next: "start"
                    }
                ]
            }

    };

    oop.inherits(SicpHighlightRules, TextHighlightRules);

    exports.SicpHighlightRules = SicpHighlightRules;
});

define("ace/mode/sicp", ["require", "exports", "module", "ace/lib/oop", "ace/mode/text", "ace/mode/sicp_highlight_rules"], function (require, exports, module) {
    "use strict";

    var oop = require("../lib/oop");
    var TextMode = require("./text").Mode;
    var SicpHighlightRules = require("./sicp_highlight_rules").SicpHighlightRules;

    var Mode = function () {
        this.HighlightRules = SicpHighlightRules;
    };
    oop.inherits(Mode, TextMode);

    (function () {

        this.lineCommentStart = ";";

        this.$id = "ace/mode/sicp";
    }).call(Mode.prototype);

    exports.Mode = Mode;
});
