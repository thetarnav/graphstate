/*

Node SDK for Graphstate

Either runs the binary in a child process.
Or loads the wasm module and calls it directly.

*/

import child_process from "node:child_process"
import fs            from "node:fs"
import path          from "node:path"


const filename = new URL(import.meta.url).pathname
const dirname  = path.dirname(filename)

export const wasm_path   = path.join(dirname, "graphstate.wasm")
export const binary_path = path.join(dirname, "graphstate")

const WASM_NOT_FOUND_MESSAGE   = "WASM module not found. Please build it first. ("+wasm_path+")"
const BINARY_NOT_FOUND_MESSAGE = "Graphstate binary not found. Please build it first. ("+binary_path+")"

/**
 * Generate functions for building queries from a graphql schema.
 * 
 * @param   {string | NodeJS.ArrayBufferView} schema
 * @returns {Buffer | Error} */
export function cli_generate_queries(schema) {
	if (!fs.existsSync(binary_path)) {
		return new Error(BINARY_NOT_FOUND_MESSAGE)
	}

	try {
		return child_process.execSync(binary_path, {input: schema})
	} catch (error) {
		return /** @type {*} */(error)
	}
}

/**
 * @typedef  {Object} Wasm_Exports
 * @property {WebAssembly.Memory} memory
 * @property {() => void} start
 */

/**
 * @enum {(typeof Out_Kind)[keyof typeof Out_Kind]} */
export const Out_Kind = /** @type {const} */({
	Output: 0,
	Error:  1,
})

/**
 * @typedef  {object   } Wasm_Props
 * @property {Get_Input} get_input
 * @property {On_Output} on_output
 * @property {On_Error } on_error
 * 
 * @callback Get_Input
 * @returns {string}
 * 
 * @callback On_Output
 * @param {string} output
 * @returns {void}
 * 
 * @callback On_Error
 * @param {string} error
 * @returns {void}
 */

/**
 * @param   {BufferSource         } wasm_source
 * @param   {Wasm_Props           } props
 * @returns {Promise<Wasm_Exports>} */
export async function wasm_init_unsafe(wasm_source, props) {
	const wasm = await WebAssembly.instantiate(wasm_source, {
		env: {
			/**
			 * @param   {Out_Kind} out_kind
			 * @param   {number  } ptr
			 * @param   {number  } len
			 * @returns {void    } */
			out_write(out_kind, ptr, len) {
				const bytes = new Uint8Array(exports.memory.buffer, ptr, len)
				const str   = new TextDecoder().decode(bytes)
				switch (out_kind) {
				case Out_Kind.Output: props.on_output(str) ;break
				case Out_Kind.Error:  props.on_error(str)  ;break
				}
			},
			/**
			 * @param   {number} ptr 
			 * @param   {number} len 
			 * @returns {number} read length */
			in_read(ptr, len) {
				const bytes = new Uint8Array(exports.memory.buffer, ptr, len)
				const res   = new TextEncoder().encodeInto(props.get_input(), bytes)
				return res.written
			}
		}
	})
	const exports = /** @type {Wasm_Exports} */ (wasm.instance.exports)
	return exports
}

/**
 * @param   {BufferSource                 } wasm_source
 * @param   {Wasm_Props                   } props
 * @returns {Promise<Wasm_Exports | Error>} */
export async function wasm_init(wasm_source, props) {
	if (!fs.existsSync) {
		return new Error(WASM_NOT_FOUND_MESSAGE)
	}

	try {
		return await wasm_init_unsafe(wasm_source, props)
	} catch (error) {
		return /** @type {*} */(error)
	}
}

/** @returns {Promise<Buffer>} */
export function wasm_read_source() {
	return fs.promises.readFile(wasm_path)
}

/**
 * One-Time generates gql queries with a wasm module.
 * @param   {string                 } schema 
 * @returns {Promise<string | Error>} queries file */
export async function wasm_generate_queries(schema) {
	let output = ""
	/** @type {Error | undefined} */
	let error

	const source  = await wasm_read_source()
	const exports = await wasm_init_unsafe(source, {
		get_input: () => schema,
		on_output: (str) => output = str,
		on_error : (str) => error = new Error(str),
	})

	exports.start()

	if (error) return error
	return output
}