import { BriefError, isBriefError } from '@src/core'
import { describe, expect, it } from 'vitest'

describe('isBriefError context', () => {
	it('accepts a class instance as context', () => {
		const context = new Date(0)
		const error = new BriefError('INVALID', 'invalid')
		Object.defineProperty(error, 'context', { value: context })
		expect(isBriefError(error)).toBe(true)
		expect(error.context).toBe(context)
	})

	it('accepts a callable object as context', () => {
		const error = new BriefError('INVALID', 'invalid')
		Object.defineProperty(error, 'context', { value: Math.max })
		expect(isBriefError(error)).toBe(true)
		expect(error.context).toBe(Math.max)
	})
})
