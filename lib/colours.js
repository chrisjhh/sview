export const colorchart = [
  '#000000', // 0 - Black
  '#404040', // 1 - Grey
  '#800080', // 2 - Purple
  '#990000', // 3 - red
  '#cc6600', // 4 - orange
  '#e6e600', // 5 - yellow
  '#39e600', // 6 - green
  '#00e6e6', // 7 - blue
  '#0080ff', // 8 - blue
  '#531aff', // 9 - blue
  '#9933ff', // 10 - purple
  '#ff4dff', // 11 - pink
  '#ff99e6', // 12 - pink
  '#f2d9df', // 13 - pink
  '#f5efef', // 14 - pink
  '#ffffff', // 15 - white
];

export const paceColor = function(pace) {
  if (pace > 12) {
    return colorchart[0];
  }
  if (pace > 11) {
    return colorchart[1];
  }
  if (pace > 10) {
    return colorchart[2];
  }
  if (pace > 9.5) {
    return colorchart[3];
  }
  if (pace > 9) {
    return colorchart[4];
  }
  if (pace > 8.5) {
    return colorchart[5];
  }
  if (pace > 8) {
    return colorchart[6];
  }
  if (pace > 7.5) {
    return colorchart[7];
  }
  if (pace > 7) {
    return colorchart[8];
  }
  if (pace > 6.5) {
    return colorchart[9];
  }
  if (pace > 6) {
    return colorchart[10];
  }
  if (pace > 5.5) {
    return colorchart[11];
  }
  if (pace > 5) {
    return colorchart[12];
  }
  if (pace > 4.5) {
    return colorchart[13];
  }
  if (pace > 4) {
    return colorchart[14];
  }
  return colorchart[15];
};

export const hrColor = function(bpm) {
  const rest = 54;
  const max = 188;
  const reserve = max - rest;
  const z1 = rest + 0.5 * reserve;
  const z2 = rest + 0.75 * reserve;
  const z3 = rest + 0.85 * reserve;
  const z4 = rest + 0.9 * reserve;
  const z5 = rest + 0.95 * reserve;
  if (bpm < z1) {
    return '#0040ff';
  }
  if (bpm < z2) {
    return '#00ffff';
  }
  if (bpm < z3) {
    return '#40ff00';
  }
  if (bpm < z4) {
    return '#ffff00';
  }
  if (bpm < z5) {
    return '#ff8000';
  }
  return '#ff0000';
};

export const cadenceColor = function(spm) {
  if (spm < 60) {
    return colorchart[0];
  }
  if (spm < 65) {
    return colorchart[1];
  }
  if (spm < 70) {
    return colorchart[2];
  }
  if (spm < 75) {
    return colorchart[3];
  }
  if (spm < 80) {
    return colorchart[4];
  }
  if (spm < 85) {
    return colorchart[5];
  }
  if (spm < 90) {
    return colorchart[6];
  }
  if (spm < 95) {
    return colorchart[7];
  }
  if (spm < 100) {
    return colorchart[8];
  }
  if (spm < 105) {
    return colorchart[9];
  }
  if (spm < 110) {
    return colorchart[10];
  }
  return colorchart[11];
};

export const efficiencyColor = function(hpm) {
  if (hpm > 1800) {
    return colorchart[0];
  }
  if (hpm > 1700) {
    return colorchart[1];
  }
  if (hpm > 1600) {
    return colorchart[2];
  }
  if (hpm > 1500) {
    return colorchart[3];
  }
  if (hpm > 1400) {
    return colorchart[4];
  }
  if (hpm > 1300) {
    return colorchart[5];
  }
  if (hpm > 1200) {
    return colorchart[6];
  }
  if (hpm > 1100) {
    return colorchart[7];
  }
  if (hpm > 1000) {
    return colorchart[8];
  }
  if (hpm > 900) {
    return colorchart[9];
  }
  if (hpm > 800) {
    return colorchart[10];
  }
  if (hpm > 700) {
    return colorchart[11];
  }
  if (hpm > 600) {
    return colorchart[12];
  }
  if (hpm > 500) {
    return colorchart[13];
  }
  if (hpm > 400) {
    return colorchart[14];
  }
  return colorchart[15];
};