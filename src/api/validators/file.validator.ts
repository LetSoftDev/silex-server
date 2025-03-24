import { z } from 'zod'

// Схема для запросов на получение списка файлов
export const getFilesSchema = z.object({
	query: z.object({
		path: z.string().optional(),
	}),
})

// Схема для запросов на создание директории
export const createDirectorySchema = z.object({
	body: z.object({
		path: z.string().optional().default(''),
		name: z.string().min(1, 'Имя директории не может быть пустым'),
	}),
})

// Схема для запросов на удаление
export const deleteItemSchema = z.object({
	params: z.object({
		id: z.string().uuid('Некорректный ID'),
	}),
	query: z.object({
		path: z.string().min(1, 'Путь к файлу не указан'),
	}),
})

// Схема для запросов на переименование
export const renameItemSchema = z.object({
	params: z.object({
		id: z.string().uuid('Некорректный ID'),
	}),
	query: z.object({
		path: z.string().min(1, 'Путь к файлу не указан'),
		dir: z.string().optional().default(''),
	}),
	body: z.object({
		newName: z.string().min(1, 'Новое имя не может быть пустым'),
	}),
})

// Схема для загрузки файла
export const uploadFileSchema = z.object({
	query: z.object({
		path: z.string().optional().default(''),
	}),
	// Файл будет проверяться в middleware загрузки
})

// Схема для запросов на получение информации о дисковом пространстве
export const diskSpaceSchema = z.object({})
