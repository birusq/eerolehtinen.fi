import getRandNum from '../utils/rand-num-api'

const Test = ({ num }: { num: number }) => {
	return (
		<p>
			{num}
		</p>
	)
}

export async function getStaticProps() {
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