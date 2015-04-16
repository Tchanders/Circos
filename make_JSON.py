# Makes JSON object from expression or orthology clusters
# Input 1 is the file dumped by the Perl script
# Input 2 is the JSON file
# Input 3 is 'expr' or 'evol'
# Input 4 is which column for keys (0-indexed)
# Input 5 is which column for values (0-indexed)

import sys
import json

with open( sys.argv[1] ) as in_file:
	lines = in_file.readlines()

cluster_dict = {}
key_col = int( sys.argv[4] )
val_col = int( sys.argv[5] )

for line in lines:
	line = line.split()
	if line[key_col] not in cluster_dict.keys():
		cluster_dict[line[key_col]] = [line[val_col]]
	else:
		cluster_dict[line[key_col]].append( line[val_col] )


with open( sys.argv[2], 'w' ) as out_file:
	out_file.write( 'var '+ sys.argv[3] + ' = ' )
	out_file.write( json.dumps( cluster_dict, sort_keys=True ) )