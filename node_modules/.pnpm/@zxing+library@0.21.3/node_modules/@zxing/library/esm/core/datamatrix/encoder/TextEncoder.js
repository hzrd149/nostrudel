var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import { C40Encoder } from './C40Encoder';
import { TEXT_ENCODATION } from './constants';
var TextEncoder = /** @class */ (function (_super) {
    __extends(TextEncoder, _super);
    function TextEncoder() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TextEncoder.prototype.getEncodingMode = function () {
        return TEXT_ENCODATION;
    };
    TextEncoder.prototype.encodeChar = function (c, sb) {
        if (c === ' '.charCodeAt(0)) {
            sb.append(3);
            return 1;
        }
        if (c >= '0'.charCodeAt(0) && c <= '9'.charCodeAt(0)) {
            sb.append(c - 48 + 4);
            return 1;
        }
        if (c >= 'a'.charCodeAt(0) && c <= 'z'.charCodeAt(0)) {
            sb.append(c - 97 + 14);
            return 1;
        }
        if (c < ' '.charCodeAt(0)) {
            sb.append(0); // Shift 1 Set
            sb.append(c);
            return 2;
        }
        if (c <= '/'.charCodeAt(0)) {
            sb.append(1); // Shift 2 Set
            sb.append(c - 33);
            return 2;
        }
        if (c <= '@'.charCodeAt(0)) {
            sb.append(1); // Shift 2 Set
            sb.append(c - 58 + 15);
            return 2;
        }
        if (c >= '['.charCodeAt(0) && c <= '_'.charCodeAt(0)) {
            sb.append(1); // Shift 2 Set
            sb.append(c - 91 + 22);
            return 2;
        }
        if (c === '`'.charCodeAt(0)) {
            sb.append(2); // Shift 3 Set
            sb.append(0); // '`' - 96 == 0
            return 2;
        }
        if (c <= 'Z'.charCodeAt(0)) {
            sb.append(2); // Shift 3 Set
            sb.append(c - 65 + 1);
            return 2;
        }
        if (c <= 127) {
            sb.append(2); // Shift 3 Set
            sb.append(c - 123 + 27);
            return 2;
        }
        sb.append(1 + "\u001E"); // Shift 2, Upper Shift
        var len = 2;
        len += this.encodeChar(c - 128, sb);
        return len;
    };
    return TextEncoder;
}(C40Encoder));
export { TextEncoder };
