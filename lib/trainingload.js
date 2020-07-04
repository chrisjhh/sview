

export const trainingLoad = function(heartrates,times,maxhr) {
  if (heartrates.length != times.length) {
    throw new Error('distance and time arrays should have same length');
  }
  let total = 0;
  for(let i=0;i<heartrates.length;++i) {
    const hr = heartrates[i];
    const t0 = i === 0 ? times[0] : times[i-1];
    const t1 = i === 0? times[1] : times[i];
    const dt = t1 - t0;
    const percent = hr * 100 / maxhr;
    let zone = 0;
    if (percent > 50) {
      zone = 1;
      if (percent > 60) {
        zone = 2;
        if (percent > 70) {
          zone = 3;
          if (percent > 80) {
            zone = 4;
            if (percent > 90) {
              zone = 5;
            }
          }
        }
      }
    }
    total += zone * dt;
  }
  return total / 60;
};

export const trainingLoad_accurate = function(heartrates,times,maxhr) {
  if (heartrates.length != times.length) {
    throw new Error('distance and time arrays should have same length');
  }
  let total = 0;
  for(let i=0;i<heartrates.length;++i) {
    const hr = heartrates[i];
    const t0 = i === 0 ? times[0] : times[i-1];
    const t1 = i === 0? times[1] : times[i];
    const dt = t1 - t0;
    const percent = hr * 100 / maxhr;
    let zone = 0;
    if (percent > 50) {
      zone = (percent - 50)/10 + 0.5;
    }
    total += zone * dt;
  }
  return total / 60;
};



