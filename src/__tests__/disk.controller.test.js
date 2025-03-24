import request from 'supertest'
import { expect } from 'chai'
import { createTestApp } from './server.test.js'
import {
	setupTestEnv,
	cleanupTestEnv,
	createTestFile,
	TEST_UPLOADS_DIR,
} from './setup.js'
import { calculateDirectorySize, getDiskSpace } from '@/utils/disk.utils.js'

// Моки для функций
let mockDiskSpace = null

describe('Disk Controller Tests', function () {
	let app

	// Перед всеми тестами инициализируем окружение
	before(async function () {
		setupTestEnv()
		app = await createTestApp()

		// Сохраняем оригинальную функцию
		mockDiskSpace = {
			freeSpace: 5000000000,
			totalSpace: 10000000000,
			usedSpace: 5000000000,
			uploadsDirSize: 1024 * 1024,
		}
	})

	// После каждого теста очищаем тестовую директорию
	afterEach(function () {
		cleanupTestEnv()
		setupTestEnv()
	})

	// После всех тестов очищаем тестовую директорию
	after(function () {
		cleanupTestEnv()
	})

	it('GET /api/disk-space должен возвращать информацию о диске', async function () {
		// Должен вернуть статус 200
		const response = await request(app).get('/api/disk-space')

		expect(response.status).to.equal(200)
		expect(response.body).to.have.property('freeSpace')
		expect(response.body).to.have.property('totalSpace')
		expect(response.body).to.have.property('usedSpace')
		expect(response.body).to.have.property('uploadsDirSize')
	})
})
