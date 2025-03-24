/**
 * Тип файла
 */
export type FileType =
	| 'image'
	| 'video'
	| 'audio'
	| 'document'
	| 'archive'
	| 'folder'
	| 'file'
	| 'code'
	| 'other'

/**
 * Интерфейс файла/директории
 */
export interface FileItem {
	id: string
	name: string
	path: string
	size: number
	modifiedAt: Date
	isDirectory: boolean
	type: FileType
	thumbnailUrl?: string
}

/**
 * Интерфейс содержимого директории
 */
export interface DirectoryContents {
	path: string
	files: FileItem[]
	parentPath?: string
}

/**
 * Интерфейс результата операции с файлом
 */
export interface FileOperationResult {
	success: boolean
	error?: string
	item?: FileItem
}

/**
 * Интерфейс результата загрузки файла
 */
export interface UploadResult {
	success: boolean
	error?: string
	file?: FileItem
}

/**
 * Интерфейс информации о дисковом пространстве
 */
export interface DiskSpaceInfo {
	freeSpace: number
	totalSpace: number
	usedSpace: number
	uploadsDirSize: number
}
