import { Request, Response, NextFunction, RequestHandler } from 'express'
import { rateLimit } from 'express-rate-limit'
import hpp from 'hpp'
import { ApiError } from '../../infrastructure/services/error.service.js'

/**
 * Middleware для защиты от XSS атак и других уязвимостей
 */
export const securityMiddleware = {
	/**
	 * Базовые настройки безопасности заголовков
	 */
	basicSecurity: (req: Request, res: Response, next: NextFunction): void => {
		// Установка защитных заголовков вручную
		res.setHeader('X-Content-Type-Options', 'nosniff')
		res.setHeader('X-XSS-Protection', '1; mode=block')
		res.setHeader('X-Frame-Options', 'SAMEORIGIN')
		res.setHeader('Referrer-Policy', 'same-origin')

		// Content Security Policy
		const cspValue = [
			"default-src 'self'",
			"script-src 'self' 'unsafe-inline'",
			"style-src 'self' 'unsafe-inline'",
			"img-src 'self' data:",
			"font-src 'self'",
			"object-src 'none'",
			"base-uri 'self'",
		].join('; ')

		res.setHeader('Content-Security-Policy', cspValue)

		next()
	},

	/**
	 * Защита от HTTP Parameter Pollution
	 */
	hpp: hpp(),

	/**
	 * Ограничение запросов для защиты от брутфорс атак и DoS
	 */
	rateLimiter: rateLimit({
		windowMs: 15 * 60 * 1000, // 15 минут
		max: 100, // лимит 100 запросов с одного IP
		standardHeaders: true,
		legacyHeaders: false,
		message: { error: 'Слишком много запросов, попробуйте позже' },
	}),

	/**
	 * Проверка размера тела запроса
	 */
	bodySize: (maxSize: number = 1 * 1024 * 1024): RequestHandler => {
		return (req: Request, res: Response, next: NextFunction): void => {
			const contentLength = parseInt(req.headers['content-length'] || '0', 10)

			if (contentLength > maxSize) {
				next(new ApiError('Запрос слишком большой', 413))
				return
			}

			next()
		}
	},

	/**
	 * Защита от Path Traversal атак
	 */
	pathTraversal: (req: Request, res: Response, next: NextFunction): void => {
		const url = req.url

		// Проверка на path traversal последовательности
		if (url.includes('../') || url.includes('..\\')) {
			next(new ApiError('Запрещенный путь', 403))
			return
		}

		next()
	},

	/**
	 * Настройка CORS
	 */
	cors: (origins: string[] = ['*']): RequestHandler => {
		return (req: Request, res: Response, next: NextFunction): void => {
			const origin = req.headers.origin

			if (origin && (origins.includes('*') || origins.includes(origin))) {
				res.setHeader('Access-Control-Allow-Origin', origin)
			} else {
				res.setHeader('Access-Control-Allow-Origin', origins[0] || '*')
			}

			res.setHeader(
				'Access-Control-Allow-Methods',
				'GET, POST, PUT, DELETE, OPTIONS'
			)
			res.setHeader(
				'Access-Control-Allow-Headers',
				'Content-Type, Authorization'
			)
			res.setHeader('Access-Control-Allow-Credentials', 'true')

			if (req.method === 'OPTIONS') {
				res.status(200).end()
				return
			}

			next()
		}
	},
}
