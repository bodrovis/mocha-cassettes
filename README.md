# MochaCassettes

[![Build Status](https://travis-ci.org/bodrovis/mocha-cassettes.svg?branch=master)](https://travis-ci.org/bodrovis/mocha-cassettes)

Node.js library based on [Nock](https://github.com/nock/nock) to record HTTP interactions in [Mocha](https://mochajs.org/) tests.

## Installation

Install with [NPM](npm install):

```
npm install -D mocha-cassettes
```

## Usage

Import the `Cassettes` module in your test:

```ts
import { Cassettes } from 'mocha-cassettes';
```

Create an instance while providing a path to the folder where your recorded cassettes should reside:

```ts
describe('Feature', function () {
  const cassette = new Cassettes('./test/cassettes');
});
```

Now create the actual test:

```ts
cassette.createTest('get request', async () => {
  const response = await got('http://localhost/test');
  expect(response.body).to.be.equal('ok');
}).register(this);
```

If the cassette does not exist, it will be recorded for you once you run the test. All subsequent test runs will utilize the recorded cassette. Set the environment variable `NO_CASSETTE_MOCKING` to ignore all mocking code.

Here is the full example:

```ts
import { Cassettes } from 'mocha-cassettes';

describe('Feature', function () {
  const cassette = new Cassettes('./test/cassettes');

  cassette.createTest('get request', async () => {
    const response = await got('http://localhost/test');
    expect(response.body).to.be.equal('ok');
  }).register(this);
});
```

## License

This library is based on [mocha-tape-deck](https://github.com/fossas/mocha-tape-deck) and licensed under the [MIT License](https://github.com/bodrovis/mocha-vcr/blob/master/LICENSE).

Copyright (c) [Ilya Bodrov](http://bodrovis.tech), Roman Kutanov
