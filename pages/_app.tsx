import "../styles/globals.sass"
import type { AppProps /*, AppContext */ } from "next/app"


const MyApp = ({ Component, pageProps }: AppProps) => {
	return <Component {...pageProps} />
}

export default MyApp
