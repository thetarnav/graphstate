/*

Node SDK for Graphstate

For now it's just running the binary in a child process

*/

import child_process from "node:child_process"
import fs            from "node:fs"
import fsp           from "node:fs/promises"
import path          from "node:path"

const filename  = new URL(import.meta.url).pathname
const dirname   = path.dirname(filename)
const root_path = path.join(dirname, "..")

export const wasm_path   = path.join(root_path, "graphstate.wasm")
export const binary_path = path.join(root_path, "graphstate")

const WASM_NOT_FOUND_MESSAGE   = "WASM module not found. Please build it first. ("+wasm_path+")"
const BINARY_NOT_FOUND_MESSAGE = "Graphstate binary not found. Please build it first. ("+binary_path+")"

/**
 * Generate functions for building queries from a graphql schema.
 * 
 * @param   {string | NodeJS.ArrayBufferView} schema
 * @returns {Buffer | Error} */
export function generate_queries(schema) {
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

const _test_schema = `
schema {
	query: Query
}

type Query {
	foo: [String!]!
	bar(a: Int, b: Float): String
	person(id: ID!): Person
}

type Person {
	id: ID!
	name: String!
	age: Int!
}`

/** @returns {Promise<Wasm_Exports>} */
export async function init_wasm_module_unsafe() {
	const wasm_binary = await fsp.readFile(wasm_path)
	const wasm = await WebAssembly.instantiate(wasm_binary, {
		env: {
			/**
			 * @param   {number} ptr 
			 * @param   {number} len 
			 * @returns {void}   */
			out_write(ptr, len) {
				console.log("output", ptr, len)
				const slice = new Uint8Array(exports.memory.buffer, ptr, len)
				const str = new TextDecoder().decode(slice)
				console.log(str)
			},
			/**
			 * @param   {number} ptr 
			 * @param   {number} len 
			 * @returns {void}   */
			err_write(ptr, len) {
				console.error("error", ptr, len)
				const slice = new Uint8Array(exports.memory.buffer, ptr, len)
				const str = new TextDecoder().decode(slice)
				console.error(str)
			},
			/**
			 * @param   {number} ptr 
			 * @param   {number} len 
			 * @returns {number} read length */
			in_write(ptr, len) {
				console.log("input", ptr, len)
				const slice = new Uint8Array(exports.memory.buffer, ptr, len)
				const str = new TextEncoder().encode(_test_schema)
				slice.set(str)
				return str.length
			}
		}
	})
	const exports = /** @type {Wasm_Exports} */ (wasm.instance.exports)
	return exports
}

/** @returns {Promise<Wasm_Exports | Error>} */
export async function init_wasm_module() {
	if (!fs.existsSync) {
		return new Error(WASM_NOT_FOUND_MESSAGE)
	}

	try {
		return await init_wasm_module_unsafe()
	} catch (error) {
		return /** @type {*} */(error)
	}
}