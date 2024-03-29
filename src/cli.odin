//+build !wasm32 !js
package graphstate

import "core:os"
import "core:fmt"
import "core:mem"
	
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

write_output :: proc(output: []u8) {
	_, os_err := os.write(os.stdout, output)
	if os_err != os.ERROR_NONE {
		fmt.panicf("error writing output: %d", os_err)
	}
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

	program(input)
}