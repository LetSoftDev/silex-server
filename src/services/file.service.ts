import fs from 'fs/promises'
import { existsSync, mkdirSync } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import config from '../config/config.js'
import { getFileType } from '../utils/file.utils.js'
import { ApiError } from '../middleware/error.middleware.js'
import { FileItem, UploadResult } from '../models/file.model.js'

export class FileService {
	/**
	 * Проверяет и создает директорию для загрузки, если она не существует
	 */
	static ensureUploadDirectory(uploadPath: string): string {
		const dirPath = path.join(config.uploadsDir, uploadPath)

		// Проверяем, что путь находится внутри uploads (безопасность)
		if (!dirPath.startsWith(config.uploadsDir)) {
			throw new ApiError('Запрещенный путь', 403)
		}

		// Создаем директорию, если она не существует
		if (!existsSync(dirPath)) {
			mkdirSync(dirPath, { recursive: true })
		}

		return dirPath
	}

	/**
	 * Получает информацию о загруженном файле
	 */
	static async getFileInfo(
		filePath: string,
		uploadPath: string
	): Promise<FileItem> {
		const stats = await fs.stat(filePath)
		const id = uuidv4()
		const filename = path.basename(filePath)

		const fileItem: FileItem = {
			id,
			name: filename,
			path: uploadPath || '/',
			size: stats.size,
			modifiedAt: stats.mtime,
			isDirectory: false,
			type: getFileType(filename),
		}

		// Добавляем URL только для изображений
		if (fileItem.type === 'image') {
			fileItem.thumbnailUrl = `/uploads${
				uploadPath === '/' ? '' : uploadPath
			}/${filename}`
		}

		return fileItem
	}

	/**
	 * Обрабатывает загруженный файл и возвращает результат
	 */
	static async processUploadedFile(
		file: Express.Multer.File | undefined,
		uploadPath: string
	): Promise<UploadResult> {
		if (!file) {
			throw new ApiError('Файл не был загружен', 400)
		}

		// Получаем информацию о файле
		const filePath = path.join(config.uploadsDir, uploadPath, file.filename)
		const fileItem = await this.getFileInfo(filePath, uploadPath)

		return {
			success: true,
			file: fileItem,
		}
	}
}
