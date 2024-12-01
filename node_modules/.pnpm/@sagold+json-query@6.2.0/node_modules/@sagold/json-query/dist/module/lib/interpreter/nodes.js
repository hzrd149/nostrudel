const join = (a, b) => `${a}/${b}`;
import { VALUE_INDEX, POINTER_INDEX } from "./keys";
const toString = Object.prototype.toString;
const rContainer = /Object|Array/;
const isContainer = (v) => rContainer.test(toString.call(v));
const getTypeOf = (v) => toString
    .call(v)
    .match(/\s([^\]]+)\]/)
    .pop()
    .toLowerCase();
function nodeAsRegex(node) {
    return new RegExp(node.text.replace(/(^{|}$)/g, ""));
}
/**
 * Iterates over object or array, passing each key, value and parentObject to the callback
 * @param value - to iterate
 * @param callback - receiving key on given input value
 */
function forEach(parent, callback) {
    if (Array.isArray(parent)) {
        parent.forEach(callback);
    }
    else if (Object.prototype.toString.call(parent) === "[object Object]") {
        Object.keys(parent).forEach(function (key) {
            callback(parent[key], key, parent);
        });
    }
}
/**
 * Returns all keys of the given input data
 * @param  value
 * @return {Array} containing keys of given value
 */
function getKeys(value) {
    if (Array.isArray(value)) {
        return value.map(function (value, index) {
            return `${index}`;
        });
    }
    if (Object.prototype.toString.call(value) === "[object Object]") {
        return Object.keys(value);
    }
    return [];
}
const cache = {
    mem: [],
    get(entry, prop) {
        const v = entry[VALUE_INDEX][prop];
        if (cache.mem.includes(v)) {
            return undefined;
        }
        if (isContainer(v)) {
            cache.mem.push(v);
        }
        return [v, prop, entry[VALUE_INDEX], join(entry[POINTER_INDEX], prop)];
    },
    reset() {
        cache.mem.length = 0;
    },
};
const expand = {
    any(node, entry) {
        const value = entry[VALUE_INDEX];
        return (getKeys(value)
            // .map(prop => cache.get(entry, prop));
            .map((prop) => [
            value[prop],
            prop,
            value,
            join(entry[POINTER_INDEX], prop),
        ]));
    },
    all(node, entry) {
        const result = [entry];
        forEach(entry[VALUE_INDEX], (value, prop) => {
            const childEntry = cache.get(entry, prop);
            // const childEntry = [value, prop, entry[VALUE_INDEX], join(entry[POINTER_INDEX], prop)];
            childEntry && result.push(...expand.all(node, childEntry));
        });
        return result;
    },
    regex(node, entry) {
        const regex = nodeAsRegex(node);
        const value = entry[VALUE_INDEX];
        return getKeys(value)
            .filter((prop) => regex.test(prop))
            .map((prop) => [
            value[prop],
            prop,
            value,
            join(entry[POINTER_INDEX], prop),
        ]);
    },
};
const select = {
    // alias to property (but escaped)
    escaped: (node, entry) => select.property(node, entry),
    property: (node, entry) => {
        const prop = node.text;
        if (entry[VALUE_INDEX] && entry[VALUE_INDEX][prop] !== undefined) {
            return [
                entry[VALUE_INDEX][prop],
                prop,
                entry[VALUE_INDEX],
                join(entry[POINTER_INDEX], prop),
            ];
        }
    },
    typecheck: (node, entry) => {
        const checkedTyped = node.text.replace(/^\?:/, "");
        if (checkedTyped === "value") {
            return isContainer(entry[VALUE_INDEX]) ? undefined : entry;
        }
        const type = getTypeOf(entry[VALUE_INDEX]);
        if (type === checkedTyped) {
            return entry;
        }
    },
    lookahead: (node, entry) => {
        let valid = true;
        let or = false;
        node.children.forEach((expr) => {
            if (expr.type === "expression") {
                const isValid = select.expression(expr, entry) !== undefined;
                valid = or === true ? valid || isValid : valid && isValid;
            }
            else {
                or = expr.type === "orExpr";
            }
        });
        return valid ? entry : undefined;
    },
    expression: (node, entry) => {
        const prop = node.children[0].text;
        const cmp = node.children[1];
        const test = node.children[2];
        const value = entry[VALUE_INDEX];
        if (isContainer(value) === false) {
            return undefined;
        }
        return expressionMatches(value[prop], cmp, test) ? entry : undefined;
    },
};
function expressionMatches(value, cmp, test) {
    if (cmp === undefined) {
        return value !== undefined;
    }
    let valid;
    const valueString = `${value}`;
    if (test.type === "regex") {
        const regex = nodeAsRegex(test);
        valid = regex.test(valueString);
    }
    else {
        valid = valueString === test.text;
    }
    if (cmp.type === "isnot") {
        valid = valid === false && value !== undefined;
    }
    return valid;
}
export { expand, select, cache };
