FLAGS="
	-no-thread-local \
	-vet-unused \
	-vet-shadowing \
	-vet-style \
	-vet-semicolon
"

FLAGS_RELEASE="
	-o:aggressive \
	-no-bounds-check \
	-disable-assert \
	-obfuscate-source-code-locations
"

case $1 in
	"release")
		odin build src $FLAGS $FLAGS_RELEASE -out:graphstate -microarch:native
		;;
	"debug")
		odin build src $FLAGS -debug -out:graphstate
		;;
	"wasm")
		# odin build src $FLAGS $FLAGS_RELEASE -out:graphstate.wasm -target:freestanding_wasm32
		odin build src -out:graphstate.wasm -target:freestanding_wasm32

		;;
	"client")
		if [ ! -f "./graphstate" ]; then
			echo "graphstate binary does not exist."
			exit 1
		fi
		
		cat ./schema_test.graphql | ./graphstate > ./_client.js
		;;
	*)
		odin build src $FLAGS -out:graphstate
		;;
esac
