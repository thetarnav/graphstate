import * as graphstate from "./sdk.js"


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

async function main() {
	const out = await graphstate.wasm_generate_queries(_test_schema)
	if (out instanceof Error) {
		console.error(out)
		return
	}
	console.log(out)
}


main()