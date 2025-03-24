// Переменные окружения загружаются в config/config.ts
// Импортируем и запускаем сервер
try {
	console.log('Запуск сервера...')
	import('./server.js')
		.then(({ startServer }) => {
			console.log('Модуль server.js успешно импортирован')
			startServer()
		})
		.catch(error => {
			console.error('Ошибка при импорте сервера:', error)
		})
} catch (error) {
	console.error('Ошибка при запуске:', error)
}
