Two simple programs that allows to test cubic2Quad converter from svg2ttf package.

The first one is bezier_math.js. It tries to use cubic2Quad function to approximate
cubic BezerCurve. It outputs the results of approximation into data/subdirectory. 
The results could be seen by executing plotapprox.gnuplot script for GNUPlot.

The second in is bezier_ps2ttf.js. It takes an SVG icon svg/link.svg that is known
to be difficult to be converted into TTF using simple mid-point approach, converts
all cubic curves to quadratic ones and writes the result to svg/link.out.svg.

By default it uses modified version with updated cubic2Quad routime, but if you want
to test the original one, just change

    "svg2ttf": "https://..."

in package.json to

    "svg2ttf": "2.0.2"

