type RepositoryData = {
	name: string
}

type RepoRelease = {
	name: string,
	descriptionHTML: string,
	tagName: string,
	publishedAt: Date,
	url: string
}

type Repository = {
	releases: RepoRelease[]
}

const toRepoRelease = (node: any): RepoRelease => {
	return {
		...node,
		publishedAt: Date.parse(node.publishedAt)
	}
}

const getRepositoryNames = () => {
	if (!process.env.GITHUB_TOKEN) {
		throw new Error("GITHUB_TOKEN env variable not set")
	}
	return new Promise<string[]>((resolve, reject) => {
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
}

const getRepository = (repoName: string) => {
	if (!process.env.GITHUB_TOKEN) {
		throw new Error("GITHUB_TOKEN env variable not set")
	}
	return new Promise<Repository>((resolve, reject) => {
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
				const releases = json.data.repository.releases.nodes.map((node: any) => toRepoRelease(node))
				const repository = { releases } as Repository
				resolve(repository)
			}
		}).catch(err => {
			reject(err)
		})
	})
}

const getRepositoryMap = async () => {
	const repoNames = await getRepositoryNames()

	const repoDatas = await Promise.all(repoNames.map(r => getRepository(r)))

	let repoMap: Record<string, Repository> = {}

	repoNames.forEach((name, i) => {
		repoMap = { ...repoMap, [name]: repoDatas[i] }
	})

	return repoMap
}

export default getRepositoryMap