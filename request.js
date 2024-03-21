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