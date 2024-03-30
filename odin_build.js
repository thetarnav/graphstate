import * as child_process from "node:child_process"

/**
 * @enum {(typeof Optimization_Mode)[keyof typeof Optimization_Mode]} */
export const Optimization_Mode = /** @type {const} */({
	None      : "none",
	Minimal   : "minimal",
	Size      : "size",
	Speed     : "speed",
	Aggressive: "aggressive",
})

/**
 * @enum {(typeof Export_Timings)[keyof typeof Export_Timings]} */
export const Export_Timings = /** @type {const} */({
	Json: "json",
	Csv : "csv",
})

/**
 * @enum {(typeof Build_Mode)[keyof typeof Build_Mode]} */
export const Build_Mode = /** @type {const} */({
	Exe      : "exe",
	Dll      : "dll",
	Shared   : "shared",
	Obj      : "obj",
	Object   : "object",
	Assembly : "assembly",
	Assembler: "assembler",
	Asm      : "asm",
	LlvmIr   : "llvm-ir",
	Llvm     : "llvm",
})

/**
 * @enum {(typeof Target)[keyof typeof Target]} */
export const Target = /** @type {const} */({
	Darwin_Amd64           : "darwin_amd64",
	Darwin_Arm64           : "darwin_arm64",
	Essence_Amd64          : "essence_amd64",
	Linux_I386             : "linux_i386",
	Linux_Amd64            : "linux_amd64",
	Linux_Arm64            : "linux_arm64",
	Linux_Arm32            : "linux_arm32",
	Windows_I386           : "windows_i386",
	Windows_Amd64          : "windows_amd64",
	Freebsd_I386           : "freebsd_i386",
	Freebsd_Amd64          : "freebsd_amd64",
	Openbsd_Amd64          : "openbsd_amd64",
	Haiku_Amd64            : "haiku_amd64",
	Freestanding_Wasm32    : "freestanding_wasm32",
	Wasi_Wasm32            : "wasi_wasm32",
	Js_Wasm32              : "js_wasm32",
	Freestanding_Wasm64p32 : "freestanding_wasm64p32",
	Js_Wasm64p32           : "js_wasm64p32",
	Wasi_Wasm64p32         : "wasi_wasm64p32",
	Freestanding_Amd64_Sysv: "freestanding_amd64_sysv",
	Freestanding_Arm64     : "freestanding_arm64",
})

/**
 * @enum {(typeof Vet)[keyof typeof Vet]} */
export const Vet = /** @type {const} */({
	Default	     : "vet",
	Unused       : "unused",
	Shadowing    : "shadowing",
	Using_Stmt   : "using-stmt",
	Using_Param  : "using-param",
	Style        : "style",
	Semicolon    : "semicolon",
})

/**
 * @enum {(typeof Reloc_Mode)[keyof typeof Reloc_Mode]} */
export const Reloc_Mode = /** @type {const} */({
	Default       : "default",
	Static        : "static",
	Pic           : "pic",
	Dynamic_No_Pic: "dynamic-no-pic",
})

/**
 * @enum {(typeof Error_Pos_Style)[keyof typeof Error_Pos_Style]} */
export const Error_Pos_Style = /** @type {const} */({
	/** `file/path:45:3` */
	Unix   : "unix",
	/** `file/path(45:3)` */
	Odin   : "odin",
	/** (Defaults to `'odin'`.) */
	Default: "default",
})

/**
 * @enum {(typeof Sanitize)[keyof typeof Sanitize]} */
export const Sanitize = /** @type {const} */({
	Address: "address",
	Memory : "memory",
	Thread : "thread",
})

/** @typedef  {Record<string, string>} Collection */
/** @typedef  {Record<string, string>} Defines */

/**
 * @typedef  {object} Options
 * 
 * @property {boolean} [file] 
 * Tells `odin build` to treat the given file as a self-contained package.\
 * This means that `<dir>/a.odin` won't have access to `<dir>/b.odin`'s contents.
 * 
 * @property {string} [out]
 * Sets the file name of the outputted executable.\
 * Example: `"foo.exe"`
 * 
 * @property {Optimization_Mode} [o]
 * Sets the optimization mode for compilation.\
 * Available options:
 * - `"none"`
 * - `"minimal"`
 * - `"size"`
 * - `"speed"`
 * - `"aggressive"`
 * 
 * The default is `"minimal"`.
 * 
 * @property {boolean} [show_timings]
 * Shows basic overview of the timings of different stages within the compiler in milliseconds.
 * 
 * @property {boolean} [show_more_timings]
 * Shows an advanced overview of the timings of different stages within the compiler in milliseconds.
 * 
 * @property {boolean} [show_system_calls]
 * Prints the whole command and arguments for calls to external tools like linker and assembler.
 * 
 * @property {Export_Timings} [export_timings]
 * Exports timings to one of a few formats. Requires {@link Options.show_timings} or {@link Options.show_more_timings}.\
 * Available options:
 * - `"json"` Exports compile time stats to JSON.
 * - `"csv"`  Exports compile time stats to CSV.
 * 
 * @property {string} [export_timings_file]
 * Specifies the filename for {@link Options.export_timings}.\
 * Example: `"timings.json"`
 * 
 * @property {number} [thread_count]
 * Overrides the number of threads the compiler will use to compile with.\
 * Example: `2`
 * 
 * @property {boolean} [keep_temp_files]
 * Keeps the temporary files generated during compilation.
 * 
 * @property {Collection} [collection]
 * Defines a library collection used for imports.\
 * Example: `{shared: "dir/to/shared"}`\
 * Usage in Code: `import "shared:foo"`
 * 
 * @property {Defines} [define]
 * Defines a scalar boolean, integer or string as global constant.\
 * Example: `{SPAM: "123"}`\
 * Usage in code: `#config(SPAM, default_value)`
 * 
 * @property {Build_Mode} [build_mode]
 * Sets the build mode.\
 * Available options:
 * - `"exe"`       Builds as an executable.
 * - `"dll"`       Builds as a dynamically linked library.
 * - `"shared"`    Builds as a dynamically linked library.
 * - `"obj"`       Builds as an object file.
 * - `"object"`    Builds as an object file.
 * - `"assembly"`  Builds as an assembly file.
 * - `"assembler"` Builds as an assembly file.
 * - `"asm"`       Builds as an assembly file.
 * - `"llvm-ir"`   Builds as an LLVM IR file.
 * - `"llvm"`      Builds as an LLVM IR file.
 * 
 * @property {Target} [target]
 * Sets the target for the executable to be built in.
 * 
 * @property {boolean} [debug]
 * Enables debug information, and defines the global constant ODIN_DEBUG to be `'true'`.
 * 
 * @property {boolean} [disable_assert]
 * Disables the code generation of the built-in run-time `'assert'` procedure, and defines the global constant ODIN_DISABLE_ASSERT to be `'true'`.
 * 
 * @property {boolean} [no_bounds_check]
 * Disables bounds checking program wide.
 * 
 * @property {boolean} [no_crt]
 * Disables automatic linking with the C Run Time.
 * 
 * @property {boolean} [no_thread_local]
 * Ignores `@thread_local` attribute, effectively treating the program as if it is single-threaded.
 * 
 * @property {boolean} [lld]
 * Uses the LLD linker rather than the default.
 * 
 * @property {boolean} [use_separate_modules]
 * [EXPERIMENTAL]\
 * The backend generates multiple build units which are then linked together.\
 * Normally, a single build unit is generated for a standard project.
 * 
 * @property {boolean} [no_threaded_checker]
 * Disables multithreading in the semantic checker stage.
 * 
 * @property {Vet[]} [vet]
 * Does extra checks on the code.
 * 
 * @property {boolean} [ignore_unknown_attributes]
 * Ignores unknown attributes.\
 * This can be used with metaprogramming tools.
 * 
 * @property {boolean} [no_entry_point]
 * Removes default requirement of an entry point (e.g. main procedure).
 * 
 * @property {string} [minimum_os_version]
 * Sets the minimum OS version targeted by the application.\
 * Default: `"11.0.0"`\
 * Only used when target is Darwin, if given, linking mismatched versions will emit a warning.
 * 
 * @property {string} [extra_linker_flags]
 * Adds extra linker specific flags in a string.
 * 
 * @property {string} [extra_assembler_flags]
 * Adds extra assembler specific flags in a string.
 * 
 * @property {string} [microarch]
 * Specifies the specific micro-architecture for the build in a string.\
 * Examples:
 * - `"sandybridge"`
 * - `"native"`
 * 
 * Run `odin build . -microarch:?` for a list.
 * 
 * @property {Reloc_Mode} [reloc_mode]
 * Specifies the reloc mode.\
 * Available options:
 * - `"default"`
 * - `"static"`
 * - `"pic"`
 * - `"dynamic-no-pic"`
 * 
 * @property {boolean} [disable_red_zone]
 * Disables red zone on a supported freestanding target.
 * 
 * @property {boolean} [dynamic_map_calls]
 * Uses dynamic map calls to minimize code generation at the cost of runtime execution.
 * 
 * @property {boolean} [disallow_do]
 * Disallows the `'do'` keyword in the project.
 * 
 * @property {boolean} [default_to_nil_allocator]
 * Sets the default allocator to be the `nil_allocator`, an allocator which does nothing.
 * 
 * @property {boolean} [strict_style]
 * Errs on unneeded tokens, such as unneeded semicolons.\
 * Errs on missing trailing commas followed by a newline.\
 * Errs on deprecated syntax.
 * 
 * @property {boolean} [ignore_warnings]
 * Ignores warning messages.
 * 
 * @property {boolean} [warnings_as_errors]
 * Treats warning messages as error messages.
 * 
 * @property {boolean} [terse_errors]
 * Prints a terse error message without showing the code on that line and the location in that line.
 * 
 * @property {boolean} [json_errors]
 * Prints the error messages as json to stderr.
 * 
 * @property {Error_Pos_Style} [error_pos_style]
 * Available options:
 * - `"unix"` file/path:45:3
 * - `"odin"` file/path(45:3)
 * - `"default"` (Defaults to `'odin'`.)
 * 
 * @property {number} [max_error_count]
 * Sets the maximum number of errors that can be displayed before the compiler terminates.\
 * Must be an integer >0.\
 * If not set, the default max error count is `36`.
 * 
 * @property {boolean} [foreign_error_procedures]
 * States that the error procedures used in the runtime are defined in a separate translation unit.
 * 
 * @property {boolean} [obfuscate_source_code_locations]
 * Obfuscate the file and procedure strings, and line and column numbers, stored with a `'runtime.Source_Code_Location'` value.
 * 
 * @property {Sanitize[]} [sanitize]
 * Enables sanitization analysis.\
 * Available options:
 * - `"address"`
 * - `"memory"`
 * - `"thread"`
 */

/**
 * Convert odin options to command line arguments.
 * @param   {Options } options
 * @param   {string[]} args
 * @returns {void} */
export function options_to_args(options, args) {
	if (options.file) {
		args.push("-file")
	}
	if (options.out) {
		args.push("-out:"+options.out)
	}
	if (options.o) {
		args.push("-o:"+options.o)
	}
	if (options.show_timings) {
		args.push("-show-timings")
	}
	if (options.show_more_timings) {
		args.push("-show-more-timings")
	}
	if (options.show_system_calls) {
		args.push("-show-system-calls")
	}
	if (options.export_timings) {
		args.push("-export-timings", options.export_timings)
	}
	if (options.export_timings_file !== undefined) {
		args.push("-export-timings-file", options.export_timings_file)
	}
	if (options.thread_count !== undefined) {
		args.push("-thread-count:"+options.thread_count)
	}
	if (options.keep_temp_files) {
		args.push("-keep-temp-files")
	}
	if (options.collection) {
		for (const key in options.collection) {
			args.push("-collection:"+key+"="+options.collection[key])
		}
	}
	if (options.define) {
		for (const key in options.define) {
			args.push("-define:"+key+"="+options.define[key])
		}
	}
	if (options.build_mode) {
		args.push("-build-mode:"+options.build_mode)
	}
	if (options.target) {
		args.push("-target:"+options.target)
	}
	if (options.debug) {
		args.push("-debug")
	}
	if (options.disable_assert) {
		args.push("-disable-assert")
	}
	if (options.no_bounds_check) {
		args.push("-no-bounds-check")
	}
	if (options.no_crt) {
		args.push("-no-crt")
	}
	if (options.no_thread_local) {
		args.push("-no-thread-local")
	}
	if (options.lld) {
		args.push("-lld")
	}
	if (options.use_separate_modules) {
		args.push("-use-separate-modules")
	}
	if (options.no_threaded_checker) {
		args.push("-no-threaded-checker")
	}
	if (options.vet) {
		for (const vet of options.vet) {
			if (vet === Vet.Default) {
				args.push("-vet")
			} else {
				args.push("-vet-"+vet)
			}
		}
	}
	if (options.ignore_unknown_attributes) {
		args.push("-ignore-unknown-attributes")
	}
	if (options.no_entry_point) {
		args.push("-no-entry-point")
	}
	if (options.minimum_os_version) {
		args.push("-minimum-os-version:"+options.minimum_os_version)
	}
	if (options.extra_linker_flags) {
		args.push("-extra-linker-flags:\""+options.extra_linker_flags+"\"")
	}
	if (options.extra_assembler_flags) {
		args.push("-extra-assembler-flags:\""+options.extra_assembler_flags+"\"")
	}
	if (options.microarch) {
		args.push("-microarch:"+options.microarch)
	}
	if (options.reloc_mode) {
		args.push("-reloc-mode:"+options.reloc_mode)
	}
	if (options.disable_red_zone) {
		args.push("-disable-red-zone")
	}
	if (options.dynamic_map_calls) {
		args.push("-dynamic-map-calls")
	}
	if (options.disallow_do) {
		args.push("-disallow-do")
	}
	if (options.default_to_nil_allocator) {
		args.push("-default-to-nil-allocator")
	}
	if (options.strict_style) {
		args.push("-strict-style")
	}
	if (options.ignore_warnings) {
		args.push("-ignore-warnings")
	}
	if (options.warnings_as_errors) {
		args.push("-warnings-as-errors")
	}
	if (options.terse_errors) {
		args.push("-terse-errors")
	}
	if (options.json_errors) {
		args.push("-json-errors")
	}
	if (options.error_pos_style) {
		args.push("-error-pos-style:"+options.error_pos_style)
	}
	if (options.max_error_count !== undefined) {
		args.push("-max-error-count:"+options.max_error_count)
	}
	if (options.foreign_error_procedures) {
		args.push("-foreign-error-procedures")
	}
	if (options.obfuscate_source_code_locations) {
		args.push("-obfuscate-source-code-locations")
	}
	if (options.sanitize) {
		for (const sanitize of options.sanitize) {
			args.push("-sanitize:"+sanitize)
		}
	}
}

/**
 * Build odin project.
 * @param   {string       } path
 * @param   {Options      } [options]
 * @returns {Promise<number>} */
export function build(path, options) {
	const args = ["build", path]

	if (options) {
		options_to_args(options, args)
	}

	const odin = child_process.spawn("odin", args, {stdio: "inherit"})

	return new Promise(resolve => {
		odin.on("close", resolve)
	})
}