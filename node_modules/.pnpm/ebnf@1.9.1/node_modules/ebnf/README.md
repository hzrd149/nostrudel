[![Coverage Status](https://coveralls.io/repos/github/menduz/node-ebnf/badge.svg?branch=master)](https://coveralls.io/github/menduz/node-ebnf?branch=master)
[![Build Status](https://travis-ci.org/lys-lang/node-ebnf.svg?branch=master)](https://travis-ci.org/lys-lang/node-ebnf)

# What is this?

It parses a formal grammar and returns a parser instance. That parser returns ASTs based on your grammar. [**SEE IT IN ACTION HERE**](http://menduz.com/ebnf-highlighter/) [GitHub source](https://github.com/menduz/ebnf-highlighter)

# Install

`npm i --save ebnf` (It's compatible with WebPack, and Browserify)

# Usage

By the moment we only accept two grammars. [BNF](https://en.wikipedia.org/wiki/Backus%E2%80%93Naur_Form) and [W3C EBNF](http://www.w3.org/TR/xquery/#EBNFNotation) (compatible with [Railroad Diagram Generator](http://www.bottlecaps.de/rr/ui))

## Create a parser

```typescript
import { Grammars } from 'ebnf';

let bnfParser = new Grammars.BNF.Parser(bnfGrammar);
let w3cParser = new Grammars.W3C.Parser(railRoadGeneratorGrammar);
```

[**Check out the test folder for more examples**](https://github.com/menduz/node-ebnf/tree/master/test)

## BNF Equation example

In this example we use plain BNF to create a simple integer formula parser

Grammar:

```ebnf
<Equation>         ::= <BinaryOperation> | <Term>
<Term>             ::= "(" <RULE_WHITESPACE> <Equation> <RULE_WHITESPACE> ")" | "(" <RULE_WHITESPACE> <Number> <RULE_WHITESPACE> ")" | <RULE_WHITESPACE> <Number> <RULE_WHITESPACE>
<BinaryOperation>  ::= <Term> <RULE_WHITESPACE> <Operator> <RULE_WHITESPACE> <Term>

<Number>           ::= <RULE_NEGATIVE> <RULE_NON_ZERO> <RULE_NUMBER_LIST> | <RULE_NON_ZERO> <RULE_NUMBER_LIST> | <RULE_DIGIT>
<Operator>         ::= "+" | "-" | "*" | "/" | "^"

<RULE_NUMBER_LIST> ::= <RULE_DIGIT> <RULE_NUMBER_LIST> | <RULE_DIGIT>
<RULE_NEGATIVE>    ::= "-"
<RULE_NON_ZERO>    ::= "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
<RULE_DIGIT>       ::= "0" | <RULE_NON_ZERO>
<RULE_WHITESPACE>  ::= <RULE_WS> | ""
<RULE_WS>          ::= " " <RULE_WHITESPACE> | <EOL> <RULE_WHITESPACE> | " " | <EOL>
```

```typescript
import { Grammars } from 'ebnf';
let parser = new Grammars.BNF.Parser(grammar);

parser.getAST('-122 + 2');
/*             -122 + 2 Equation
               -122 + 2 BinaryOperation
               -122     Term
               -122     Number
                    +   Operator
                      2 Term
                      2 Number
*/
parser.getAST( '(2 + (2 * -123)) * 5332');
/*              (2 + (2 * -123)) * 5332 Equation
                (2 + (2 * -123)) * 5332 BinaryOperation
                (2 + (2 * -123))        Term
                 2 + (2 * -123)         Equation
                 2 + (2 * -123)         BinaryOperation
                 2                      Term
                 2                      Number
                   +                    Operator
                     (2 * -123)         Term
                      2 * -123          Equation
                      2 * -123          BinaryOperation
                      2                 Term
                      2                 Number
                        *               Operator
                          -123          Term
                          -123          Number
                                 *      Operator
                                   5332 Term
                                   5332 Number
*/
```

## JSON example

```wbnf
/* https://www.ietf.org/rfc/rfc4627.txt */
value                ::= false | null | true | object | array | number | string
BEGIN_ARRAY          ::= WS* #x5B WS*  /* [ left square bracket */
BEGIN_OBJECT         ::= WS* #x7B WS*  /* { left curly bracket */
END_ARRAY            ::= WS* #x5D WS*  /* ] right square bracket */
END_OBJECT           ::= WS* #x7D WS*  /* } right curly bracket */
NAME_SEPARATOR       ::= WS* #x3A WS*  /* : colon */
VALUE_SEPARATOR      ::= WS* #x2C WS*  /* , comma */
WS                   ::= [#x20#x09#x0A#x0D]+   /* Space | Tab | \n | \r */
false                ::= "false"
null                 ::= "null"
true                 ::= "true"
object               ::= BEGIN_OBJECT (member (VALUE_SEPARATOR member)*)? END_OBJECT
member               ::= string NAME_SEPARATOR value
array                ::= BEGIN_ARRAY (value (VALUE_SEPARATOR value)*)? END_ARRAY

number                ::= "-"? ("0" | [1-9] [0-9]*) ("." [0-9]+)? (("e" | "E") ( "-" | "+" )? ("0" | [1-9] [0-9]*))?

/* STRINGS */

string                ::= '"' (([#x20-#x21] | [#x23-#x5B] | [#x5D-#xFFFF]) | #x5C (#x22 | #x5C | #x2F | #x62 | #x66 | #x6E | #x72 | #x74 | #x75 HEXDIG HEXDIG HEXDIG HEXDIG))* '"'
HEXDIG                ::= [a-fA-F0-9]
```

```typescript
import { Grammars } from 'ebnf';
let parser = new Grammars.W3C.Parser(grammar);

parser.getAST( '{"a":false,"b":"asd\\n      asd ","list":[1,2,3,true]}');
/*              {"a":false,"b":"asd\n      asd ","list":[1,2,3,true]} value
                {"a":false,"b":"asd\n      asd ","list":[1,2,3,true]} object
                 "a":false                                            member
                 "a"                                                  string
                     false                                            value
                     false                                            false
                           "b":"asd\n      asd "                      member
                           "b"                                        string
                               "asd\n      asd "                      value
                               "asd\n      asd "                      string
                                                 "list":[1,2,3,true]  member
                                                 "list"               string
                                                        [1,2,3,true]  value
                                                        [1,2,3,true]  array
                                                         1            value
                                                         1            number
                                                           2          value
                                                           2          number
                                                             3        value
                                                             3        number
                                                               true   value
                                                               true   true
*/
```

## AST

Every ast node has the following interface

```typescript
interface IToken {
  type: string;         // Rule name
  text: string;         // Inner text
  children: IToken[];   // Children nodes
  start: number;        // Start position of the input string
  end: number;          // End position
  errors: TokenError[]; // List of Errors
}
```

## Conventions

We try to keep this tool as much unopinionated and free of conventions as possible. However, we have some conventions:
- All `UPPER_AND_SNAKE_CASE` rules are not emmited on the AST. This option can be deactivated setting the flag `keepUpperRules: true`.
