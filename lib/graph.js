// A class for displaying graphs on an html canvas

export class Graph {
  constructor(canvasID) {
    this.canvas =  document.getElementById(canvasID);
    this.margins = [5.0,5.0,5.0,5.0]; // T, R, B, L.
    this.width = this.canvas.clientWidth;
    this.height = this.canvas.clientHeight;
  }

  setXData(data) {
    this.xdata = data;
    if (data) {
      this.max_x = data.reduce((acc,cur) => Math.max(acc,cur));
      this.min_x = data.reduce((acc,cur) => Math.min(acc,cur));
    } else {
      delete this.max_x;
      delete this.min_x;
    }
  }

  setYData(data) {
    this.ydata = data;
    if (data) {
      this.max_y = data.reduce((acc,cur) => Math.max(acc,cur));
      this.min_y = data.reduce((acc,cur) => Math.min(acc,cur));
    } else {
      delete this.max_y;
      delete this.min_y;
    }
  }

  plot(xdata,ydata) {
    const xscale = (this.width - this.margins[1] - this.margins[3]) / (this.max_x - this.min_x);
    const x = this.margins[3] + (xdata - this.min_x) * xscale/2;
    const yscale = (this.height - this.margins[0] - this.margins[2]) / (this.max_y - this.min_y);
    const y = this.margins[2] + (ydata - this.min_y) * yscale;
    const ydown = this.height - y;
    return [x,ydown];
  }

  clear() {
    const ctx = this.canvas.getContext('2d');
    ctx.clearRect(0,0,this.width, this.height);
  }

  draw() {
    if (!this.xdata || this.xdata.length < 2) {
      throw new Error('x-data not set');
    }
    if (!this.ydata || this.ydata.length < 2) {
      throw new Error('y-data not set');
    }
    if (this.xdata.length !== this.ydata.length) {
      throw new Error('Mismatched x & y data length');
    }
    const ctx = this.canvas.getContext('2d');
    ctx.beginPath();
    for (let i=0; i<this.xdata.length; ++i) {
      const xval = this.xdata[i];
      const yval = this.ydata[i];
      const [x, y] = this.plot(xval,yval);
      if (i === 0) {
        ctx.moveTo(x,y);
      } else {
        ctx.lineTo(x,y);
      }
    }
    ctx.stroke();
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