import { parse } from "./parser";
const skip = ["root", "recursion"];
function buildPath(node, path = []) {
    if (skip.includes(node.type)) {
        node.children.forEach((n) => buildPath(n, path));
        return path;
    }
    // remove escaped property quotes?
    path.push(node.text);
    return path;
}
/**
 * Returns queryString as a list of property-queries
 */
export function split(queryString) {
    if (queryString == null || queryString === "") {
        return [];
    }
    const ast = parse(queryString);
    // console.log(toJSON(ast, null, 2));
    return buildPath(ast);
}
