/**
 * Тестовая конфигурация для запуска тестов
 */
import path from 'path'
import { fileURLToPath } from 'url'
import { TEST_UPLOADS_DIR } from './setup'
import { describe, it, expect } from 'vitest'

// Получение текущей директории для ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Тестовая конфигурация для сервера
const testConfig = {
	// Директория для загруженных файлов для тестов
	uploadsDir: TEST_UPLOADS_DIR,

	// Максимальный размер файла (10 МБ для тестов)
	maxFileSize: 10 * 1024 * 1024,

	// Порт для тестового сервера
	port: 3001,

	// Другие константы для тестов
	allowedMimeTypes: [
		'image/jpeg',
		'image/png',
		'application/pdf',
		'text/plain',
	],

	// Ограничения для тестового окружения
	maxTotalSpace: 100 * 1024 * 1024, // 100 МБ для тестов
}

describe('Config Tests', () => {
	it('должен содержать правильные значения по умолчанию', () => {
		expect(testConfig.uploadsDir).toBe(TEST_UPLOADS_DIR)
		expect(testConfig.port).toBe(3001)
		expect(testConfig.maxFileSize).toBe(10 * 1024 * 1024) // 10 МБ
		expect(testConfig.maxTotalSpace).toBe(100 * 1024 * 1024) // 100 МБ
	})

	it('должен поддерживать разрешенные MIME-типы', () => {
		expect(testConfig.allowedMimeTypes).toContain('image/jpeg')
		expect(testConfig.allowedMimeTypes).toContain('image/png')
		expect(testConfig.allowedMimeTypes).toContain('application/pdf')
		expect(testConfig.allowedMimeTypes).toContain('text/plain')
	})
})

export default testConfig
