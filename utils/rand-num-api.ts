const getRandNum = async () => {
	const res = await fetch("https://www.random.org/integers/" +
		"?num=1&min=1&max=1000000&col=1&base=10&format=plain&rnd=new")

	const text = await res.text()
	return parseInt(text)
}

export default getRandNum
