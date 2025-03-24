import { Router } from 'express'
import { uploadFile } from '../controllers/upload.controller.js'
import { uploadSingleFile } from '../middleware/upload.middleware.js'
import { asyncHandler } from '../middleware/error.middleware.js'
import { validateRequest } from '../middleware/validation.middleware.js'
import { uploadFileSchema } from '../validators/file.validator.js'

const uploadsRouter = Router()

// Маршруты для загрузки файлов
uploadsRouter.post(
	'/',
	validateRequest(uploadFileSchema),
	uploadSingleFile,
	asyncHandler(uploadFile)
)

export default uploadsRouter
