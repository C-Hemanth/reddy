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
const base_1 = require("./classes/base");
const vscode = require("vscode");
const project_1 = require("./classes/project/project");
exports.default = new class App extends base_1.default {
    registerExtensionContext(context) {
        this._projectManager = new project_1.default();
        this.registerWorkspaceBehaviours();
        context.subscriptions.push(vscode.commands.registerCommand(base_1.default.CONSTANTS.COMMANDS.GET_STARTED, () => {
            this._projectManager.actionShowMainMenu();
        }));
        context.subscriptions.push(vscode.commands.registerCommand(base_1.default.CONSTANTS.COMMANDS.PROJECT_RUN, () => {
            this._projectManager.actionRun();
        }));
        context.subscriptions.push(vscode.commands.registerCommand(base_1.default.CONSTANTS.COMMANDS.PROJECT_STOP, () => {
            this._projectManager.terminalKillCurrentProcess();
        }));
        if (vscode.window.activeTextEditor) {
            this.showToolbarForActiveDocumentIfNeeded(vscode.window.activeTextEditor.document.uri);
        }
        this.statusDone();
    }
    registerWorkspaceBehaviours() {
        // document open
        // purpose:
        //  - show run button if opened document can be run
        vscode.workspace.onDidOpenTextDocument((textDocument) => {
            this.log("onDidOpenTextDocument");
            this.showToolbarForActiveDocumentIfNeeded(textDocument.uri);
        });
        // document text changed
        // purpose:
        vscode.workspace.onDidChangeTextDocument((textDocumentChangeEvent) => {
            this.log("onDidChangeTextDocument");
            console.log("User did updated text document but not saved yet");
        });
        // document did saved
        // purpose:
        //  - show run button if saved document can be execute
        vscode.workspace.onDidSaveTextDocument((textDocument) => {
            this.log("onDidSaveTextDocument");
            this.showToolbarForActiveDocumentIfNeeded(textDocument.uri);
        });
        // document did closed
        // purpose:
        //  - hide the run button because cannot run empty document
        vscode.workspace.onDidCloseTextDocument((textDocument) => {
            this.log("onDidCloseTextDocument");
            this.showToolbarForActiveDocumentIfNeeded(textDocument.uri);
        });
        // documents has been switched
        // purpose:
        //  - hide the run button if active text editor cannot be run
        vscode.window.onDidChangeActiveTextEditor((textEditor) => {
            this.log("onDidChangeActiveTextEditor");
            if (!textEditor) {
                this.toolbarRunShown(false);
                return;
            }
            this.showToolbarForActiveDocumentIfNeeded(textEditor.document.uri);
        });
        // terminal did closed
        // purpose:
        //  - hide the stop button if closed terminal is default app's terminal
        vscode.window.onDidCloseTerminal((terminal) => __awaiter(this, void 0, void 0, function* () {
            this.log("onDidCloseTerminal");
            let defaultTerminalPID = yield this.terminalGetProcessId();
            let closedTerminalPID = yield terminal.processId;
            if (defaultTerminalPID === closedTerminalPID) {
                this.toolbarStopShown(false);
            }
        }));
    }
    showToolbarForActiveDocumentIfNeeded(documentUri) {
        if (this.isMicropythonProject(documentUri)) {
            this.toolbarRunShown(true);
        }
        else {
            this.toolbarRunShown(false);
        }
    }
    onDestroyed() {
        super.onDestroyed();
    }
};
//# sourceMappingURL=app.js.map