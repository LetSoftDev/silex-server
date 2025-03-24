import { UploadService } from '../../domain/services/upload.service.js'

/**
 * Middleware для загрузки одиночного файла
 */
export const uploadSingleFile = UploadService.getSingleFileUploader()
