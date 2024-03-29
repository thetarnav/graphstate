import * as t      from "node:test"
import * as assert from "node:assert/strict"
import * as gql    from "./_client.js" // Generated

t.test("query_get_body", () => {
	const query_foo = gql.query_get_body_foo({})
	assert.equal(query_foo, "query{foo}")

	const query_bat = gql.query_get_body_bar({a: 1, b: 2.3})
	assert.equal(query_bat, "query{bar(a:1 b:2.3)}")

	const query_person = gql.query_get_body_person({id: "123"})
	assert.equal(query_person, "query{person(id:\"123\"){id name age}}")
})