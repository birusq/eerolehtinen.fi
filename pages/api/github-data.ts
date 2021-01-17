import type { NextApiRequest, NextApiResponse } from "next"
import getRepositories from "../../utils/github-api"

export default async (_req: NextApiRequest, res: NextApiResponse) => {
	try {
		const data = await getRepositories()

		res.status(200).json(data)
	}
	catch (err) {
		console.error(err)
		res.status(500).send("Internal error")
	}
}
