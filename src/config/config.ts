import path from 'path'
import { fileURLToPath } from 'url'

// Получение текущей директории для ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Базовая директория проекта (на два уровня выше config)
const baseDir = path.resolve(__dirname, '..', '..')

interface Config {
	port: number
	uploadsDir: string
	corsOptions: {
		origin: string | string[]
		methods: string[]
		allowedHeaders: string[]
	}
}

const config: Config = {
	port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
	uploadsDir: path.join(baseDir, 'uploads'),
	corsOptions: {
		origin: '*', // В продакшн-режиме здесь должен быть список разрешенных доменов
		methods: ['GET', 'POST', 'PUT', 'DELETE'],
		allowedHeaders: ['Content-Type', 'Authorization'],
	},
}

export default config
