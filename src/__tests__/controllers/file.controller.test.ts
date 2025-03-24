import supertest from 'supertest'
import path from 'path'
import fs from 'fs'
import mockFs from 'mock-fs'
import {
	describe,
	it,
	expect,
	beforeAll,
	beforeEach,
	afterEach,
	vi,
} from 'vitest'
import express from 'express'
import { TEST_UPLOADS_DIR } from '../setup.js'
import * as fileController from '../../controllers/file.controller.js'
import { setupTestApp, setupTestErrorHandlers } from '../utils/test-utils.js'

// Конфигурация для корректной работы mock-fs
const mockedFsConfig = {
	// Эмулируем директорию для загрузок
	[TEST_UPLOADS_DIR]: {
		'test-file.txt': 'Содержимое тестового файла',
		'file-to-delete.txt': 'Файл для удаления',
		'old-name.txt': 'Файл для переименования',
	},
	// Сохраняем доступ к node_modules, чтобы работали зависимости
	node_modules: mockFs.load(path.resolve(process.cwd(), 'node_modules')),
}

// Мокаем конфигурацию, чтобы использовать тестовую директорию
vi.mock('../../config/config.js', () => ({
	default: {
		uploadsDir: TEST_UPLOADS_DIR,
		port: 3002,
		corsOptions: {
			origin: '*',
			methods: ['GET', 'POST', 'PUT', 'DELETE'],
			allowedHeaders: ['Content-Type', 'Authorization'],
		},
	},
}))

describe('File Controller Tests', () => {
	let app: express.Application

	beforeAll(() => {
		// Инициализация
		console.log(`Тестовая директория: ${TEST_UPLOADS_DIR}`)
	})

	beforeEach(() => {
		// Инициализация мока файловой системы с правильной конфигурацией
		mockFs(mockedFsConfig)

		// Создаем экземпляр приложения для каждого теста
		app = express()

		// Настраиваем приложение для тестов
		setupTestApp(app)

		// Регистрация маршрутов
		app.get('/api/files', fileController.getFiles)
		app.post('/api/directory', fileController.createDirectory)
		app.delete('/api/delete/:id', fileController.deleteItem)
		app.put('/api/rename/:id', fileController.renameItem)

		// Добавляем обработчики ошибок для тестов
		setupTestErrorHandlers(app)
	})

	afterEach(() => {
		// Очищаем мок файловой системы
		mockFs.restore()
	})

	// Тест получения списка файлов из корневой директории
	it('GET /api/files - получение списка файлов из корневой директории', async () => {
		const response = await supertest(app).get('/api/files').expect(200)

		expect(response.body).toBeDefined()
		expect(response.body.files).toBeDefined()
		expect(Array.isArray(response.body.files)).toBe(true)

		// Должен быть хотя бы один файл в списке
		expect(response.body.files.length).toBeGreaterThan(0)

		// Проверяем, что наш файл есть в списке
		const foundFile = response.body.files.find(
			(file: any) => file.name === 'test-file.txt'
		)
		expect(foundFile).toBeDefined()
	})

	// Тест создания директории
	it('POST /api/directory - создание директории', async () => {
		const dirName = 'test-dir'

		const response = await supertest(app)
			.post('/api/directory')
			.send({ path: '/', name: dirName })
			.expect(200)

		expect(response.body).toHaveProperty('success', true)
		expect(response.body).toHaveProperty('item')
		expect(response.body.item).toHaveProperty('name', dirName)
		expect(response.body.item).toHaveProperty('isDirectory', true)

		// Проверяем, что директория физически создана
		const dirPath = path.join(TEST_UPLOADS_DIR, dirName)
		const dirExists = fs.existsSync(dirPath)
		expect(dirExists).toBe(true)
	})

	// Тест удаления файла
	it('DELETE /api/delete/:id - удаление файла', async () => {
		const fileName = 'file-to-delete.txt'
		const filePath = path.join(TEST_UPLOADS_DIR, fileName)

		// Убеждаемся что файл существует
		expect(fs.existsSync(filePath)).toBe(true)

		const response = await supertest(app)
			.delete('/api/delete/file')
			.query({ path: fileName })
			.expect(200)

		expect(response.body.success).toBe(true)

		// Проверяем, что файл физически удален
		expect(fs.existsSync(filePath)).toBe(false)
	})

	// Тест переименования файла
	it('PUT /api/rename/:id - переименование файла', async () => {
		const oldName = 'old-name.txt'
		const newName = 'new-name.txt'
		const oldPath = path.join(TEST_UPLOADS_DIR, oldName)
		const newPath = path.join(TEST_UPLOADS_DIR, newName)

		// Убеждаемся что исходный файл существует
		expect(fs.existsSync(oldPath)).toBe(true)

		const response = await supertest(app)
			.put('/api/rename/file')
			.query({ path: oldName })
			.send({ newName })
			.expect(200)

		expect(response.body.success).toBe(true)

		// Проверяем, что старый файл удален
		expect(fs.existsSync(oldPath)).toBe(false)

		// Проверяем, что новый файл создан
		expect(fs.existsSync(newPath)).toBe(true)
	})

	// Тест обработки ошибок - получение файлов из несуществующей директории
	it('GET /api/files - получение файлов из несуществующей директории создает ее', async () => {
		const nonExistentDir = 'non-existent-dir'
		const dirPath = path.join(TEST_UPLOADS_DIR, nonExistentDir)

		// Убеждаемся что директория не существует
		expect(fs.existsSync(dirPath)).toBe(false)

		const response = await supertest(app)
			.get('/api/files')
			.query({ path: nonExistentDir })
			.expect(200)

		expect(response.body.files).toBeDefined()
		expect(Array.isArray(response.body.files)).toBe(true)

		// Проверяем, что директория была создана
		expect(fs.existsSync(dirPath)).toBe(true)
	})

	// Тест обработки ошибок - попытка доступа к запрещенному пути
	it('GET /api/files - попытка доступа к запрещенному пути', async () => {
		const response = await supertest(app)
			.get('/api/files')
			.query({ path: '../forbidden' })
			.expect(403)

		expect(response.body).toHaveProperty('error', 'Запрещенный путь')
	})
})
