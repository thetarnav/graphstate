/** @typedef {string     } String */
/** @typedef {string & {}} ID */
/** @typedef {number     } Int */
/** @typedef {number     } Float */
/** @typedef {boolean    } Boolean */

/**
 * @template T
 * @typedef {T | null} Maybe
 */

/**
 * @template TVars
 * @callback Query_Get_Body
 * @param   {TVars} vars
 * @returns {string}
 */

/**
 * @template TVars
 * @template TValue
 * @typedef  {object               } Query_Data
 * @property {string               } name
 * @property {Query_Get_Body<TVars>} get_body
 * @property {TValue | undefined   } initial_value
 * @property {TVars                } _type_vars
 * @property {TValue               } _type_value
 */

/**
 * @typedef  {Object} Query_Location
 * @property {Int} column
 * @property {Int} line
 */

class Query_Error extends Error {
	/**
	 * @param {string          } message
	 * @param {Query_Location[]} locations
	 */
	constructor(message, locations) {
		super(message)
		this.locations = locations
	}
}
class Fetch_Error extends Error {
	/**
	 * @param {string} message
	 */
	constructor(message) {super(message)}
}

/**
 * @typedef  {object} Raw_Request_Result
 * @property {any   } data
 * @property {(Query_Error | Fetch_Error)[]} errors
 */

/** @typedef {RequestInit} Request_Init */

/**
 * @param   {Request_Init       } request_init `RequestInit` object to modify
 * @param   {string             } query        GraphQL query string
 * @returns {void} */
export function request_init_init(request_init, query) {
	request_init.method  ??= "POST"
	request_init.headers ??= {"Content-Type": "application/json"}
	request_init.body      = '{"query":'+JSON.stringify(query)+'}'
}

/**
 * @param   {string | URL | Request} url
 * @param   {Request_Init          } request_init
 * @returns {Promise<Raw_Request_Result>} */
export async function raw_request(url, request_init) {
	try {
		const res  = await fetch(url, request_init)
		const json = await res.json()

		if (Array.isArray(json.errors)) {
			for (let i = 0; i < json.errors.length; i++) {
				const err = json.errors[i]
				json.errors[i] = new Query_Error(err.message, err.locations)
			}
		}
		return json
	} catch (err) {
		if (err instanceof Error) {
			err = new Fetch_Error(err.message)
		} else if (typeof err === "string") {
			err = new Fetch_Error(err)
		} else {
			err = new Fetch_Error("Unknown error")
		}
		return {data: null, errors: [/** @type {*} */(err)]}
	}
}
