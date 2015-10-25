var math = require('svg2ttf/lib/math.js');
var Point = math.Point;
var fs = require('fs');

Point.prototype.toString = function() {
    return this.x + ' ' + this.y;
}

Point.prototype.dot = function(point) {
    return this.x * point.x + this.y * point.y;
}

function calcPoint(bezierCurve, t) {
    var result = new Point(0, 0);
    var order = bezierCurve.length - 1;

    if (t == 0) {
        return bezierCurve[0];
    } else if (t == 1) {
        return bezierCurve[order];
    }

    // point = sum_{i=0}^n term_i * control_point_i
    // term_i = C^n_i * t^i * (1 - t)^{n - i}, n = order
    var term = Math.pow(1 - t, order);
    for (var i = 0; i <= order; i++) {
        result = result.add(bezierCurve[i].mul(term));
        // C^n_{i+1} = C^n_i * (n - i) / (i + 1)
        // so term_{i+1} = term_i * (n - i) / (i + 1) * t / (1 - t)
        term *= (order - i) / (i + 1) * t / (1 - t);
    }
    return result;
}

// return squared distance derivative, deivided by 4
function distanceToQuadPointDerivative(point, quadCurve, t) {
    // d((B(t) - P)^2)/dt = 2 * (B(t) - P, dB(t)/dt), B(t) is a BezierCurve of second order
    // dB(t)/dt = 2 * (p1 - p0) * (1 - t)  + 2 * (p2 - p1) * t which is a bezierCurve of first order
    // so d((B(t) - P)^2)/dt ~ ((B(t) - P), calcPoint([p1 - p0, p2 - p1], t))
    // this method is not the most efficient, but is easier to read and check than the direct
    // derivative calculation of the squared distance

    var tangentCurve = calcPoint([
            quadCurve[1].sub(quadCurve[0]),
            quadCurve[2].sub(quadCurve[1]) ], t);
    return calcPoint(quadCurve, t).sub(point).dot(tangentCurve);
}

function findZero(f, tLeft, tRight) {
    // find the root assuming that the one exists (and only one)
    var valueLeft = f(tLeft);
    var valueRight = f(tRight);
    var eps = 1e-8;
    do {
        var t = (tLeft + tRight) / 2;
        var value = f(t);

        if (Math.abs(value) < eps)
            return t;

        if (value * valueLeft < 0) {
            tRight = t;
            valueRight = value;
        } else {
            tLeft = t;
            valueLeft = value;
        }
    } while (Math.abs(tLeft - tRight) > eps);
    return t;
}

function findZeros(f, tLeft, tRight) {
    // it is bad, but is good enough for given particular case
    var dt = (tRight - tLeft) / 10;
    var zeros = [];
    for (var t = tLeft; t < tRight; t += dt) {
        var valueLeft = f(t);
        var valueRight = f(t + dt);
        if (valueLeft * valueRight < 0) {
            zeros.push(findZero(f, t, t + dt));
        }
    }
    return zeros;
}

function findMinimum(f, grad, tLeft, tRight) {
    var candidates = findZeros(grad, tLeft, tRight).concat([tLeft, tRight]);
    var values = candidates.map(f);
    var minIndex = 0;
    for (var i = 1; i < candidates.length; i++) {
        if (values[i] < values[minIndex]) {
            minIndex = i;
        }
    }
    return candidates[minIndex];
}

function distanceToQuad(point, quadCurve) {
    var t = findMinimum(
        function(t) { return point.sub(calcPoint(quadCurve, t)).sqr() },
        function(t) { return distanceToQuadPointDerivative(point, quadCurve, t) },
        0, 1);
    return calcPoint(quadCurve, t).sub(point).dist();
}

function distanceToQuads(point, quadCurves) {
    var distance = 1e9;
    for (var i = 0; i < quadCurves.length; i++) {
        var newDistance = distanceToQuad(point, quadCurves[i]);
        if (newDistance < distance) {
            distance = newDistance;
        }
    }
    return distance;
}

var p1 = new Point(0, 0);
var p2 = new Point(10, 0);
var c1 = new Point(-22, -22);
var c2 = new Point(-8, 52);

var cubic = [p1,c1,c2,p2];
var quads = math.bezierCubicToQuad(p1, c1, c2, p2).reverse();

// looks for Hausdorff distance (only for the left term from
// the definition, but it gives the order of error)
var maxDistance = 0;
var maxT = 0;
for (var t = 0; t <= 1; t += 1e-4) {
    var distance = distanceToQuads(calcPoint(cubic, t), quads);
    if (distance > maxDistance) {
        maxDistance = distance;
        maxT = t;
    }
}

console.log('distance is ', maxDistance, ', maxT = ', maxT, ', point is ', calcPoint(cubic, maxT), ', n = ', quads.length);

var cubicData = [];
var quadData = [];
var quadBounds = [quads[0][0]];
for (var t = 0; t <= 1; t += 1e-3) {
    cubicData.push(calcPoint(cubic, t).toString());
}
for (var n = 0; n < quads.length; n++) {
    quadBounds.push(quads[n][2]);
    for (var t = 1; t >= 0; t -= 1e-2) {
        quadData.push(calcPoint(quads[n], t).toString());
    }
}

fs.writeFileSync('data/cubic.txt', cubicData.join('\n'));
fs.writeFileSync('data/quad.txt', quadData.join('\n'));
fs.writeFileSync('data/bound.txt', quadBounds.join('\n'));

