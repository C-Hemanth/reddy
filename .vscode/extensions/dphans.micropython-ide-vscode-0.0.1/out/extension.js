'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app/app");
function activate(context) {
    app_1.default.registerExtensionContext(context);
}
exports.activate = activate;
function deactivate() {
    app_1.default.onDestroyed();
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map