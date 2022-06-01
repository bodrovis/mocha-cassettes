"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const index_1 = require("./../src/index");
const express = require("express");
const path = require("path");
const got_1 = require("got");
const PORT = 8675;
const url = "test";
const url_root = `http://localhost:${PORT}`;
describe("Mocha VCR", function () {
    let server;
    const cassette = new index_1.Cassettes(path.join(__dirname, "cassettes"));
    let response;
    beforeEach((done) => {
        const app = express();
        response = "response1";
        app.get(`/${url}`, (_req, res) => {
            res.send(response);
        });
        server = app.listen(PORT, done);
    });
    afterEach((done) => {
        server.close(done);
    });
    after(() => cassette.removeAllCassettes());
    describe("Mocks the http requests that were recorded", function () {
        cassette
            .createTest("can be written", async () => {
            const resp = await (0, got_1.default)(url, { prefixUrl: url_root });
            (0, chai_1.expect)(resp.body).to.be.equal("response1");
        })
            .recordCassette()
            .register(this);
        cassette
            .createTest("can be read with an async function", async () => {
            const resp = await (0, got_1.default)(url, { prefixUrl: url_root });
            (0, chai_1.expect)(resp.body).to.be.equal("response1");
        })
            .playCassette("Mocha VCR mocks the http requests that were recorded can be written.cassette")
            .register(this);
        cassette
            .createTest("can be read with a returned promise", () => {
            response = "incorrectResponse";
            return (0, got_1.default)(url, { prefixUrl: url_root }).then((resp) => {
                (0, chai_1.expect)(resp.body).to.be.equal("response1");
            });
        })
            .playCassette("Mocha VCR mocks the http requests that were recorded can be written.cassette")
            .register(this);
        it("will not affect non mocked cases", async () => {
            response = "incorrectResponse";
            const resp = await (0, got_1.default)(url, { prefixUrl: url_root });
            (0, chai_1.expect)(resp.body).to.be.equal(response);
        });
    });
    describe("Non specified action cases work as expected", function () {
        // the names for these tests must remain the same to map to the same fixture
        cassette
            .createTest("record case", async () => {
            const resp = await (0, got_1.default)(url, { prefixUrl: url_root });
            (0, chai_1.expect)(resp.body).to.be.equal("response1");
        })
            .register(this);
        cassette
            .createTest("record case", async () => {
            response = "incorrectResponse";
            const resp = await (0, got_1.default)(url, { prefixUrl: url_root });
            (0, chai_1.expect)(resp.body).to.be.equal("response1");
        })
            .register(this);
    });
    describe("passes when there are no http calls made", function () {
        cassette
            .createTest("namespace collision", async () => {
            (0, chai_1.expect)(true).to.be.true;
        })
            .register(this);
        cassette
            .createTest("namespace collision", () => {
            (0, chai_1.expect)(true).to.be.true;
        })
            .register(this);
        cassette
            .createTest("namespace collision", (done) => {
            (0, chai_1.expect)(true).to.be.true;
            done();
        })
            .register(this);
        cassette
            .createTest("namespace collision", () => {
            (0, chai_1.expect)(true).to.be.true;
            return Promise.resolve();
        })
            .register(this);
    });
    // Unskip this to test timeout cases. If timeout catching is not implemented properly a nock error like
    // "Module's request already overridden for http protocol." or  "Nock recording already in progress" will be thrown
    // If it is implemented properly, then only the third test will fail, and it will be a timeout error
    describe("timeout suite", function () {
        // record
        cassette
            .createTest("can handle a timeout", async () => {
            const resp = await (0, got_1.default)(url, { prefixUrl: url_root });
            (0, chai_1.expect)(resp.body).to.be.equal("response1");
        })
            .register(this);
        // replay
        cassette
            .createTest("can handle a timeout", async () => {
            response = "incorrectResponse";
            const resp = await (0, got_1.default)(url, { prefixUrl: url_root });
            (0, chai_1.expect)(resp.body).to.be.equal("response1");
        })
            .register(this);
        //vcr.createTest('can handle a timeout', (done) => {
        //  setTimeout(() => {
        //    done()
        //  }, 10000)
        //  })
        //  .timeout(500)
        //  .register(this)
        // replay
        cassette
            .createTest("can handle a timeout", async () => {
            response = "incorrectResponse";
            const resp = await (0, got_1.default)(url, { prefixUrl: url_root });
            (0, chai_1.expect)(resp.body).to.be.equal("response1");
        })
            .register(this);
    });
});
//# sourceMappingURL=index.spec.js.map