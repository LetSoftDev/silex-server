import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

// Определяем текущее окружение
const NODE_ENV = process.env.NODE_ENV || 'development'

// Загружаем переменные окружения из соответствующего файла
dotenv.config({
	path: path.resolve(process.cwd(), `.env.${NODE_ENV}`),
})

// Загружаем дополнительные локальные переменные, если они есть
dotenv.config({
	path: path.resolve(process.cwd(), '.env'),
	override: false,
})

// Получение текущей директории для ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Базовая директория проекта (на два уровня выше config)
const baseDir = path.resolve(__dirname, '..', '..')

// Переменные окружения с значениями по умолчанию
const env = {
	PORT: process.env.PORT || '3000',
	UPLOADS_DIR: process.env.UPLOADS_DIR || 'uploads',
	CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
	NODE_ENV: process.env.NODE_ENV || 'development',
}

interface Config {
	port: number
	uploadsDir: string
	corsOptions: {
		origin: string | string[]
		methods: string[]
		allowedHeaders: string[]
	}
	isDevelopment: boolean
	isProduction: boolean
	isTest: boolean
}

const config: Config = {
	port: parseInt(env.PORT, 10),
	uploadsDir: path.join(baseDir, env.UPLOADS_DIR),
	corsOptions: {
		origin: env.CORS_ORIGIN, // В продакшн-режиме здесь должен быть список разрешенных доменов
		methods: ['GET', 'POST', 'PUT', 'DELETE'],
		allowedHeaders: ['Content-Type', 'Authorization'],
	},
	isDevelopment: env.NODE_ENV === 'development',
	isProduction: env.NODE_ENV === 'production',
	isTest: env.NODE_ENV === 'test',
}

console.log(`Загружена конфигурация для окружения: ${env.NODE_ENV}`)

export default config
