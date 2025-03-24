import express, { Application, Request, Response, NextFunction } from 'express'
import {
	testErrorHandler,
	ApiError,
} from '../../middleware/error.middleware.js'

/**
 * Настраивает Express приложение для тестов
 * @param app Express приложение
 */
export function setupTestApp(app: Application): void {
	// Настройка базовых middleware
	app.use(express.json())
	app.use(express.urlencoded({ extended: true }))
}

/**
 * Добавляет обработчики ошибок для тестов
 * @param app Express приложение
 */
export function setupTestErrorHandlers(app: Application): void {
	// Добавляем middleware для прехвата неперехваченных ошибок
	app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
		// Проверяем, является ли ошибка нашим ApiError
		if (err instanceof ApiError) {
			res.status(err.statusCode).json({
				error: err.message,
			})
			return
		}

		// Для других ошибок используем тестовый обработчик
		testErrorHandler(err, req, res, next)
	})
}
