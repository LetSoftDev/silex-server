import { Router } from 'express'
import {
	getFiles,
	createDirectory,
	deleteItem,
	renameItem,
} from '../controllers/file.controller.js'
import { uploadFile } from '../controllers/upload.controller.js'
import { getDiskSpaceInfo } from '../controllers/disk.controller.js'
import { uploadSingleFile } from '../middleware/upload.middleware.js'
import { asyncHandler } from '../middleware/error.middleware.js'
import { validateRequest } from '../middleware/validation.middleware.js'
import {
	getFilesSchema,
	createDirectorySchema,
	deleteItemSchema,
	renameItemSchema,
	uploadFileSchema,
	diskSpaceSchema,
} from '../validators/file.validator.js'

const router = Router()

// Маршруты с использованием асинхронного обработчика и валидации для автоматической обработки ошибок
router.get('/files', validateRequest(getFilesSchema), asyncHandler(getFiles))
router.post(
	'/directory',
	validateRequest(createDirectorySchema),
	asyncHandler(createDirectory)
)
router.delete(
	'/delete/:id',
	validateRequest(deleteItemSchema),
	asyncHandler(deleteItem)
)
router.put(
	'/rename/:id',
	validateRequest(renameItemSchema),
	asyncHandler(renameItem)
)
router.post(
	'/upload',
	validateRequest(uploadFileSchema),
	uploadSingleFile,
	asyncHandler(uploadFile)
)
router.get(
	'/disk-space',
	validateRequest(diskSpaceSchema),
	asyncHandler(getDiskSpaceInfo)
)

export default router
