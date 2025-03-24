import { Router } from 'express'
import { getDiskSpaceInfo } from '../controllers/disk.controller.js'
import { asyncHandler } from '../middleware/error.middleware.js'
import { validateRequest } from '../middleware/validation.middleware.js'
import { diskSpaceSchema } from '../validators/file.validator.js'

const diskRouter = Router()

// Маршруты для работы с информацией о диске
diskRouter.get(
	'/',
	validateRequest(diskSpaceSchema),
	asyncHandler(getDiskSpaceInfo)
)

export default diskRouter
