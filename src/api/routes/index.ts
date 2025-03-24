import { Router } from 'express'
import filesRouter from './files.routes.js'
import directoriesRouter from './directories.routes.js'
import uploadsRouter from './uploads.routes.js'
import diskRouter from './disk.routes.js'

const router = Router()

// Группируем маршруты по функциональности
router.use('/files', filesRouter)
router.use('/directory', directoriesRouter)
router.use('/upload', uploadsRouter)
router.use('/disk-space', diskRouter)

export default router
