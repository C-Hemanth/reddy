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
const base_1 = require("../base");
class GettingStarted extends base_1.default {
    showMainMenu() {
        return __awaiter(this, void 0, void 0, function* () {
            let menuItems = [];
            menuItems.push({
                label: "New project...",
                description: "",
                detail: "Generate new project included supported files"
            });
            let selectedAction = yield vscode.window.showQuickPick(menuItems);
            if (!selectedAction) {
                return;
            }
            switch (selectedAction.label) {
                case 'New project...':
                    this.actionNewProject();
                    break;
            }
        });
    }
    actionNewProject() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let selectedFolder = yield vscode.window.showOpenDialog({
                    openLabel: "Create...",
                    canSelectFiles: false,
                    canSelectFolders: true,
                    canSelectMany: false
                });
                if (!selectedFolder) {
                    this.statusDone();
                    return;
                }
                if (!selectedFolder.length) {
                    this.statusDone();
                    return;
                }
                let projectName = yield vscode.window.showInputBox({
                    ignoreFocusOut: true,
                    placeHolder: "My Project",
                    prompt: "Name of your project...",
                    validateInput(value) {
                        return (value.match(/^[^\\/:\*\?"<>\|]+$/) || '') ? null : 'The following characters are not allowed: \ / : * ? \" < > |';
                    }
                });
                if (!projectName || !projectName.length) {
                    this.statusDone();
                    return;
                }
                let workingFolder = path.join(selectedFolder[0].fsPath, projectName);
                let configFile = path.join(workingFolder, base_1.default.CONSTANTS.APP.CONFIG_FILE_NAME);
                // find connected ports
                var selectedPort = '';
                switch (this.getUserPlatform()) {
                    case 'win32':
                        selectedPort = (yield vscode.window.showInputBox({
                            ignoreFocusOut: true,
                            placeHolder: 'COM1',
                            prompt: "Current, we are not support auto detect devices connected for Windows. You need to enter port manually."
                        })) || '';
                        break;
                    default:
                        selectedPort = '> Reload list';
                        while (selectedPort === '> Reload list') {
                            var serialPorts = [];
                            try {
                                fs.readdirSync('/dev/').forEach((portItem) => {
                                    if (portItem.startsWith('tty.') && portItem.length >= 15) {
                                        serialPorts.push('/dev/' + portItem);
                                    }
                                });
                            }
                            catch (exception) {
                                serialPorts = [];
                                this.reportException(exception);
                            }
                            finally {
                                serialPorts.push('> Reload list');
                                serialPorts.push('> Not listed above?');
                            }
                            selectedPort = (yield vscode.window.showQuickPick(serialPorts, {
                                ignoreFocusOut: true,
                                placeHolder: "Please select port of connected device."
                            })) || '';
                        }
                        if (selectedPort === "> Not listed above?") {
                            selectedPort = (yield vscode.window.showInputBox({
                                ignoreFocusOut: true,
                                prompt: "Please enter port manually."
                            })) || '';
                        }
                        break;
                }
                if (!selectedPort || !selectedPort.length) {
                    this.statusDone();
                    return;
                }
                if (!fs.existsSync(selectedPort)) {
                    vscode.window.showErrorMessage("Port not exist, please connect device and try again!");
                    this.statusDone();
                    return;
                }
                let selectedBaudRate = parseInt((yield vscode.window.showQuickPick([
                    "300", "600", "1200", "2400", "4800", "9600", "14400", "19200", "28800", "38400", "57600", "115200", "128000", "256000"
                ], {
                    ignoreFocusOut: true,
                    placeHolder: "Please select default baud rate, default is 115200."
                })) || '115200') || 115200;
                // content of micropython config file
                let configFileObject = {
                    upload: { port: selectedPort, baud: selectedBaudRate },
                    serial: { port: selectedPort, baud: selectedBaudRate },
                    ignore: { extensions: [base_1.default.CONSTANTS.APP.CONFIG_FILE_NAME], directories: [".vscode"] }
                };
                fs.mkdirSync(workingFolder);
                fs.writeFileSync(path.join(workingFolder, "boot.py"), "# This is script that run when device boot up or wake from sleep.\n\n\n");
                fs.writeFileSync(path.join(workingFolder, "main.py"), "# This is your main script.\n\n\nprint(\"Hello, world!\")\n");
                fs.writeFileSync(configFile, JSON.stringify(configFileObject, null, 2));
                vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.parse(workingFolder));
            }
            catch (exception) {
                this.reportException(exception);
            }
            finally {
                this.statusDone();
            }
        });
    }
}
exports.default = GettingStarted;
//# sourceMappingURL=getting-started.js.map