import { Request, Response } from 'express'
import { getDiskSpace } from '../../utils/disk.utils.js'
import config from '../../infrastructure/config/config.js'

/**
 * Получает информацию о дисковом пространстве
 */
export const getDiskSpaceInfo = async (
	req: Request,
	res: Response
): Promise<void> => {
	// Получаем информацию о дисковом пространстве
	const diskInfo = await getDiskSpace(config.uploadsDir)

	res.json({
		success: true,
		data: diskInfo,
	})
}
