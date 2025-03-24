import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { expect } from 'chai'
import sinon from 'sinon'
import { afterAll, afterEach, beforeEach } from 'vitest'

// Получение текущей директории для ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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
		if (fs.existsSync(TEST_UPLOADS_DIR)) {
			fs.rmSync(TEST_UPLOADS_DIR, { recursive: true, force: true })
			console.log(`Тестовая директория очищена: ${TEST_UPLOADS_DIR}`)
		}
	})

	// Возвращаем объект с полезными функциями и переменными
	return {
		cleanTestDir: () => {
			if (fs.existsSync(TEST_UPLOADS_DIR)) {
				fs.readdirSync(TEST_UPLOADS_DIR).forEach(file => {
					fs.unlinkSync(path.join(TEST_UPLOADS_DIR, file))
				})
			}
		},
	}
}

/**
 * Очищает тестовую директорию после запуска тестов
 */
export const cleanupTestEnv = (): void => {
	// Рекурсивно удаляем все файлы из тестовой директории
	if (fs.existsSync(TEST_UPLOADS_DIR)) {
		fs.rmSync(TEST_UPLOADS_DIR, { recursive: true, force: true })
		fs.mkdirSync(TEST_UPLOADS_DIR) // Пересоздаем пустую директорию
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
