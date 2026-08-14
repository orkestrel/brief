// Exhaustive barrel-to-source bijection is NOT proved here — `tests/guides.test.ts` owns it
// (check SB, both directions, against the parsed declarations). This file proves only the
// runtime facts a static parse cannot see: real bindings, no duplicates, no foreign re-export.

import * as entry from '@src/core'
import { describe, expect, it } from 'vitest'

describe('src core entry', () => {
	it('binds every exported name to a real value', () => {
		const names = Object.keys(entry)
		expect(names.length).toBeGreaterThan(60)
		expect(names.filter((name) => Reflect.get(entry, name) === undefined)).toStrictEqual([])
	})

	it('exports no name twice', () => {
		const names = Object.keys(entry)
		expect(new Set(names).size).toBe(names.length)
	})

	it('re-exports nothing that originates in a dependency', () => {
		const names = Object.keys(entry)
		// The instrument must be able to report membership before its absences count.
		expect(names).toContain('createCompiler')
		for (const foreign of [
			'createInterpret',
			'createReason',
			'createEmitter',
			'createContract',
			'digestValue',
			'formatField',
			'recordOf',
			'attempt',
			'cloneJSONRecord',
		]) {
			expect(names).not.toContain(foreign)
		}
	})
})
