import express from 'express'
import cors from 'cors'
import fileUpload from 'express-fileupload'
import path from 'path'
import { fileURLToPath } from 'url'

// Импорт маршрутов
import fileRoutes from '@routes/file.routes.js'
import diskRoutes from '@routes/disk.routes.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Создаёт экземпляр тестового приложения Express
 * @returns {Promise<express.Application>} Экземпляр Express приложения
 */
export async function createTestApp() {
	const app = express()

	// Настройка middleware
	app.use(cors())
	app.use(express.json())
	app.use(
		fileUpload({
			createParentPath: true,
			limits: {
				fileSize: 1024 * 1024 * 1024, // 1GB
			},
		})
	)

	// Настройка маршрутов
	app.use('/api', fileRoutes)
	app.use('/api', diskRoutes)

	return app
}
