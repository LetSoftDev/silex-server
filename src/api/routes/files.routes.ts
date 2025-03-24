import { Router } from 'express'
import {
	getFiles,
	deleteItem,
	renameItem,
} from '../controllers/file.controller.js'
import { asyncHandler } from '../middleware/error.middleware.js'
import { validateRequest } from '../middleware/validation.middleware.js'
import {
	getFilesSchema,
	deleteItemSchema,
	renameItemSchema,
} from '../validators/file.validator.js'

const filesRouter = Router()

// Маршруты для работы с файлами
filesRouter.get('/', validateRequest(getFilesSchema), asyncHandler(getFiles))
filesRouter.delete(
	'/:id',
	validateRequest(deleteItemSchema),
	asyncHandler(deleteItem)
)
filesRouter.put(
	'/:id',
	validateRequest(renameItemSchema),
	asyncHandler(renameItem)
)

export default filesRouter
