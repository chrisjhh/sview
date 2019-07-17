const simplify = require('simplify-js');

/**
 * Take an array of distances in meters and altitudes in meters
 * And return an array of inclinations that match the time array
 * @param {Array} distances 
 * @param {Array} times 
 * @param {Number} tolerance The tolerance in meters
 * @param {Boolean} hiquality Wether to use slower high-quality algorithm  
 */
export const inclination = function(distances,altitudes,tolerance=2,span=40,hiquality=false) {
  if (distances.length != altitudes.length) {
    throw new Error('distance and time arrays should have same length');
  }
  // Zip these two arrays into points {x,y} as times are much more accurate
  // than distances, use ms
  let points = distances.map((x,i) => ({x,y:altitudes[i]}));

  // Simplify these into a polyline use simplify-js
  let distance_polyline = simplify(points,tolerance,hiquality);

  // Filter out spans of less than 3 meters
  // let filtered = [];
  // let last = 0;
  // distance_polyline.forEach((p,i,array) => {
  //   if (i === 0 || i === array.length - 1 || array[i].x - last > 3) {
  //     filtered.push(p);
  //     last = p.x;
  //   }
  // });
  // distance_polyline = filtered;

  // Convert these to inclinations / distance points
  let inclination_polyline = distance_polyline.map((p,i,a) => {
    if (i === a.length - 1) {
      return {i:0,d:p.x};
    }
    const d1 = p.x;
    const d2 = a[i+1].x;
    const a1 = p.y;
    const a2 = a[i+1].y;
    const inc = (a2 - a1)/(d2 - d1);
    return {i:inc,d:d1};
  });

  let inclinations = [];
  let index = 1;
  distances.forEach((d) => {
    while(d > inclination_polyline[index].d) {
      ++index;
      if (index >= inclination_polyline.length) {
        throw new Error('Algorithm Error: End of polyline reached!');
      }
    }
    inclinations.push(inclination_polyline[index-1].i * 100);
  });


  //velocities = smooth(velocities,Math.floor(span/2));
  //velocities = smooth(velocities,Math.floor(span/5));

  return inclinations;
};

const smooth = function(velocities, span) {
  if (velocities.length < 3) {
    return velocities;
  }
  return velocities.map((v,i,array) => {
    if (v < 1.0) {
      // Dont average very slow or stopped
      return v;
    }
    let lower = i - span;
    let upper = i + span;
    if (lower < 0) {
      lower = 0;
    }
    if (upper >= array.length) {
      upper = array.length - 1;
    }
    let count = 0;
    let total = 0;
    for (let n=lower; n<=upper; ++n) {
      // Dont average very slow or stopped
      if (array[n] < 1.0) {
        continue;
      }
      total += array[n];
      ++count;
    }
    if (count === 0) {
      return v;
    }
    return total / count;
  });
};
