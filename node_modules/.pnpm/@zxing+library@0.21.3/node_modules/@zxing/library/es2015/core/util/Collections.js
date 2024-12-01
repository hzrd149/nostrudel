export default class Collections {
    /**
     * The singletonList(T) method is used to return an immutable list containing only the specified object.
     */
    static singletonList(item) {
        return [item];
    }
    /**
     * The min(Collection<? extends T>, Comparator<? super T>) method is used to return the minimum element of the given collection, according to the order induced by the specified comparator.
     */
    static min(collection, comparator) {
        return collection.sort(comparator)[0];
    }
}
