import { Router } from 'express'
import { getDiskSpaceInfo } from '../controllers/disk.controller.js'
import { asyncHandler } from '../middleware/error.middleware.js'

const diskRouter = Router()

// Маршруты для работы с дисковым пространством
diskRouter.get('/', asyncHandler(getDiskSpaceInfo))

export default diskRouter
