import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { expect } from 'chai'
import sinon from 'sinon'
import { afterAll, afterEach, beforeEach, beforeAll, vi } from 'vitest'
import dotenv from 'dotenv'
import express from 'express'

// Получение текущей директории для ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Загружаем переменные окружения для тестов
dotenv.config({
	path: path.resolve(process.cwd(), '.env.test'),
})

// Путь к тестовой директории uploads
export const TEST_UPLOADS_DIR = path.join(process.cwd(), 'test-uploads')

// Для правильной типизации в глобальном контексте
declare global {
	namespace NodeJS {
		interface Global {
			expect: typeof import('chai').expect
		}
	}
}

/**
 * Подготавливает тестовое окружение
 */
export function setupTestEnv() {
	// Создаем тестовую директорию, если она не существует
	if (!fs.existsSync(TEST_UPLOADS_DIR)) {
		fs.mkdirSync(TEST_UPLOADS_DIR, { recursive: true })
		console.log(`Тестовая директория создана: ${TEST_UPLOADS_DIR}`)
	}

	// Глобальная конфигурация для тестов
	process.env.TEST_UPLOADS_DIR = TEST_UPLOADS_DIR

	// Настройка для Chai (ожидание)
	;(global as any).expect = expect

	// Настройка для Sinon (стабы и моки)
	beforeEach(() => {
		// Можем добавить дополнительные действия перед каждым тестом
	})

	afterEach(() => {
		// Восстанавливаем все стабы и моки после каждого теста
		sinon.restore()
	})

	afterAll(() => {
		// Очищаем тестовую директорию после всех тестов
		try {
			if (fs.existsSync(TEST_UPLOADS_DIR)) {
				// Более безопасная очистка: пытаемся сначала удалить всё содержимое
				cleanAllFiles(TEST_UPLOADS_DIR)
				console.log(`Тестовая директория очищена: ${TEST_UPLOADS_DIR}`)
			}
		} catch (error: any) {
			console.error(`Ошибка при очистке тестовой директории: ${error.message}`)
		}
	})

	// Возвращаем объект с полезными функциями и переменными
	return {
		cleanTestDir: () => {
			if (fs.existsSync(TEST_UPLOADS_DIR)) {
				fs.readdirSync(TEST_UPLOADS_DIR).forEach(file => {
					const filePath = path.join(TEST_UPLOADS_DIR, file)
					if (fs.lstatSync(filePath).isDirectory()) {
						// Рекурсивно очищаем поддиректорию
						cleanAllFiles(filePath)
						try {
							fs.rmdirSync(filePath)
						} catch (error: any) {
							console.error(
								`Не удалось удалить директорию ${filePath}: ${error.message}`
							)
						}
					} else {
						// Удаляем файл
						try {
							fs.unlinkSync(filePath)
						} catch (error: any) {
							console.error(
								`Не удалось удалить файл ${filePath}: ${error.message}`
							)
						}
					}
				})
			}
		},
	}
}

/**
 * Рекурсивно удаляет все файлы и директории внутри указанной директории
 */
const cleanAllFiles = (dirPath: string): void => {
	if (!fs.existsSync(dirPath)) return

	// Получаем список файлов в директории
	const files = fs.readdirSync(dirPath)

	// Рекурсивно удаляем все файлы и поддиректории
	for (const file of files) {
		const curPath = path.join(dirPath, file)

		// Если это директория, рекурсивно очищаем её, затем удаляем
		if (fs.lstatSync(curPath).isDirectory()) {
			cleanAllFiles(curPath)
			try {
				fs.rmdirSync(curPath)
			} catch (error: any) {
				console.error(
					`Не удалось удалить директорию ${curPath}: ${error.message}`
				)
			}
		} else {
			// Удаляем файл
			try {
				fs.unlinkSync(curPath)
			} catch (error: any) {
				console.error(`Не удалось удалить файл ${curPath}: ${error.message}`)
			}
		}
	}
}

/**
 * Очищает тестовую директорию после запуска тестов
 */
export const cleanupTestEnv = (): void => {
	// Рекурсивно удаляем все файлы из тестовой директории
	try {
		if (fs.existsSync(TEST_UPLOADS_DIR)) {
			cleanAllFiles(TEST_UPLOADS_DIR)

			// Пересоздаем пустую директорию, если она была удалена
			if (!fs.existsSync(TEST_UPLOADS_DIR)) {
				fs.mkdirSync(TEST_UPLOADS_DIR)
			}
		}
	} catch (error: any) {
		console.error(`Ошибка при очистке тестового окружения: ${error.message}`)
	}
}

// Функция для создания временного тестового файла
export const createTestFile = (
	fileName: string,
	content: string = 'test content'
): string => {
	const filePath = path.join(TEST_UPLOADS_DIR, fileName)
	fs.writeFileSync(filePath, content)
	return filePath
}

// Функция для создания временной тестовой директории
export const createTestDirectory = (dirName: string): string => {
	const dirPath = path.join(TEST_UPLOADS_DIR, dirName)
	if (!fs.existsSync(dirPath)) {
		fs.mkdirSync(dirPath, { recursive: true })
	}
	return dirPath
}

// Функция для создания директории по указанному пути
const ensureDir = (dirPath: string) => {
	if (!fs.existsSync(dirPath)) {
		fs.mkdirSync(dirPath, { recursive: true })
	}
}

// Функция для рекурсивного удаления директории
const removeDir = (dirPath: string) => {
	if (fs.existsSync(dirPath)) {
		try {
			// Сначала очищаем всё содержимое директории
			cleanAllFiles(dirPath)

			// Затем пытаемся удалить саму директорию
			fs.rmdirSync(dirPath)
		} catch (error: any) {
			console.error(
				`Не удалось удалить директорию ${dirPath}: ${error.message}`
			)
			// Если не удалось удалить - можно оставить пустую директорию
		}
	}
}

// Мокаем модули, которые нуждаются в моках
vi.mock('helmet', () => {
	return {
		default: () => (req: any, res: any, next: any) => {
			next()
		},
	}
})

vi.mock('express-rate-limit', () => {
	return {
		rateLimit: ({ max, windowMs, message }: any) => {
			return (req: any, res: any, next: any) => {
				// Упрощенная реализация rate limiter для тестирования
				next()
			}
		},
	}
})

vi.mock('hpp', () => {
	return {
		default: () => (req: any, res: any, next: any) => {
			next()
		},
	}
})

// Подготовка перед всеми тестами
beforeAll(() => {
	// Устанавливаем переменные окружения для тестов
	process.env.NODE_ENV = 'test'
	process.env.UPLOADS_DIR = TEST_UPLOADS_DIR

	try {
		// Создаем тестовую директорию для uploads
		ensureDir(TEST_UPLOADS_DIR)

		// Создаем некоторые тестовые файлы
		const testFile = path.join(TEST_UPLOADS_DIR, 'test-file.txt')
		try {
			fs.writeFileSync(testFile, 'Test file content')
		} catch (error: any) {
			console.warn(`Не удалось создать тестовый файл: ${error.message}`)
		}

		// Создаем поддиректорию
		const testSubDir = path.join(TEST_UPLOADS_DIR, 'testdir')
		ensureDir(testSubDir)

		// Создаем файл в поддиректории
		const testSubFile = path.join(testSubDir, 'subfile.txt')
		try {
			fs.writeFileSync(testSubFile, 'Subfile content')
		} catch (error: any) {
			console.warn(
				`Не удалось создать тестовый файл в поддиректории: ${error.message}`
			)
		}

		console.log('✅ Тестовая среда подготовлена')
	} catch (error: any) {
		console.error(`Ошибка при подготовке тестовой среды: ${error.message}`)
	}
})

// Очистка после всех тестов
afterAll(() => {
	// Удаляем тестовую директорию
	try {
		removeDir(TEST_UPLOADS_DIR)
		console.log('✅ Тестовая среда очищена')
	} catch (error: any) {
		console.error(`Ошибка при очистке тестовой среды: ${error.message}`)
	}
})

// Создаем тестовое Express-приложение
export const createTestApp = () => {
	const app = express()

	// Стандартная настройка Express для тестов
	app.use(express.json())

	return app
}
