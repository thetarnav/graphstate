import * as graphstate from "./src/sdk.js"

async function main() {
	const wasm = await graphstate.init_wasm_module()
	if (wasm instanceof Error) {
		console.error(wasm)
		return
	}

	wasm.start()
}



main()