import { describe, it, expect } from 'vitest'
import { getFileType } from '@/utils/file.utils'

describe('File Utils Tests', () => {
	// Тесты для функции определения типа файла
	describe('getFileType', () => {
		it('должен определять изображения', () => {
			expect(getFileType('image.jpg')).toBe('image')
			expect(getFileType('image.jpeg')).toBe('image')
			expect(getFileType('image.png')).toBe('image')
			expect(getFileType('image.gif')).toBe('image')
			expect(getFileType('image.svg')).toBe('image')
		})

		it('должен определять документы', () => {
			expect(getFileType('document.pdf')).toBe('document')
			expect(getFileType('document.doc')).toBe('document')
			expect(getFileType('document.docx')).toBe('document')
			expect(getFileType('document.xls')).toBe('document')
			expect(getFileType('document.xlsx')).toBe('document')
			expect(getFileType('document.ppt')).toBe('document')
			expect(getFileType('document.pptx')).toBe('document')
			expect(getFileType('document.odt')).toBe('document')
		})

		it('должен определять архивы', () => {
			expect(getFileType('archive.zip')).toBe('archive')
			expect(getFileType('archive.rar')).toBe('archive')
			expect(getFileType('archive.7z')).toBe('archive')
			expect(getFileType('archive.tar')).toBe('archive')
			expect(getFileType('archive.gz')).toBe('archive')
		})

		it('должен определять аудио', () => {
			expect(getFileType('audio.mp3')).toBe('audio')
			expect(getFileType('audio.wav')).toBe('audio')
			expect(getFileType('audio.ogg')).toBe('audio')
			expect(getFileType('audio.flac')).toBe('audio')
		})

		it('должен определять видео', () => {
			expect(getFileType('video.mp4')).toBe('video')
			expect(getFileType('video.avi')).toBe('video')
			expect(getFileType('video.mov')).toBe('video')
			expect(getFileType('video.mkv')).toBe('video')
		})

		it('должен определять код', () => {
			expect(getFileType('code.js')).toBe('code')
			expect(getFileType('code.ts')).toBe('code')
			expect(getFileType('code.html')).toBe('code')
			expect(getFileType('code.css')).toBe('code')
			expect(getFileType('code.json')).toBe('code')
			expect(getFileType('code.php')).toBe('code')
			expect(getFileType('code.py')).toBe('code')
		})

		it('должен возвращать "file" для неизвестных типов', () => {
			expect(getFileType('unknown.xyz')).toBe('file')
			expect(getFileType('unknown')).toBe('file')
			expect(getFileType('')).toBe('file')
		})
	})
})
