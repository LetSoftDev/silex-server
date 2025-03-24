/**
 * Тесты для маршрутов файлов
 */
import express from 'express'
import { describe, it, expect } from 'vitest'
import testConfig from '../config.test'

import {
	getFiles,
	createDirectory,
	deleteItem,
	renameItem,
} from '@/controllers/file.controller'

import { uploadFile } from '@/controllers/upload.controller'
import { getDiskSpaceInfo } from '@/controllers/disk.controller'

describe('File Routes Tests', () => {
	let router: express.Router

	beforeEach(() => {
		router = express.Router()

		// Настраиваем маршруты
		router.get('/', getFiles)
		router.get('/disk', getDiskSpaceInfo)
		router.post('/directory', createDirectory)
		router.post('/upload', uploadFile)
		router.delete('/:id', deleteItem)
		router.put('/rename/:id', renameItem)
	})

	it('должен содержать все необходимые маршруты', () => {
		const routes = router.stack.map((layer: any) => {
			return {
				path: layer.route?.path || '',
				method: layer.route?.stack[0]?.method || '',
			}
		})

		// Проверка наличия всех маршрутов
		expect(routes).toContainEqual({ path: '/', method: 'get' })
		expect(routes).toContainEqual({ path: '/disk', method: 'get' })
		expect(routes).toContainEqual({ path: '/directory', method: 'post' })
		expect(routes).toContainEqual({ path: '/upload', method: 'post' })
		expect(routes).toContainEqual({ path: '/:id', method: 'delete' })
		expect(routes).toContainEqual({ path: '/rename/:id', method: 'put' })
	})
})

// Экспортируем функцию для создания маршрутов
export default express
	.Router()
	.get('/', getFiles)
	.get('/disk', getDiskSpaceInfo)
	.post('/directory', createDirectory)
	.post('/upload', uploadFile)
	.delete('/:id', deleteItem)
	.put('/rename/:id', renameItem)
