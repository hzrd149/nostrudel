"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * RSS util functions.
 */
var RSSUtils = /** @class */ (function () {
    function RSSUtils() {
    }
    RSSUtils.getRSSvalue = function (widths, maxWidth, noNarrow) {
        var e_1, _a;
        var n = 0;
        try {
            for (var widths_1 = __values(widths), widths_1_1 = widths_1.next(); !widths_1_1.done; widths_1_1 = widths_1.next()) {
                var width = widths_1_1.value;
                n += width;
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (widths_1_1 && !widths_1_1.done && (_a = widths_1.return)) _a.call(widths_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        var val = 0;
        var narrowMask = 0;
        var elements = widths.length;
        for (var bar = 0; bar < elements - 1; bar++) {
            var elmWidth = void 0;
            for (elmWidth = 1, narrowMask |= 1 << bar; elmWidth < widths[bar]; elmWidth++, narrowMask &= ~(1 << bar)) {
                var subVal = RSSUtils.combins(n - elmWidth - 1, elements - bar - 2);
                if (noNarrow && (narrowMask === 0) && (n - elmWidth - (elements - bar - 1) >= elements - bar - 1)) {
                    subVal -= RSSUtils.combins(n - elmWidth - (elements - bar), elements - bar - 2);
                }
                if (elements - bar - 1 > 1) {
                    var lessVal = 0;
                    for (var mxwElement = n - elmWidth - (elements - bar - 2); mxwElement > maxWidth; mxwElement--) {
                        lessVal += RSSUtils.combins(n - elmWidth - mxwElement - 1, elements - bar - 3);
                    }
                    subVal -= lessVal * (elements - 1 - bar);
                }
                else if (n - elmWidth > maxWidth) {
                    subVal--;
                }
                val += subVal;
            }
            n -= elmWidth;
        }
        return val;
    };
    RSSUtils.combins = function (n, r) {
        var maxDenom;
        var minDenom;
        if (n - r > r) {
            minDenom = r;
            maxDenom = n - r;
        }
        else {
            minDenom = n - r;
            maxDenom = r;
        }
        var val = 1;
        var j = 1;
        for (var i = n; i > maxDenom; i--) {
            val *= i;
            if (j <= minDenom) {
                val /= j;
                j++;
            }
        }
        while ((j <= minDenom)) {
            val /= j;
            j++;
        }
        return val;
    };
    return RSSUtils;
}());
exports.default = RSSUtils;
