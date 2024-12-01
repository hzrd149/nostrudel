export const propertyRegex = "[^?/{}*,()#]+";
// W3C ENBF grammar
// https://github.com/lys-lang/node-ebnf/blob/master/test/W3CEBNF.spec.ts
// https://www.w3.org/TR/xml/#sec-notation
export const jsonQueryGrammar = `
root ::= ("#" recursion | recursion | (query | pattern) recursion* | "#" SEP? | SEP)
recursion ::= (SEP query | pattern)*

query ::= (ESC escaped ESC | property | all | any | regex) typecheck? lookahead?
property ::= ${propertyRegex}
regex ::= "{" [^}]+ "}"
SEP ::= "/"
all ::= "**"
any ::= "*"

typecheck ::= "?:" ("value" | "boolean" | "string" | "number" | "object" | "array")
lookahead ::= "?" expression ((andExpr | orExpr) expression)*
andExpr ::= S? "&&" S?
orExpr ::= S? "||" S?

expression ::= (exprProperty | ESC escaped ESC) ((isnot | is) (exprProperty | regex | ESC escaped ESC))*
exprProperty ::= [a-zA-Z0-9-_ $]+
escaped ::= [^"]+
is ::= ":"
isnot ::= ":!"
ESC ::= '"'

pattern ::= S? "(" (SEP query | pattern (orPattern? pattern)*)* ")" quantifier? S? lookahead?
quantifier ::= "+" | "*" | [0-9]+
orPattern ::= S? "," S?

S ::= [ ]*
`;
