import {
  __commonJS
} from "./chunk-EWTE5DHJ.js";

// node_modules/.pnpm/identicon.js@2.3.3/node_modules/identicon.js/pnglib.js
var require_pnglib = __commonJS({
  "node_modules/.pnpm/identicon.js@2.3.3/node_modules/identicon.js/pnglib.js"(exports, module) {
    (function() {
      function write(buffer, offs) {
        for (var i = 2; i < arguments.length; i++) {
          for (var j = 0; j < arguments[i].length; j++) {
            buffer[offs++] = arguments[i].charAt(j);
          }
        }
      }
      function byte2(w) {
        return String.fromCharCode(w >> 8 & 255, w & 255);
      }
      function byte4(w) {
        return String.fromCharCode(w >> 24 & 255, w >> 16 & 255, w >> 8 & 255, w & 255);
      }
      function byte2lsb(w) {
        return String.fromCharCode(w & 255, w >> 8 & 255);
      }
      var PNGlib = function(width, height, depth) {
        this.width = width;
        this.height = height;
        this.depth = depth;
        this.pix_size = height * (width + 1);
        this.data_size = 2 + this.pix_size + 5 * Math.floor((65534 + this.pix_size) / 65535) + 4;
        this.ihdr_offs = 0;
        this.ihdr_size = 4 + 4 + 13 + 4;
        this.plte_offs = this.ihdr_offs + this.ihdr_size;
        this.plte_size = 4 + 4 + 3 * depth + 4;
        this.trns_offs = this.plte_offs + this.plte_size;
        this.trns_size = 4 + 4 + depth + 4;
        this.idat_offs = this.trns_offs + this.trns_size;
        this.idat_size = 4 + 4 + this.data_size + 4;
        this.iend_offs = this.idat_offs + this.idat_size;
        this.iend_size = 4 + 4 + 4;
        this.buffer_size = this.iend_offs + this.iend_size;
        this.buffer = new Array();
        this.palette = new Object();
        this.pindex = 0;
        var _crc32 = new Array();
        for (var i = 0; i < this.buffer_size; i++) {
          this.buffer[i] = "\0";
        }
        write(this.buffer, this.ihdr_offs, byte4(this.ihdr_size - 12), "IHDR", byte4(width), byte4(height), "\b");
        write(this.buffer, this.plte_offs, byte4(this.plte_size - 12), "PLTE");
        write(this.buffer, this.trns_offs, byte4(this.trns_size - 12), "tRNS");
        write(this.buffer, this.idat_offs, byte4(this.idat_size - 12), "IDAT");
        write(this.buffer, this.iend_offs, byte4(this.iend_size - 12), "IEND");
        var header = 8 + (7 << 4) << 8 | 3 << 6;
        header += 31 - header % 31;
        write(this.buffer, this.idat_offs + 8, byte2(header));
        for (var i = 0; (i << 16) - 1 < this.pix_size; i++) {
          var size, bits;
          if (i + 65535 < this.pix_size) {
            size = 65535;
            bits = "\0";
          } else {
            size = this.pix_size - (i << 16) - i;
            bits = "";
          }
          write(this.buffer, this.idat_offs + 8 + 2 + (i << 16) + (i << 2), bits, byte2lsb(size), byte2lsb(~size));
        }
        for (var i = 0; i < 256; i++) {
          var c = i;
          for (var j = 0; j < 8; j++) {
            if (c & 1) {
              c = -306674912 ^ c >> 1 & 2147483647;
            } else {
              c = c >> 1 & 2147483647;
            }
          }
          _crc32[i] = c;
        }
        this.index = function(x, y) {
          var i2 = y * (this.width + 1) + x + 1;
          var j2 = this.idat_offs + 8 + 2 + 5 * Math.floor(i2 / 65535 + 1) + i2;
          return j2;
        };
        this.color = function(red, green, blue, alpha) {
          alpha = alpha >= 0 ? alpha : 255;
          var color = ((alpha << 8 | red) << 8 | green) << 8 | blue;
          if (typeof this.palette[color] == "undefined") {
            if (this.pindex == this.depth) return "\0";
            var ndx = this.plte_offs + 8 + 3 * this.pindex;
            this.buffer[ndx + 0] = String.fromCharCode(red);
            this.buffer[ndx + 1] = String.fromCharCode(green);
            this.buffer[ndx + 2] = String.fromCharCode(blue);
            this.buffer[this.trns_offs + 8 + this.pindex] = String.fromCharCode(alpha);
            this.palette[color] = String.fromCharCode(this.pindex++);
          }
          return this.palette[color];
        };
        this.getBase64 = function() {
          var s = this.getDump();
          var ch = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
          var c1, c2, c3, e1, e2, e3, e4;
          var l = s.length;
          var i2 = 0;
          var r = "";
          do {
            c1 = s.charCodeAt(i2);
            e1 = c1 >> 2;
            c2 = s.charCodeAt(i2 + 1);
            e2 = (c1 & 3) << 4 | c2 >> 4;
            c3 = s.charCodeAt(i2 + 2);
            if (l < i2 + 2) {
              e3 = 64;
            } else {
              e3 = (c2 & 15) << 2 | c3 >> 6;
            }
            if (l < i2 + 3) {
              e4 = 64;
            } else {
              e4 = c3 & 63;
            }
            r += ch.charAt(e1) + ch.charAt(e2) + ch.charAt(e3) + ch.charAt(e4);
          } while ((i2 += 3) < l);
          return r;
        };
        this.getDump = function() {
          var BASE = 65521;
          var NMAX = 5552;
          var s1 = 1;
          var s2 = 0;
          var n = NMAX;
          for (var y = 0; y < this.height; y++) {
            for (var x = -1; x < this.width; x++) {
              s1 += this.buffer[this.index(x, y)].charCodeAt(0);
              s2 += s1;
              if ((n -= 1) == 0) {
                s1 %= BASE;
                s2 %= BASE;
                n = NMAX;
              }
            }
          }
          s1 %= BASE;
          s2 %= BASE;
          write(this.buffer, this.idat_offs + this.idat_size - 8, byte4(s2 << 16 | s1));
          function crc32(png, offs, size2) {
            var crc = -1;
            for (var i2 = 4; i2 < size2 - 4; i2 += 1) {
              crc = _crc32[(crc ^ png[offs + i2].charCodeAt(0)) & 255] ^ crc >> 8 & 16777215;
            }
            write(png, offs + size2 - 4, byte4(crc ^ -1));
          }
          crc32(this.buffer, this.ihdr_offs, this.ihdr_size);
          crc32(this.buffer, this.plte_offs, this.plte_size);
          crc32(this.buffer, this.trns_offs, this.trns_size);
          crc32(this.buffer, this.idat_offs, this.idat_size);
          crc32(this.buffer, this.iend_offs, this.iend_size);
          return "PNG\r\n\n" + this.buffer.join("");
        };
      };
      if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
        module.exports = PNGlib;
      } else {
        window.PNGlib = PNGlib;
      }
    })();
  }
});

// node_modules/.pnpm/identicon.js@2.3.3/node_modules/identicon.js/identicon.js
var require_identicon = __commonJS({
  "node_modules/.pnpm/identicon.js@2.3.3/node_modules/identicon.js/identicon.js"(exports, module) {
    (function() {
      var PNGlib;
      if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
        PNGlib = require_pnglib();
      } else {
        PNGlib = window.PNGlib;
      }
      var Identicon = function(hash, options) {
        if (typeof hash !== "string" || hash.length < 15) {
          throw "A hash of at least 15 characters is required.";
        }
        this.defaults = {
          background: [240, 240, 240, 255],
          margin: 0.08,
          size: 64,
          saturation: 0.7,
          brightness: 0.5,
          format: "png"
        };
        this.options = typeof options === "object" ? options : this.defaults;
        if (typeof arguments[1] === "number") {
          this.options.size = arguments[1];
        }
        if (arguments[2]) {
          this.options.margin = arguments[2];
        }
        this.hash = hash;
        this.background = this.options.background || this.defaults.background;
        this.size = this.options.size || this.defaults.size;
        this.format = this.options.format || this.defaults.format;
        this.margin = this.options.margin !== void 0 ? this.options.margin : this.defaults.margin;
        var hue = parseInt(this.hash.substr(-7), 16) / 268435455;
        var saturation = this.options.saturation || this.defaults.saturation;
        var brightness = this.options.brightness || this.defaults.brightness;
        this.foreground = this.options.foreground || this.hsl2rgb(hue, saturation, brightness);
      };
      Identicon.prototype = {
        background: null,
        foreground: null,
        hash: null,
        margin: null,
        size: null,
        format: null,
        image: function() {
          return this.isSvg() ? new Svg(this.size, this.foreground, this.background) : new PNGlib(this.size, this.size, 256);
        },
        render: function() {
          var image = this.image(), size = this.size, baseMargin = Math.floor(size * this.margin), cell = Math.floor((size - baseMargin * 2) / 5), margin = Math.floor((size - cell * 5) / 2), bg = image.color.apply(image, this.background), fg = image.color.apply(image, this.foreground);
          var i, color;
          for (i = 0; i < 15; i++) {
            color = parseInt(this.hash.charAt(i), 16) % 2 ? bg : fg;
            if (i < 5) {
              this.rectangle(2 * cell + margin, i * cell + margin, cell, cell, color, image);
            } else if (i < 10) {
              this.rectangle(1 * cell + margin, (i - 5) * cell + margin, cell, cell, color, image);
              this.rectangle(3 * cell + margin, (i - 5) * cell + margin, cell, cell, color, image);
            } else if (i < 15) {
              this.rectangle(0 * cell + margin, (i - 10) * cell + margin, cell, cell, color, image);
              this.rectangle(4 * cell + margin, (i - 10) * cell + margin, cell, cell, color, image);
            }
          }
          return image;
        },
        rectangle: function(x, y, w, h, color, image) {
          if (this.isSvg()) {
            image.rectangles.push({ x, y, w, h, color });
          } else {
            var i, j;
            for (i = x; i < x + w; i++) {
              for (j = y; j < y + h; j++) {
                image.buffer[image.index(i, j)] = color;
              }
            }
          }
        },
        // adapted from: https://gist.github.com/aemkei/1325937
        hsl2rgb: function(h, s, b) {
          h *= 6;
          s = [
            b += s *= b < 0.5 ? b : 1 - b,
            b - h % 1 * s * 2,
            b -= s *= 2,
            b,
            b + h % 1 * s,
            b + s
          ];
          return [
            s[~~h % 6] * 255,
            // red
            s[(h | 16) % 6] * 255,
            // green
            s[(h | 8) % 6] * 255
            // blue
          ];
        },
        toString: function(raw) {
          if (raw) {
            return this.render().getDump();
          } else {
            return this.render().getBase64();
          }
        },
        isSvg: function() {
          return this.format.match(/svg/i);
        }
      };
      var Svg = function(size, foreground, background) {
        this.size = size;
        this.foreground = this.color.apply(this, foreground);
        this.background = this.color.apply(this, background);
        this.rectangles = [];
      };
      Svg.prototype = {
        size: null,
        foreground: null,
        background: null,
        rectangles: null,
        color: function(r, g, b, a) {
          var values = [r, g, b].map(Math.round);
          values.push(a >= 0 && a <= 255 ? a / 255 : 1);
          return "rgba(" + values.join(",") + ")";
        },
        getDump: function() {
          var i, xml, rect, fg = this.foreground, bg = this.background, stroke = this.size * 5e-3;
          xml = "<svg xmlns='http://www.w3.org/2000/svg' width='" + this.size + "' height='" + this.size + "' style='background-color:" + bg + ";'><g style='fill:" + fg + "; stroke:" + fg + "; stroke-width:" + stroke + ";'>";
          for (i = 0; i < this.rectangles.length; i++) {
            rect = this.rectangles[i];
            if (rect.color == bg) continue;
            xml += "<rect  x='" + rect.x + "' y='" + rect.y + "' width='" + rect.w + "' height='" + rect.h + "'/>";
          }
          xml += "</g></svg>";
          return xml;
        },
        getBase64: function() {
          if ("function" === typeof btoa) {
            return btoa(this.getDump());
          } else if (Buffer) {
            return new Buffer(this.getDump(), "binary").toString("base64");
          } else {
            throw "Cannot generate base64 output";
          }
        }
      };
      if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
        module.exports = Identicon;
      } else {
        window.Identicon = Identicon;
      }
    })();
  }
});
export default require_identicon();
/*! Bundled license information:

identicon.js/pnglib.js:
  (**
  * A handy class to calculate color values.
  *
  * @version 1.0
  * @author Robert Eisele <robert@xarg.org>
  * @copyright Copyright (c) 2010, Robert Eisele
  * @link http://www.xarg.org/2010/03/generate-client-side-png-files-using-javascript/
  * @license http://www.opensource.org/licenses/bsd-license.php BSD License
  *
  *)
*/
//# sourceMappingURL=identicon__js.js.map
