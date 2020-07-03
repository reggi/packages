"use strict";
exports.__esModule = true;
exports.getDeclared = exports.getVariable = exports.getCallExpression = exports.getImportDefaultSpecifier = exports.getStringLiteral = void 0;
var code_frame_1 = require("@babel/code-frame");
var traverse_1 = require("@babel/traverse");
var babelParser = require("@babel/parser");
function getStringLiteral(node) {
    var isStringLiteral = (node === null || node === void 0 ? void 0 : node.type) == 'StringLiteral';
    if (!isStringLiteral)
        return;
    return node === null || node === void 0 ? void 0 : node.value;
}
exports.getStringLiteral = getStringLiteral;
function getImportDefaultSpecifier(node) {
    var isImportDefaultSpecifier = (node === null || node === void 0 ? void 0 : node.type) == 'ImportDefaultSpecifier';
    if (!isImportDefaultSpecifier)
        return;
    var isIdentifier = node.local.type === 'Identifier';
    if (!isIdentifier)
        return;
    var hasName = node.local.name;
    if (!hasName)
        return;
    return hasName;
}
exports.getImportDefaultSpecifier = getImportDefaultSpecifier;
function getCallExpression(node, functionName) {
    var _a, _b, _c, _d;
    var isCallExpression = (node === null || node === void 0 ? void 0 : node.type) == 'CallExpression';
    if (!isCallExpression)
        return;
    var isIdentifier = ((_a = node === null || node === void 0 ? void 0 : node.callee) === null || _a === void 0 ? void 0 : _a.type) === 'Identifier';
    if (!isIdentifier)
        return;
    var isFunctionName = ((_b = node === null || node === void 0 ? void 0 : node.callee) === null || _b === void 0 ? void 0 : _b.name) === functionName;
    if (!isFunctionName)
        return;
    var isStringLiteral = ((_c = node === null || node === void 0 ? void 0 : node.arguments[0]) === null || _c === void 0 ? void 0 : _c.type) === 'StringLiteral';
    if (!isStringLiteral)
        return;
    return (_d = node === null || node === void 0 ? void 0 : node.arguments[0]) === null || _d === void 0 ? void 0 : _d.value;
}
exports.getCallExpression = getCallExpression;
function getVariable(node) {
    var _a;
    var isVariableDeclarator = (node === null || node === void 0 ? void 0 : node.type) == 'VariableDeclarator';
    if (!isVariableDeclarator)
        return;
    return (_a = node.id) === null || _a === void 0 ? void 0 : _a.name;
}
exports.getVariable = getVariable;
function getDeclared(node, variable) {
    var isIdentifier = node.type === 'Identifier';
    if (!isIdentifier)
        return;
    var isUsed = variable.includes(node === null || node === void 0 ? void 0 : node.name) || variable === (node === null || node === void 0 ? void 0 : node.name);
    if (!isUsed)
        return;
    return node === null || node === void 0 ? void 0 : node.name;
}
exports.getDeclared = getDeclared;
function dependencies(code) {
    var error = function (node, message) {
        var line = node.loc.start.line;
        return line + ": " + message + "\n" + code_frame_1.codeFrameColumns(code, node.loc, { linesAbove: 0, linesBelow: 0 });
    };
    var safety = 0;
    var VALID_LIBS = ['url-import', '@reggi/url-import'];
    var nodes = babelParser.parse(code, {
        plugins: ['typescript'],
        sourceType: 'module'
    });
    var urlImportVariable;
    var urlImportModule;
    var requires = [];
    var imports = [];
    var urlImports = [];
    traverse_1["default"](nodes, {
        ImportDeclaration: function (path) {
            var module = getStringLiteral(path.node.source);
            if (module)
                imports.push(module);
            path.node.specifiers.forEach(function (specifier) {
                var variable = getImportDefaultSpecifier(specifier);
                if (VALID_LIBS.includes(module) && !variable) {
                    throw new Error(error(specifier, "Module required \"" + module + "\" must have a default assigment"));
                }
                if (VALID_LIBS.includes(module) && variable) {
                    if (urlImportVariable) {
                        throw new Error(error(specifier, "Duplicate URL-IMPORT variable detected \"" + variable + "\" and \"" + urlImportVariable + "\", please use one"));
                    }
                    if (urlImportModule) {
                        throw new Error(error(specifier, "Duplicate URL-IMPORT module detected \"" + module + "\" and \"" + urlImportModule + "\", please use one"));
                    }
                    urlImportModule = module;
                    urlImportVariable = variable;
                }
            });
        },
        CallExpression: function (path) {
            var module = getCallExpression(path.node, 'require');
            if (module)
                requires.push(module);
            var variable = getVariable(path.container);
            if (VALID_LIBS.includes(module) && !variable) {
                throw new Error(error(path.node, "Module required \"" + module + "\" must have a variable assigment"));
            }
            if (VALID_LIBS.includes(module) && variable) {
                if (urlImportVariable) {
                    throw new Error(error(path.node, "Duplicate URL-IMPORT variable detected \"" + variable + "\" and \"" + urlImportVariable + "\", please use one"));
                }
                if (urlImportModule) {
                    throw new Error(error(path.node, "Duplicate URL-IMPORT module detected \"" + module + "\" and \"" + urlImportModule + "\", please use one"));
                }
                urlImportModule = module;
                urlImportVariable = variable;
            }
        }
    });
    traverse_1["default"](nodes, {
        CallExpression: function (path) {
            var urlImport = getCallExpression(path.node, urlImportVariable);
            if (urlImport)
                urlImports.push(urlImport);
        },
        VariableDeclaration: function (path) {
            path.node.declarations.forEach(function (dec) {
                var usage = getDeclared(dec.id, urlImportVariable);
                if (usage && safety > 0) {
                    throw new Error(error(path.node, "No redeclare URI-IMPORT variable \"" + urlImportVariable + "\""));
                }
                safety++;
            });
        },
        AssignmentExpression: function (path) {
            var usage = getDeclared(path.node.left, urlImportVariable);
            if (usage) {
                throw new Error(error(path.node, "No reassign URI-IMPORT variable \"" + urlImportVariable + "\""));
            }
        }
    });
    return { requires: requires, imports: imports, urlImports: urlImports };
}
exports["default"] = dependencies;
