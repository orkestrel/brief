import { createBriefContract, createBriefManager, createBriefCompiler, isBrief } from '@src/core'
import { seededRandom } from '@orkestrel/contract'
import { describe, expect, it } from 'vitest'
import { buildAdversarialValues, buildReadyBrief, buildReadyInput } from '../../setup.js'

describe('createBriefCompiler', () => {
	it('wires its own engines when none are supplied', () => {
		const compiler = createBriefCompiler()
		expect(compiler.interpret).toBeDefined()
		expect(compiler.reason.supports('logical')).toBe(true)
		expect(compiler.compile(buildReadyInput()).brief).toBeDefined()
		compiler.destroy()
	})

	it('drives deriveTask through the supplied vocabularies only', () => {
		const compiler = createBriefCompiler({ actions: {}, domains: {} })
		expect(compiler.compile({ proofs: [] }).failures[0]?.code).toBe('DRAFT_FAILED')
		compiler.destroy()
	})
})

describe('createBriefManager', () => {
	it('creates an empty registry', () => {
		const registry = createBriefManager()
		expect(registry.count).toBe(0)
		expect(registry.briefs()).toStrictEqual([])
		registry.destroy()
	})

	it('seeds from the supplied briefs', () => {
		const registry = createBriefManager({ briefs: [buildReadyBrief()] })
		expect(registry.count).toBe(1)
		registry.destroy()
	})
})

describe('createBriefContract', () => {
	it('compiles a guard that agrees with isBrief', () => {
		const contract = createBriefContract()
		expect(contract.is(buildReadyBrief())).toBe(true)
		expect(contract.is({})).toBe(false)
		for (const value of buildAdversarialValues()) {
			expect(contract.is(value)).toBe(isBrief(value))
		}
	})

	it('pins both sides, so a mechanism-wide inversion cannot satisfy the comparison', () => {
		// `contract.is(x) === isBrief(x)` alone passes when BOTH mechanisms are wrong the same
		// way. These assert the absolute answer each one owes.
		const contract = createBriefContract()
		const valid = buildReadyBrief()
		expect(contract.is(valid)).toBe(true)
		expect(isBrief(valid)).toBe(true)
		expect(contract.is({ ...valid, surplus: 1 })).toBe(false)
		expect(isBrief({ ...valid, surplus: 1 })).toBe(false)
	})

	it('exposes a schema, a parser, and a seeded generator', () => {
		const contract = createBriefContract()
		expect(contract.schema.type).toBe('object')
		// The parser rebuilds an owned record rather than returning the input, so the
		// comparison is structural: `toStrictEqual` would fail on the prototype alone.
		expect(contract.parse(buildReadyBrief())).toEqual(buildReadyBrief())
		expect(contract.parse(null)).toBeUndefined()
		expect(contract.generate(seededRandom(3))).toStrictEqual(contract.generate(seededRandom(3)))
	})

	it('returns a fresh bundle each call', () => {
		expect(createBriefContract()).not.toBe(createBriefContract())
	})
})
