"use strict";
// Adapted from https://github.com/fossas/mocha-tape-deck/blob/master/src/index.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cassettes = exports.TestCassettes = exports.MochaCassettes = void 0;
const fs = require("fs");
const nock = require("nock");
const mocha = __importStar(require("mocha"));
const path = require("path");
const rimraf = require("rimraf");
const sanitize = require("sanitize-filename");
class MochaCassettes extends mocha.Test {
    cassettePath;
    fnPrefix;
    fnSuffix;
    actionSpecified;
    constructor(cassettePath, title, fn) {
        super(title, fn);
        this.cassettePath = cassettePath;
        this.fnPrefix = () => { };
        this.fnSuffix = () => { };
        this.actionSpecified = false;
    }
    recordCassette(cassetteFileName) {
        this.actionSpecified = true;
        if (process.env.NO_CASSETTE_MOCKING) {
            return this;
        }
        if (!this.fn) {
            return this;
        }
        let cassetteFilePath;
        this.fnPrefix = () => {
            if (!fs.existsSync(this.cassettePath)) {
                fs.mkdirSync(this.cassettePath);
            }
            if (fs.existsSync(this.getCassetteFilePath(cassetteFileName))) {
                cassetteFilePath = cassetteFileName
                    ? path.join(this.cassettePath, cassetteFileName)
                    : this.getCassetteFilePath();
                fs.unlinkSync(cassetteFilePath);
            }
            nock.recorder.rec({
                dont_print: true,
                use_separator: false,
                output_objects: true,
            });
        };
        this.fnSuffix = () => {
            const res = nock.recorder.play();
            fs.writeFileSync(this.getCassetteFilePath(cassetteFileName), JSON.stringify(res, null, 2));
        };
        return this;
    }
    playCassette(cassetteFileName) {
        this.actionSpecified = true;
        if (process.env.NO_CASSETTE_MOCKING) {
            return this;
        }
        this.fnPrefix = () => {
            const cassettePath = this.getCassetteFilePath(cassetteFileName);
            nock.load(cassettePath);
            if (!nock.isActive()) {
                nock.activate();
            }
        };
        this.fnSuffix = () => { };
        return this;
    }
    selectCassetteAction(fn, cassettePath) {
        return fn() === "record"
            ? this.recordCassette()
            : this.playCassette(cassettePath);
    }
    register(suite, options = { failIfNoCassette: false }) {
        const originalFn = this.fn;
        this.fn = (done) => {
            try {
                if (!this.actionSpecified) {
                    if (this.cassetteExists(this.getCassetteFilePath())) {
                        this.playCassette();
                    }
                    else {
                        if (options.failIfNoCassette) {
                            throw new Error("Expected cassette file for mocha-cassettes does not exist");
                        }
                        this.recordCassette();
                    }
                }
                this.fnPrefix();
                let testExecutedPromise;
                let doneWrapper;
                const donePromise = new Promise((res) => {
                    doneWrapper = res;
                });
                const returnVal = originalFn(done ? doneWrapper : undefined);
                // sanity check for promise case
                if (returnVal && returnVal.then) {
                    testExecutedPromise = returnVal;
                }
                else {
                    //test was synchronous
                    testExecutedPromise = Promise.resolve();
                }
                testExecutedPromise
                    .then(() => {
                    if (done) {
                        return donePromise.then((res) => {
                            done(res);
                        });
                    }
                    else {
                        return undefined;
                    }
                })
                    .then(() => this.fnSuffix())
                    .then(this.resetNock.bind(this))
                    .catch(() => {
                    this.resetNock.bind(this);
                });
                // if we return with a done fn defined, we get the error Resolution method is overspecified.
                if (done) {
                    return undefined;
                }
                else {
                    return testExecutedPromise;
                }
            }
            catch (e) {
                // catches timeout errors. Mocha magic handles the rest. NOTE, this is incredibly hard to test for
                this.resetNock();
                return undefined;
            }
        };
        suite.addTest(this);
    }
    resetNock() {
        nock.recorder.clear();
        nock.cleanAll();
        nock.restore();
    }
    cassetteExists(filePath) {
        return fs.existsSync(filePath);
    }
    getCassetteFilePath(filename) {
        return path.join(this.cassettePath, filename || this.getCassetteName());
    }
    getCassetteName(filename) {
        // remove all spaces and /, replace them with _ and - respectively
        return sanitize(filename || this.fullTitle()) + ".cassette";
    }
}
exports.MochaCassettes = MochaCassettes;
function TestCassettes(cassettePath, title, fn) {
    return new MochaCassettes(cassettePath, title, fn);
}
exports.TestCassettes = TestCassettes;
class Cassettes {
    cassettePath;
    constructor(cassettePath) {
        this.cassettePath = cassettePath;
    }
    createTest(title, fn) {
        return new MochaCassettes(this.cassettePath, title, fn);
    }
    removeAllCassettes() {
        return new Promise((res, rej) => {
            rimraf(this.cassettePath, (err) => {
                if (err) {
                    rej(err);
                }
                else {
                    res();
                }
            });
        });
    }
}
exports.Cassettes = Cassettes;
//# sourceMappingURL=index.js.map