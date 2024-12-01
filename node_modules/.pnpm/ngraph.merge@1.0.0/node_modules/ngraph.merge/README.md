# ngraph.merge

Simple merge utility to extend objects without extra dependencies. This utility
may be useful when you want to quickly provide optional settings

[![build status](https://secure.travis-ci.org/anvaka/ngraph.merge.png)](http://travis-ci.org/anvaka/ngraph.merge)
# usage

``` js
  var merge = require('ngraph.merge');
  var options = { age: 42 };
  merge(options, { name: 'John' });
  console.log(options); // { age: 42, name: 'John'}

  merge(options, { age: 100 });
  console.log(options.age); // 42. Options already has age defined

  merge(options, {age: '100'});
  console.log(options.age); // '100'. Type mismatch. Age is overwritten
```

For more examples please refer to [tests](https://github.com/anvaka/ngraph.merge/blob/master/test/merge.js).

# why?
I want to control dependencies chain and not pull too many external libraries
into ngraph.

# install

With [npm](https://npmjs.org) do:

```
npm install ngraph.merge
```

# license

MIT
