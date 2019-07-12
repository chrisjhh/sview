export const duration = function(time) {
  let t = Math.round(time);
  let mins = Math.floor(t/60);
  let secs = t - mins * 60;
  let hours = 0;
  if (mins > 60) {
    hours = Math.floor(mins/60);
    mins = mins - 60 * hours;
    return `${hours}:${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
  }
  return `${mins}:${secs.toString().padStart(2,'0')}`;
};

export const hms = function(str) {
  const array = str.split(':');
  let value = 0;
  while (array.length) {
    value = 60 * value + Number(array.shift());
  }
  return value;
};

export const dateFormat = function(time) {
  const date = new Date(time);
  const day = date.getDate();
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug',
    'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()];
  const hour = date.getHours();
  const min = date.getMinutes();
  const now = new Date();
  if (date.getFullYear() != now.getFullYear()) {
    const year = ' ' + date.getFullYear();
    return `${weekday} ${day} ${month}${year}`;
  }
  return `${hour.toString().padStart(2,'0')}:${min.toString().padStart(2,'0')} ${weekday} ${day} ${month}`;
};
