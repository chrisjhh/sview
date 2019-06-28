const simplify = require('simplify-js');

/**
 * Take an array of distances in meters and times in seconds
 * And return an array of velocities that match the time array
 * @param {Array} distances 
 * @param {Array} times 
 * @param {Number} tolerance The tolerance in meters
 * @param {Boolean} hiquality Wether to use slower high-quality algorithm  
 */
export const velocity = function(distances,times,tolerance=2,span=40,hiquality=false) {
  if (distances.length != times.length) {
    throw new Error('distance and time arrays should have same length');
  }
  // Zip these two arrays into points {x,y} as times are much more accurate
  // than distances, use ms
  let points = distances.map((x,i) => ({x,y:times[i]*1000}));

  // Simplify these into a polyline use simplify-js
  let distance_polyline = simplify(points,tolerance,hiquality);

  // Filter out spans of less than 3 seconds
  let filtered = [];
  let last = 0;
  distance_polyline.forEach((p,i,array) => {
    if (i === 0 || i === array.length - 1 || array[i].y - last > 3000) {
      filtered.push(p);
      last = p.y;
    }
  });
  distance_polyline = filtered;

  // Convert these to velocity / time points
  let velocity_polyline = distance_polyline.map((p,i,a) => {
    if (i === a.length - 1) {
      return {v:0,t:p.y / 1000};
    }
    const t1 = p.y / 1000;
    const t2 = a[i+1].y / 1000;
    const d1 = p.x;
    const d2 = a[i+1].x;
    const v = Math.max(0, (d2 - d1)/(t2 - t1));
    return {v,t:t1};
  });

  let velocities = [];
  let index = 1;
  times.forEach((t) => {
    while(t > velocity_polyline[index].t) {
      ++index;
      if (index >= velocity_polyline.length) {
        throw new Error('Algorithm Error: End of polyline reached!');
      }
    }
    velocities.push(velocity_polyline[index-1].v);
  });


  velocities = smooth(velocities,Math.floor(span/2));
  velocities = smooth(velocities,Math.floor(span/5));

  return velocities;
};

const smooth = function(velocities, span) {
  if (velocities.length < 3) {
    return velocities;
  }
  return velocities.map((v,i,array) => {
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
      total += array[n];
      ++count;
    }
    return total / count;
  });
};
