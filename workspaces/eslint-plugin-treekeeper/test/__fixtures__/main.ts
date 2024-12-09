import {RuleTester} from 'eslint'
import typescriptParser from '@typescript-eslint/parser'
import path from 'node:path'
import mock from 'mock-fs'
import {test} from 'node:test'

export class RuleHarness<T> {
  private files: Record<string, string>
  private rule: any
  private RULE: string
  private ruleTester: RuleTester

  constructor(files: Record<string, string>, rule: any, RULE: string, plugin: string, defaultOptions: T) {
    this.files = files
    this.rule = rule
    this.RULE = RULE

    mock(Object.fromEntries(Object.entries(files).map(([key, value]) => [path.join(process.cwd(), key), value])))

    this.ruleTester = new RuleTester({
      languageOptions: {
        parser: typescriptParser,
      },
      settings: {
        [plugin]: defaultOptions,
      },
    })
  }

  cleanup() {
    mock.restore()
  }

  private createTestCase(fileKey: string, options?: Partial<T>, error?: any) {
    return {
      code: this.files[fileKey],
      filename: path.join(process.cwd(), fileKey),
      ...(options && {options: [options]}),
      ...(error && {errors: [error]}),
    }
  }

  valid(filename: string, options?: Partial<T>) {
    test(`valid: ${filename}`, () => {
      this.ruleTester.run(this.RULE, this.rule, {
        valid: [this.createTestCase(filename, options)],
        invalid: [],
      })
    })
  }

  invalid(filename: string, options?: Partial<T>, data?: any) {
    test(`invalid: ${filename}`, () => {
      this.ruleTester.run(this.RULE, this.rule, {
        valid: [],
        invalid: [this.createTestCase(filename, options, {messageId: this.RULE, ...(data && {data})})],
      })
    })
  }
}
