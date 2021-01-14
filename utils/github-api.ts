type RepoRelease = {
	name: string,
	descriptionHTML: string,
	tagName: string,
	publishedAt: Date,
	url: string
}

type RepoCommit = {
	commitUrl: string,
	committedDate: Date,
	messageHeadLine: string,
	messageBody: string
}

type Repository = {
	name: string,
	url: string
	createdAt: Date,
	updatedAt: Date,
	releases: RepoRelease[]
	commits: RepoCommit[]
}

const toRepository = (node: any): Repository => {
	return {
		name: node.name,
		url: node.url,
		createdAt: new Date(node.createdAt),
		updatedAt: new Date(node.updatedAt),
		releases: node.releases.nodes.map((relNode: any) => toRepoRelease(relNode)),
		commits: node.defaultBranchRef.target.history.nodes.map((relNode: any) => toRepoCommit(relNode))
	}
}

const toRepoRelease = (node: any): RepoRelease => {
	return {
		name: node.name,
		descriptionHTML: node.descriptionHTML,
		tagName: node.tagName,
		url: node.url,
		publishedAt: new Date(node.publishedAt)
	}
}

const toRepoCommit = (node: any): RepoCommit => {
	return {
		commitUrl: node.commitUrl,
		messageHeadLine: node.messageHeadLine,
		messageBody: node.messageBody,
		committedDate: new Date(node.committedDate)
	}
}

const QUERY_COMMITS_FRAGMENT = `
	defaultBranchRef {
		name
		target {
			... on Commit {
				history(first: 100, after: $after) {
					nodes {
						commitUrl
						committedDate
						messageHeadline
						messageBody
					}
					pageInfo {
						hasNextPage
						endCursor
					}
				}
			}
		}
	}`

const QUERY_REPOSITORIES = `
	query GetRepositories($after: String) {
		user(login: "birusq") {
			repositories(privacy: PUBLIC, first: 100) {
				nodes {
					name
					url
					updatedAt
					createdAt
					releases(first: 100) {
						nodes {
							name
							descriptionHTML
							tagName
							publishedAt
							url
						}
					}
					${QUERY_COMMITS_FRAGMENT}
				}
			}
		}
	}`

const QUERY_MORE_COMMITS = `
	query GetCommits($repoName: String!, $after: String!) {
		repository(owner: "birusq", name: $repoName) {
			${QUERY_COMMITS_FRAGMENT}
		}
	}`

const fetchGithubJson = async (query: string) => {
	if (!process.env.GITHUB_TOKEN) {
		throw new Error("GITHUB_TOKEN env variable not set")
	}

	const res = await fetch("https://api.github.com/graphql", {
		method: "POST",
		headers: [["Authorization", "bearer " + process.env.GITHUB_TOKEN]],
		body: query
	})

	const json = await res.json()
	if (!json.data) {
		console.error(json)
		throw new Error("Invalid repository request")
	}
	return json
}

const createQueryMoreCommits = (repoName: string, after: string) =>
	JSON.stringify({
		query: QUERY_MORE_COMMITS,
		variables: { repoName, after }
	})

const createQueryRepositories = () => JSON.stringify({ query: QUERY_REPOSITORIES })

const getFullCommitHistory = async (repoNode: any) => {
	let commitHistory = repoNode.defaultBranchRef.target.history
	while (commitHistory.pageInfo.hasNextPage) {
		const json = await fetchGithubJson(createQueryMoreCommits(repoNode.name, commitHistory.pageInfo.endCursor))

		const newCommitHistory = json.data.repository.defaultBranchRef.target.history
		commitHistory = {
			nodes: [...commitHistory.nodes, ...newCommitHistory.nodes],
			pageInfo: newCommitHistory.pageInfo
		}
	}
	return commitHistory
}

const getRepositoriesInfo = async () => {

	const json = await fetchGithubJson(createQueryRepositories())
	const histories = await Promise.all(json.data.user.repositories.nodes.map((repoNode: any) => getFullCommitHistory(repoNode)))
	histories.forEach((history, i) => {
		json.data.user.repositories.nodes[i].defaultBranchRef.target.history = history
	})

	return json.data.user.repositories.nodes.map((repoNode: any) => toRepository(repoNode))
}

const getRepositories = async () => {
	const repos = await getRepositoriesInfo()
	return repos
}

export default getRepositories