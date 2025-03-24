import { Request, Response, NextFunction, RequestHandler } from 'express'
import { AnyZodObject, z } from 'zod'
import { ApiError } from './error.middleware.js'

// Middleware для валидации запросов
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
