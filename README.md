# karma-json-to-file-reporter
Karma reporter that save JSON messages from log to file

[![NPM version][npm-image]][npm-url]

A simple Karma reporter for harvesting json messages from matchers and specs, filtering and saving to file.

It's extremely useful for creating custom CI artifacts with reports or important information.

## Installation

Install from NPM:
```shell
npm install --save-dev karma-json-to-file-reporter
```

Or add `karma-json-reporter` as a devDependency in your `package.json`.
```json
{
  "devDependencies": {
    "karma": "^3.0.0",
    "karma-json-reporter": "*"
  }
}
```

## Usage

Use it as a usual reporter. Add config to `karma.conf.js`:

```json
{
	"jsonToFileReporter": {
		"outputPath": "tests/out/"
		// other configs
	},
	"plugins": [
		"karma-json-to-file-reporter"
	],
	"reporters": ["json-to-file"]
}
```

JSON messages logged via `console.log(_)` will be filtered and saved to local json file you specified in config.

In you spec code you just need to log your JSON object as string or object:

```javascript
let obj = {msg: "hello world!"};
console.log(JSON.stringify(obj)); // as string
console.log({foo: "bar"}); // or as object
```

##Output data
```json
[
  {
    "msg": "hello world!"
  },
  {
    "foo": "bar"
  }
]
```

## Config

#### `outputPath`

Path for your json output file. By default it will save your files in the root of your project.

__Default__: ""

#### `fileName`

File name pattern. You can use wildcards:

* `*timestamp*` - for current karma run timestamp.
* `*index*` - for log entry index: 1, 2, 3, etc.

__Default__: "logFile_*start-timestamp*.json"

#### `overwrite`

Set it `true` to overwrite files if it already exists.
If `false`, log entries will be added to the end

__Default__: undefined

#### `filter`

Filter for json objects. This option can be:

* String. Filter JSONs by field on the root level
* Predicate function. (obj: Object) => boolean

__Default__: undefined


[npm-url]: https://www.npmjs.org/package/karma-json-to-file-reporter
[npm-image]: https://badge.fury.io/js/karma-json-to-file-reporter.png
