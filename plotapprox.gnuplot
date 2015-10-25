#!/usr/bin/gnuplot -p
plot "data/cubic.txt" with lines, "data/quad.txt" lt rgb "blue" with lines, "data/bound.txt" with points lt rgb "black"

