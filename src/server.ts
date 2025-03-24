import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import apiRoutes from './routes/index.js'
import config from './config/config.js'
import { errorHandler } from './middleware/error.middleware.js'

// Получаем текущую директорию для ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

// Создаем директорию uploads, если она не существует
if (!fs.existsSync(config.uploadsDir)) {
	fs.mkdirSync(config.uploadsDir, { recursive: true })
	console.log('✅ Создана директория uploads для хранения файлов')
}

// Настройка CORS
app.use(cors(config.corsOptions))
app.use(express.json())

// Статическое обслуживание файлов из папки uploads
app.use('/uploads', express.static(config.uploadsDir))

// Регистрация маршрутов API
app.use('/api', apiRoutes)

// Базовый маршрут для проверки API
app.get('/api', (req, res) => {
	res.json({ message: 'API работает на порту ' + config.port })
})

// Обработчик для несуществующих маршрутов
app.use((req: Request, res: Response) => {
	res.status(404).json({ error: 'Запрашиваемый ресурс не найден' })
})

// Подключаем middleware для обработки ошибок
app.use((err: Error, req: Request, res: Response, next: NextFunction) =>
	errorHandler(err, req, res, next)
)

// Экспорт приложения и функция запуска сервера
export const startServer = () => {
	return app.listen(config.port, () => {
		console.log(`Сервер запущен на порту ${config.port}`)
		console.log(`API доступно по адресу: http://localhost:${config.port}/api`)
		console.log(
			`Загруженные файлы доступны по адресу: http://localhost:${config.port}/uploads`
		)
	})
}

// Экспорт Express приложения
export default app
