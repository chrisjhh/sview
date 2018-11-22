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
    const x = this.margins[3] + (xdata - this.min_x) * xscale;
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
    this.drawLine();
  }

  colourGraph(colourFn,smoothTol) {
    let col = null;
    let lastyval = null;
    let datapoints = [];
    for (let i=0; i<this.xdata.length; ++i) {
      const xval = this.xdata[i];
      const yval = this.ydata[i];
      if (xval == null || yval == null) {
        continue;
      }
      const [x, y] = this.plot(xval,yval);
      let icol = colourFn(yval);
      if (col === null) {
        col = icol;
        lastyval = yval;
      }
      if (icol === col) {
        datapoints.push([x,y]);
        lastyval = yval;
      } else if (Math.abs(yval - lastyval) < smoothTol) {
        datapoints.push([x,y]);
      } else {
        if (datapoints.length > 0) {
          datapoints.push([x,y]);
          this.drawPoly(col,datapoints);
        }
        datapoints = [];
        datapoints.push([x,y]);
        col = icol;
        lastyval = yval;
      }
    }
    if (datapoints.length > 1) {
      this.drawPoly(col,datapoints);
    }
  }

  drawPoly(colour,points) {
    const ctx = this.canvas.getContext('2d');
    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.moveTo(points[0][0], this.height - this.margins[2]);
    points.forEach(p => {
      ctx.lineTo(p[0],p[1]);
    });
    ctx.lineTo(points[points.length - 1][0], this.height - this.margins[2]);
    ctx.closePath();
    ctx.fill();
  }

  drawLine() {
    const ctx = this.canvas.getContext('2d');
    ctx.beginPath();
    let first = true;
    for (let i=0; i<this.xdata.length; ++i) {
      const xval = this.xdata[i];
      const yval = this.ydata[i];
      if (xval == null || yval == null) {
        continue;
      }
      const [x, y] = this.plot(xval,yval);
      if (first) {
        ctx.moveTo(x,y);
        first = false;
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