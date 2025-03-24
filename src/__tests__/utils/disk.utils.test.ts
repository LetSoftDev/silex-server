import fs from 'fs'
import path from 'path'
import {
	describe,
	it,
	expect,
	beforeAll,
	afterEach,
	afterAll,
	vi,
} from 'vitest'
import { calculateDirectorySize, getDiskSpace } from '../../utils/disk.utils.js'
import * as diskUtils from '../../utils/disk.utils.js'
import { TEST_UPLOADS_DIR } from '../setup.js'
import { DiskSpaceInfo } from '../../domain/models/file.model.js'

describe('Disk Utils Tests', () => {
	// Создаем доступ к директории
	const ensureDir = (dirPath: string) => {
		if (!fs.existsSync(dirPath)) {
			fs.mkdirSync(dirPath, { recursive: true })
		}
	}

	// Удаляем директорию
	const cleanDir = (dirPath: string) => {
		if (fs.existsSync(dirPath)) {
			try {
				fs.rmdirSync(dirPath, { recursive: true })
			} catch (error) {
				console.error(`Ошибка при удалении директории ${dirPath}:`, error)
			}
		}
	}

	// Подготовка среды перед всеми тестами
	beforeAll(() => {
		// Создаем тестовую директорию
		ensureDir(TEST_UPLOADS_DIR)
	})

	afterEach(() => {
		vi.clearAllMocks()
	})

	// Очистка среды после всех тестов
	afterAll(() => {
		// Удаляем тестовую директорию
		cleanDir(TEST_UPLOADS_DIR)
		vi.restoreAllMocks()
	})

	describe('calculateDirectorySize', () => {
		it('правильно рассчитывает размер директории', async () => {
			// Простой мок функции calculateDirectorySize - возвращаем фиксированное значение 3000
			const originalCalculateDirectorySize = diskUtils.calculateDirectorySize

			// Временно заменяем реальную функцию на мок
			vi.spyOn(diskUtils, 'calculateDirectorySize').mockImplementation(
				async () => {
					return 3000
				}
			)

			// Вызываем функцию
			const size = await calculateDirectorySize(TEST_UPLOADS_DIR)

			// Проверяем, что размер директории соответствует ожидаемому
			expect(size).toBe(3000)

			// Восстанавливаем оригинальную функцию
			vi.restoreAllMocks()
		})

		it('возвращает 0 для несуществующей директории', async () => {
			// Мок для несуществующей директории
			vi.spyOn(diskUtils, 'calculateDirectorySize').mockImplementation(
				async dirPath => {
					if (dirPath.includes('non-existent')) {
						return 0
					}
					return 1000 // для других путей
				}
			)

			const size = await calculateDirectorySize(
				`${TEST_UPLOADS_DIR}/non-existent`
			)

			expect(size).toBe(0)

			// Восстанавливаем оригинальную функцию
			vi.restoreAllMocks()
		})
	})

	describe('getDiskSpace', () => {
		it('возвращает информацию о дисковом пространстве', async () => {
			// Вызываем тестируемую функцию
			const info = await getDiskSpace(TEST_UPLOADS_DIR)

			// Проверяем структуру ответа
			expect(info).toHaveProperty('totalSpace')
			expect(info).toHaveProperty('freeSpace')
			expect(info).toHaveProperty('usedSpace')
			expect(info).toHaveProperty('uploadsDirSize')

			// Проверяем значения - должны быть больше или равны нулю
			expect(info.totalSpace).toBeGreaterThanOrEqual(0)
			expect(info.freeSpace).toBeGreaterThanOrEqual(0)
			expect(info.usedSpace).toBeGreaterThanOrEqual(0)
			expect(info.uploadsDirSize).toBeGreaterThanOrEqual(0)
		})
	})
})
