import { BriefReadCounter, buildCapturePrototype } from '../../setup.js'
import { captureValue } from '@src/core'
import { describe, expect, it } from 'vitest'

describe('captureValue', () => {
	it('reads own entries before uncopied members and retains repeated member reads', () => {
		// Base 2584af5 src/core/cloners.ts:49 reads own descriptors before expected members.
		const reads: string[] = []
		const source = new Proxy(
			{ first: 1, second: 2 },
			{
				ownKeys: (target) => {
					reads.push('keys')
					return Reflect.ownKeys(target)
				},
				getOwnPropertyDescriptor: (target, key) => {
					reads.push(`descriptor:${String(key)}`)
					return Reflect.getOwnPropertyDescriptor(target, key)
				},
				get: (target, key, receiver) => {
					reads.push(`read:${String(key)}`)
					return Reflect.get(target, key, receiver)
				},
			},
		)
		const owned = captureValue(source, ['first', 'missing', 'missing'])
		expect(owned).toEqual({ first: 1, second: 2, missing: undefined })
		expect(reads).toEqual([
			'keys',
			'descriptor:first',
			'descriptor:second',
			'read:missing',
			'read:missing',
		])
	})

	it('captures one frozen plain view while retaining unknown members and leaf identity', () => {
		const answers = new BriefReadCounter()
		const unknowns = new BriefReadCounter()
		const prototype = buildCapturePrototype(answers)
		const nested = ['captured']
		const source: Record<PropertyKey, unknown> = Object.create(prototype)
		source['nested'] = nested
		source['leaf'] = Math.max
		source['self'] = source
		Object.defineProperty(source, 'unknown', {
			enumerable: true,
			get: () => {
				return unknowns.next() === 1 ? 'retained' : 'forged'
			},
		})

		const owned = captureValue(source, ['answer'])
		if (owned === null || typeof owned !== 'object') throw new Error('capture was not an object')
		const capturedNested = Reflect.get(owned, 'nested')
		if (!Array.isArray(capturedNested)) throw new Error('nested branch was not an array')

		expect(Reflect.get(owned, 'answer')).toBe('captured')
		expect(Reflect.get(owned, 'unknown')).toBe('retained')
		expect(Reflect.get(owned, 'leaf')).toBe(Math.max)
		expect(Reflect.get(owned, 'self')).toBe(owned)
		expect(answers.count).toBe(1)
		expect(unknowns.count).toBe(1)
		expect(Object.isFrozen(owned)).toBe(true)
		expect(Object.isFrozen(capturedNested)).toBe(true)

		nested.push('mutated')
		expect(capturedNested).toStrictEqual(['captured'])
	})

	it('reports a source whose own members cannot be captured', () => {
		const hostile = new Proxy(
			{},
			{
				ownKeys: () => {
					throw new Error('own members are unreadable')
				},
			},
		)
		expect(() => captureValue(hostile, [])).toThrow('own members are unreadable')
	})
})
