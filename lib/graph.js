import { duration } from './duration';

// A class for displaying graphs on an html canvas
const consolodate = function(array) {
  const newArray = [];
  array.forEach(x => {
    const entry = [Math.round(x[0]),x[1]];
    if (newArray.length === 0 || newArray[newArray.length - 1][0] !== entry[0]) {
      newArray.push(entry);
    }
    newArray[newArray.length - 1][1] = Math.max(newArray[newArray.length - 1][1], entry[1]);
  });
  return newArray;
};

export class Graph {
  constructor(canvasID) {
    this.canvas =  document.getElementById(canvasID);
    this.margins = [5.0,5.0,5.0,5.0]; // T, R, B, L.
    this.width = this.canvas.clientWidth;
    this.height = this.canvas.clientHeight;

    this.canvas.onmousemove = this.onMouseMove.bind(this);
    this.canvas.onmouseout = this.onMouseOut.bind(this);
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

  /**
   * @param {number} val
   */
  set bottomMargin(val) {
    this.margins[2] = val;
  }

  get bottomMargin() {
    return this.margins[2];
  }

  /**
   * @param {number} val
   */
  set leftMargin(val) {
    this.margins[3] = val;
  }

  get leftMargin() {
    return this.margins[3];
  }

  setXLabels(type) {
    if (type != null) {
      this.bottomMargin = 12;
    }
    this.xlabel = type;
  }

  setYLabels(type) {
    if (type != null) {
      this.leftMargin = 24;
    }
    this.ylabel = type;
  }

  plot(xdata,ydata) {
    const xscale = (this.width - this.margins[1] - this.margins[3]) / (this.max_x - this.min_x);
    const x = this.margins[3] + (xdata - this.min_x) * xscale;
    const yscale = (this.height - this.margins[0] - this.margins[2]) / (this.max_y - this.min_y);
    const y = this.margins[2] + (ydata - this.min_y) * yscale;
    const ydown = this.height - y;
    return [x,ydown];
  }

  evaluate(x) {
    const dx = x - this.leftMargin;
    const scale = (this.max_x - this.min_x) / (this.width - this.margins[1] - this.margins[3]);
    return dx * scale;
  }

  clear() {
    const ctx = this.canvas.getContext('2d');
    ctx.clearRect(0,0,this.width, this.height);
    this.bottomMargin = 5;
    this.leftMargin = 5;
    delete this.xlabel;
    delete this.ylabel;
    if (this.slice) {
      delete this.slice;
    }
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
      let icol = colourFn(yval,i);
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

  drawPoly(colour,rawpoints) {
    const points = consolodate(rawpoints);
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
    ctx.strokeStyle = 'black';
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

  drawVerticalLine(x) {
    const ctx = this.canvas.getContext('2d');
    this.restoreSlice();
    if (x > this.leftMargin) {
      this.saveSlice(x);
      ctx.strokeStyle = '#A0A0A0';
      ctx.beginPath();
      ctx.moveTo(x,this.height - this.bottomMargin);
      ctx.lineTo(x,0);
      ctx.stroke();
    }
  }

  saveSlice(x) {
    const ctx = this.canvas.getContext('2d');
    this.slice = [x,ctx.getImageData(x-1, 0, 3, this.height - this.bottomMargin + 1)];
  }

  restoreSlice() {
    if (this.slice) {
      const ctx = this.canvas.getContext('2d');
      let [x, data] = this.slice;
      ctx.putImageData(data, x-1, 0);
      delete this.slice;
    }
  }

  onMouseMove(e) {
    let pos = this.canvasPosFromMouseEvent(e);
    if (pos.x > this.leftMargin && pos.x < this.width - this.margins[1]) {
      this.drawVerticalLine(pos.x);
      if (this.moveHook && typeof this.moveHook === 'function') {
        this.moveHook(this.evaluate(pos.x),pos);
      }
    } else {
      this.restoreSlice();
    }
  }

  onMouseOut() {
    this.restoreSlice();
    if (this.outHook && typeof this.outHook === 'function') {
      this.outHook();
    }
  }

  drawAxes() {
    const ctx = this.canvas.getContext('2d');
    ctx.strokeStyle = 'black';
    if (this.xlabel != null) {
      ctx.beginPath();
      const [x0, y0] = this.plot(this.min_x,this.min_y);
      ctx.moveTo(x0,y0);
      const [x1, y1] = this.plot(this.max_x,this.min_y);
      ctx.lineTo(x1,y1);
      
      const m_per_mile = 1609.34;
      ctx.font = '8px sans-serif';
      ctx.fillStyle = 'black';
      switch(this.xlabel) {
        case 'distance':
          for (let marker=1; marker * m_per_mile < this.max_x; ++marker) {
            const [xn,yn] = this.plot(marker * m_per_mile, this.min_y);  
            ctx.moveTo(xn,yn);
            ctx.lineTo(xn,yn + 3);
            ctx.fillText(marker.toString(),xn-2,yn+8+2);
          }
          break;
        case 'time': {
          let gap = 600;
          if (this.max_x < gap) {
            gap = 60;
          }
          for (let marker=1; marker * gap < this.max_x; ++marker) {
            const [xn,yn] = this.plot(marker * gap, this.min_y);  
            ctx.moveTo(xn,yn);
            ctx.lineTo(xn,yn + 3);
            ctx.fillText(duration(marker * gap),xn-10,yn+8+2);
          }
          break;
        }

      }
      ctx.stroke();
    }
    if (this.ylabel != null) {
      ctx.beginPath();
      const [x0, y0] = this.plot(this.min_x,this.min_y);
      ctx.moveTo(x0,y0);
      const [x1, y1] = this.plot(this.min_x,this.max_y);
      ctx.lineTo(x1,y1);
      ctx.font = '8px sans-serif';
      ctx.fillStyle = 'black';
      switch(this.ylabel) {
        case 'pace':
          for (let marker=1;-marker > this.min_y; ++marker) {
            if (-marker > this.max_y) {
              continue;
            }
            if (this.min_y < -20 && marker % 5 !== 0) {
              continue;
            }
            const [xn,yn] = this.plot(this.min_x, -marker); 
            ctx.moveTo(xn,yn);
            ctx.lineTo(xn-3,yn);
            let xoffset = 20;
            if (marker > 9) {
              xoffset += 4;
            }
            ctx.fillText(`${marker}:00`,xn-xoffset,yn+3);
          }
          ctx.stroke();
          ctx.beginPath();
          ctx.setLineDash([2, 3]);
          ctx.strokeStyle = '#A0A0A0';
          for (let marker=1;-marker > this.min_y; ++marker) {
            if (-marker > this.max_y) {
              continue;
            }
            if (this.min_y < -20 && marker % 5 !== 0) {
              continue;
            }
            const [xn,yn] = this.plot(this.min_x, -marker);
            const [xm,ym] = this.plot(this.max_x, -marker);
            ctx.moveTo(xn,yn);
            ctx.lineTo(xm,ym);
          }
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.strokeStyle = 'black';
          break;
        case 'hr':
        case 'altitude':
          for (let hr=10; hr<this.max_y; hr+=10) {
            if (hr < this.min_y) {
              continue;
            }
            const [xn,yn] = this.plot(this.min_x, hr); 
            ctx.moveTo(xn,yn);
            ctx.lineTo(xn-3,yn);
            let xoffset = 20;
            ctx.fillText(hr.toString(),xn-xoffset,yn+3);
          }
          // Show max and min altitudes too
          if (this.ylabel === 'altitude') {
            [Math.ceil(this.min_y),Math.floor(this.max_y)].forEach(y => {
              const [xn,yn] = this.plot(this.min_x, y);
              let xoffset = 20;
              ctx.fillText(y.toString(),xn-xoffset,yn+3);
            });
          }
          ctx.stroke();
          ctx.beginPath();
          ctx.setLineDash([2, 3]);
          ctx.strokeStyle = '#A0A0A0';
          for (let hr=10; hr<this.max_y; hr+=10) {
            if (hr < this.min_y) {
              continue;
            }
            const [xn,yn] = this.plot(this.min_x, hr);
            const [xm,ym] = this.plot(this.max_x, hr);
            ctx.moveTo(xn,yn);
            ctx.lineTo(xm,ym);
          }
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.strokeStyle = 'black';
          break;
        case 'cadence':
          for (let cad=10; cad<this.max_y; cad+=5) {
            if (cad < this.min_y) {
              continue;
            }
            const [xn,yn] = this.plot(this.min_x, cad); 
            ctx.moveTo(xn,yn);
            ctx.lineTo(xn-3,yn);
            let xoffset = 20;
            if (cad < 50) {
              xoffset -= 4;
            }
            ctx.fillText((cad*2).toString(),xn-xoffset,yn+3);
          }
          ctx.stroke();
          ctx.beginPath();
          ctx.setLineDash([2, 3]);
          ctx.strokeStyle = '#A0A0A0';
          for (let cad=10; cad<this.max_y; cad+=5) {
            if (cad < this.min_y) {
              continue;
            }
            const [xn,yn] = this.plot(this.min_x, cad);
            const [xm,ym] = this.plot(this.max_x, cad);
            ctx.moveTo(xn,yn);
            ctx.lineTo(xm,ym);
          }
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.strokeStyle = 'black';
          break;  
      }
    }
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
    let offsetParent = this.canvas.offsetParent;
    while (offsetParent) {
      pos.x -= offsetParent.offsetLeft;
      pos.y -= offsetParent.offsetTop;
      offsetParent = offsetParent.offsetParent;
    }
    return pos;
  }
}
