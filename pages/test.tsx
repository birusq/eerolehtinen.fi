import getRandNum from "../utils/rand-num-api"
import { GetStaticProps, InferGetStaticPropsType } from "next"

const Test = ({ num }: InferGetStaticPropsType<typeof getStaticProps>) => {
	return (
		<p>
			{num}
		</p>
	)
}

export const getStaticProps: GetStaticProps = async () => {
	const num = await getRandNum()

	console.log(num)

	return {
		props: {
			num,
		},
		revalidate: 1,
	}
}

export default Test