import { describe, it, expect } from 'vitest'
import supertest from 'supertest'
import express from 'express'
import { securityMiddleware } from '../../api/middleware/security.middleware.js'
import { errorHandler } from '../../api/middleware/error.middleware.js'

/**
 * Интеграционные тесты для проверки middleware безопасности
 */
describe('Security Middleware Integration', () => {
	// Создаем тестовое приложение Express
	const app = express()

	// Добавляем защитные middleware
	app.use(securityMiddleware.basicSecurity)
	app.use(securityMiddleware.hpp)
	app.use(securityMiddleware.pathTraversal)

	// Создаем тестовые маршруты
	app.get('/api/test', (req, res) => {
		res.json({ success: true, message: 'Test endpoint' })
	})

	app.get('/api/files', (req, res) => {
		res.json({ success: true, data: ['file1.txt', 'file2.jpg'] })
	})

	// Добавляем обработчик ошибок для перехвата ошибок в тестах
	app.use(errorHandler)

	const request = supertest(app)

	describe('HTTP Headers Security', () => {
		it('должен устанавливать защитные HTTP заголовки', async () => {
			const response = await request.get('/api/test')

			expect(response.status).toBe(200)
			expect(response.headers).toHaveProperty(
				'x-content-type-options',
				'nosniff'
			)
			expect(response.headers).toHaveProperty(
				'x-xss-protection',
				'1; mode=block'
			)
			expect(response.headers).toHaveProperty('x-frame-options', 'SAMEORIGIN')
			expect(response.headers).toHaveProperty('content-security-policy')
		})
	})

	describe('Path Traversal Protection', () => {
		it('должен блокировать запросы с path traversal последовательностями', async () => {
			const response = await request.get('/api/../config')

			expect(response.status).toBe(403)
		})

		it('должен разрешать правильные запросы', async () => {
			const response = await request.get('/api/files')

			expect(response.status).toBe(200)
			expect(response.body).toHaveProperty('success', true)
		})
	})

	describe('CORS Headers', () => {
		// Создаем приложение с CORS middleware
		const corsApp = express()
		corsApp.use(securityMiddleware.cors(['http://example.com']))
		corsApp.get('/api/test', (req, res) => {
			res.json({ success: true })
		})

		const corsRequest = supertest(corsApp)

		it('должен устанавливать правильные заголовки CORS', async () => {
			const response = await corsRequest
				.get('/api/test')
				.set('Origin', 'http://example.com')

			expect(response.status).toBe(200)
			expect(response.headers).toHaveProperty(
				'access-control-allow-origin',
				'http://example.com'
			)
			expect(response.headers).toHaveProperty('access-control-allow-methods')
			expect(response.headers).toHaveProperty('access-control-allow-headers')
		})

		it('должен обрабатывать preflight OPTIONS запросы', async () => {
			const response = await corsRequest
				.options('/api/test')
				.set('Origin', 'http://example.com')
				.set('Access-Control-Request-Method', 'GET')

			expect(response.status).toBe(200)
			expect(response.headers).toHaveProperty(
				'access-control-allow-origin',
				'http://example.com'
			)
		})
	})
})
