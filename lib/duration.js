export const duration = function(time) {
  let mins = Math.floor(time/60);
  let secs = Math.round(time - mins * 60);
  let hours = 0;
  if (mins > 60) {
    hours = Math.floor(mins/60);
    mins = mins - 60 * hours;
    return `${hours}:${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
  }
  return `${mins}:${secs.toString().padStart(2,'0')}`;
};