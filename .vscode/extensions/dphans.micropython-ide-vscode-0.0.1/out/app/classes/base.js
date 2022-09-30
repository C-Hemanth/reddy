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
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const terminal_helper_1 = require("./helpers/terminal-helper");
class Base {
    constructor() {
        this.onInitial();
    }
    static getTerminalHelper() {
        return terminal_helper_1.default;
    }
    onInitial() {
        if (!Base._statusBar) {
            Base._statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
            Base._statusBar.command = Base.CONSTANTS.COMMANDS.GET_STARTED;
        }
        if (!Base._outputChannel) {
            Base._outputChannel = vscode.window.createOutputChannel(Base.CONSTANTS.APP.UNIQUE_NAME);
        }
        if (!Base._toolbarRunProject) {
            Base._toolbarRunProject = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
            Base._toolbarRunProject.text = "▶";
            Base._toolbarRunProject.tooltip = Base.CONSTANTS.APP.UNIQUE_NAME + ": Build this file then run main.py script";
            Base._toolbarRunProject.color = '#89D185';
            Base._toolbarRunProject.command = Base.CONSTANTS.COMMANDS.PROJECT_RUN;
        }
        if (!Base._toolbarStopProject) {
            Base._toolbarStopProject = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
            Base._toolbarStopProject.text = "■";
            Base._toolbarStopProject.tooltip = Base.CONSTANTS.APP.UNIQUE_NAME + ": Stop current running serial monitor";
            Base._toolbarStopProject.color = '#F48771';
            Base._toolbarStopProject.command = Base.CONSTANTS.COMMANDS.PROJECT_STOP;
        }
    }
    onDestroyed() {
        this.statusShown(false);
        delete Base._statusBar;
        this.outputShown(false);
        delete Base._outputChannel;
    }
    /**
     * Show status bar with message
     * @param message text need to show
     */
    statusText(message, tooltipText = "") {
        if (!Base._statusBar) {
            return;
        }
        Base._statusBar.text = Base.CONSTANTS.APP.UNIQUE_NAME + ": " + message;
        if (tooltipText.length) {
            Base._statusBar.tooltip = tooltipText;
        }
        this.statusShown(true);
    }
    statusWarning(isWarning = true) {
        if (!Base._statusBar) {
            return;
        }
        Base._statusBar.color = isWarning ? '#F48771' : '#FFFFFF';
    }
    /**
     * Toggle status bar
     * @param isShown true if need to show status bar
     */
    statusShown(isShown = false) {
        if (!Base._statusBar) {
            return;
        }
        if (isShown) {
            if (Base._isStatusBarShown) {
                return;
            }
            Base._statusBar.show();
            Base._isOutputChannelShown = true;
            return;
        }
        if (!Base._isStatusBarShown) {
            return;
        }
        Base._statusBar.hide();
        Base._isOutputChannelShown = false;
    }
    /**
     * Reset status bar text
     */
    statusDone() {
        this.statusText("Done!", "Click here to getting started!");
    }
    /**
     * Print into Output window
     * @param message text need to log into output
     */
    outputPrint(message) {
        if (!Base._outputChannel) {
            return;
        }
        this.outputShown(true);
        Base._outputChannel.append(message);
    }
    /**
     * Print into Output window with new line
     * @param message text need to log into output
     */
    outputPrintLn(message, isAlsoUpdateStatus = false) {
        if (!Base._outputChannel) {
            return;
        }
        this.outputShown(true);
        Base._outputChannel.appendLine(message);
        if (isAlsoUpdateStatus) {
            this.statusText(message);
        }
    }
    /**
     * Clear Output window
     * @param alsoHideWindow hide Output after clear, default is false
     */
    outputClear(alsoHideWindow = false) {
        if (!Base._outputChannel) {
            return;
        }
        Base._outputChannel.clear();
        if (alsoHideWindow) {
            this.outputShown(false);
        }
    }
    /**
     * Create Terminal window if not available
     */
    terminalInitIfNeeded() {
        if (Base._terminal) {
            return;
        }
        Base._terminal = vscode.window.createTerminal(Base.CONSTANTS.APP.UNIQUE_NAME);
        Base._isTerminalShown = false;
    }
    /**
     * Send command into Terminal window
     * @param commandText command need to send to terminal
     * @param newLine append new line command also, default is true
     */
    terminalWrite(commandText, newLine = true) {
        this.terminalInitIfNeeded();
        this.terminalShown(true);
        if (Base._terminal) {
            Base._terminal.sendText(commandText, newLine);
        }
    }
    /**
     * Show Terminal window
     * @param isShown set to true if need display terminal, default is false
     */
    terminalShown(isShown = false) {
        this.terminalInitIfNeeded();
        if (isShown === Base._isTerminalShown) {
            return;
        }
        if (!Base._terminal) {
            return;
        }
        if (isShown) {
            Base._terminal.show(false);
        }
        else {
            Base._terminal.hide();
        }
        Base._isTerminalShown = isShown;
    }
    /**
     * Kill current running process on default terminal then reinit
     */
    terminalKillCurrentProcess() {
        return __awaiter(this, void 0, void 0, function* () {
            let processId = yield this.terminalGetProcessId();
            if (!processId) {
                return;
            }
            try {
                yield terminal_helper_1.default.killProcessPromise(processId);
            }
            catch (e) { }
            try {
                Base._terminal.dispose();
            }
            catch (e) { }
            Base._isTerminalShown = false;
            Base._terminal = undefined;
            this.toolbarStopShown(false);
        });
    }
    /**
     * Get current terminal process
     */
    terminalGetProcessId() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!Base._terminal) {
                return undefined;
            }
            try {
                return (yield Base._terminal.processId) || undefined;
            }
            catch (e) {
                return undefined;
            }
        });
    }
    /**
     * Toggle Output window
     * @param isShown true if need to show Output window
     */
    outputShown(isShown = false) {
        if (isShown) {
            if (Base._isOutputChannelShown) {
                return;
            }
            Base._outputChannel.show(false);
            Base._isOutputChannelShown = true;
            return;
        }
        if (!Base._isOutputChannelShown) {
            return;
        }
        Base._outputChannel.hide();
        Base._isOutputChannelShown = false;
    }
    /**
     * Toogle toolbar RUN
     * @param isShown set to true if need to show Run item
     */
    toolbarRunShown(isShown = false) {
        if (isShown === Base._isToolbarRunProjectShown) {
            return;
        }
        if (isShown) {
            Base._toolbarRunProject.show();
        }
        else {
            Base._toolbarRunProject.hide();
        }
        Base._isToolbarRunProjectShown = isShown;
    }
    /**
     * Toogle toolbar STOP
     * @param isShown set to true if need to show Stop item
     */
    toolbarStopShown(isShown = false) {
        if (isShown === Base._isToolbarStopProjectShown) {
            return;
        }
        if (isShown) {
            Base._toolbarStopProject.show();
        }
        else {
            Base._toolbarStopProject.hide();
        }
        Base._isToolbarStopProjectShown = isShown;
    }
    /**
     * Check if current document is in Micropython project
     * @param documentPath path of document included inside project need to check
     */
    isMicropythonProject(documentPath) {
        let projectPath = vscode.workspace.getWorkspaceFolder(documentPath);
        if (!projectPath) {
            return false;
        }
        return fs.existsSync(path.join(projectPath.uri.fsPath, Base.CONSTANTS.APP.CONFIG_FILE_NAME));
    }
    /**
     * Get current user Operation System
     * @returns name of platform, possibles:
     *          'darwin' => MacOS,
     *          'freebsd' => FreeBSD
     *          'linux' => Ubuntu or CentOS,...
     *          'sunos' => SunOS
     *          'win32' => Microsoft Windows
     */
    getUserPlatform() {
        return process.platform || '';
    }
    /**
     * Print log for debugging
     * @param message message need to print
     * @param optionalParams additional params
     */
    log(message, ...optionalParams) {
        console.log(message, optionalParams);
    }
    /**
     * Send report to developer if user have any exception
     * @param exception error need to report
     */
    reportException(exception) {
        // TODO: Send report...
    }
}
Base.CONSTANTS = require("../constants");
Base._isStatusBarShown = false;
Base._isOutputChannelShown = false;
Base._isTerminalShown = false;
Base._isToolbarRunProjectShown = false;
Base._isToolbarStopProjectShown = false;
exports.default = Base;
//# sourceMappingURL=base.js.map