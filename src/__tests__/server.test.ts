/**
 * Тесты для сервера
 */
import express from 'express'
import cors from 'cors'
import path from 'path'
import { describe, it, expect } from 'vitest'
import testConfig from './config.test'
import { setupTestEnv } from './setup'
import multer from 'multer'

/**
 * Создает тестовое приложение Express для тестов
 */
export const createTestApp = async () => {
	// Инициализируем тестовое окружение
	setupTestEnv()

	// Создаем тестовый сервер Express
	const app = express()

	// Настройка middleware
	app.use(express.json())
	app.use(express.urlencoded({ extended: true }))
	app.use(cors())

	// Настройка статических файлов
	app.use('/uploads', express.static(testConfig.uploadsDir))

	// Загружаем маршруты для тестов
	const fileRoutes = await import('./routes/file.routes.test')

	// Регистрируем основные маршруты API
	app.use('/api/files', fileRoutes.default)

	// Регистрируем базовый маршрут файлового API
	app.use('/api', fileRoutes.default)

	// Регистрируем маршрут загрузки
	const upload = multer({ dest: testConfig.uploadsDir })
	const { uploadFile } = await import('../controllers/upload.controller')
	app.post('/api/upload', upload.single('file'), uploadFile)

	return app
}

/**
 * Тесты для сервера
 * Примечание: основные тесты проводятся в тестах контроллеров и маршрутов
 */
describe('Сервер', () => {
	it('Создание тестового приложения', async () => {
		const app = await createTestApp()
		expect(app).toBeDefined()
	})
})

export default createTestApp
