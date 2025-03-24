import { Request, Response } from 'express'
import fs from 'fs/promises'
import { existsSync, statSync } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import config from '../config/config.js'
import { getFileType } from '../utils/file.utils.js'
import { ApiError } from '../middleware/error.middleware.js'
import {
	FileItem,
	DirectoryContents,
	FileOperationResult,
} from '../models/file.model.js'

/**
 * Получает список файлов и директорий
 */
export const getFiles = async (req: Request, res: Response): Promise<void> => {
	const requestedPath = (req.query.path as string) || ''
	let dirPath = path.join(config.uploadsDir, requestedPath)

	// Проверяем, что путь находится внутри uploads (безопасность)
	if (!dirPath.startsWith(config.uploadsDir)) {
		throw new ApiError('Запрещенный путь', 403)
	}

	// Проверяем существование директории
	try {
		await fs.access(dirPath)
	} catch (error) {
		// Если директория не существует, создаем её
		await fs.mkdir(dirPath, { recursive: true })
	}

	// Получаем содержимое директории
	const files = await fs.readdir(dirPath)

	// Формируем информацию о файлах
	const filePromises = files.map(async filename => {
		const filePath = path.join(dirPath, filename)
		const stats = await fs.stat(filePath)
		const id = uuidv4()
		const isDirectory = stats.isDirectory()

		// Формируем относительный путь для хранения
		const relativePath = requestedPath || '/'

		const item: FileItem = {
			id,
			name: filename,
			path: relativePath,
			size: stats.size,
			modifiedAt: stats.mtime,
			isDirectory,
			type: isDirectory ? 'folder' : getFileType(filename),
		}

		// Добавляем URL только для изображений
		if (!isDirectory && item.type === 'image') {
			item.thumbnailUrl = `/uploads${
				relativePath === '/' ? '' : relativePath
			}/${filename}`
		}

		return item
	})

	const fileItems = await Promise.all(filePromises)

	// Определяем родительский путь
	let parentPath: string | undefined
	if (requestedPath && requestedPath !== '/') {
		const pathParts = requestedPath.split('/').filter(part => part)
		if (pathParts.length > 0) {
			pathParts.pop()
			parentPath = pathParts.length === 0 ? '/' : '/' + pathParts.join('/')
		} else {
			parentPath = '/'
		}
	}

	const result: DirectoryContents = {
		path: requestedPath || '/',
		files: fileItems,
	}

	// Добавляем родительский путь, если он существует
	if (parentPath) {
		;(result as any).parentPath = parentPath
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
