import fs from 'fs'

const DP_FILE_PATH = `${process.env.SERIES_VOLUME}/db.json`

const cache = loadDb()

function loadDb() {
	if (!fs.existsSync(DP_FILE_PATH)) {
		console.log('no db found, starting fresh')
		return {}
	}

	try {
		console.log('loading db')
		const data = fs.readFileSync(DP_FILE_PATH).toString()
		return JSON.parse(data)
	} catch (e) {
		console.error('error loading db:', e)
		return {}
	}
}

export function getCurrentEpisode(show) {
	const episodeData = cache[show]

	if (!episodeData) {
		return { show, season: 1, episode: 1, time: 0 }
	}

	return { show, ...episodeData }
}

export function getNextEpisode({ show, season, episode }) {
	const nextEpisode = getNextEpisode()
	console.log(`nextEpisode for ${show} is:`, nextEpisode)

	return nextEpisode

	function getNextEpisode() {
		const showSeasons = SHOW_EPISODE_COUNT[show]
		const seasonEpisodes = showSeasons[season - 1] ?? 0

		if (seasonEpisodes <= episode) {
			const isLastSeason = season >= showSeasons.length
			const nextSeason = isLastSeason ? 1 : season + 1
			return { season: nextSeason, episode: 1 }
		}

		return { season, episode: episode + 1 }
	}
}

export function saveEpisode({ show, season, episode, time }) {
	console.log('save episode:', { show, season, episode, time })
	cache[show] = { season, episode, time }

	fs.writeFileSync(DP_FILE_PATH, JSON.stringify(cache), {})
}


const SHOW_EPISODE_COUNT = {
	Office: [6, 18, 23, 14, 26, 24, 24, 24, 23],
	Friends: [24, 24, 25, 24, 24, 25, 24, 24, 24, 18],
	FamilyGuy: [7, 21, 22, 30, 18, 12, 16, 21, 18, 23, 22, 21, 18, 20, 20, 20, 20, 20, 20, 20],
	'Avatar - The last airbender': [20, 20, 21],
}