import request from 'supertest'
import { expect } from 'chai'
import fs from 'fs'
import path from 'path'
import { createTestApp } from './server.test.js'
import {
	setupTestEnv,
	cleanupTestEnv,
	createTestFile,
	createTestDirectory,
	TEST_UPLOADS_DIR,
} from './setup.js'

describe('File Controller Tests', function () {
	let app

	// Перед всеми тестами инициализируем окружение
	before(async function () {
		setupTestEnv()
		app = await createTestApp()
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

	describe('GET /api/files', function () {
		it('должен возвращать пустой список файлов в пустой директории', async function () {
			const response = await request(app).get('/api/files')

			expect(response.status).to.equal(200)
			expect(response.body).to.be.an('array')
			expect(response.body).to.have.lengthOf(0)
		})

		it('должен возвращать список файлов в директории', async function () {
			// Создаем тестовые файлы
			createTestFile('test1.txt', 'тестовое содержимое 1')
			createTestFile('test2.txt', 'тестовое содержимое 2')

			const response = await request(app).get('/api/files')

			expect(response.status).to.equal(200)
			expect(response.body).to.be.an('array')
			expect(response.body).to.have.lengthOf(2)

			// Проверяем содержимое ответа
			const fileNames = response.body.map(file => file.name)
			expect(fileNames).to.include('test1.txt')
			expect(fileNames).to.include('test2.txt')
		})

		it('должен возвращать файлы из указанной директории', async function () {
			// Создаем директорию и файл внутри нее
			createTestDirectory('subdir')
			createTestFile('subdir/test.txt', 'тестовое содержимое')

			const response = await request(app).get('/api/files?path=subdir')

			expect(response.status).to.equal(200)
			expect(response.body).to.be.an('array')
			expect(response.body).to.have.lengthOf(1)
			expect(response.body[0].name).to.equal('test.txt')
		})
	})

	describe('POST /api/files/mkdir', function () {
		it('должен создавать новую директорию', async function () {
			const dirName = 'newdir'

			const response = await request(app)
				.post('/api/files/mkdir')
				.send({ dirName })

			expect(response.status).to.equal(201)

			// Проверяем, что директория действительно создана
			const dirPath = path.join(TEST_UPLOADS_DIR, dirName)
			expect(fs.existsSync(dirPath)).to.be.true
			expect(fs.statSync(dirPath).isDirectory()).to.be.true
		})

		it('должен возвращать ошибку при попытке создать существующую директорию', async function () {
			const dirName = 'existingdir'
			createTestDirectory(dirName)

			const response = await request(app)
				.post('/api/files/mkdir')
				.send({ dirName })

			expect(response.status).to.equal(400)
		})
	})

	// Дополнительные тесты можно добавить для других эндпоинтов
})
