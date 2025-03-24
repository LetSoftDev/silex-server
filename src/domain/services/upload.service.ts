import multer from 'multer'
import path from 'path'
import { RequestHandler } from 'express'
import { ApiError } from '../../infrastructure/services/error.service.js'
import { FileService } from './file.service.js'

/**
 * Сервис для загрузки файлов
 */
export class UploadService {
	/**
	 * Создает и настраивает multer для загрузки файлов
	 */
	static createUploader(): multer.Multer {
		// Конфигурация хранилища multer для сохранения файлов
		const storage = multer.diskStorage({
			destination: function (req, file, cb) {
				try {
					// Определяем директорию для загрузки
					const dirPath = (req.query.path as string) || ''

					try {
						// Проверяем/создаем директорию для загрузки
						const uploadPath = FileService.ensureUploadDirectory(dirPath)
						cb(null, uploadPath)
					} catch (error) {
						if (error instanceof ApiError) {
							cb(error as Error, '')
						} else {
							cb(
								new ApiError('Ошибка создания директории для загрузки', 500),
								''
							)
						}
					}
				} catch (error) {
					cb(
						error instanceof Error
							? error
							: new ApiError('Ошибка загрузки файла', 500),
						''
					)
				}
			},
			filename: function (req, file, cb) {
				try {
					// Используем оригинальное имя файла
					const filename = file.originalname

					// Проверка безопасности имени файла
					if (
						filename.includes('..') ||
						filename.includes('/') ||
						filename.includes('\\')
					) {
						return cb(new ApiError('Недопустимое имя файла', 400), '')
					}

					cb(null, filename)
				} catch (error) {
					cb(
						error instanceof Error
							? error
							: new ApiError('Ошибка установки имени файла', 500),
						''
					)
				}
			},
		})

		// Настройка multer для загрузки файлов
		return multer({
			storage,
			limits: {
				fileSize: 100 * 1024 * 1024, // 100MB максимальный размер файла
			},
			fileFilter: (req, file, cb) => {
				// Здесь можно реализовать фильтрацию файлов по типу, если нужно
				cb(null, true)
			},
		})
	}

	/**
	 * Получает middleware для загрузки одиночного файла
	 */
	static getSingleFileUploader(): RequestHandler {
		return this.createUploader().single('file')
	}
}
