import { Request, Response, NextFunction } from 'express'
import { ApiError } from '../../infrastructure/services/error.service.js'

/**
 * Middleware для централизованной обработки ошибок
 */
export const errorHandler = (
	err: Error,
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	// Если это наша ApiError, используем её statusCode
	if (err instanceof ApiError) {
		console.error(`Error ${err.statusCode}: ${err.message}`)
		res.status(err.statusCode).json({
			error: err.message,
			details: err.messages,
		})
		return
	}

	// Для других ошибок - логируем и отправляем 500
	console.error('Непредвиденная ошибка:', err)
	res.status(500).json({
		error: 'Ошибка сервера',
	})
}

/**
 * Обработчик для асинхронных функций-обработчиков
 * Автоматически передает ошибки в errorHandler
 */
export const asyncHandler = (
	fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
	return (req: Request, res: Response, next: NextFunction): void => {
		Promise.resolve(fn(req, res, next)).catch(next)
	}
}

/**
 * Тестовая версия middleware для обработки ошибок
 * Возвращает конкретные сообщения об ошибках вместо общего "Ошибка сервера"
 */
export const testErrorHandler = (
	err: Error,
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	// Если это наша ApiError, используем её statusCode
	if (err instanceof ApiError) {
		res.status(err.statusCode).json({
			error: err.message,
			details: err.messages,
		})
		return
	}

	// Для других ошибок отправляем сообщение об ошибке
	const errorMessage = err.message || 'Ошибка сервера'
	const errorType = err.name || 'Error'
	res.status(500).json({
		error: `${errorType}: ${errorMessage}`,
	})
}
