# Contributing guide

## Testing

We use Jest as our test runner. Invoke `yarn test` to run all tests.

## Writing a plugin

A Happo plugin is basically an object with a few methods/properties defined,
along with an optional set of files.

### `customizeWebpackConfig`
Similar to the `customizeWebpackConfig` configuration option, this is a method
that allows you to extend/customize the default webpack configuration used by
Happo.

```js
module.exports = {
  customizeWebpackConfig: config => {
    config.plugins.push(new MyOwnWebpackPlugin()),
  },
}
```

### `pathToExamplesFile`
Specify a path to a file that gets added to the list of happo example files
being parsed. The most common usecase here would be to auto-generate Happo
examples from a different source.

```js
const path = require('path');

module.exports = {
  pathToExamplesFile: path.resolve(__dirname, 'myHappoExamples.js'),
}
```

