import path from 'path'
import fs from 'fs'

// Путь к тестовой директории uploads
export const TEST_UPLOADS_DIR = path.join(process.cwd(), 'test-uploads')

/**
 * Подготавливает тестовую директорию перед запуском тестов
 */
export function setupTestEnv() {
	// Создаем тестовую директорию, если она не существует
	if (!fs.existsSync(TEST_UPLOADS_DIR)) {
		fs.mkdirSync(TEST_UPLOADS_DIR, { recursive: true })
	}
}

/**
 * Очищает тестовую директорию после запуска тестов
 */
export function cleanupTestEnv() {
	// Рекурсивно удаляем все файлы из тестовой директории
	if (fs.existsSync(TEST_UPLOADS_DIR)) {
		fs.rmSync(TEST_UPLOADS_DIR, { recursive: true, force: true })
		fs.mkdirSync(TEST_UPLOADS_DIR) // Пересоздаем пустую директорию
	}
}

// Функция для создания временного тестового файла
export function createTestFile(fileName, content = 'test content') {
	const filePath = path.join(TEST_UPLOADS_DIR, fileName)

	// Если файл включает путь с директориями, создаем эти директории
	const dirPath = path.dirname(filePath)
	if (!fs.existsSync(dirPath)) {
		fs.mkdirSync(dirPath, { recursive: true })
	}

	fs.writeFileSync(filePath, content)
	return filePath
}

// Функция для создания временной тестовой директории
export function createTestDirectory(dirName) {
	const dirPath = path.join(TEST_UPLOADS_DIR, dirName)
	if (!fs.existsSync(dirPath)) {
		fs.mkdirSync(dirPath, { recursive: true })
	}
	return dirPath
}
