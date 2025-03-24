import { Request, Response } from 'express'
import fs from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import config from '../config/config.js'
import { getFileType } from '../utils/file.utils.js'
import { ApiError } from '../middleware/error.middleware.js'
import { FileItem, UploadResult } from '../models/file.model.js'

/**
 * Обрабатывает загрузку файла
 */
export const uploadFile = async (
	req: Request,
	res: Response
): Promise<void> => {
	if (!req.file) {
		// Синхронная проверка для тестов
		res.status(400).json({ error: 'Файл не был загружен' })
		return
	}

	const uploadPath = (req.query.path as string) || ''
	const file = req.file
	const id = uuidv4()

	// Получаем информацию о файле
	const filePath = path.join(config.uploadsDir, uploadPath, file.filename)
	const stats = await fs.stat(filePath)

	// Формируем объект файла
	const fileItem: FileItem = {
		id,
		name: file.filename,
		path: uploadPath || '/',
		size: stats.size,
		modifiedAt: stats.mtime,
		isDirectory: false,
		type: getFileType(file.filename),
	}

	// Добавляем URL только для изображений
	if (fileItem.type === 'image') {
		fileItem.thumbnailUrl = `/uploads${uploadPath === '/' ? '' : uploadPath}/${
			file.filename
		}`
	}

	const result: UploadResult = {
		success: true,
		file: fileItem,
	}

	res.json(result)
}
