import express from 'express'
import { getCurrentEpisode, getNextEpisode, saveEpisode } from './database.js'
import mime from 'mime-types'
import fs from 'fs'
import { getEpisodePath } from './files.js'

console.log('Starting server...')
console.log('series volume', process.env.SERIES_VOLUME)
const port = 3000

const app = express()
app.use(express.json())

app.options('*', (req, res) => {
	res.writeHead(200, {
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type',
	}).end()
})

app.get('/', (req, res) => {
	res.send('Hello World!')
})

app.get('/api/currentEpisode', async function (req, res) {
	const show = req.query.show
	const episode = getCurrentEpisode(show)
	console.log('currentEpisode:', episode)
	successResponse({ res, data: episode })
})

app.put('/api/currentEpisode', async function (req, res) {
	try {
		const payload = req.body
		console.log('save episode:', payload)
		saveEpisode(payload)
		successResponse({ res })
	} catch (e) {
		console.error('failed to save episode:', e)
		res.sendStatus(500).send({ success: false, reason: `failed to save episode, ${e}` })
	}
})

app.get('/api/nextEpisode', async function (req, res) {
	const show = req.query.show
	const season = Number(req.query.season)
	const episode = Number(req.query.episode)

	console.log('nextEpisode, payload:', { show, season, episode })
	const nextEpisode = getNextEpisode({ show, season, episode })

	successResponse({ res, data: nextEpisode })
})

app.get('/api/episode/:show/:season/:episode', async function (req, res) {
	try {
		const range = req.headers.range
		if (!range) {
			res.status(416).send('Requires Range header')
			return
		}

		const { show, season, episode } = req.params
		const seasonNum = Number(season.slice(1))
		const episodeNum = Number(episode.slice(1))

		const videoPath = await getEpisodePath({ show, season: seasonNum, episode: episodeNum })

		console.log(`TEST: ${videoPath}`)
		const size = fs.statSync(videoPath).size
		const CHUNK_SIZE = 2 * (10 ** 6)
		const start = Number(range.replace(/\D/g, ''))
		const end = Math.min(start + CHUNK_SIZE, size - 1)
		const contentLength = end - start + 1

		res.writeHead(206, {
			'Content-Range': `bytes ${start}-${end}/${size}`,
			'Accept-Ranges': 'bytes',
			'Content-Length': contentLength,
			'Content-Type': mime.contentType(videoPath),
			'Access-Control-Allow-Origin': '*',
		})

		const videoStream = fs.createReadStream(videoPath, { start, end })
		videoStream.pipe(res)
	} catch (e) {
		console.error('failed to get episode:', e)
		res.status(500).send({ success: false, reason: `failed to get episode, ${e}` })
	}
})

function successResponse({ res, data }) {
	res.set({
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type',
		'Content-Type': 'Application/json',
	})

	if (data) {
		res.send(data)
	} else {
		res.sendStatus(200)
	}
}

app.listen(port, function () {
	console.log(`Listening on port ${port}...`)
})