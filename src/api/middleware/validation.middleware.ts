import { Request, Response, NextFunction, RequestHandler } from 'express'
import { AnyZodObject, z } from 'zod'
import { ApiError } from '../../infrastructure/services/error.service.js'

/**
 * Промежуточное ПО для валидации запросов с использованием Zod
 */
export const validateRequest =
	(schema: AnyZodObject): RequestHandler =>
	(req: Request, res: Response, next: NextFunction): void => {
		try {
			// Валидируем объект запроса синхронно
			schema.parse({
				body: req.body,
				query: req.query,
				params: req.params,
			})
			next()
		} catch (error) {
			if (error instanceof z.ZodError) {
				const messages = error.errors.map(err => ({
					field: err.path.join('.'),
					message: err.message,
				}))
				next(new ApiError('Ошибка валидации', 400))
			} else {
				next(error)
			}
		}
	}

// Middleware для валидации только параметров тела запроса
export const validateBody =
	(schema: AnyZodObject): RequestHandler =>
	(req: Request, res: Response, next: NextFunction): void => {
		try {
			// Валидируем синхронно
			schema.parse(req.body)
			next()
		} catch (error) {
			if (error instanceof z.ZodError) {
				next(new ApiError('Ошибка валидации', 400))
			} else {
				next(error)
			}
		}
	}

// Middleware для валидации только query параметров
export const validateQuery =
	(schema: AnyZodObject): RequestHandler =>
	(req: Request, res: Response, next: NextFunction): void => {
		try {
			// Валидируем синхронно
			schema.parse(req.query)
			next()
		} catch (error) {
			if (error instanceof z.ZodError) {
				next(new ApiError('Ошибка валидации', 400))
			} else {
				next(error)
			}
		}
	}
