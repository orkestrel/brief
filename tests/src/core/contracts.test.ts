import { createBriefCompiler, createBriefContract, parseBrief, snapshotBrief } from '@src/core'
import { seededRandom } from '@orkestrel/contract'
import { describe, expect, it } from 'vitest'
import { BRIEF_CONTRACT_CASES, buildReadyBrief, buildReadyInput } from '../../setup.js'

describe('standing guard contract table', () => {
	it.each(BRIEF_CONTRACT_CASES)('$name: canonical positive and negative control', (row) => {
		expect(row.direction).toBe('is implies guard')
		expect(row.project).toBeUndefined()
		expect(row.wire.is(row.accepted)).toBe(true)
		expect(row.guard(row.accepted)).toBe(true)
		expect(row.wire.is(row.refused)).toBe(false)
		expect(row.guard(row.refused)).toBe(false)
	})

	it.each(BRIEF_CONTRACT_CASES)(
		'$name: generated admissions imply the guard without discards',
		(row) => {
			const admissions = Array.from({ length: 100 }, (_, seed) => {
				const value = row.wire.generate(seededRandom(seed))
				return { seed, admitted: row.wire.is(value), guarded: row.guard(value) }
			})
			expect(admissions.filter((entry) => !entry.admitted)).toEqual([])
			expect(admissions.filter((entry) => !entry.guarded)).toEqual([])
		},
	)

	it('owned snapshots pass the contract and survive restoration', () => {
		const snapshot = snapshotBrief(buildReadyBrief())
		expect(createBriefContract().is(snapshot)).toBe(true)
		expect(parseBrief(JSON.stringify(snapshot))).toEqual(snapshot)
	})

	it('gap faults retain discriminant hints from contract', () => {
		const brief = buildReadyBrief({
			gaps: [
				{
					field: 'choice',
					question: 'Which choice?',
					blocking: true,
					fault: {
						reason: 'variant',
						path: ['choice'],
						variants: 2,
						key: 'category',
						expected: ['a', 'b'],
					},
				},
			],
		})
		expect(createBriefContract().is(brief)).toBe(true)
		expect(parseBrief(JSON.stringify(brief))).toEqual(brief)
	})

	it('the reused default interpreter keeps compilations independent', () => {
		const compiler = createBriefCompiler()
		const interpreter = compiler.interpret
		try {
			const first = compiler.compile({ ...buildReadyInput(), text: 'Refactor three stores.' })
			const second = compiler.compile({ ...buildReadyInput(), text: 'Audit the barrel.' })
			expect(compiler.interpret).toBe(interpreter)
			expect(first.interpretation?.text).toBe('Refactor three stores.')
			expect(second.interpretation?.text).toBe('Audit the barrel.')
			expect(first.interpretation?.entities).toEqual([])
			expect(second.interpretation?.entities).toEqual([])
		} finally {
			compiler.destroy()
		}
	})
})
