import { describe, it, expect, vi, beforeEach } from 'vitest'
import { securityMiddleware } from '../../api/middleware/security.middleware.js'
import { ApiError } from '../../infrastructure/services/error.service.js'
import { Request, Response } from 'express'

/**
 * Мок объектов Request, Response и NextFunction для тестов
 */
describe('Security Middleware', () => {
	let req: Partial<Request>
	let res: Partial<Response>
	let next: any // используем any для mock функции, чтобы получить доступ к .mock

	beforeEach(() => {
		// Сбрасываем моки перед каждым тестом
		req = {
			url: '/api/files',
			method: 'GET',
			headers: {},
		}

		res = {
			setHeader: vi.fn(),
			status: vi.fn().mockReturnThis(),
			end: vi.fn(),
		}

		next = vi.fn()
	})

	describe('basicSecurity', () => {
		it('должен устанавливать защитные HTTP заголовки', () => {
			securityMiddleware.basicSecurity(req as Request, res as Response, next)

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

			securityMiddleware.pathTraversal(req as Request, res as Response, next)

			expect(next).toHaveBeenCalledWith(expect.any(ApiError))
			expect(next.mock.calls[0][0].statusCode).toBe(403)
			expect(next.mock.calls[0][0].message).toBe('Запрещенный путь')
		})

		it('должен блокировать пути с "..\\" последовательностями', () => {
			req.url = '/api/files..\\config'

			securityMiddleware.pathTraversal(req as Request, res as Response, next)

			expect(next).toHaveBeenCalledWith(expect.any(ApiError))
			expect(next.mock.calls[0][0].statusCode).toBe(403)
		})

		it('должен пропускать безопасные пути', () => {
			req.url = '/api/files/documents'

			securityMiddleware.pathTraversal(req as Request, res as Response, next)

			expect(next).toHaveBeenCalledWith()
		})
	})

	describe('bodySize', () => {
		it('должен блокировать запросы с большим размером тела', () => {
			req.headers = { 'content-length': '2000000' } // 2MB
			const bodySizeMiddleware = securityMiddleware.bodySize(1000000) // 1MB лимит

			bodySizeMiddleware(req as Request, res as Response, next)

			expect(next).toHaveBeenCalledWith(expect.any(ApiError))
			expect(next.mock.calls[0][0].statusCode).toBe(413)
			expect(next.mock.calls[0][0].message).toBe('Запрос слишком большой')
		})

		it('должен пропускать запросы с размером в пределах лимита', () => {
			req.headers = { 'content-length': '500000' } // 500KB
			const bodySizeMiddleware = securityMiddleware.bodySize(1000000) // 1MB лимит

			bodySizeMiddleware(req as Request, res as Response, next)

			expect(next).toHaveBeenCalledWith()
		})
	})

	describe('cors', () => {
		it('должен правильно устанавливать заголовки CORS для разрешенных источников', () => {
			if (!req.headers) req.headers = {}
			req.headers.origin = 'http://example.com'
			const corsMiddleware = securityMiddleware.cors(['http://example.com'])

			corsMiddleware(req as Request, res as Response, next)

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

			corsMiddleware(req as Request, res as Response, next)

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

			corsMiddleware(req as Request, res as Response, next)

			expect(res.status).toHaveBeenCalledWith(200)
			expect(res.end).toHaveBeenCalled()
			expect(next).not.toHaveBeenCalled()
		})
	})
})
