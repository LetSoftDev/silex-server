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
export const TEST_DIR = path.join(process.cwd(), 'test-uploads')
export const TEST_UPLOADS_DIR = path.join(process.cwd(), 'test-uploads/uploads')
export const TEST_UPLOADS_PUBLIC_DIR = path.join(
	process.cwd(),
	'test-uploads/public'
)

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
 * Рекурсивно удаляет все файлы и подкаталоги из указанного каталога
 */
async function cleanAllFiles(dirPath: string): Promise<void> {
	// Проверяем существует ли каталог
	try {
		await fs.promises.access(dirPath)
	} catch (error: any) {
		// Каталог не существует, ничего делать не нужно
		return
	}

	// Получаем список файлов в каталоге
	let files: string[] = []
	try {
		files = await fs.promises.readdir(dirPath)
	} catch (error: any) {
		console.error(`Ошибка чтения каталога ${dirPath}: ${error.message}`)
		return
	}

	// Обрабатываем каждый файл/каталог
	for (const file of files) {
		const filePath = path.join(dirPath, file)

		try {
			const stat = await fs.promises.stat(filePath)

			if (stat.isDirectory()) {
				// Если это каталог, рекурсивно очищаем его
				await cleanAllFiles(filePath)
				// Удаляем пустой каталог
				await fs.promises.rmdir(filePath)
			} else {
				// Если это файл, удаляем его
				await fs.promises.unlink(filePath)
			}
		} catch (error: any) {
			console.error(`Ошибка при удалении ${filePath}: ${error.message}`)
		}
	}
}

/**
 * Создает каталог, если он не существует
 */
export async function createDir(dirPath: string) {
	try {
		await fs.promises.access(dirPath)
	} catch (error: any) {
		try {
			await fs.promises.mkdir(dirPath, { recursive: true })
			console.log(`Каталог создан: ${dirPath}`)
		} catch (error: any) {
			console.error(`Ошибка создания каталога ${dirPath}: ${error.message}`)
		}
	}
}

/**
 * Удаляет каталог, сначала очищая его содержимое
 */
export async function removeDir(dirPath: string) {
	try {
		// Сначала очищаем каталог рекурсивно
		await cleanAllFiles(dirPath)

		// Проверяем все еще ли существует каталог
		try {
			await fs.promises.access(dirPath)
			// Если каталог существует, пытаемся удалить его
			await fs.promises.rmdir(dirPath)
			console.log(`Каталог удален: ${dirPath}`)
		} catch (error: any) {
			// Каталог уже не существует, ничего делать не нужно
		}
	} catch (error: any) {
		// Логируем ошибку, но не выбрасываем, чтобы не прерывать тесты
		console.error(`Ошибка удаления каталога ${dirPath}: ${error.message}`)
	}
}

/**
 * Создает тестовый файл с указанным содержимым
 */
export async function createTestFile(
	filePath: string,
	content = 'test content'
) {
	try {
		const dir = path.dirname(filePath)
		await createDir(dir)
		await fs.promises.writeFile(filePath, content)
	} catch (error: any) {
		console.error(
			`Ошибка создания тестового файла ${filePath}: ${error.message}`
		)
	}
}

// Настройка среды перед запуском всех тестов
beforeAll(async () => {
	// Создаем тестовые каталоги перед запуском тестов
	await createDir(TEST_DIR)
	await createDir(TEST_UPLOADS_DIR)
	await createDir(TEST_UPLOADS_PUBLIC_DIR)
})

// Очистка среды после всех тестов
afterAll(async () => {
	// Удаляем тестовые каталоги после завершения тестов
	await removeDir(TEST_UPLOADS_PUBLIC_DIR)
	await removeDir(TEST_UPLOADS_DIR)
	await removeDir(TEST_DIR)

	// Очищаем все моки
	vi.clearAllMocks()
})

// Перед каждым тестом очищаем моки
beforeEach(() => {
	vi.clearAllMocks()
})

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

// Создаем тестовое Express-приложение
export const createTestApp = () => {
	const app = express()

	// Стандартная настройка Express для тестов
	app.use(express.json())

	return app
}
