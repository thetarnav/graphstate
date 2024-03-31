//+build !wasm32 !js
package graphstate

import "core:os"
import "core:fmt"
import "core:mem"
import gql "../graphql_parser"
	
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

@(private)
buf_arr: [mem.Megabyte * 20]u8

main :: proc() {
	if is_terminal(os.stdin) {
		fmt.println("\e[0;36mEnter a GraphQL query or schema:\e[0m")
	}

	input: string
	input_len, os_err := os.read(os.stdin, buf_arr[:])
	if os_err != os.ERROR_NONE {
		fmt.panicf("Error reading input: %d", os_err)
	}

	input = string(buf_arr[:input_len])
	buf := buf_arr[input_len:]

	arena: mem.Arena
	mem.arena_init(&arena, buf)
	context.allocator = mem.arena_allocator(&arena)

	output, err := program(input)

	if err != nil {
		err_str := gql.schema_error_to_string(input, err) or_else "Error converting error to string"
		os.write(os.stderr, transmute([]u8)err_str)
	} else {
		os.write(os.stdout, output)
	}
}