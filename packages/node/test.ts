import * as assert from 'assert'
import * as nativeModules from './native_modules.json'

assert.strictEqual(nativeModules.includes('assert'), true)
assert.strictEqual(nativeModules.includes('url'), true)
assert.strictEqual(nativeModules.includes('events'), true)