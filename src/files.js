import { readdirSync, statSync } from 'fs'
import mime from 'mime-types'

export async function getEpisodePath({ show, season, episode }) {
	const seasons = readSeasonsDir(show)
	const seasonName = seasons[season - 1]

	if (!seasonName) {
		throw new Error(`season not found: season ${season}`)
	}

	const seasonPath = `${process.env.SERIES_VOLUME}/${show}/${seasonName}`

	const episodes = readEpisodesDir(seasonPath)
	const episodeName = episodes[episode - 1]

	if (!episodeName) {
		throw new Error(`episode not found: episode ${episode}`)
	}

	return `${seasonPath}/${episodeName}`
}

function readSeasonsDir(show) {
	const season = readdirSync(`${process.env.SERIES_VOLUME}/${show}`)
	return season.filter(season => {
		const stats = statSync(`${process.env.SERIES_VOLUME}/${show}/${season}`)
		return stats.isDirectory()
	}).sort((left, right) => {
		const r = /\d+/
		const leftNum = Number(left.match(r))
		const rightNum = Number(right.match(r))

		return leftNum - rightNum
	})
}

function readEpisodesDir(seasonPath) {
	const episodes = readdirSync(seasonPath)
	return episodes.filter(episode => {
		const type = mime.lookup(`${seasonPath}/${episode}`)
		if (!type) {
			return false
		}

		return type.includes('video')
	}).sort()
}
