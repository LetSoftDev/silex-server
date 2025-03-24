import { Request, Response } from 'express'
import { FileService } from '../../domain/services/file.service.js'

/**
 * Обрабатывает загрузку файла
 */
export const uploadFile = async (
	req: Request,
	res: Response
): Promise<void> => {
	// Используем сервис для обработки загруженного файла
	const uploadPath = (req.query.path as string) || ''
	const result = await FileService.processUploadedFile(req.file, uploadPath)

	res.json(result)
}
