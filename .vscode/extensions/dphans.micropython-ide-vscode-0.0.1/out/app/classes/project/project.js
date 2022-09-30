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
const base_1 = require("../base");
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
class Project extends base_1.default {
    /**
     * display main menu for project managerment
     */
    actionShowMainMenu() {
        return __awaiter(this, void 0, void 0, function* () {
            let menuItems = [];
            menuItems.push({
                label: "New project...",
                description: "",
                detail: "Generate new project included supported files"
            });
            menuItems.push({
                label: "Flash Firmware...",
                description: "",
                detail: "Flash Micropython firmware using esptool.py"
            });
            menuItems.push({
                label: "Download Firmware...",
                description: "",
                detail: "Enter Micropython download page"
            });
            let selectedAction = yield vscode.window.showQuickPick(menuItems);
            if (!selectedAction) {
                return;
            }
            switch (selectedAction.label) {
                case 'New project...':
                    this.actionNewProject();
                    break;
                case 'Flash Firmware...':
                    this.actionFlashFirmware();
                    break;
                case 'Download Firmware...':
                    vscode.commands.executeCommand('vscode.open', vscode.Uri.parse('http://www.micropython.org/download'));
                    break;
            }
        });
    }
    /**
     * start new project setup widzard
     */
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
                    ignore: { extensions: [base_1.default.CONSTANTS.APP.CONFIG_FILE_NAME], directories: [".vscode"] },
                    tools: { ampy: "", rshell: "" }
                };
                // check build tools
                try {
                    let ampyPath = yield base_1.default.getTerminalHelper().execPromise("which ampy");
                    configFileObject.tools.ampy = (ampyPath || '').trim();
                }
                catch (commandNotFoundException) {
                    this.reportException(commandNotFoundException);
                }
                if (!configFileObject.tools.ampy || !configFileObject.tools.ampy.length || !fs.existsSync(configFileObject.tools.ampy)) {
                    if ((yield vscode.window.showInformationMessage("`ampy` command not found in your executable environment. Do you want to install `ampy` tool?", { modal: false }, "No", "Install")) === "Install") {
                        try {
                            this.statusText("Installing adafruit-ampy via pip...");
                            let installResult = yield base_1.default.getTerminalHelper().execPromise("pip install adafruit-ampy");
                            this.outputClear();
                            this.outputPrintLn((installResult || ''));
                            this.outputShown(true);
                        }
                        catch (installAmpyException) {
                            this.reportException(installAmpyException);
                        }
                        finally {
                            this.outputShown(false);
                            this.statusDone();
                        }
                        try {
                            let ampyPath = yield base_1.default.getTerminalHelper().execPromise("which ampy");
                            configFileObject.tools.ampy = (ampyPath || '').trim();
                        }
                        catch (commandNotFoundException) {
                            this.reportException(commandNotFoundException);
                        }
                    }
                }
                try {
                    let rshellPath = yield base_1.default.getTerminalHelper().execPromise("which rshell");
                    configFileObject.tools.rshell = (rshellPath || '').trim();
                }
                catch (commandNotFoundException) {
                    this.reportException(commandNotFoundException);
                }
                if (!configFileObject.tools.rshell || !configFileObject.tools.rshell.length || !fs.existsSync(configFileObject.tools.rshell)) {
                    if ((yield vscode.window.showInformationMessage("`rshell` command not found in your executable environment. Do you want to install `rshell` tool?", { modal: false }, "No", "Install")) === "Install") {
                        try {
                            this.statusText("Installing rshell via pip...");
                            let installResult = yield base_1.default.getTerminalHelper().execPromise("pip install rshell");
                            this.outputClear();
                            this.outputPrintLn((installResult || ''));
                            this.outputShown(true);
                        }
                        catch (installRshellException) {
                            this.reportException(installRshellException);
                        }
                        finally {
                            this.outputShown(false);
                            this.statusDone();
                        }
                        try {
                            let rshellPath = yield base_1.default.getTerminalHelper().execPromise("which rshell");
                            configFileObject.tools.ampy = (rshellPath || '').trim();
                        }
                        catch (commandNotFoundException) {
                            this.reportException(commandNotFoundException);
                        }
                    }
                }
                fs.mkdirSync(workingFolder);
                fs.writeFileSync(path.join(workingFolder, "boot.py"), "# This is script that run when device boot up or wake from sleep.\n\n\n");
                fs.writeFileSync(path.join(workingFolder, "main.py"), "# This is your main script.\n\n\nprint(\"Hello, world!\")\n");
                fs.writeFileSync(configFile, JSON.stringify(configFileObject, null, 2));
                yield vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.parse(workingFolder));
            }
            catch (exception) {
                vscode.window.showErrorMessage("Error while preparing new project: " + exception.message);
                this.reportException(exception);
            }
            finally {
                this.statusDone();
            }
        });
    }
    /**
     * flash firmware using esptool
     */
    actionFlashFirmware() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(yield base_1.default.getTerminalHelper().checkExecutableToolPromise("esptool.py", "pip install esptool"))) {
                throw new Error("Required tool not found (`esptool.py`). Please install `esptool` to run project.");
            }
            let selectedFirmwareUri = yield vscode.window.showOpenDialog({
                canSelectFiles: true,
                canSelectFolders: false,
                canSelectMany: false,
                openLabel: "Use this firmware",
                filters: { 'Binary files': ['bin'] }
            });
            if (!selectedFirmwareUri || !selectedFirmwareUri.length) {
                return;
            }
            let selectedFirmware = selectedFirmwareUri[0].fsPath;
            let selectedBoard = yield vscode.window.showQuickPick([
                '[ESP32] ESP32',
                '[ESP8266] ESP8266',
                '[ESP8266] NodeMCU (like ESP8266 but included dio flag)'
            ], {
                ignoreFocusOut: true,
                placeHolder: "Select your board, current supports ESP32, ESP8266 boards."
            });
            if (!selectedBoard || !selectedBoard.length) {
                return;
            }
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
                return;
            }
            if (!fs.existsSync(selectedPort)) {
                vscode.window.showErrorMessage("Port not exist, please connect device and try again!");
                return;
            }
            if ((yield vscode.window.showInformationMessage(path.basename(selectedFirmware) + " will be flashed into your " + selectedBoard + " via " + selectedPort + ". Continue?", { modal: false }, "No", "Confirm")) === "Confirm") {
                try {
                    yield this.terminalKillCurrentProcess();
                }
                catch (e) { }
                try {
                    vscode.window.showInformationMessage("Flashing firmware, please check flashing status...");
                    this.statusWarning(true);
                    let esptoolCmdPrefix = "esptool.py --port " + selectedPort + " ";
                    this.statusText("Erasing firmware...");
                    yield base_1.default.getTerminalHelper().execPromise(esptoolCmdPrefix + "erase_flash");
                    this.statusText("Writing firmware...");
                    switch (selectedBoard) {
                        case "[ESP8266] ESP8266":
                            yield base_1.default.getTerminalHelper().execPromise(esptoolCmdPrefix + "--baud 460800 write_flash --flash_size=detect 0 " + selectedFirmware);
                            break;
                        case "[ESP8266] NodeMCU":
                            yield base_1.default.getTerminalHelper().execPromise(esptoolCmdPrefix + "--baud 460800 write_flash --flash_size=detect -fm dio 0 " + selectedFirmware);
                            break;
                        case "[ESP32] ESP32":
                            yield base_1.default.getTerminalHelper().execPromise(esptoolCmdPrefix + "--chip esp32 write_flash -z 0x1000 " + selectedFirmware);
                            break;
                    }
                    vscode.window.showInformationMessage("Firmware has been flashed successfully!");
                }
                catch (exception) {
                    let exceptionMessage = exception.message || 'Unknown error';
                    vscode.window.showErrorMessage("Error while flashing firmware: " + exceptionMessage);
                    this.reportException(exception);
                }
                finally {
                    this.statusWarning(false);
                    this.statusDone();
                }
            }
        });
    }
    /**
     * check and push document into device
     * then run main.py script (restart device also)
     */
    actionRun() {
        return __awaiter(this, void 0, void 0, function* () {
            let beginTimeInMillis = (new Date()).getTime();
            vscode.window.showInformationMessage("Start building project files... You can check details in Output window named " + base_1.default.CONSTANTS.APP.UNIQUE_NAME + ".");
            try {
                this.outputClear(false);
                this.statusWarning(true);
                this.toolbarRunShown(false);
                this.statusText("[Run] Preparing...");
                this.outputPrintLn("Checking current script...");
                if (!vscode.window.activeTextEditor) {
                    throw new Error("No active editor can run in this time, please switch to your working file to run!");
                }
                this.outputPrintLn("Preparing file " + vscode.window.activeTextEditor.document.fileName + "...");
                this.outputPrintLn("Checking `ampy` tool...");
                if (!(yield base_1.default.getTerminalHelper().checkExecutableToolPromise("ampy", "pip install adafruit-ampy"))) {
                    throw new Error("Required tool not found (`ampy`). Please install `ampy` to run project.");
                }
                this.outputPrintLn("Checking `rshell` tool...");
                if (!(yield base_1.default.getTerminalHelper().checkExecutableToolPromise("rshell", "pip install rshell"))) {
                    throw new Error("Required tool not found (`rshell`). Please install `rshell` to run project.");
                }
                this.outputPrintLn("Reading settings from config file (" + base_1.default.CONSTANTS.APP.CONFIG_FILE_NAME + ")...");
                let projectConfig = this.helperGetProjectConfig();
                this.outputPrintLn("Checking config file...");
                if (typeof projectConfig !== 'object') {
                    throw new Error("Error while reading settings from Micropython config file " + base_1.default.CONSTANTS.APP.CONFIG_FILE_NAME + ". Please recheck config file!");
                }
                this.outputPrintLn("Checking `ampy` path config...");
                let ampyExecutePath = ((projectConfig || {}).tools || {}).ampy || '';
                if (!ampyExecutePath || !ampyExecutePath.length) {
                    throw new Error("Error while reading `ampy` execuable path. Please recheck `tools.ampy` setting inside Micropython config file (`" + base_1.default.CONSTANTS.APP.CONFIG_FILE_NAME + "`) then try again!");
                }
                this.outputPrintLn("Checking `rshell` path config...");
                let rshellExecutePath = ((projectConfig || {}).tools || {}).rshell || '';
                if (!rshellExecutePath || !rshellExecutePath.length) {
                    throw new Error("Error while reading `rshell` execuable path. Please recheck `tools.rshell` setting inside Micropython config file (`" + base_1.default.CONSTANTS.APP.CONFIG_FILE_NAME + "`) then try again!");
                }
                this.outputPrintLn("Checking upload port config...");
                let uploadPort = ((projectConfig || {}).upload || {}).port || '';
                if (!uploadPort || !uploadPort.length) {
                    throw new Error("Cannot read port setting in config file. Please recheck `upload.port` setting inside config file " + base_1.default.CONSTANTS.APP.CONFIG_FILE_NAME + " then try again!");
                }
                this.outputPrintLn("Connect device from port " + uploadPort + "...");
                if (!fs.existsSync(uploadPort)) {
                    throw new Error("Device at port " + uploadPort + " is disconnected! Please connect device or re-check your upload port settings in config file: " + base_1.default.CONSTANTS.APP.CONFIG_FILE_NAME + ".");
                }
                this.outputPrintLn("Reading baud rate config...");
                var uploadBaud = ((projectConfig || {}).upload || {}).baud || 115200;
                if (typeof uploadBaud === "string") {
                    uploadBaud = parseInt(uploadBaud) || 115200;
                }
                uploadBaud = uploadBaud || 115200; // sure that int in settings available
                this.outputPrintLn("Using baud rate: " + uploadBaud);
                this.outputPrintLn("Using port: " + uploadPort);
                let ignoredExts = ((projectConfig || {}).ignore || {}).extensions || [];
                let ignoredDirs = ((projectConfig || {}).ignore || {}).directories || [];
                let documentUri = vscode.window.activeTextEditor.document.uri;
                let projectRoot = vscode.workspace.getWorkspaceFolder(documentUri);
                if (!projectRoot) {
                    throw new Error("Cannot find project directory!");
                }
                // kill current terminal process to skip busy port if available
                this.outputPrintLn("Stopping running script if available...");
                try {
                    yield this.terminalKillCurrentProcess();
                }
                catch (e) { }
                // execute command prefix
                let ampyCommandPrefix = ampyExecutePath + " --port " + uploadPort + " --baud " + uploadBaud + " ";
                let rshellCommandPrefix = rshellExecutePath + " --port " + uploadPort + " --baud " + uploadBaud + " ";
                // remove all files inside device
                this.statusText("[Run] Formatting data...");
                let ampyLsResult = ((yield base_1.default.getTerminalHelper().execPromise(ampyCommandPrefix + "ls")) || '').split('\n');
                for (var fileDirIndex = 0; fileDirIndex < ampyLsResult.length; fileDirIndex++) {
                    let fileDirPath = ampyLsResult[fileDirIndex];
                    if (fileDirPath.length) {
                        this.outputPrintLn("Removing " + fileDirPath + "...");
                        try {
                            yield base_1.default.getTerminalHelper().execPromise(ampyCommandPrefix + "rmdir " + fileDirPath);
                        }
                        catch (e) { }
                        try {
                            yield base_1.default.getTerminalHelper().execPromise(ampyCommandPrefix + "rm " + fileDirPath);
                        }
                        catch (e) { }
                    }
                }
                this.outputPrintLn("Searching for ignored files and directories...");
                let projectFiles = this.helperGetDirectories(projectRoot.uri.fsPath);
                var resultFiles = [];
                for (var fileIndex = 0; fileIndex < projectFiles.length; fileIndex++) {
                    let filePath = projectFiles[fileIndex];
                    var isIgnored = false;
                    if (fs.statSync(filePath).isFile()) {
                        for (var ignoredExtIndex = 0; ignoredExtIndex < ignoredExts.length; ignoredExtIndex++) {
                            if (filePath.endsWith(ignoredExts[ignoredExtIndex])) {
                                isIgnored = true;
                                break;
                            }
                        }
                    }
                    else {
                        this.outputPrintLn("Checking directory " + filePath);
                        for (var ignoredDirIndex = 0; ignoredDirIndex < ignoredDirs.length; ignoredDirIndex++) {
                            if (path.basename(filePath) === ignoredDirs[ignoredDirIndex]) {
                                isIgnored = true;
                                break;
                            }
                        }
                    }
                    if (!isIgnored) {
                        resultFiles.push(filePath);
                    }
                }
                this.statusText("[Run] Sending files...");
                for (var resultFileIndex = 0; resultFileIndex < resultFiles.length; resultFileIndex++) {
                    let fileOrDirectoryPath = resultFiles[resultFileIndex];
                    let workingPath = fileOrDirectoryPath.replace(projectRoot.uri.fsPath, '').replace(projectRoot.uri.fsPath, '').split(' ').join('\\ ');
                    try {
                        if (fs.statSync(fileOrDirectoryPath).isFile()) {
                            let createFileCommand = ampyCommandPrefix + "put ." + workingPath + " " + workingPath;
                            this.outputPrintLn("Sending " + workingPath + "...");
                            yield base_1.default.getTerminalHelper().execPromise(createFileCommand);
                        }
                        else {
                            let createDirCommand = ampyCommandPrefix + "mkdir " + workingPath;
                            this.outputPrintLn("Creating directory " + workingPath + "...");
                            yield base_1.default.getTerminalHelper().execPromise(createDirCommand);
                        }
                    }
                    catch (e) { }
                }
                // show terminal window in rshell mode
                this.statusText("[Run] Reseting device...");
                this.outputPrintLn("Reseting state...");
                yield base_1.default.getTerminalHelper().execPromise(ampyCommandPrefix + "reset");
                this.outputPrintLn("Task done with " + ((new Date()).getTime() - beginTimeInMillis) + " milliseconds.");
                vscode.window.showInformationMessage("Building files successfully with " + ((new Date()).getTime() - beginTimeInMillis) + " milliseconds!");
                this.terminalWrite(rshellCommandPrefix + "repl");
                this.toolbarStopShown(true);
            }
            catch (executeException) {
                let errorMessage = (executeException || {}).message || 'Unknown error while building your project.';
                this.outputPrintLn("Error: " + errorMessage);
                this.outputPrintLn("Task abort with " + ((new Date()).getTime() - beginTimeInMillis) + " milliseconds.");
                vscode.window.showErrorMessage(errorMessage, { modal: true });
                this.reportException(executeException);
            }
            finally {
                this.toolbarRunShown(true);
                this.statusWarning(false);
                this.statusDone();
            }
        });
    }
    helperGetDirectories(fsPath, results = []) {
        if (!fsPath) {
            return results;
        }
        fs.readdirSync(fsPath).forEach((itemPath) => {
            let fullPath = path.join(fsPath, itemPath);
            results.push(fullPath);
            if (fs.statSync(fullPath).isDirectory()) {
                results = this.helperGetDirectories(fullPath, results);
            }
        });
        return results;
    }
    /**
     * find micropython config file
     * @returns content of config file as json object, or null if not available
     */
    helperGetProjectConfig() {
        if (!vscode.workspace.rootPath) {
            return null;
        }
        let configFilePath = path.join(vscode.workspace.rootPath, base_1.default.CONSTANTS.APP.CONFIG_FILE_NAME);
        if (!fs.existsSync(configFilePath)) {
            return null;
        }
        try {
            let configContent = fs.readFileSync(configFilePath);
            return JSON.parse(configContent.toString());
        }
        catch (fileReadException) {
            this.reportException(fileReadException);
            return null;
        }
    }
}
exports.default = Project;
//# sourceMappingURL=project.js.map