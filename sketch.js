var leaf;
var data = {
  length:{min:0,max:500,start:250},
  detail:{min:10,max:25,start:15},
  widthScale:{min:0,max:2,start:0.65},
  curveHeight:{min:0,max:100,start:50},
  bendHeight:{min:0,max:100,start:50},
};

function setup(){
  createCanvas(800,800,WEBGL);
  var dir = createVector(1,0,0);
  var up = createVector(0,1,0);
  leaf = new Leaf(createVector(),dir,up);
  leaf.generate();
  for (var value in data)
  {
    data[value].slider = createSlider(data[value].min,data[value].max,data[value].start,0);
  }
}

function draw(){
  background(51);
  orbitControl(4,4);
  leaf.render();
  leaf.setValues(data);
}

function Leaf(pos,dir,up,length=250)
{
  this.pos = pos.copy();
  this.dir = dir.copy();
  this.up = up.copy();
  this.length = length;
  this.detail = 12;
  this.widthScale = 0.65;
  this.curveHeight = 20;
  this.bendHeight = 120;
  this.points = [];
  this.mesh = [];
  this.renderMode = 'MESH';

  this.render = function()
  {
    if (this.renderMode == 'POINTS')
    {
      push();
      stroke(255,0,0);
      beginShape(POINTS);
      for (var i = this.points.length-1; i >= 0; i--)
      {
        vertex(this.points[i].pos.x,this.points[i].pos.y,this.points[i].pos.z);
      }
      endShape();
      pop();
    } else if (this.renderMode == 'MESH')
    {
      for (var i = this.mesh.length-1; i >= 0; i--)
      {
        var avg = this.mesh[i].vertices[0].copy();
        for (var j = this.mesh[i].vertices.length-1; j > 0; j--)
        {
          avg.add(this.mesh[i].vertices[j].copy());
        }
        avg.div(this.mesh[i].vertices.length);
        push();
        fill(124-abs(avg.z), 199-abs(avg.z)/2-avg.x/4, 78-abs(avg)/2);
        noStroke();
        beginShape();
        for (var j = this.mesh[i].vertices.length-1; j >= 0; j--)
        {
          vertex(this.mesh[i].vertices[j].x,this.mesh[i].vertices[j].y,this.mesh[i].vertices[j].z);
        }
        endShape(CLOSE);
        pop();
      }
    }
  }

  this.generate = function()
  {
    this.generatePoints();
    this.generateMesh();
  }

  this.generatePoints = function()
  {
    this.points = [];
    var left = rotate3D(this.dir.copy(),this.up,-PI/2);
    for (var i = 0; i <= this.length; i+=this.detail)
    {
      var pos = this.pos.copy().add(this.dir.copy().setMag(i));
      pos.add(this.up.copy().setMag(-sin((i/this.length)*PI*0.5+PI)*this.bendHeight));
      var w = constrain(sin((i/this.length)*PI)*this.length*this.widthScale,0,this.length*this.widthScale);
      var points = round(w/this.detail);
      if (points%2==0)
      {
        points++;
      }
      var index = createVector(floor(i/this.detail),-points/2);
      for (var j = 0; j < points; j++)
      {
        var value = map(j,0,points-1,-w/2,w/2);
        var v = left.copy().setMag(value).add(this.getCurve(abs(value/(w/2)),1-i/this.length));
        v.add(pos);
        this.points.push({pos:v,index:index.copy()});
        index.y++;
      }
    }
  }

  this.generateMesh = function()
  {
    this.mesh = [];
    var grid = [];
    var maxIndex = createVector();
    var minIndex = createVector();
    for (var k = 0; k < this.points.length; k++)
    {
      if (this.points[k].index.x > maxIndex.x)
      {
        maxIndex.x = this.points[k].index.x;
      }
      if (this.points[k].index.y > maxIndex.y)
      {
        maxIndex.y = this.points[k].index.y;
      }
      if (this.points[k].index.x < minIndex.x)
      {
        minIndex.x = this.points[k].index.x;
      }
      if (this.points[k].index.y < minIndex.y)
      {
        minIndex.y = this.points[k].index.y;
      }
    }
    for (var i = 0; i <= maxIndex.x-minIndex.x; i++)
    {
      grid.push([]);
      for (var j = 0; j <= maxIndex.y-minIndex.y; j++)
      {
        grid[i][j] = null;
      }
    }
    for (var k = 0; k < this.points.length; k++)
    {
      var i_ = this.points[k].index.x-minIndex.x;
      var j_ = this.points[k].index.y-minIndex.y;
      grid[i_][j_] = this.points[k].pos;
    }
    for (var i = 0; i < grid.length-1; i++)
    {
      for (var j = 0; j < grid[i].length-1; j++)
      {
        var vertices = [];
        if (grid[i][j] != null)
        {
          vertices.push(grid[i][j]);
        }
        if (grid[i+1][j] != null)
        {
          vertices.push(grid[i+1][j]);
        }
        if (grid[i+1][j+1] != null)
        {
          vertices.push(grid[i+1][j+1]);
        }
        if (grid[i][j+1] != null)
        {
          vertices.push(grid[i][j+1]);
        }
        if (vertices.length > 1)
        {
          if (vertices.length == 4)
          {
            this.mesh.push({
              vertices:[vertices[0],vertices[1],vertices[3]],
            });
            this.mesh.push({
              vertices:[vertices[1],vertices[2],vertices[3]],
            });
          } else
          {
            this.mesh.push({
              vertices,
            });
          }
        }
      }
    }
  }

  this.getCurve = function(value,mult)
  {
    var v = this.up.copy().setMag(sin(value*PI+PI/2)*this.curveHeight*mult);
    return v;
  }

  this.setValues = function(data)
  {
    for (var value in data)
    {
      if (this[value] != data[value].slider.value())
      {
        this[value] = data[value].slider.value();
        this.generate();
      }
    }
  }
}

function rotate3D(vect, axis, angle) {
  axis = p5.Vector.normalize(axis);
  return p5.Vector.add(
    p5.Vector.mult(vect, cos(angle)),
    p5.Vector.add(
      p5.Vector.mult(
        p5.Vector.cross(axis, vect),
        sin(angle)
      ),
      p5.Vector.mult(
        p5.Vector.mult(
          axis,
          p5.Vector.dot(axis, vect)
        ),
        (1 - cos(angle))
      )
    )
  );
}

function makeDivisible(number,target)
{
  var a = round(number);
  var b = a;
  while (true)
  {
    if (a % target !== 0)
    {
      return a;
    } else if (b % target !== 0)
    {
      return b;
    }
    a--;
    b++;
  }
}
