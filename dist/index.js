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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cassettes = exports.MochaCassettes = void 0;
exports.TestCassettes = TestCassettes;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const mocha = __importStar(require("mocha"));
const nock_1 = __importDefault(require("nock"));
const rimraf_1 = require("rimraf");
const sanitize_filename_1 = __importDefault(require("sanitize-filename"));
class MochaCassettes extends mocha.Test {
    cassettePath;
    fnPrefix;
    fnSuffix;
    actionSpecified;
    constructor(cassettePath, title, fn) {
        super(title, fn);
        this.cassettePath = cassettePath;
        this.fnPrefix = () => {
            // Intentionally left empty
        };
        this.fnSuffix = () => {
            // Intentionally left empty
        };
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
            if (!fs_1.default.existsSync(this.cassettePath)) {
                fs_1.default.mkdirSync(this.cassettePath);
            }
            if (fs_1.default.existsSync(this.getCassetteFilePath(cassetteFileName))) {
                cassetteFilePath = cassetteFileName
                    ? path_1.default.join(this.cassettePath, cassetteFileName)
                    : this.getCassetteFilePath();
                fs_1.default.unlinkSync(cassetteFilePath);
            }
            nock_1.default.recorder.rec({
                dont_print: true,
                use_separator: false,
                output_objects: true,
            });
        };
        this.fnSuffix = () => {
            const res = nock_1.default.recorder.play();
            fs_1.default.writeFileSync(this.getCassetteFilePath(cassetteFileName), JSON.stringify(res, null, 2));
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
            nock_1.default.load(cassettePath);
            if (!nock_1.default.isActive()) {
                nock_1.default.activate();
            }
        };
        this.fnSuffix = () => {
            // Intentionally left empty
        };
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
            catch (_e) {
                // catches timeout errors. Mocha magic handles the rest. NOTE, this is incredibly hard to test for
                this.resetNock();
                return undefined;
            }
        };
        suite.addTest(this);
    }
    resetNock() {
        nock_1.default.recorder.clear();
        nock_1.default.cleanAll();
        nock_1.default.restore();
    }
    cassetteExists(filePath) {
        return fs_1.default.existsSync(filePath);
    }
    getCassetteFilePath(filename) {
        return path_1.default.join(this.cassettePath, filename || this.getCassetteName());
    }
    getCassetteName(filename) {
        // remove all spaces and /, replace them with _ and - respectively
        return (0, sanitize_filename_1.default)(filename || this.fullTitle()) + ".cassette";
    }
}
exports.MochaCassettes = MochaCassettes;
function TestCassettes(cassettePath, title, fn) {
    return new MochaCassettes(cassettePath, title, fn);
}
class Cassettes {
    cassettePath;
    constructor(cassettePath) {
        this.cassettePath = cassettePath;
    }
    createTest(title, fn) {
        return new MochaCassettes(this.cassettePath, title, fn);
    }
    removeAllCassettes() {
        return (0, rimraf_1.rimraf)(this.cassettePath);
    }
}
exports.Cassettes = Cassettes;
//# sourceMappingURL=index.js.map