import type { NextApiRequest, NextApiResponse } from 'next'

interface RepositoryData {
	name: string
}

const getRepositoryNames = () =>
	new Promise<string[]>((resolve, reject) => {
		fetch("https://api.github.com/graphql", {
			method: "POST",
			headers: [
				["Authorization", "bearer " + process.env.GITHUB_TOKEN]
			],
			body: JSON.stringify({
				query: `
				query GetRepos {
					user(login: "birusq") {
						repositories(privacy: PUBLIC, last: 100) {
							nodes {
								name
							}
						}
					}
				}`
			})
		}).then(res => {
			return res.json()
		}).then(json => {
			if (!json.data) {
				reject("Invalid repository request")
			}
			else {
				const repositories: string[] = json.data.user.repositories.nodes
					.map((node: RepositoryData) => node.name)

				resolve(repositories)
			}
		}).catch(err => {
			reject(err)
		})
	})

interface ReleaseData {
	name: string,
	descriptionHTML: string,
	tagName: string,
	publishedAt: Date,
	url: string
}

const toReleaseData = (node: any): ReleaseData => {
	return {
		...node,
		publishedAt: Date.parse(node.publishedAt)
	}
}


const getReleases = (repoName: string) =>
	new Promise<ReleaseData[]>((resolve, reject) => {
		fetch("https://api.github.com/graphql", {
			method: "POST",
			headers: [
				["Authorization", "bearer " + process.env.GITHUB_TOKEN]
			],
			body: JSON.stringify({
				query: `
				query GetReleases($name: String!) {
					repository(owner: "birusq", name: $name) {
						releases(last: 100) {
							nodes {
								name
								descriptionHTML
								tagName
								publishedAt
								url
							}
						}
					}
				}`,
				variables: {
					name: repoName
				}
			})
		}).then(res => {
			return res.json()
		}).then(json => {
			if (!json.data) {
				reject("Invalid repository request")
			}
			else {
				resolve(json.data.repository.releases.nodes.map((node: any) => toReleaseData(node)))
			}
		}).catch(err => {
			reject(err)
		})
	})


export default async (_req: NextApiRequest, res: NextApiResponse) => {
	try {
		if (!process.env.GITHUB_TOKEN) {
			throw new Error("GITHUB_TOKEN env variable not set")
		}

		const repositories = await getRepositoryNames()

		const releases = await Promise.all(repositories.map(r => getReleases(r)))

		let releasesMap: Record<string, ReleaseData[]> = {}
		for (let i = 0; i < releases.length; i++) {
			releasesMap = { ...releasesMap, [repositories[i]]: releases[i] }
		}

		res.status(200).json(releasesMap)
	}
	catch (err) {
		console.error(err)
		res.status(500).send("Internal error");
	}
}
