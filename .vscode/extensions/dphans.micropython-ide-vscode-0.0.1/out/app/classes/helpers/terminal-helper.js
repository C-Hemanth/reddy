'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process = require("child_process");
const vscode_1 = require("vscode");
exports.default = new class TerminalHelper {
    execPromise(command) {
        return new Promise((resolve, reject) => {
            // Fix parsing args child_process library for python3
            // TODO: Remove line below when owner fixed this problem (reference: https://github.com/madjar/nox/issues/19)
            command = "export LANG=\"en_US.UTF-8\" && " + command;
            child_process.exec(command, {
                encoding: 'utf8',
                cwd: vscode_1.workspace.rootPath
            }, (error, stdout, stderr) => {
                if (error) {
                    return reject(error);
                }
                return resolve(stdout);
            });
        });
    }
    /**
     * kill process by process id
     * @param processId id of process
     * @param delayTimeMillis after process killed, delay this time
     */
    killProcessPromise(processId, delayTimeMillis = 1000) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.execPromise("kill -9 " + processId);
                setTimeout(() => {
                    resolve(true);
                }, delayTimeMillis);
            }
            catch (executeException) {
                reject(executeException);
            }
        }));
    }
    checkExecutableToolPromise(executeCommandName, installScript) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                let toolPath = yield this.getExecutableToolPathPromise(executeCommandName);
                if ((toolPath || '') === "") {
                    throw new Error("Build tool is not available");
                }
                resolve(true);
            }
            catch (commandNotFoundException) {
                if ((yield vscode_1.window.showInformationMessage("`" + executeCommandName + "` command not found in your executable environment. Do you want to install `" + executeCommandName + "` tool?", { modal: false }, "No", "Install")) === "Install") {
                    try {
                        yield this.execPromise(installScript);
                    }
                    catch (installAmpyException) {
                        vscode_1.window.showErrorMessage("Error while installing `" + executeCommandName + "`, please recheck your internet connection and try again!");
                    }
                    finally {
                        try {
                            let isAvailable = (yield this.getExecutableToolPathPromise(executeCommandName)) !== '';
                            if (isAvailable) {
                                vscode_1.window.showInformationMessage("`" + executeCommandName + "` has been installed successfully!");
                            }
                            resolve(isAvailable);
                        }
                        catch (e) {
                            resolve(false);
                        }
                    }
                }
                else {
                    resolve(false);
                }
            }
        }));
    }
    getExecutableToolPathPromise(executeCommandName) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                let toolPath = yield this.execPromise("which " + executeCommandName);
                if (typeof toolPath !== "string") {
                    toolPath = '';
                }
                resolve(toolPath.trim());
            }
            catch (toolPathNotFound) {
                reject(toolPathNotFound);
            }
        }));
    }
};
//# sourceMappingURL=terminal-helper.js.map