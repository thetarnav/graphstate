package graphstate

import "core:strings"
import gql "../graphql_parser"

write :: strings.write_string

runtime := #load("./runtime.js", string)

@(require_results)
program :: proc(input: string) -> (output: []u8, err: gql.Schema_Error) {
	schema: gql.Schema
	gql.schema_init(&schema) or_return
	gql.schema_parse(&schema, input) or_return

	// gql.schema_topological_sort(&schema)
	
	b: strings.Builder
	strings.builder_init_len_cap(&b, 0, len(runtime) + len(input) * 20) or_return
	write(&b, runtime)

	/*
	Types typedef jsdoc
	*/
	write(&b, "\n/*\n\n")
	write(&b, "TYPES:\n\n")
	write(&b, "*/\n")

	types_done := make([]bool, len(schema.types)) or_return
	#unroll for i in 0..<gql.USER_TYPES_START {
		types_done[i] = true
	}

	for i in gql.USER_TYPES_START..<len(schema.types) {

		if i == schema.query || i == schema.mutation || i == schema.subscription {
			continue
		}

		// topological sorting
		for j in schema.types[i].interfaces {
			write_typedef(&b, types_done, schema, j)
		}
		for f in schema.types[i].fields {
			for a in f.args {
				write_typedef(&b, types_done, schema, a.value.index)
			}
			write_typedef(&b, types_done, schema, f.value.index)
		}
		for m in schema.types[i].members {
			write_typedef(&b, types_done, schema, m)
		}

		write_typedef(&b, types_done, schema, i)
	}

	/*
	Queries
	*/
	if schema.query == 0 {
		panic("Query type not found")
	}

	write(&b, "\n/*\n\n")
	write(&b, "QUERIES:\n\n")
	write(&b, "*/\n")

	queries_type := schema.types[schema.query]
	for query in queries_type.fields {
		write_query_data(&b, schema, query, "query")
	}

	/*
	Mutations
	*/
	if schema.mutation != 0 {
		write(&b, "\n/*\n\n")
		write(&b, "MUTATIONS:\n\n")
		write(&b, "*/\n")

		mutations_type := schema.types[schema.mutation]
		for mutation in mutations_type.fields {
			write_query_data(&b, schema, mutation, "mutation")
		}
	}

	return b.buf[:], err
}

write_typedef :: proc(b: ^strings.Builder, types_done: []bool, schema: gql.Schema, idx: int) {
	if types_done[idx] do return
	types_done[idx] = true

	type := schema.types[idx]

	switch type.kind {
	case .Object, .Interface, .Input_Object:
		if len(type.fields) == 0 {
			panic("Object type has no fields")
		}

		write(b, "\n/**\n * Initial value: {@link initial_")
		write(b, type.name)
		write(b, "}\n *\n")
		write(b, " * @typedef  {object} ")
		write(b, type.name)
		write(b, "\n")
		for field in type.fields {
			write(b, " * @property {")
			write_type_value(b, schema, field.value)
			write(b, "} ")
			write(b, field.name)
			write(b, "\n")
		}
		write(b, " */\n")

		// Initial value
		write(b, "/** @type {")
		write(b, type.name)
		write(b, "} */\n")
		write(b, "export const initial_")
		write(b, type.name)
		write(b, " = {\n")

		for field, i in type.fields {
			write(b, "\t")
			write(b, field.name)
			write(b, ": ")
			write_initial_value(b, schema, field.value)
			write(b, ",\n")
		}

		write(b, "}\n")
	case .Union:
		if len(type.members) == 0 {
			panic("Union type has no members")
		}

		// Type
		write(b, "\n/**\n * @typedef  {")
		for member, i in type.members {
			member_type := schema.types[member]
			write(b, member_type.name)
			if i < len(type.members)-1 {
				write(b, "|")
			}
		}
		write(b, "} ")
		write(b, type.name)
	case .Enum:
		if len(type.enum_values) == 0 {
			panic("Enum type has no values")
		}

		// Type
		write(b, "\n/**\n * @enum {(typeof ")
		write(b, type.name)
		write(b, ")[keyof typeof ")
		write(b, type.name)
		write(b, "]} */\n")
		write(b, "export const ")
		write(b, type.name)
		write(b, " = /** @type {const} */({\n")
		for item, i in type.enum_values {
			write(b, "\t")
			write(b, item)
			write(b, ": \"")
			write(b, item)
			write(b, "\"")
			write(b, ",\n")
		}
		write(b, "})\n")
	case .Scalar, .Unknown:
		return
	}
}

write_query_data :: proc(b: ^strings.Builder, schema: gql.Schema, field: gql.Field, operation_type: string) {
	{ // typedefs
		write(b, "\n\n/**\n * @typedef  {object} Vars_")
		write(b, field.name)
		write(b, "\n")
		for arg in field.args {
			write(b, " * @property {")
			write_type_value(b, schema, arg.value)
			write(b, "} ")
			write(b, arg.name)
			write(b, "\n")
		}
		write(b, " *\n * @typedef  {")
		write_type_value(b, schema, field.value)
		write(b, "} Value_")
		write(b, field.name)
		write(b, "\n */\n\n")
	}

	{ // query_get_body function
		write(b, "/**\n * @param   {Vars_")
		write(b, field.name)
		write(b, "} vars\n")
		write(b, " * @returns {string} */\n")
		write(b, "export function query_get_body_")
		write(b, field.name)
		write(b, "(vars) {\n")
		write(b, "\treturn '")
		write(b, field.name)

		if len(field.args) > 0 {
			write(b, "(")
			for arg, i in field.args {
				write(b, arg.name)
				write(b, ":'+JSON.stringify(vars.")
				write(b, arg.name)
				write(b, ")+'")
				if i < len(field.args)-1 {
					write(b, " ")
				}
			}
			write(b, ")")
		}

		write_type_fields(b, schema, field.value)

		write(b, "'\n}\n\n")
	}

	{ // query_data
		write(b, "/**\n * ")
		write(b, operation_type)
		write(b, ": `")
		write(b, field.name)
		write(b, "`\\\n * vars : {@link Vars_")
		write(b, field.name)
		write(b, " }\\\n * value: {@link Value_")
		write(b, field.name)
		write(b, "}\n * @type  {Query_Data<Vars_")
		write(b, field.name)
		write(b, ", Value_")
		write(b, field.name)
		write(b, ">}\n */\nexport const ")
		write(b, operation_type)
		write(b, "_")
		write(b, field.name)
		write(b, " = /** @type {*} */({\n")
		write(b, "\tname         : \"")
		write(b, field.name)
		write(b, "\",\n")
		write(b, "\tkind         : \"")
		write(b, operation_type)
		write(b, "\",\n")
		write(b, "\tget_body     : query_get_body_")
		write(b, field.name)
		write(b, ",\n")
		write(b, "\tinitial_value: ")
		write_initial_value(b, schema, field.value)
		write(b, ",\n})\n")
	}
}

write_type_fields :: proc(b: ^strings.Builder, schema: gql.Schema, value: gql.Type_Value) -> (is_obj: bool) {
	type := schema.types[value.index]
	if (type.kind != .Object) do return false

	write(b, "{")
	for field, i in type.fields {
		write(b, field.name)
		if !write_type_fields(b, schema, field.value) && i < len(type.fields)-1 {
			write(b, " ")
		}
	}
	write(b, "}")

	return true
}

write_initial_value :: proc(b: ^strings.Builder, schema: gql.Schema, value: gql.Type_Value) {
	if gql.type_value_is_non_null(value) {
		if value.lists > 0 {
			write(b, "[]")
		} else {
			type := schema.types[value.index]
			write_initial_type(b, schema, type)
		}
	} else {
		write(b, "null")
	}
}

write_initial_type :: proc(b: ^strings.Builder, schema: gql.Schema, type: gql.Type) {
	switch type.kind {
	case .Enum:
		write(b, type.name)
		write(b, ".")
		write(b, type.enum_values[0])
	case .Union:
		write_initial_type(b, schema, schema.types[type.members[0]])
	case .Object, .Input_Object, .Interface:
		write(b, "initial_")
		write(b, type.name)
	case .Scalar, .Unknown:
		switch type.name {
		case "String", "ID":
			write(b, "\"\"")
		case "Int", "Float":
			write(b, "0")
		case "Boolean":
			write(b, "false")
		case:
			write(b, "null")
		}
	}
}

/*
  String    -> Maybe<String>
  String!   -> String
 [String]   -> Maybe<Array<Maybe<String>>>
 [String!]  -> Maybe<Array<String>>
 [String!]! -> Array<String>
 [String]!  -> Array<Maybe<String>>
[[String]]  -> Maybe<Array<Maybe<Array<Maybe<String>>>>>
*/
write_type_value :: proc(b: ^strings.Builder, schema: gql.Schema, value: gql.Type_Value) {
	type := schema.types[value.index]

	to_close := 0
	for i in 0..<value.lists {
		if gql.type_value_is_list_non_null(value, i) {
			write(b, "Array<")
			to_close += 1
		} else {
			write(b, "Maybe<Array<")
			to_close += 2
		}
	}

	if gql.type_value_is_non_null(value) {
		write(b, type.name)
	} else {
		write(b, "Maybe<")
		write(b, type.name)
		write(b, ">")
	}

	for _ in 0..<to_close {
		write(b, ">")
	}
}

