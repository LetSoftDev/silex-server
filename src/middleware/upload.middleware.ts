import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { ApiError } from './error.middleware.js'
import config from '../config/config.js'
import { UploadService } from '../services/upload.service.js'

/**
 * Конфигурация хранилища multer для сохранения файлов
 */
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		try {
			// Определяем директорию для загрузки
			let uploadPath = config.uploadsDir
			const dirPath = req.query.path || ''

			if (dirPath) {
				uploadPath = path.join(config.uploadsDir, dirPath as string)

				// Проверка, что путь находится внутри uploads (безопасность)
				if (!uploadPath.startsWith(config.uploadsDir)) {
					return cb(new ApiError('Недопустимый путь загрузки', 403), '')
				}

				// Создаем директорию, если она не существует
				if (!fs.existsSync(uploadPath)) {
					fs.mkdirSync(uploadPath, { recursive: true })
				}
			}

			cb(null, uploadPath)
		} catch (error) {
			cb(
				error instanceof Error ? error : new Error('Ошибка загрузки файла'),
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
					: new Error('Ошибка установки имени файла'),
				''
			)
		}
	},
})

/**
 * Настройка multer для загрузки файлов
 */
export const fileUpload = multer({
	storage,
	limits: {
		fileSize: 100 * 1024 * 1024, // 100MB максимальный размер файла
	},
	fileFilter: (req, file, cb) => {
		// Здесь можно реализовать фильтрацию файлов по типу, если нужно
		cb(null, true)
	},
})

/**
 * Middleware для загрузки одиночного файла
 */
export const uploadSingleFile = UploadService.getSingleFileUploader()
