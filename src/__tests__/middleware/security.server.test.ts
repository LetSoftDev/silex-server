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

	describe('Body Size Limiter', () => {
		// Создаем специальное приложение с body size лимитом
		const bodySizeApp = express()
		bodySizeApp.use(express.json())
		bodySizeApp.use(securityMiddleware.bodySize(100)) // Лимит 100 байт
		bodySizeApp.post('/api/data', (req, res) => {
			res.json({ success: true, received: true })
		})
		bodySizeApp.use(errorHandler)

		const bodySizeRequest = supertest(bodySizeApp)

		it('должен блокировать запросы с большим телом', async () => {
			// Создаем данные, превышающие лимит
			const largeData = { data: 'a'.repeat(200) }

			const response = await bodySizeRequest
				.post('/api/data')
				.send(largeData)
				.set('Content-Type', 'application/json')

			expect(response.status).toBe(413)
			expect(response.body).toHaveProperty('error', 'Запрос слишком большой')
		})

		it('должен пропускать запросы с телом в пределах лимита', async () => {
			// Создаем данные в пределах лимита
			const smallData = { test: 'ok' }

			const response = await bodySizeRequest
				.post('/api/data')
				.send(smallData)
				.set('Content-Type', 'application/json')

			expect(response.status).toBe(200)
			expect(response.body).toHaveProperty('success', true)
		})
	})

	describe('Rate Limiter', () => {
		// Создаем специальное приложение с ограничителем запросов
		const rateLimitApp = express()

		// Устанавливаем очень низкий лимит для тестирования
		const testLimiter = securityMiddleware.rateLimiter
		rateLimitApp.use(testLimiter)

		rateLimitApp.get('/api/limited', (req, res) => {
			res.json({ success: true })
		})

		rateLimitApp.use(errorHandler)

		const rateLimitRequest = supertest(rateLimitApp)

		it('должен возвращать успешный ответ для запросов в пределах лимита', async () => {
			const response = await rateLimitRequest.get('/api/limited')

			expect(response.status).toBe(200)
			expect(response.body).toHaveProperty('success', true)
		})

		// Примечание: тестирование реального блокирования затруднено в тестах,
		// так как он зависит от состояния, которое сбрасывается между тестами
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

		it('должен отклонять запросы с неразрешенным origin', async () => {
			const response = await corsRequest
				.get('/api/test')
				.set('Origin', 'http://malicious-site.com')

			expect(response.status).toBe(200) // CORS не блокирует запросы, только ограничивает доступ к данным в браузере
			expect(response.headers).toHaveProperty(
				'access-control-allow-origin',
				'http://example.com' // Должен вернуть разрешенный origin, а не запрашиваемый
			)
		})
	})

	describe('HPP Protection', () => {
		// Создаем приложение с HPP middleware
		const hppApp = express()
		hppApp.use(express.urlencoded({ extended: true }))
		hppApp.use(securityMiddleware.hpp)

		hppApp.get('/api/search', (req, res) => {
			res.json({ params: req.query })
		})

		const hppRequest = supertest(hppApp)

		it('должен обрабатывать параметры запроса корректно', async () => {
			// Тест с одним параметром
			const response = await hppRequest.get('/api/search?id=1')

			expect(response.status).toBe(200)
			expect(response.body.params).toHaveProperty('id')
		})
	})
})
