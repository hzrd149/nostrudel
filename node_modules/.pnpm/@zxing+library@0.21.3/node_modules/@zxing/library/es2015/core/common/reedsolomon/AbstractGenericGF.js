/*
 * Copyright 2007 ZXing authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import IllegalArgumentException from '../../IllegalArgumentException';
/**
 * <p>This class contains utility methods for performing mathematical operations over
 * the Galois Fields. Operations use a given primitive polynomial in calculations.</p>
 *
 * <p>Throughout this package, elements of the GF are represented as an {@code int}
 * for convenience and speed (but at the cost of memory).
 * </p>
 *
 * @author Sean Owen
 * @author David Olivier
 */
export default class AbstractGenericGF {
    /**
     * @return 2 to the power of a in GF(size)
     */
    exp(a) {
        return this.expTable[a];
    }
    /**
     * @return base 2 log of a in GF(size)
     */
    log(a /*int*/) {
        if (a === 0) {
            throw new IllegalArgumentException();
        }
        return this.logTable[a];
    }
    /**
     * Implements both addition and subtraction -- they are the same in GF(size).
     *
     * @return sum/difference of a and b
     */
    static addOrSubtract(a /*int*/, b /*int*/) {
        return a ^ b;
    }
}
