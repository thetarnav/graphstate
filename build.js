import fs        from "fs"
import path      from "path"
import ts        from "typescript"
import * as odin from "./odin_build.js"
import * as sdk  from "./sdk.js"

const filename     = new URL(import.meta.url).pathname
const dirname      = path.dirname(filename)
const sdk_js_path  = path.join(dirname, "sdk.js")
const sdk_dts_path = path.join(dirname, "sdk.d.ts")
const sdk_map_path = path.join(dirname, "sdk.d.ts.map")

/** @type {ts.CompilerOptions} */
const ts_options = {
	allowJs             : true,
	checkJs             : true,
	skipLibCheck        : false,
	maxNodeModuleJsDepth: 1,
	emitDeclarationOnly : true,
	noEmit              : false,
	noEmitOnError       : false,
	declaration         : true,
	declarationMap	    : true,
}

/** @type {odin.Options} */
const vet_options = {
	vet: ["unused", "shadowing", "style", "semicolon"]
}

/** @type {odin.Options} */
const release_options = {
	...vet_options,
	o: "aggressive",
	no_thread_local: true,
	no_bounds_check: true,
	disable_assert: true,
	obfuscate_source_code_locations: true
}

const buildType = process.argv[2]

let code = 0

switch (buildType) {
case "cli": {
	code = await odin.build("src", {
		...vet_options,
		out: "graphstate",
	})
	break
}
case "wasm": {
	code = await odin.build("src", {
		...vet_options,
		out: "graphstate.wasm",
		target: "freestanding_wasm32"
	})
	break
}
default:
case "release": {
	const binary_build = odin.build("src", {
		...release_options,
		out: "graphstate",
		microarch: "native"
	})
	const wasm_build   = odin.build("src", {
		...release_options,
		out: "graphstate.wasm",
		target: "freestanding_wasm32"
	})

	/* DTS */
	// Remove old .d.ts files
	if (fs.existsSync(sdk_dts_path)) fs.unlinkSync(sdk_dts_path)
	if (fs.existsSync(sdk_map_path)) fs.unlinkSync(sdk_map_path)
	
	// Emit d.ts files
	const ts_program = ts.createProgram([sdk_js_path], ts_options)
	ts_program.emit()

	const [binary_code, wasm_code] = await Promise.all([binary_build, wasm_build])
	code = binary_code || wasm_code

	break
}
case "debug": {
	code = await odin.build("src", {
		...vet_options,
		out: "graphstate",
		debug: true
	})
	break
}
case "client": {
	const schema_test = fs.readFileSync("schema_test.graphql", "utf8")
	const queries = sdk.cli_generate_queries(schema_test)
	if (queries instanceof Error) {
		console.log(queries.message)
		process.exit(1)
	}

	fs.writeFileSync('_client.js', queries)
	break
}
}

process.exit(code)