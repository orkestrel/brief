import { captureValue } from '@src/core'
import { describe, expect, it } from 'vitest'

describe('captureValue', () => {
	it('captures one frozen plain view while retaining unknown members and leaf identity', () => {
		let answers = 0
		let unknowns = 0
		const prototype = {
			get answer() {
				answers += 1
				return answers === 1 ? 'captured' : 'forged'
			},
		}
		const nested = ['captured']
		const source: Record<PropertyKey, unknown> = Object.create(prototype)
		source['nested'] = nested
		source['leaf'] = Math.max
		source['self'] = source
		Object.defineProperty(source, 'unknown', {
			enumerable: true,
			get: () => {
				unknowns += 1
				return unknowns === 1 ? 'retained' : 'forged'
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
		expect(answers).toBe(1)
		expect(unknowns).toBe(1)
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
