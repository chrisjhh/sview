// A class for displaying graphs on an html canvas

export class Graph {
  constructor(canvasID) {
    this.canvas =  document.getElementById(canvasID);
    this.margins = [5.0,5.0,5.0,5.0]; // T, R, B, L.
  }

  setXData(data) {
    this.xdata = data;
  }

  setYData(data) {
    this.ydata = data;
  }

  canvasPosFromMouseEvent(e) {
    let pos = {};
    if (e.pageX || e.pageY) { 
      pos.x = e.pageX;
      pos.y = e.pageY;
    } else { 
      pos.x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft; 
      pos.y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop; 
    } 
    pos.x -= this.canvas.offsetLeft;
    pos.y -= this.canvas.offsetTop;
    return pos;
  }
}