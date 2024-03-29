//+build freestanding wasm32
package graphstate

import "core:mem"
import "core:runtime"
import gql "../graphql_parser"

foreign import "env"

@(default_calling_convention = "contextless")
foreign env {
	out_write :: proc(text: string) ---
	err_write :: proc(text: string) ---
	in_write   :: proc(input: []u8) -> int ---
}

buf_arr: [mem.Megabyte * 20]u8

@export start :: proc "contextless" () {
	context = runtime.default_context()
	
	bytes_read := in_write(buf_arr[:])
	input := string(buf_arr[:bytes_read])
	buf := buf_arr[bytes_read:]

	arena: mem.Arena
	mem.arena_init(&arena, buf)
	context.allocator = mem.arena_allocator(&arena)
	context.temp_allocator = context.allocator

	err := program(input)

	if err != nil {
		err_str := gql.schema_error_to_string(input, err) or_else "Error converting error to string"
		err_write(err_str)
	}
}