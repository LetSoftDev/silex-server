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
		const path = req.path
		const query = req.query || {}

		// Проверка URL на наличие подозрительных последовательностей
		const suspiciousPatterns = [
			'../',
			'..\\', // Классические path traversal
			'%2e%2e%2f',
			'%2e%2e/', // URL-encoded варианты "../"
			'..%2f',
			'%2e%2e%5c', // Смешанные кодировки
			'//etc/',
			'c:\\', // Абсолютные пути
			'..\0', // Null byte injection
		]

		const hasSuspiciousPattern = suspiciousPatterns.some(
			pattern =>
				url.includes(pattern) ||
				(typeof path === 'string' && path.includes(pattern)) ||
				(query &&
					Object.keys(query).some(
						key =>
							typeof query[key] === 'string' &&
							query[key].toString().includes(pattern)
					))
		)

		if (hasSuspiciousPattern) {
			next(new ApiError('Запрещенный путь', 403))
			return
		}

		// Проверка на попытки обхода с помощью декодирования
		try {
			const decodedUrl = decodeURIComponent(url)
			if (
				decodedUrl !== url &&
				suspiciousPatterns.some(pattern => decodedUrl.includes(pattern))
			) {
				next(new ApiError('Запрещенный путь', 403))
				return
			}
		} catch (error) {
			// Если URL не может быть декодирован, это может быть попыткой атаки
			next(new ApiError('Недопустимый URL', 400))
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

	/**
	 * Защита от NoSQL инъекций и проверка JSON запросов
	 */
	preventNoSQLInjection: (
		req: Request,
		res: Response,
		next: NextFunction
	): void => {
		if (req.body && typeof req.body === 'object') {
			// Проверяем на наличие операторов MongoDB в запросах
			const hasMongoOperator = (obj: any): boolean => {
				if (!obj || typeof obj !== 'object') return false

				return Object.keys(obj).some(key => {
					// Проверка на NoSQL операторы
					if (
						key.startsWith('$') ||
						key.includes('.') ||
						key.includes('$ne') ||
						key.includes('$gt')
					) {
						return true
					}

					// Рекурсивная проверка вложенных объектов
					if (typeof obj[key] === 'object' && obj[key] !== null) {
						return hasMongoOperator(obj[key])
					}

					return false
				})
			}

			if (hasMongoOperator(req.body)) {
				next(new ApiError('Недопустимые данные запроса', 400))
				return
			}

			// Проверка JSON на глубину вложенности
			const checkDepth = (
				obj: any,
				currentDepth: number = 0,
				maxDepth: number = 10
			): boolean => {
				if (currentDepth > maxDepth) return false
				if (!obj || typeof obj !== 'object') return true

				return Object.keys(obj).every(key => {
					if (typeof obj[key] === 'object' && obj[key] !== null) {
						return checkDepth(obj[key], currentDepth + 1, maxDepth)
					}
					return true
				})
			}

			if (!checkDepth(req.body)) {
				next(
					new ApiError('Превышена максимальная глубина вложенности JSON', 400)
				)
				return
			}
		}

		// Проверяем также параметры в query
		if (req.query && typeof req.query === 'object') {
			const hasMongoOperator = (obj: any): boolean => {
				if (!obj || typeof obj !== 'object') return false

				return Object.keys(obj).some(key => {
					// Проверка на NoSQL операторы
					if (
						key.startsWith('$') ||
						key.includes('.') ||
						key.includes('$ne') ||
						key.includes('$gt')
					) {
						return true
					}

					// Рекурсивная проверка вложенных объектов
					if (typeof obj[key] === 'object' && obj[key] !== null) {
						return hasMongoOperator(obj[key])
					}

					return false
				})
			}

			if (hasMongoOperator(req.query)) {
				next(new ApiError('Недопустимые параметры запроса', 400))
				return
			}
		}

		next()
	},

	/**
	 * Валидация параметров с использованием whitelist
	 */
	validateParams: (allowedParams: string[]): RequestHandler => {
		return (req: Request, res: Response, next: NextFunction): void => {
			const query = req.query

			if (query && Object.keys(query).length > 0) {
				// Проверяем, что все параметры находятся в списке разрешенных
				const invalidParams = Object.keys(query).filter(
					param => !allowedParams.includes(param)
				)

				if (invalidParams.length > 0) {
					next(
						new ApiError(
							`Недопустимые параметры запроса: ${invalidParams.join(', ')}`,
							400
						)
					)
					return
				}
			}

			next()
		}
	},
}
