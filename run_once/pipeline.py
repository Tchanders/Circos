import os
import argparse

parser = argparse.ArgumentParser()
parser.add_argument("-n",
                    "--number_of_clusters",
                    type=int,
                    required=True,
                    help="Make a map with this many clusters.")

parser.add_argument("-org",
                    "--organism",
                    type=str,
                    required=True,
                    choices=['plasmo', 'anoph'],
                    help="Which organism is this? Must be either plasmo or anoph.")

args = parser.parse_args()

organism = args.organism
nof_clusters = args.number_of_clusters

expr_map_name = "%s_expr_%02d" % (organism, nof_clusters)
ortho_map_name = "%s_ortho_%02d" % (organism, nof_clusters)

expr_in_file, ortho_in_file, minconds = '', '', 0
if organism == 'plasmo':
    expr_in_file = "Plasmo3D7Exp.txt"
    ortho_in_file = "Plasmo-i-SVD-U-95var_zero_padded.tsv"
    minconds = 8  # Only because we have this many for the plasmodium.
elif organism == 'anoph':
    expr_in_file = "Anopheles-gambiae_MSM_VB-2013-12.txt"
    ortho_in_file = "psm_bsAGAMP-i-svd-90var.tsv"
    minconds = 10

print "Creating expression and orthology maps with dimensions 1x%d\n" % nof_clusters

expr_run_call = ("perl cluster-continuous-data.pl -mapname %s -pearson -mapdims 1x%s -seed 12345 -mingenes 1000"
                 " -minconds 10 -alpha 0.01 %s") % (expr_map_name, nof_clusters, expr_in_file)
expr_dump_call = "perl dump-mappings-for-gp.pl -mapname %s > %s.dump" % (expr_map_name, expr_map_name)

print "Creating the expression map --> " + expr_map_name + "\n"
os.system(expr_run_call)
print expr_run_call

os.system(expr_dump_call)
print expr_dump_call, '\n'

ortho_run_call = ("perl cluster-continuous-data.pl -mapname %s -pearson -mapdims 1x%s -seed 12345 -mingenes 1000"
                  " -minconds %d -alpha 0.01 %s") % (ortho_map_name, nof_clusters, minconds, ortho_in_file)
ortho_dump_call = "perl dump-mappings-for-gp.pl -mapname %s > %s.dump" % (ortho_map_name, ortho_map_name)

print "Creating the ortho map --> " + ortho_map_name + "\n"
os.system(ortho_run_call)
print ortho_run_call

os.system(ortho_dump_call)
print ortho_dump_call, '\n'

print "All done."
