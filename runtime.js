/**
 * '"' -> '\\"'
 * @param {string} str
 * @returns {string} */
function escape_quotes(str) {
	return str.replace(escape_quotes_regex, '\\"')
}
const escape_quotes_regex = /"/g

/**
 * @template T
 * @param {string} url 
 * @param {string} query 
 * @returns {Promise<T | Error>} */
async function request(url, query) {
	try {
		const res = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: '{"query":"'+escape_quotes(query)+'"}'
		})
		const json = await res.json()
		if (json.errors) {
			return new Error(json.errors[0].message)
		}
		return json.data
	} catch (err) {
		if (err instanceof Error) {
			return err
		}
		if (typeof err === "string") {
			return new Error(err)
		}
		return new Error("Unknown error")
	}
}

/**
 * @typedef {object} Client
 * @property {string} url
 */

/**
 * @param {Client} client
 * @param {string} topicName 
 */
function publicGetGlobalTopic(client, topicName) {
	return request(client.url, 'query{publicGetGlobalTopic(topicName:"'+escape_quotes(topicName)+'"){name,description,messages{id,content,author{id,name}}}}')
}