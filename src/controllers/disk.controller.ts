import { Request, Response } from 'express'
import { getDiskSpace } from '../utils/disk.utils.js'
import config from '../config/config.js'

/**
 * Получает информацию о дисковом пространстве
 */
export const getDiskSpaceInfo = async (
	req: Request,
	res: Response
): Promise<void> => {
	try {
		// Получаем информацию о дисковом пространстве
		const diskInfo = await getDiskSpace(config.uploadsDir)

		res.json({
			success: true,
			data: diskInfo,
		})
	} catch (error) {
		// Обрабатываем ошибку синхронно для тестов
		res.status(500).json({
			error:
				error instanceof Error
					? error.message
					: 'Ошибка при получении информации о диске',
		})
	}
}
