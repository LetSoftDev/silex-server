import { FileType } from '../domain/models/file.model.js'

/**
 * Определяет тип файла по расширению
 * @param filename имя файла
 * @returns тип файла
 */
export function getFileType(filename: string): FileType {
	if (!filename.includes('.')) {
		return 'file'
	}

	const extension = filename.split('.').pop()?.toLowerCase() || ''

	// Изображения
	if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension)) {
		return 'image'
	}

	// Видео
	if (['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv'].includes(extension)) {
		return 'video'
	}

	// Аудио
	if (['mp3', 'wav', 'ogg', 'aac', 'flac'].includes(extension)) {
		return 'audio'
	}

	// Документы
	if (
		[
			'pdf',
			'doc',
			'docx',
			'xls',
			'xlsx',
			'ppt',
			'pptx',
			'txt',
			'rtf',
			'md',
			'odt',
		].includes(extension)
	) {
		return 'document'
	}

	// Архивы
	if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
		return 'archive'
	}

	// Код
	if (
		[
			'js',
			'ts',
			'html',
			'css',
			'json',
			'php',
			'py',
			'java',
			'c',
			'cpp',
			'cs',
			'go',
			'rb',
		].includes(extension)
	) {
		return 'code'
	}

	return 'file'
}

/**
 * Проверяет, содержится ли путь в базовой директории
 * @param basePath базовая директория
 * @param targetPath проверяемый путь
 * @returns true, если путь находится внутри базовой директории
 */
export function isPathInBase(basePath: string, targetPath: string): boolean {
	return targetPath.startsWith(basePath)
}

/**
 * Форматирует размер в байтах в удобочитаемый формат
 * @param size размер в байтах
 * @returns форматированный размер
 */
export function formatSize(size: number): string {
	if (size < 1024) {
		return `${size} B`
	} else if (size < 1024 * 1024) {
		return `${(size / 1024).toFixed(2)} KB`
	} else if (size < 1024 * 1024 * 1024) {
		return `${(size / (1024 * 1024)).toFixed(2)} MB`
	} else {
		return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`
	}
}
