var test = require('tap').test,
  merge = require('..');

test('Should not touch properties when types match', function(t) {
  var options = {
    age: 42
  };
  merge(options, {
    age: 24
  });

  t.equals(options.age, 42);
  t.end();
});

test('Should extend, because types are different', function(t) {
  var options = {
    age: '42'
  };
  merge(options, {
    age: 24
  });

  t.equals(options.age, 24);
  t.end();
});

test('Should augment with new properties', function(t) {
  var options = {
    age: 42
  };
  merge(options, {
    newproperty: 24
  });

  t.equals(options.age, 42);
  t.equals(options.newproperty, 24);
  t.end();
});

test('goes deep', function(t) {
  var options = {
    age: 42
  };
  merge(options, {
    nested: {
      name: 'deep'
    }
  });

  t.equals(options.age, 42);
  t.equals(options.nested.name, 'deep');
  t.end();
});

test('goes deep avoids conflicts', function(t) {
  var options = {
    age: 42,
    user: {
      firstName: 'John'
    }
  };
  merge(options, {
    user: {
      lastName: 'Smith'
    }
  });

  t.equals(options.age, 42);
  t.equals(options.user.firstName, 'John');
  t.equals(options.user.lastName, 'Smith');
  t.end();
});

test('Initializes with default object', function(t) {
  var options = {
    age: '42'
  };
  var result = merge(undefined, options);
  t.deepEqual(result, options);

  var onlyOptions = merge(options);
  t.deepEqual(onlyOptions, options);

  t.end();
});

test('Do not copy prototype', function(t) {
  function Options() {
    this.age = 42;
  }
  Options.prototype.foo = 'foo';

  var options = new Options();
  var result = merge({}, options);
  t.equals(result.age, 42);
  t.ok(result.foo === undefined);

  t.end();
});
