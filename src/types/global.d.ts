// Глобальные типы для тестов
import '@jest/globals'
import { expect } from 'chai'

// Глобальные определения типов для тестов
declare global {
	namespace NodeJS {
		interface Global {
			expect: typeof expect
		}
	}

	// Для Chai
	const expect: typeof import('chai').expect

	// Для Mocha
	function describe(name: string, callback: () => void): void
	function describe(name: string, options: object, callback: () => void): void

	function it(name: string, callback: Function): void
	function it(name: string, options: object, callback: Function): void

	function before(callback: Function): void
	function beforeEach(callback: Function): void
	function after(callback: Function): void
	function afterEach(callback: Function): void
}
