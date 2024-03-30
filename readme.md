# graphstate

A reactive GraphQL client generator.

Work in progress.

Example usage:

```js
import * as graphstate from "graphstate/sdk.js"


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
```

Initial values for types:

```gql
# Type            | Initial value
String            # null
String!           # ""
Int!              # 0
Float!            # 0
Boolean!          # false
ID!               # "" ?????
[String!]!        # []

type Link {       # {
  title: String!  #   title: "",
  url:   String!  #   url:   "",
}                 # }

enum LinkState {  # "None" (always the first member)
  None
  Bookmark
  InProgress
  Completed
}

union LinkUnion = LinkState | Link

LinkUnion         # null
LinkUnion!        # "None" (LinkState is the first member of the union)
```