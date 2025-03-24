/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		testTimeout: 10000,
		mockReset: true,
		setupFiles: ['./src/__tests__/setup.ts'],
		include: ['src/__tests__/**/*.test.ts'],
		exclude: ['node_modules', 'dist'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html', 'json'],
			exclude: [
				'coverage/**',
				'dist/**',
				'**/node_modules/**',
				'src/**/__tests__/**',
				'test{,s}/**',
				'test{,-*}.{js,cjs,mjs,ts,tsx,jsx}',
				'mock/**',
				'.{eslint,mocha,prettier}rc.{js,cjs,yml}',
			],
		},
	},
	resolve: {
		alias: {
			'@': resolve(__dirname, './src'),
			'@controllers': resolve(__dirname, './src/controllers'),
			'@models': resolve(__dirname, './src/models'),
			'@utils': resolve(__dirname, './src/utils'),
			'@config': resolve(__dirname, './src/config'),
			'@routes': resolve(__dirname, './src/routes'),
		},
	},
})
