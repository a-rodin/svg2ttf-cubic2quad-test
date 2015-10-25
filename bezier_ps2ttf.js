var fs = require('fs');
var SvgPath = require('svgpath');
var DOMParser = require('xmldom').DOMParser;
var svg = require('svg2ttf/lib/svg');

var svgString = fs.readFileSync('svg/link.svg').toString();
var dom = new DOMParser().parseFromString(svgString);
var pathTag = dom.getElementsByTagName('path')[0];
var pathString = pathTag.attributes.getNamedItem('d').value;

var srcPath = new SvgPath(pathString);
var newPath = srcPath
    .abs()
    .unshort()
    .unarc()
    .iterate(svg.cubicToQuad);

// save transformed path to another svg
pathTag.attributes.getNamedItem('d').value = newPath.toString();
fs.writeFileSync('svg/link.out.svg', dom.toString());

