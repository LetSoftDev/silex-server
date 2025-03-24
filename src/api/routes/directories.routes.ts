import { Router } from 'express'
import { createDirectory } from '../controllers/file.controller.js'
import { asyncHandler } from '../middleware/error.middleware.js'
import { validateRequest } from '../middleware/validation.middleware.js'
import { createDirectorySchema } from '../validators/file.validator.js'

const directoriesRouter = Router()

// Маршруты для работы с директориями
directoriesRouter.post(
	'/',
	validateRequest(createDirectorySchema),
	asyncHandler(createDirectory)
)

export default directoriesRouter
