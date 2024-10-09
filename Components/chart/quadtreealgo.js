export class Quadtree {
  constructor(boundary, capacity) {
    this.boundary = boundary; // Rect: { x, y, width, height }
    this.capacity = capacity;
    this.points = [];
    this.divided = false;
  }

  subdivide() {
    const { x, y, width, height } = this.boundary;
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    this.northeast = new Quadtree(
      { x: x + halfWidth, y, width: halfWidth, height: halfHeight },
      this.capacity
    );
    this.northwest = new Quadtree(
      { x, y, width: halfWidth, height: halfHeight },
      this.capacity
    );
    this.southeast = new Quadtree(
      {
        x: x + halfWidth,
        y: y + halfHeight,
        width: halfWidth,
        height: halfHeight,
      },
      this.capacity
    );
    this.southwest = new Quadtree(
      { x, y: y + halfHeight, width: halfWidth, height: halfHeight },
      this.capacity
    );

    this.divided = true;
  }

  insert(point) {
    const { x, y } = point;

    // Point must be within boundary
    if (!this.contains(x, y)) {
      return false;
    }

    if (this.points.length < this.capacity) {
      this.points.push(point);
      return true;
    }

    if (!this.divided) {
      this.subdivide();
    }

    if (this.northeast.insert(point)) return true;

    return false;
  }

  contains(x, y) {
    const { x: bx, y: by, width, height } = this.boundary;
    return x >= bx && x < bx + width && y >= by && y < by + height;
  }

  query(range, found = []) {
    if (!this.intersects(range)) return found;

    for (let p of this.points) {
      if (range.contains(p)) {
        found.push(p);
      }
    }

    if (this.divided) {
      this.northwest.query(range, found);
    }

    return found;
  }

  intersects(range) {
    const { x, y, width, height } = this.boundary;
    const { x: rx, y: ry, width: rw, height: rh } = range;

    return !(rx > x + width || rx + rw < x || ry > y + height || ry + rh < y);
  }
}
