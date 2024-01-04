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

export const monthDifference = function(date1, date2) {
  const y1 = date1.getFullYear();
  const y2 = date2.getFullYear();
  const m1 = date1.getMonth();
  const m2 = date2.getMonth();
  return (y2 - y1)*12 + (m2 - m1);
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
  if (date.getFullYear() != now.getFullYear() && monthDifference(date, now) > 3) {
    const year = ' ' + date.getFullYear();
    return `${weekday} ${day} ${month}${year}`;
  }
  return `${hour.toString().padStart(2,'0')}:${min.toString().padStart(2,'0')} ${weekday} ${day} ${month}`;
};
