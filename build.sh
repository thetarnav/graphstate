FLAGS="-out:graphstate \
	-no-thread-local \
	-vet-unused \
	-vet-shadowing \
	-vet-style \
	-vet-semicolon"

case $1 in
	"release")
		odin build . $FLAGS \
			-o:aggressive \
			-microarch:native \
			-no-bounds-check \
			-disable-assert \
			-obfuscate-source-code-locations
		;;
	"debug")
		odin build . $FLAGS -debug
		;;
	"client")
		if [ ! -f "./graphstate" ]; then
			echo "graphstate binary does not exist."
			exit 1
		fi
		
		mkdir -p ./build
		cat ./schema_test.graphql | ./graphstate > ./build/client.js
		;;
	*)
		./build.sh
		;;
esac
