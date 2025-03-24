import fs from 'fs/promises'
import path from 'path'
import { DiskSpaceInfo } from '../models/file.model.js'

/**
 * Получает информацию о дисковом пространстве
 * @param directory директория для которой нужно получить информацию
 * @returns информация о свободном, занятом и общем пространстве
 */
export async function getDiskSpace(directory: string): Promise<DiskSpaceInfo> {
	try {
		// В Node.js нет прямого способа получить информацию о диске,
		// но можно использовать fs.statfs на Unix-системах или другие методы.
		// Здесь используем имитацию, в реальном проекте нужно использовать
		// платформо-зависимые методы или библиотеки типа diskusage

		// Рассчитываем размер директории загрузок
		const uploadsDirSize = await calculateDirectorySize(directory)

		// Для примера, используем фиксированные значения
		const totalSpace = 1000000000000 // 1 ТБ
		const usedSpace = totalSpace * 0.3 // 30% использовано
		const freeSpace = totalSpace - usedSpace

		return {
			freeSpace,
			totalSpace,
			usedSpace,
			uploadsDirSize,
		}
	} catch (error) {
		console.error('Error getting disk space:', error)
		throw error
	}
}

/**
 * Вычисляет размер директории рекурсивно
 * @param directoryPath путь к директории
 * @returns размер директории в байтах
 */
export async function calculateDirectorySize(
	directoryPath: string
): Promise<number> {
	let totalSize = 0

	try {
		const items = await fs.readdir(directoryPath, { withFileTypes: true })

		for (const item of items) {
			const itemPath = path.join(directoryPath, item.name)

			if (item.isDirectory()) {
				totalSize += await calculateDirectorySize(itemPath)
			} else {
				const stats = await fs.stat(itemPath)
				totalSize += stats.size
			}
		}

		return totalSize
	} catch (error) {
		console.error(`Error calculating size for ${directoryPath}:`, error)
		return 0
	}
}
