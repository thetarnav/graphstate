/*

Node SDK for Graphstate

For now it's just running the binary in a child process

*/

import child_process from "node:child_process"
import fs            from "node:fs"
import path          from "node:path"

const filename = new URL(import.meta.url).pathname
const dirname  = path.dirname(filename)

export const binary_path = path.join(dirname, "graphstate")

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