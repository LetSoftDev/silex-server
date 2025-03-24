/**
 * Класс для пользовательских ошибок API
 */
export class ApiError extends Error {
	statusCode: number
	messages?: Array<{ field: string; message: string }>

	constructor(
		message: string,
		statusCode: number = 500,
		messages?: Array<{ field: string; message: string }>
	) {
		super(message)
		this.name = 'ApiError'
		this.statusCode = statusCode
		this.messages = messages
	}
}
