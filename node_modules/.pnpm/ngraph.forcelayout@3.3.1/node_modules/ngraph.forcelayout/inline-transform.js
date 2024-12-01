var through = require('through2');

module.exports = function (file) {
    return through(function (buf, enc, next) {
      let originalContent = buf.toString('utf8');
      let dimensions = 2; // change this if you need different number of dimensions
      if (file.match(/codeGenerators\/generate/)) {
        let content = require(file);
        let matches = originalContent.match(/^\/\/ InlineTransform: (.+)$/gm);
        let additionalTransform = matches ? matches.map(name => {
          let f = name.substr('// InlineTransform: '.length);
          return content[f](dimensions);
        }).join('\n') : '';
        let exportCodeMatch = originalContent.match(/^\/\/ InlineTransformExport: (.+)$/m);
        let codeExport = exportCodeMatch ?  exportCodeMatch[1] :
          `module.exports = function() { return ${content(dimensions).toString()} }`;
        this.push(`${additionalTransform}\n${codeExport}`);
      } else {
        this.push(originalContent);
      }
      next();
    });
};