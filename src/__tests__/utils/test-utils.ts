import express, { Application } from 'express'
import { testErrorHandler } from '../../middleware/error.middleware.js'

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
	// Добавляем middleware для обработки ошибок
	app.use(testErrorHandler)
}
