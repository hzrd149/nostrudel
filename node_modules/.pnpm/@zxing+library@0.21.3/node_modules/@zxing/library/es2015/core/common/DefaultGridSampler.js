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
/*namespace com.google.zxing.common {*/
import GridSampler from './GridSampler';
import BitMatrix from './BitMatrix';
import PerspectiveTransform from './PerspectiveTransform';
import NotFoundException from '../NotFoundException';
/**
 * @author Sean Owen
 */
export default class DefaultGridSampler extends GridSampler {
    /*@Override*/
    sampleGrid(image, dimensionX /*int*/, dimensionY /*int*/, p1ToX /*float*/, p1ToY /*float*/, p2ToX /*float*/, p2ToY /*float*/, p3ToX /*float*/, p3ToY /*float*/, p4ToX /*float*/, p4ToY /*float*/, p1FromX /*float*/, p1FromY /*float*/, p2FromX /*float*/, p2FromY /*float*/, p3FromX /*float*/, p3FromY /*float*/, p4FromX /*float*/, p4FromY /*float*/) {
        const transform = PerspectiveTransform.quadrilateralToQuadrilateral(p1ToX, p1ToY, p2ToX, p2ToY, p3ToX, p3ToY, p4ToX, p4ToY, p1FromX, p1FromY, p2FromX, p2FromY, p3FromX, p3FromY, p4FromX, p4FromY);
        return this.sampleGridWithTransform(image, dimensionX, dimensionY, transform);
    }
    /*@Override*/
    sampleGridWithTransform(image, dimensionX /*int*/, dimensionY /*int*/, transform) {
        if (dimensionX <= 0 || dimensionY <= 0) {
            throw new NotFoundException();
        }
        const bits = new BitMatrix(dimensionX, dimensionY);
        const points = new Float32Array(2 * dimensionX);
        for (let y = 0; y < dimensionY; y++) {
            const max = points.length;
            const iValue = y + 0.5;
            for (let x = 0; x < max; x += 2) {
                points[x] = (x / 2) + 0.5;
                points[x + 1] = iValue;
            }
            transform.transformPoints(points);
            // Quick check to see if points transformed to something inside the image
            // sufficient to check the endpoints
            GridSampler.checkAndNudgePoints(image, points);
            try {
                for (let x = 0; x < max; x += 2) {
                    if (image.get(Math.floor(points[x]), Math.floor(points[x + 1]))) {
                        // Black(-ish) pixel
                        bits.set(x / 2, y);
                    }
                }
            }
            catch (aioobe /*: ArrayIndexOutOfBoundsException*/) {
                // This feels wrong, but, sometimes if the finder patterns are misidentified, the resulting
                // transform gets "twisted" such that it maps a straight line of points to a set of points
                // whose endpoints are in bounds, but others are not. There is probably some mathematical
                // way to detect this about the transformation that I don't know yet.
                // This results in an ugly runtime exception despite our clever checks above -- can't have
                // that. We could check each point's coordinates but that feels duplicative. We settle for
                // catching and wrapping ArrayIndexOutOfBoundsException.
                throw new NotFoundException();
            }
        }
        return bits;
    }
}
