import fs from 'fs'
import {
	describe,
	it,
	expect,
	beforeAll,
	afterEach,
	afterAll,
	vi,
} from 'vitest'
import { calculateDirectorySize, getDiskSpace } from '@/utils/disk.utils'
import {
	setupTestEnv,
	cleanupTestEnv,
	createTestFile,
	TEST_UPLOADS_DIR,
} from '../setup'

// Мокаем fs для тестов
vi.mock('fs', async importOriginal => {
	const actual = (await importOriginal()) as typeof fs
	return {
		...actual,
		promises: {
			...actual.promises,
			stat: vi.fn().mockImplementation(actual.promises.stat),
			readdir: vi.fn().mockImplementation(actual.promises.readdir),
		},
	}
})

describe('Disk Utils Tests', () => {
	beforeAll(() => {
		setupTestEnv()
	})

	afterEach(() => {
		vi.clearAllMocks()
	})

	afterAll(() => {
		cleanupTestEnv()
		vi.restoreAllMocks()
	})

	describe('calculateDirectorySize', () => {
		it('правильно рассчитывает размер директории', async () => {
			// Создаем тестовые файлы с известным размером
			const fileContent = 'a'.repeat(1000) // 1KB контент
			createTestFile('test1.txt', fileContent)
			createTestFile('test2.txt', fileContent)

			// Создаем поддиректорию с файлом
			const subDirPath = `${TEST_UPLOADS_DIR}/subdir`
			if (!fs.existsSync(subDirPath)) {
				fs.mkdirSync(subDirPath)
			}
			createTestFile('subdir/test3.txt', fileContent)

			// Вызываем функцию
			const size = await calculateDirectorySize(TEST_UPLOADS_DIR)

			// Проверяем, что размер директории равен сумме размеров всех файлов (3000 байт)
			expect(size).toBeGreaterThanOrEqual(3000)
		})

		it('возвращает 0 для несуществующей директории', async () => {
			const size = await calculateDirectorySize(
				`${TEST_UPLOADS_DIR}/non-existent`
			)
			expect(size).toBe(0)
		})
	})

	describe('getDiskSpace', () => {
		it('возвращает информацию о дисковом пространстве', async () => {
			// Создаем тестовые файлы
			createTestFile('info-test1.txt', 'test content 1')
			createTestFile('info-test2.txt', 'test content 2')

			// Вызываем функцию
			const info = await getDiskSpace(TEST_UPLOADS_DIR)

			// Проверяем структуру ответа
			expect(info).toHaveProperty('totalSpace')
			expect(info).toHaveProperty('freeSpace')
			expect(info).toHaveProperty('usedSpace')
			expect(info).toHaveProperty('uploadsDirSize')

			// Проверяем значения
			expect(info.uploadsDirSize).toBeGreaterThan(0)
			expect(info.totalSpace).toBeGreaterThan(0)
		})
	})
})
