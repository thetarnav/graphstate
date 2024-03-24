package graphstate

import "core:os"
import "core:fmt"
import "core:mem"
import "core:strings"
import gql "./graphql_parser"

write_string :: strings.write_string

when ODIN_OS == .Windows {
	is_terminal :: proc(fd: os.Handle) -> bool {
		return false
	}
} else {
	foreign import libc "system:c"

	foreign libc {
		@(link_name = "isatty")
		_isatty :: proc(fd: os.Handle) -> b32 ---
	}

	is_terminal :: proc(fd: os.Handle) -> bool {
		return bool(_isatty(fd))
	}
}

runtime := #load("./runtime.js")

main :: proc() {
	if is_terminal(os.stdin) {
		fmt.println("\e[0;36mEnter a GraphQL query or schema:\e[0m")
	}

	buf, alloc_err := make([]byte, mem.Megabyte * 10)
	if alloc_err != nil {
		fmt.panicf("error allocating memory: %v", alloc_err)
	}

	input: string
	input_len, os_err := os.read(os.stdin, buf[:])
	if os_err != os.ERROR_NONE {
		fmt.panicf("error reading input: %d", os_err)
	}

	input = string(buf[:input_len])
	buf = buf[input_len:]

	arena: mem.Arena
	mem.arena_init(&arena, buf)
	context.allocator = mem.arena_allocator(&arena)

	schema: gql.Schema
	alloc_err = gql.schema_init(&schema)
	if alloc_err != nil {
		fmt.panicf("error initializing schema: %v", alloc_err)
	}

	schema_err := gql.schema_parse(&schema, input)
	if schema_err != nil {
		fmt.panicf("Error parsing schema: %v", schema_err)
	}

	os.write(os.stdout, runtime)

	b := strings.builder_make_len_cap(0, 2048)

	/*
	Types typedef jsdoc
	*/
	for type, _i in schema.types[gql.USER_TYPES_START:] {
		i := _i + gql.USER_TYPES_START

		if i == schema.query || i == schema.mutation || i == schema.subscription {
			continue
		}

		switch type.kind {
		case .Object, .Interface, .Input_Object:
			write_string(&b, "\n/**\n * @typedef  {object} ")
			write_string(&b, type.name)
			write_string(&b, "\n")
			for field in type.fields {
				write_string(&b, " * @property {")
				write_type_value(&b, schema, field.value)
				write_string(&b, "} ")
				write_string(&b, field.name)
				write_string(&b, "\n")
			}
			write_string(&b, " */\n")
		case .Union:
			write_string(&b, "\n/**\n * @typedef  {")
			for member, i in type.members {
				member_type := schema.types[member]
				write_string(&b, member_type.name)
				if i < len(type.members)-1 {
					write_string(&b, "|")
				}
			}
			write_string(&b, "} ")
			write_string(&b, type.name)
		case .Enum:
			write_string(&b, "\n/**\n * @enum {(typeof ")
			write_string(&b, type.name)
			write_string(&b, ")[keyof typeof ")
			write_string(&b, type.name)
			write_string(&b, "]} */\n")
			write_string(&b, "export const ")
			write_string(&b, type.name)
			write_string(&b, " = /** @type {const} */({\n")
			for item, i in type.enum_values {
				write_string(&b, "\t")
				write_string(&b, item)
				write_string(&b, ": \"")
				write_string(&b, item)
				write_string(&b, "\"")
				write_string(&b, ",\n")
			}
			write_string(&b, "})\n")
		case .Scalar, .Unknown:
			panic("Unknown type kind")
		}
	}

	/*
	Queries
	*/
	if schema.query == 0 {
		panic("Query type not found")
	}

	write_string(&b, "\n/*\n\n")
	write_string(&b, "QUERIES:\n\n")
	write_string(&b, "*/\n")

	queries_type := schema.types[schema.query]
	for query in queries_type.fields {
		write_query_data(&b, schema, query, "query")
	}

	/*
	Mutations
	*/
	if schema.mutation != 0 {
		write_string(&b, "\n/*\n\n")
		write_string(&b, "MUTATIONS:\n\n")
		write_string(&b, "*/\n")

		mutations_type := schema.types[schema.mutation]
		for mutation in mutations_type.fields {
			write_query_data(&b, schema, mutation, "mutation")
		}
	}

	str := strings.to_string(b)
	os.write(os.stdout, transmute([]byte)str)
}

write_query_data :: proc(b: ^strings.Builder, schema: gql.Schema, field: gql.Field, operation_type: string) {
	{ // typedefs
		write_string(b, "\n\n/**\n * @typedef  {object} Vars_")
		write_string(b, field.name)
		write_string(b, "\n")
		for arg in field.args {
			write_string(b, " * @property {")
			write_type_value(b, schema, arg.value)
			write_string(b, "} ")
			write_string(b, arg.name)
			write_string(b, "\n")
		}
		write_string(b, " *\n * @typedef  {")
		write_type_value(b, schema, field.value)
		write_string(b, "} Value_")
		write_string(b, field.name)
		write_string(b, "\n */\n\n")
	}

	{ // query_get_body function
		write_string(b, "/**\n * @param   {Vars_")
		write_string(b, field.name)
		write_string(b, "} vars\n")
		write_string(b, " * @returns {string} */\n")
		write_string(b, "export function query_get_body_")
		write_string(b, field.name)
		write_string(b, "(vars) {\n")
		write_string(b, "\treturn '")
		write_string(b, operation_type)
		write_string(b, "{")
		write_string(b, field.name)

		if len(field.args) > 0 {
			write_string(b, "(")
			for arg, i in field.args {
				write_string(b, arg.name)
				write_string(b, ":'+JSON.stringify(vars.")
				write_string(b, arg.name)
				write_string(b, ")+'")
				if i < len(field.args)-1 {
					write_string(b, " ")
				}
			}
			write_string(b, ")")
		}

		write_type_fields(b, schema, field.value)

		write_string(b, "}'\n}\n\n")
	}

	{ // query_data
		write_string(b, "/**\n * ")
		write_string(b, operation_type)
		write_string(b, ": `")
		write_string(b, field.name)
		write_string(b, "`\\\n * vars : {@link Vars_")
		write_string(b, field.name)
		write_string(b, " }\\\n * value: {@link Value_")
		write_string(b, field.name)
		write_string(b, "}\n * @type  {Query_Data<Vars_")
		write_string(b, field.name)
		write_string(b, ", Value_")
		write_string(b, field.name)
		write_string(b, ">}\n */\nexport const ")
		write_string(b, operation_type)
		write_string(b, "_")
		write_string(b, field.name)
		write_string(b, " = /** @type {*} */({\n")
		write_string(b, "\tname         : \"")
		write_string(b, field.name)
		write_string(b, "\",\n")
		write_string(b, "\tget_body     : query_get_body_")
		write_string(b, field.name)
		write_string(b, ",\n")
		write_string(b, "\tinitial_value: ")
		if field.value.lists > 0 {
			write_string(b, "[]")
		} else {
			write_string(b, "undefined")
		}
		write_string(b, ",\n})\n")
	}
}

write_type_fields :: proc(b: ^strings.Builder, schema: gql.Schema, value: gql.Type_Value) -> (is_obj: bool) {
	type := schema.types[value.index]
	if (type.kind != .Object) do return false

	write_string(b, "{")
	for field, i in type.fields {
		write_string(b, field.name)
		if !write_type_fields(b, schema, field.value) && i < len(type.fields)-1 {
			write_string(b, " ")
		}
	}
	write_string(b, "}")

	return true
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
			write_string(b, "Array<")
			to_close += 1
		} else {
			write_string(b, "Maybe<Array<")
			to_close += 2
		}
	}

	if gql.type_value_is_non_null(value) {
		write_string(b, type.name)
	} else {
		write_string(b, "Maybe<")
		write_string(b, type.name)
		write_string(b, ">")
	}

	for _ in 0..<to_close {
		write_string(b, ">")
	}
}
