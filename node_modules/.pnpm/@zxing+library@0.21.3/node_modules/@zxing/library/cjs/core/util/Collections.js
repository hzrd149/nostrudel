"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Collections = /** @class */ (function () {
    function Collections() {
    }
    /**
     * The singletonList(T) method is used to return an immutable list containing only the specified object.
     */
    Collections.singletonList = function (item) {
        return [item];
    };
    /**
     * The min(Collection<? extends T>, Comparator<? super T>) method is used to return the minimum element of the given collection, according to the order induced by the specified comparator.
     */
    Collections.min = function (collection, comparator) {
        return collection.sort(comparator)[0];
    };
    return Collections;
}());
exports.default = Collections;
