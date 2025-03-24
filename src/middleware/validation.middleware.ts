import { Request, Response, NextFunction, RequestHandler } from 'express'
import { AnyZodObject, z } from 'zod'

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
				res.status(400).json({
					error: 'Ошибка валидации',
					details: error.errors,
				})
			} else {
				res.status(500).json({ error: 'Внутренняя ошибка сервера' })
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
				res.status(400).json({
					error: 'Ошибка валидации',
					details: error.errors,
				})
			} else {
				res.status(500).json({ error: 'Внутренняя ошибка сервера' })
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
				res.status(400).json({
					error: 'Ошибка валидации',
					details: error.errors,
				})
			} else {
				res.status(500).json({ error: 'Внутренняя ошибка сервера' })
			}
		}
	}
