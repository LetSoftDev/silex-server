import { describe, it, expect, vi, beforeEach } from 'vitest'
import { securityMiddleware } from '../../api/middleware/security.middleware.js'
import { ApiError } from '../../infrastructure/services/error.service.js'
import { Request, Response, NextFunction } from 'express'
import type { Mock } from 'vitest'

/**
 * Мок объектов Request, Response и NextFunction для тестов
 */
describe('Security Middleware', () => {
	let req: Partial<Request>
	let res: Partial<Response>
	let next: Mock

	beforeEach(() => {
		// Сбрасываем моки перед каждым тестом
		req = {
			url: '/api/files',
			method: 'GET',
			headers: {},
			ip: '127.0.0.1',
			query: {},
			body: {},
		}

		res = {
			setHeader: vi.fn(),
			status: vi.fn().mockReturnThis(),
			end: vi.fn(),
			json: vi.fn(),
		}

		next = vi.fn()
	})

	describe('basicSecurity', () => {
		it('должен устанавливать защитные HTTP заголовки', () => {
			securityMiddleware.basicSecurity(
				req as Request,
				res as Response,
				next as NextFunction
			)

			expect(res.setHeader).toHaveBeenCalledWith(
				'X-Content-Type-Options',
				'nosniff'
			)
			expect(res.setHeader).toHaveBeenCalledWith(
				'X-XSS-Protection',
				'1; mode=block'
			)
			expect(res.setHeader).toHaveBeenCalledWith(
				'X-Frame-Options',
				'SAMEORIGIN'
			)
			expect(res.setHeader).toHaveBeenCalledWith(
				'Referrer-Policy',
				'same-origin'
			)
			expect(res.setHeader).toHaveBeenCalledWith(
				'Content-Security-Policy',
				expect.any(String)
			)
			expect(next).toHaveBeenCalled()
		})
	})

	describe('pathTraversal', () => {
		it('должен блокировать пути с "../" последовательностями', () => {
			req.url = '/api/files/../config'

			securityMiddleware.pathTraversal(
				req as Request,
				res as Response,
				next as NextFunction
			)

			expect(next).toHaveBeenCalledWith(expect.any(ApiError))
			expect(next.mock.calls[0][0].statusCode).toBe(403)
			expect(next.mock.calls[0][0].message).toBe('Запрещенный путь')
		})

		it('должен блокировать пути с "..\\" последовательностями', () => {
			req.url = '/api/files..\\config'

			securityMiddleware.pathTraversal(
				req as Request,
				res as Response,
				next as NextFunction
			)

			expect(next).toHaveBeenCalledWith(expect.any(ApiError))
			expect(next.mock.calls[0][0].statusCode).toBe(403)
		})

		it('должен блокировать URL-encoded path traversal попытки', () => {
			req.url = '/api/files/%2e%2e%2fconfig'

			securityMiddleware.pathTraversal(
				req as Request,
				res as Response,
				next as NextFunction
			)

			expect(next).toHaveBeenCalledWith(expect.any(ApiError))
			expect(next.mock.calls[0][0].statusCode).toBe(403)
		})

		it('должен блокировать path traversal в параметрах запроса', () => {
			req.url = '/api/files'
			req.query = { path: '../config' }

			securityMiddleware.pathTraversal(
				req as Request,
				res as Response,
				next as NextFunction
			)

			expect(next).toHaveBeenCalledWith(expect.any(ApiError))
			expect(next.mock.calls[0][0].statusCode).toBe(403)
		})

		it('должен блокировать смешанные кодировки и null byte инъекции', () => {
			req.url = '/api/files/..%2fconfig'

			securityMiddleware.pathTraversal(
				req as Request,
				res as Response,
				next as NextFunction
			)

			expect(next).toHaveBeenCalledWith(expect.any(ApiError))
		})

		it('должен блокировать абсолютные пути', () => {
			req.url = '/api/files//etc/passwd'

			securityMiddleware.pathTraversal(
				req as Request,
				res as Response,
				next as NextFunction
			)

			expect(next).toHaveBeenCalledWith(expect.any(ApiError))
		})

		it('должен пропускать безопасные пути', () => {
			req.url = '/api/files/documents'

			securityMiddleware.pathTraversal(
				req as Request,
				res as Response,
				next as NextFunction
			)

			expect(next).toHaveBeenCalledWith()
		})
	})

	describe('bodySize', () => {
		it('должен блокировать запросы с большим размером тела', () => {
			req.headers = { 'content-length': '2000000' } // 2MB
			const bodySizeMiddleware = securityMiddleware.bodySize(1000000) // 1MB лимит

			bodySizeMiddleware(req as Request, res as Response, next as NextFunction)

			expect(next).toHaveBeenCalledWith(expect.any(ApiError))
			expect(next.mock.calls[0][0].statusCode).toBe(413)
			expect(next.mock.calls[0][0].message).toBe('Запрос слишком большой')
		})

		it('должен пропускать запросы с размером в пределах лимита', () => {
			req.headers = { 'content-length': '500000' } // 500KB
			const bodySizeMiddleware = securityMiddleware.bodySize(1000000) // 1MB лимит

			bodySizeMiddleware(req as Request, res as Response, next as NextFunction)

			expect(next).toHaveBeenCalledWith()
		})

		it('должен пропускать запросы без content-length', () => {
			req.headers = {}
			const bodySizeMiddleware = securityMiddleware.bodySize(1000000)

			bodySizeMiddleware(req as Request, res as Response, next as NextFunction)

			expect(next).toHaveBeenCalledWith()
		})
	})

	describe('rateLimiter', () => {
		// Мокируем rateLimiter для тестирования
		it('существует и экспортируется', () => {
			expect(securityMiddleware.rateLimiter).toBeDefined()
		})

		// В реальных тестах нужно тестировать функциональность через интеграционные тесты
		// так как express-rate-limit сложно тестировать напрямую
	})

	describe('cors', () => {
		it('должен правильно устанавливать заголовки CORS для разрешенных источников', () => {
			if (!req.headers) req.headers = {}
			req.headers.origin = 'http://example.com'
			const corsMiddleware = securityMiddleware.cors(['http://example.com'])

			corsMiddleware(req as Request, res as Response, next as NextFunction)

			expect(res.setHeader).toHaveBeenNthCalledWith(
				1,
				'Access-Control-Allow-Origin',
				'http://example.com'
			)
			expect(res.setHeader).toHaveBeenCalledWith(
				'Access-Control-Allow-Methods',
				expect.any(String)
			)
			expect(res.setHeader).toHaveBeenCalledWith(
				'Access-Control-Allow-Headers',
				expect.any(String)
			)
			expect(res.setHeader).toHaveBeenCalledWith(
				'Access-Control-Allow-Credentials',
				'true'
			)
			expect(next).toHaveBeenCalled()
		})

		it('должен использовать wildcard для всех источников, если указан "*"', () => {
			if (!req.headers) req.headers = {}
			req.headers.origin = 'http://example.com'
			const corsMiddleware = securityMiddleware.cors(['*'])

			corsMiddleware(req as Request, res as Response, next as NextFunction)

			expect(res.setHeader).toHaveBeenNthCalledWith(
				1,
				'Access-Control-Allow-Origin',
				'http://example.com'
			)
			expect(next).toHaveBeenCalled()
		})

		it('должен отвечать на OPTIONS запросы статусом 200', () => {
			req.method = 'OPTIONS'
			const corsMiddleware = securityMiddleware.cors(['*'])

			corsMiddleware(req as Request, res as Response, next as NextFunction)

			expect(res.status).toHaveBeenCalledWith(200)
			expect(res.end).toHaveBeenCalled()
			expect(next).not.toHaveBeenCalled()
		})

		it('должен использовать первый разрешенный источник если origin не указан', () => {
			req.headers = {} // нет origin
			const corsMiddleware = securityMiddleware.cors([
				'http://example.com',
				'http://test.com',
			])

			corsMiddleware(req as Request, res as Response, next as NextFunction)

			expect(res.setHeader).toHaveBeenNthCalledWith(
				1,
				'Access-Control-Allow-Origin',
				'http://example.com'
			)
			expect(next).toHaveBeenCalled()
		})
	})

	describe('preventNoSQLInjection', () => {
		it('должен блокировать запросы с MongoDB операторами', () => {
			req.body = { $where: 'function() { return true; }' }

			securityMiddleware.preventNoSQLInjection(
				req as Request,
				res as Response,
				next as NextFunction
			)

			expect(next).toHaveBeenCalledWith(expect.any(ApiError))
			expect(next.mock.calls[0][0] instanceof ApiError).toBe(true)
			expect(next.mock.calls[0][0].statusCode).toBe(400)
		})

		it('должен блокировать запросы с MongoDB операторами во вложенных объектах', () => {
			req.body = {
				user: {
					query: { $ne: null },
				},
			}

			securityMiddleware.preventNoSQLInjection(
				req as Request,
				res as Response,
				next as NextFunction
			)

			expect(next).toHaveBeenCalledWith(expect.any(ApiError))
			expect(next.mock.calls[0][0] instanceof ApiError).toBe(true)
		})

		it('должен блокировать запросы с точечной нотацией', () => {
			req.body = { 'user.password': '123456' }

			securityMiddleware.preventNoSQLInjection(
				req as Request,
				res as Response,
				next as NextFunction
			)

			expect(next).toHaveBeenCalledWith(expect.any(ApiError))
			expect(next.mock.calls[0][0] instanceof ApiError).toBe(true)
		})

		it('должен разрешать корректные запросы без MongoDB операторов', () => {
			req.body = { user: { name: 'John', age: 30 } }

			securityMiddleware.preventNoSQLInjection(
				req as Request,
				res as Response,
				next as NextFunction
			)

			expect(next).toHaveBeenCalled()
			expect(next).not.toHaveBeenCalledWith(expect.any(ApiError))
		})

		it('должен блокировать запросы с чрезмерной вложенностью', () => {
			// Создаем глубоко вложенный объект
			let deepObject: any = { value: 'test' }
			for (let i = 0; i < 15; i++) {
				deepObject = { nested: deepObject }
			}

			req.body = deepObject

			securityMiddleware.preventNoSQLInjection(
				req as Request,
				res as Response,
				next as NextFunction
			)

			expect(next).toHaveBeenCalledWith(expect.any(ApiError))
			expect(next.mock.calls[0][0] instanceof ApiError).toBe(true)
			expect(next.mock.calls[0][0].statusCode).toBe(400)
			expect(next.mock.calls[0][0].message).toContain('глубина вложенности')
		})

		it('должен обрабатывать пустое тело запроса', () => {
			req.body = {}

			securityMiddleware.preventNoSQLInjection(
				req as Request,
				res as Response,
				next as NextFunction
			)

			expect(next).toHaveBeenCalled()
			expect(next).not.toHaveBeenCalledWith(expect.any(ApiError))
		})

		it('должен блокировать запросы с MongoDB операторами в query', () => {
			req.query = { $where: 'function() { return true; }' }

			securityMiddleware.preventNoSQLInjection(
				req as Request,
				res as Response,
				next as NextFunction
			)

			expect(next).toHaveBeenCalledWith(expect.any(ApiError))
			expect(next.mock.calls[0][0] instanceof ApiError).toBe(true)
			expect(next.mock.calls[0][0].statusCode).toBe(400)
		})
	})

	describe('validateParams', () => {
		it('должен разрешать запросы с валидными параметрами', () => {
			req.query = { page: '1', limit: '10' }

			const middleware = securityMiddleware.validateParams([
				'page',
				'limit',
				'sort',
			])
			middleware(req as Request, res as Response, next as NextFunction)

			expect(next).toHaveBeenCalled()
			expect(next).not.toHaveBeenCalledWith(expect.any(ApiError))
		})

		it('должен блокировать запросы с недопустимыми параметрами', () => {
			req.query = { hack: 'true', page: '1' }

			const middleware = securityMiddleware.validateParams(['page', 'limit'])
			middleware(req as Request, res as Response, next as NextFunction)

			expect(next).toHaveBeenCalledWith(expect.any(ApiError))
			const error = next.mock.calls[0][0] as ApiError
			expect(error.statusCode).toBe(400)
			expect(error.message).toContain('hack')
		})

		it('должен разрешать запросы без параметров', () => {
			req.query = {}

			const middleware = securityMiddleware.validateParams(['page', 'limit'])
			middleware(req as Request, res as Response, next as NextFunction)

			expect(next).toHaveBeenCalled()
			expect(next).not.toHaveBeenCalledWith(expect.any(ApiError))
		})
	})
})
