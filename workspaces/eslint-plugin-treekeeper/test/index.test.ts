import plugin from '../src/index.ts'
import test from 'node:test'
import assert from 'node:assert'

test('main', () => {
  assert.strictEqual(typeof plugin.rules, 'object')
  assert.ok(true)
})
