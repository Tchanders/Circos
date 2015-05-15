import re

genes_to_full_file = 'OG_PFALC_PF3D7_keys.txt'
ogs_to_genes_file = 'Plasmo_OGtoGene_mapping_zero_padded.txt'

new_og_to_gene_file = ogs_to_genes_file + '.new'

ogs_to_genes = {}
genes_to_full = {}

print "Reading geneID equivalencies from the file", genes_to_full_file

with open(genes_to_full_file) as in_file:
    for line in in_file:
        words = line.split()
        if len(words) == 3:
            genes_to_full[words[1]] = words[2]
        elif len(words) == 2:
            genes_to_full[words[0]] = words[1]

print "Read", len(genes_to_full), "geneID equivalencies from", genes_to_full_file
print "Constructing the second dict from the file", ogs_to_genes_file

new_id_equivalencies = {}
new_lines = []

with open(new_og_to_gene_file, "w") as out_file:
    with open(ogs_to_genes_file) as in_file:
        for line in in_file:
            line = line.rstrip()
            words = line.split()
            if 'PFALC' in words[1] and words[1] in genes_to_full:
                out_file.write(line + "\t" + genes_to_full[words[1]] + "\n")
                new_id_equivalencies[words[0]] = genes_to_full[words[1]]
                new_lines.append(line + "\t" + genes_to_full[words[1]])
            elif 'PFALC' in words[1]:
                print "WARNING: geneID", words[1], "present in", ogs_to_genes_file, "but not in", genes_to_full_file
            else:
                out_file.write(line + "\n")

print "Added", len(new_lines), "geneID equivalencies"
print "Printing the new file in", new_og_to_gene_file

mappings_file = 'Plasmo-i-SVD-U-95var_zero_padded.tsv'
new_mappings_file = 'Plasmo-i-SVD-U-95var_zero_padded.tsv.new'

# Replace "1", "2" with the correct OGIDs
line_counter = 0
with open(new_mappings_file, 'w') as out_file:
    with open(mappings_file) as in_file:
        for line in in_file:
            line = line.rstrip()
            words = line.split()
            ogid_regex = re.compile(r'(PZ\d+)')
            ogid_match = ogid_regex.search(words[0])
            if ogid_match:
                ogid = ogid_match.group(1)
                if ogid in new_id_equivalencies:
                    words[0] = new_id_equivalencies[ogid]
                    out_file.write('\t'.join(words) + '\n')

print "All done."
