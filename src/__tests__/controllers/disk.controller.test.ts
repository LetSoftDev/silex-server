import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getDiskSpaceInfo } from '../../controllers/disk.controller.js'
import * as diskUtils from '../../utils/disk.utils.js'
import supertest from 'supertest'
import express from 'express'
import { setupTestApp, setupTestErrorHandlers } from '../utils/test-utils.js'

// Мокаем модуль diskUtils
vi.mock('../../utils/disk.utils.js', () => ({
	getDiskSpace: vi.fn(),
	calculateDirectorySize: vi.fn(),
}))

describe('Disk Controller Tests', () => {
	let app: express.Application

	// Настройка перед тестами
	beforeEach(() => {
		// Сбрасываем все моки
		vi.clearAllMocks()

		// Создаем тестовое приложение Express
		app = express()

		// Настраиваем приложение для тестов
		setupTestApp(app)

		// Регистрируем маршрут
		app.get('/api/disk', getDiskSpaceInfo)

		// Добавляем обработчики ошибок для тестов
		setupTestErrorHandlers(app)
	})

	// Тест получения информации о дисковом пространстве
	it('GET /api/disk - получение информации о диске', async () => {
		// Мокаем данные о дисковом пространстве
		const diskData = {
			totalSpace: 1000000,
			freeSpace: 500000,
			usedSpace: 500000,
			uploadsDirSize: 300000,
		}

		// Настраиваем мок для getDiskSpace
		vi.mocked(diskUtils.getDiskSpace).mockResolvedValue(diskData)

		const response = await supertest(app).get('/api/disk')

		// Проверяем только структуру ответа и статус код
		expect(response.status).toBe(200)
		expect(response.body).toHaveProperty('success', true)
		expect(response.body).toHaveProperty('data')
		expect(response.body.data).toEqual(diskData)
	})

	// Тест обработки ошибок при получении информации о диске
	it('GET /api/disk - обработка ошибок', async () => {
		// Мокаем ошибку
		vi.mocked(diskUtils.getDiskSpace).mockRejectedValue(new Error('Test error'))

		const response = await supertest(app).get('/api/disk')

		expect(response.status).toBe(500)
		expect(response.body).toHaveProperty('error', 'Test error')
	})
})
