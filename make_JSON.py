# Makes JSON object from expression or orthology clusters
# Input 1 is the file dumped by the Perl script
# Input 2 is the JSON file

import sys
import json

with open( sys.argv[1] ) as in_file:
	lines = in_file.readlines()

cluster_dict = {}

for line in lines:
	line = line.split()
	if line[1] not in cluster_dict.keys():
		cluster_dict[line[1]] = [line[2]]
	else:
		cluster_dict[line[1]].append( line[2] )


with open( sys.argv[2], 'w' ) as out_file:
	out_file.write( json.dumps( cluster_dict, sort_keys=True ) )