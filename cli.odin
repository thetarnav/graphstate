package graphstate

import "core:os"
import "core:fmt"
import "core:mem"
import "core:strings"
import gql "./graphql_parser"

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
			strings.write_string(&b, "\n/**\n * @typedef  {object} ")
			strings.write_string(&b, type.name)
			strings.write_string(&b, "\n")
			for field in type.fields {
				field_type := schema.types[field.value.index]
				strings.write_string(&b, " * @property {")
				strings.write_string(&b, field_type.name)
				strings.write_string(&b, "} ")
				strings.write_string(&b, field.name)
				strings.write_string(&b, "\n")
			}
			strings.write_string(&b, " */\n")
		case .Union:
			strings.write_string(&b, "\n/**\n * @typedef  {")
			for member, i in type.members {
				member_type := schema.types[member]
				strings.write_string(&b, member_type.name)
				if i < len(type.members)-1 {
					strings.write_string(&b, "|")
				}
			}
			strings.write_string(&b, "} ")
			strings.write_string(&b, type.name)
		case .Enum:
			strings.write_string(&b, "\n/**\n * @enum {(typeof ")
			strings.write_string(&b, type.name)
			strings.write_string(&b, ")[keyof typeof ")
			strings.write_string(&b, type.name)
			strings.write_string(&b, "]} */\n")
			strings.write_string(&b, "export const ")
			strings.write_string(&b, type.name)
			strings.write_string(&b, " = /** @type {const} */({\n")
			for item, i in type.enum_values {
				strings.write_string(&b, "\t")
				strings.write_string(&b, item)
				strings.write_string(&b, ": \"")
				strings.write_string(&b, item)
				strings.write_string(&b, "\"")
				strings.write_string(&b, ",\n")
			}
			strings.write_string(&b, "})\n")
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

	strings.write_string(&b, "\n/*\n\n")
	strings.write_string(&b, "QUERIES:\n\n")
	strings.write_string(&b, "*/\n")

	queries_type := schema.types[schema.query]
	for query in queries_type.fields {
		write_field_function(&b, schema, query, "query")
	}

	/*
	Mutations
	*/
	if schema.mutation != 0 {
		strings.write_string(&b, "\n/*\n\n")
		strings.write_string(&b, "MUTATIONS:\n\n")
		strings.write_string(&b, "*/\n")

		mutations_type := schema.types[schema.mutation]
		for mutation in mutations_type.fields {
			write_field_function(&b, schema, mutation, "mutation")
		}
	}

	str := strings.to_string(b)
	os.write(os.stdout, transmute([]byte)str)
}

write_field_function :: proc(b: ^strings.Builder, schema: gql.Schema, field: gql.Field, operation_type: string) {
	return_type := schema.types[field.value.index]

	strings.write_string(b, "\n/**\n * ")
	strings.write_string(b, operation_type)
	strings.write_string(b, ": `")
	strings.write_string(b, field.name)
	strings.write_string(b, "`.\n * value: {@link ")
	strings.write_string(b, return_type.name)
	strings.write_string(b, "}.\n")

	for arg in field.args {
		arg_type := schema.types[arg.type.index] // TODO null lists
		strings.write_string(b, " * @param   {")
		strings.write_string(b, arg_type.name)
		strings.write_string(b, "} ")
		strings.write_string(b, arg.name)
		strings.write_string(b, "\n")
	}

	strings.write_string(b, " * @returns {string} */\n")
	strings.write_string(b, "export function ")
	strings.write_string(b, operation_type)
	strings.write_string(b, "_body_")
	strings.write_string(b, field.name)
	strings.write_string(b, "(")

	for arg, i in field.args {
		strings.write_string(b, arg.name)
		if i < len(field.args)-1 {
			strings.write_string(b, ", ")
		}
	}

	strings.write_string(b, ") {\n")
	strings.write_string(b, "\treturn '")
	strings.write_string(b, operation_type)
	strings.write_string(b, "{")
	strings.write_string(b, field.name)
	
	if len(field.args) > 0 {
		strings.write_string(b, "(")
		for arg, i in field.args {
			arg_type := schema.types[arg.type.index]
			strings.write_string(b, arg.name)
			strings.write_string(b, ":")
			switch arg_type.name {
			case "String":
				strings.write_string(b, "\"'+escape_quotes(")
				strings.write_string(b, arg.name)
				strings.write_string(b, ")+'\"")
			case "ID":
				strings.write_string(b, "\"'+")
				strings.write_string(b, arg.name)
				strings.write_string(b, "+'\"")
			case "Int", "Float", "Boolean":
				strings.write_string(b, "'+")
				strings.write_string(b, arg.name)
				strings.write_string(b, "+'")
			case:
				strings.write_string(b, "'+JSON.stringify(")
				strings.write_string(b, arg.name)
				strings.write_string(b, ")+'")
			}
			if i < len(field.args)-1 {
				strings.write_string(b, " ")
			}
		}
		strings.write_string(b, ")")
	}

	write_type_fields(b, schema, field.value)

	strings.write_string(b, "}'\n}\n")

	// Return type alias
	strings.write_string(b, "/** @typedef {")
	strings.write_string(b, return_type.name)
	strings.write_string(b, "} Value_")
	strings.write_string(b, field.name)
	strings.write_string(b, " */\n")
}

write_type_fields :: proc(b: ^strings.Builder, schema: gql.Schema, value: gql.Type_Value) -> (is_obj: bool) {
	type := schema.types[value.index]
	if (type.kind != .Object) do return false

	strings.write_string(b, "{")
	for field, i in type.fields {
		strings.write_string(b, field.name)
		if !write_type_fields(b, schema, field.value) && i < len(type.fields)-1 {
			strings.write_string(b, " ")
		}
	}
	strings.write_string(b, "}")

	return true
}