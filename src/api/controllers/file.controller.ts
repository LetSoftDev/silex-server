import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs/promises'
import path from 'path'
import config from '../../infrastructure/config/config.js'
import { getFileType } from '../../utils/file.utils.js'
import { FileService } from '../../domain/services/file.service.js'
import { ApiError } from '../../infrastructure/services/error.service.js'
import {
	DirectoryContents,
	FileItem,
	FileOperationResult,
} from '../../domain/models/file.model.js'

/**
 * Получает список файлов и директорий
 */
export const getFiles = async (req: Request, res: Response): Promise<void> => {
	const dirPath = (req.query.path as string) || ''
	const fullPath = path.join(config.uploadsDir, dirPath)

	// Проверяем, что путь находится внутри uploads (безопасность)
	if (!fullPath.startsWith(config.uploadsDir)) {
		throw new ApiError('Запрещенный путь', 403)
	}

	// Проверяем существование директории
	try {
		await fs.access(fullPath)
	} catch (error) {
		// Если директория не существует, создаем её
		await fs.mkdir(fullPath, { recursive: true })
	}

	// Получаем список файлов в директории
	const files = await fs.readdir(fullPath)
	const fileDetails = await Promise.all(
		files.map(async file => {
			const filePath = path.join(fullPath, file)
			const stats = await fs.stat(filePath)
			const id = uuidv4() // Генерируем UUID для каждого файла

			const fileItem: FileItem = {
				id,
				name: file,
				path: dirPath || '/',
				size: stats.size,
				modifiedAt: stats.mtime,
				isDirectory: stats.isDirectory(),
				type: stats.isDirectory() ? 'folder' : getFileType(file),
			}

			// Добавляем URL только для изображений
			if (fileItem.type === 'image') {
				fileItem.thumbnailUrl = `/uploads${
					dirPath === '/' ? '' : dirPath
				}/${file}`
			}

			return fileItem
		})
	)

	// Сортируем: сначала директории, затем файлы, по алфавиту
	fileDetails.sort((a, b) => {
		if (a.isDirectory && !b.isDirectory) return -1
		if (!a.isDirectory && b.isDirectory) return 1
		return a.name.localeCompare(b.name)
	})

	// Определяем родительский путь
	let parentPath
	if (dirPath !== '' && dirPath !== '/') {
		parentPath = path.dirname(dirPath)
		if (parentPath === '.') parentPath = '/'
	}

	const result: DirectoryContents = {
		path: dirPath || '/',
		files: fileDetails,
	}

	if (parentPath !== undefined) {
		result.parentPath = parentPath
	}

	res.json(result)
}

/**
 * Создает новую директорию
 */
export const createDirectory = async (
	req: Request,
	res: Response
): Promise<void> => {
	const { path: dirPath, name } = req.body

	if (!name) {
		throw new ApiError('Имя директории не указано', 400)
	}

	const newDirPath = path.join(config.uploadsDir, dirPath || '', name)

	// Проверяем, что путь находится внутри uploads (безопасность)
	if (!newDirPath.startsWith(config.uploadsDir)) {
		throw new ApiError('Запрещенный путь', 403)
	}

	// Проверяем существование директории
	try {
		await fs.access(newDirPath)
		throw new ApiError('Директория с таким именем уже существует', 400)
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
			throw error
		}
		// Директория не существует, продолжаем
	}

	// Создаем директорию
	await fs.mkdir(newDirPath, { recursive: true })

	// Формируем информацию о созданной директории
	const stats = await fs.stat(newDirPath)
	const id = uuidv4()

	const newDir: FileItem = {
		id,
		name,
		path: dirPath || '/',
		size: 0,
		modifiedAt: stats.mtime,
		isDirectory: true,
		type: 'folder',
	}

	const result: FileOperationResult = {
		success: true,
		item: newDir,
	}

	res.json(result)
}

/**
 * Удаляет файл или директорию
 */
export const deleteItem = async (
	req: Request,
	res: Response
): Promise<void> => {
	const { id } = req.params
	const filePath = req.query.path as string

	if (!filePath) {
		throw new ApiError('Путь к файлу не указан', 400)
	}

	const fullPath = path.join(config.uploadsDir, filePath)

	// Проверяем, что путь находится внутри uploads (безопасность)
	if (!fullPath.startsWith(config.uploadsDir)) {
		throw new ApiError('Запрещенный путь', 403)
	}

	// Проверяем существование файла/директории
	try {
		await fs.access(fullPath)
	} catch (error) {
		throw new ApiError('Файл или директория не найдены', 404)
	}

	const stats = await fs.stat(fullPath)
	const isDirectory = stats.isDirectory()

	// Удаляем файл или директорию
	if (isDirectory) {
		await fs.rm(fullPath, { recursive: true, force: true })
	} else {
		await fs.unlink(fullPath)
	}

	const result: FileOperationResult = {
		success: true,
		item: {
			id,
			path: filePath,
			isDirectory,
		} as FileItem,
	}

	res.json(result)
}

/**
 * Переименовывает файл или директорию
 */
export const renameItem = async (
	req: Request,
	res: Response
): Promise<void> => {
	const { id } = req.params
	const { newName } = req.body
	const oldPath = req.query.path as string
	const dirPath = (req.query.dir as string) || ''

	if (!newName) {
		throw new ApiError('Новое имя не указано', 400)
	}

	if (!oldPath) {
		throw new ApiError('Путь к файлу не указан', 400)
	}

	const fullOldPath = path.join(config.uploadsDir, dirPath, oldPath)
	const fullNewPath = path.join(config.uploadsDir, dirPath, newName)

	// Проверяем, что пути находятся внутри uploads (безопасность)
	if (
		!fullOldPath.startsWith(config.uploadsDir) ||
		!fullNewPath.startsWith(config.uploadsDir)
	) {
		throw new ApiError('Запрещенный путь', 403)
	}

	// Проверяем существование исходного файла/директории
	try {
		await fs.access(fullOldPath)
	} catch (error) {
		throw new ApiError('Файл или директория не найдены', 404)
	}

	// Проверяем, не существует ли уже файл/директория с новым именем
	try {
		await fs.access(fullNewPath)
		throw new ApiError('Файл или директория с таким именем уже существует', 400)
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
			throw error
		}
		// Файл не существует, продолжаем
	}

	// Переименовываем файл или директорию
	await fs.rename(fullOldPath, fullNewPath)

	// Получаем информацию о переименованном файле
	const stats = await fs.stat(fullNewPath)
	const isDirectory = stats.isDirectory()

	const result: FileOperationResult = {
		success: true,
		item: {
			id,
			name: newName,
			path: dirPath || '/',
			size: stats.size,
			modifiedAt: stats.mtime,
			isDirectory,
			type: isDirectory ? 'folder' : getFileType(newName),
		},
	}

	res.json(result)
}
