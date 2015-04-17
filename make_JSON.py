import json
import argparse

parser = argparse.ArgumentParser()
parser.add_argument("-i",
                    "--input",
                    type=str,
                    required=True,
                    help="Input file. This should be the dump from the Perl script.")

parser.add_argument("-o",
                    "--output",
                    type=str,
                    required=False,
                    help="Output file. This should end in json."
                         "If it is not provided same as input but ending in json.")

parser.add_argument("-n",
                    "--name",
                    type=str,
                    required=True,
                    choices=['expr', 'evol', 'mapDict'],
                    help="Name for the JSON variable. Must be either expr, evol or mapDict.")

parser.add_argument("-k",
                    "--key",
                    type=int,
                    required=True,
                    help="Which column of the input file to use as keys for the JSON file."
                         "It is zero-indexed.")

parser.add_argument("-v",
                    "--value",
                    type=int,
                    required=True,
                    help="Which column of the input file to use as values for the JSON file."
                         "It is zero-indexed.")

args = parser.parse_args()

input_file = args.input
output_file = args.output
name = args.name
key = args.key
value = args.value

with open(input_file) as in_file:
    lines = in_file.readlines()

cluster_dict = {}
key_col = int(key)
val_col = int(value)

for line in lines:
    line = line.split()
    if line[key_col] not in cluster_dict.keys():
        cluster_dict[line[key_col]] = [line[val_col]]
    else:
        cluster_dict[line[key_col]].append(line[val_col])

with open(output_file, 'w') as out_file:
    out_file.write('var ' + name + ' = ')
    out_file.write(json.dumps(cluster_dict, sort_keys=True))