package graphstate

import "core:os"
import "core:fmt"
import "core:mem"

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

Error :: union {
	os.Errno,
	gql.Schema_Error,
}

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
	alloc_err = gql.schema_init(&schema, context.allocator)
	if alloc_err != nil {
		fmt.panicf("error initializing schema: %v", alloc_err)
	}

	schema_err := gql.schema_parse(&schema, input)
	if schema_err != nil {
		fmt.panicf("Error parsing schema: %v", schema_err)
	}

	if schema.query == 0 || schema.query >= len(schema.types) {
		panic("Query type not found")
	}

	for type in schema.types[gql.USER_TYPES_START:] {
		fmt.printfln("Type: %s", type.name)
	}
}