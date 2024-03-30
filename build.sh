FLAGS_VET="
	-vet-unused \
	-vet-shadowing \
	-vet-style \
	-vet-semicolon
"

FLAGS_RELEASE="
	-no-thread-local
	-o:aggressive \
	-no-bounds-check \
	-disable-assert \
	-obfuscate-source-code-locations
"

case $1 in
	"cli")
		odin build src $FLAGS_VET -out:graphstate
		;;
	"wasm")
		odin build src $FLAGS_VET -out:graphstate.wasm -target:freestanding_wasm32
		;;
	"release")
		odin build src $FLAGS_VET $FLAGS_RELEASE -out:graphstate -microarch:native
		odin build src $FLAGS_VET $FLAGS_RELEASE -out:graphstate.wasm -target:freestanding_wasm32
		;;
	"debug")
		odin build src -out:graphstate -debug
		;;
	"client")
		if [ ! -f "./graphstate" ]; then
			echo "graphstate binary does not exist."
			exit 1
		fi
		
		cat ./schema_test.graphql | ./graphstate > ./_client.js
		;;
	*)
		./build.sh release
		;;
esac
