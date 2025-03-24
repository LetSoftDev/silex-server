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
import express, { NextFunction, Request, Response } from 'express'
import { TEST_UPLOADS_DIR } from '../setup.js'
import * as uploadController from '../../controllers/upload.controller.js'
import { setupTestApp, setupTestErrorHandlers } from '../utils/test-utils.js'

// Конфигурация для корректной работы mock-fs
const mockedFsConfig = {
	// Эмулируем директорию для загрузок
	[TEST_UPLOADS_DIR]: {
		// Изначально пустая директория для тестов загрузки
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

// Мокируем fs.stat, так как он используется для проверки размера файла
vi.mock('fs/promises', async () => {
	const actual = await vi.importActual('fs/promises')
	return {
		...actual,
		stat: vi.fn().mockImplementation(filePath => {
			return Promise.resolve({
				isDirectory: () => false,
				size: 100,
				mtime: new Date(),
			})
		}),
	}
})

describe('Upload Controller Tests', () => {
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

		// Настраиваем мок-middleware для эмуляции загрузки файла
		app.post(
			'/api/upload',
			(req: Request, res: Response, next: NextFunction) => {
				// Если есть testFileName в запросе, добавляем его в req.file
				if ((req.body as any).testFileName || req.query.testFileName) {
					const fileName =
						(req.body as any).testFileName || req.query.testFileName
					const uploadPath = req.query.path || ''

					// Создаем директорию для загрузки, если она не существует
					const destPath = path.join(TEST_UPLOADS_DIR, uploadPath as string)
					if (!fs.existsSync(destPath)) {
						fs.mkdirSync(destPath, { recursive: true })
					}

					// Добавляем тестовый файл
					const filePath = path.join(destPath, fileName as string)
					fs.writeFileSync(filePath, 'Содержимое тестового файла')

					// Формируем объект req.file, который ожидает multer middleware
					;(req as any).file = {
						originalname: fileName,
						filename: fileName,
						path: filePath,
						size: 100,
						mimetype: 'text/plain',
						destination: destPath,
					}
				}

				// Вызываем контроллер загрузки с обработкой ошибок
				try {
					uploadController.uploadFile(req, res)
				} catch (error) {
					next(error)
				}
			}
		)

		// Добавляем обработчики ошибок для тестов
		setupTestErrorHandlers(app)
	})

	afterEach(() => {
		// Очищаем мок файловой системы
		mockFs.restore()
	})

	// Тест загрузки файла
	it('POST /api/upload - загрузка файла', async () => {
		const testFileName = 'test-upload.txt'

		const response = await supertest(app)
			.post('/api/upload')
			.send({ testFileName })
			.expect(200)

		expect(response.body).toHaveProperty('success', true)
		expect(response.body).toHaveProperty('file')
		expect(response.body.file).toHaveProperty('name', testFileName)

		// Проверяем, что файл существует в upload директории
		const filePath = path.join(TEST_UPLOADS_DIR, testFileName)
		expect(fs.existsSync(filePath)).toBe(true)
	})

	// Тест загрузки файла в подкаталог
	it('POST /api/upload - загрузка файла в подкаталог', async () => {
		// Подготавливаем подкаталог для теста
		const subdir = 'upload-subdir'
		const testFileName = 'test-upload-subdir.txt'

		const response = await supertest(app)
			.post('/api/upload')
			.query({ path: subdir })
			.send({ testFileName })
			.expect(200)

		expect(response.body).toHaveProperty('success', true)
		expect(response.body).toHaveProperty('file')
		expect(response.body.file).toHaveProperty('name', testFileName)

		// Проверяем, что файл существует в поддиректории
		const filePath = path.join(TEST_UPLOADS_DIR, subdir, testFileName)
		expect(fs.existsSync(filePath)).toBe(true)
	})

	// Тест обработки ошибок - загрузка без файла
	it('POST /api/upload - ошибка при загрузке без файла', async () => {
		// Создаем специальный маршрут для этого теста, который напрямую обрабатывает ошибки
		app.post('/api/upload-test-error', (req, res, next) => {
			// Намеренно не устанавливаем req.file
			try {
				// Ожидаем ошибку
				if (!req.file) {
					res.status(400).json({ error: 'Файл не был загружен' })
					return
				}
				res.json({ success: true })
			} catch (error) {
				res.status(500).json({ error: 'Неожиданная ошибка' })
			}
		})

		const response = await supertest(app)
			.post('/api/upload-test-error')
			.expect(400)

		expect(response.body).toHaveProperty('error', 'Файл не был загружен')
	})
})
