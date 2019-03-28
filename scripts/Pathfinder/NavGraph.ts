class NavGraph {

    public path: NavGraphPoint[];
    public start: NavGraphPoint;
    public end: NavGraphPoint;
    public points: NavGraphPoint[];
    public obstacles: Obstacle[] = [];

    public setStart(s: BABYLON.Vector2): void {
        if (!this.start) {
            this.start = new NavGraphPoint(0, undefined);
        }
        this.start.position = s;
    }

    public setEnd(e: BABYLON.Vector2): void {
        if (!this.end) {
            this.end = new NavGraphPoint(1, undefined);
        }
        this.end.position = e;
    }

    public update(): void {
        this.points = [this.start, this.end];
        let counter = 2;
        for (let i = 0; i < this.obstacles.length; i++) {
            let o = this.obstacles[i];
            let ngPoints = [];
            for (let j = 0; j < o.shape.length; j++) {
                let ngPoint = new NavGraphPoint(counter++, o.shape);
                ngPoint.position = o.shape[j];
                ngPoints.push(ngPoint);
            }
            for (let j = 0; j < ngPoints.length; j++) {
                NavGraphPoint.Connect(ngPoints[j], ngPoints[(j + 1) % ngPoints.length]);
            }
            this.points.push(...ngPoints);
        }
        for (let i = 0; i < this.points.length; i++) {
            for (let j = i + 1; j < this.points.length; j++) {
                let p1 = this.points[i];
                let p2 = this.points[j];
                if (p1.shape !== p2.shape || (!p1.shape && !p2.shape)) {
                    let d = p2.position.subtract(p1.position);
                    // Check if segment intersects p1.shape
                    let p1ShapeSelfIntersect = true;
                    if (p1.shape) {
                        let index = p1.shape.indexOf(p1.position);
                        let sNext = p1.shape[(index + 1) % p1.shape.length].subtract(p1.position);
                        let sPrev = p1.shape[(index - 1 + p1.shape.length) % p1.shape.length].subtract(p1.position);
                        if (Math2D.AngleFromTo(sPrev, d, true) <= Math2D.AngleFromTo(sPrev, sNext, true)) {
                            p1ShapeSelfIntersect = false;
                        }
                    }
                    else {
                        p1ShapeSelfIntersect = false;
                    }
                    if (!p1ShapeSelfIntersect) {
                        // Check if segment intersects p2.shape
                        d.scaleInPlace(-1);
                        let p2ShapeSelfIntersect = true;
                        if (p2.shape) {
                            let index = p2.shape.indexOf(p2.position);
                            let sNext = p2.shape[(index + 1) % p2.shape.length].subtract(p2.position);
                            let sPrev = p2.shape[(index - 1 + p2.shape.length) % p2.shape.length].subtract(p2.position);
                            if (Math2D.AngleFromTo(sPrev, d, true) <= Math2D.AngleFromTo(sPrev, sNext, true)) {
                                p2ShapeSelfIntersect = false;
                            }
                        }
                        else {
                            p2ShapeSelfIntersect = false;
                        }
                        if (!p2ShapeSelfIntersect) {
                            let crossOtherShape = false;
                            for (let i = 0; i < this.obstacles.length; i++) {
                                let o = this.obstacles[i];
                                if (o.shape !== p1.shape && o.shape !== p2.shape) {
                                    for (let j = 0; j < o.shape.length; j++) {
                                        let s1 = o.shape[j];
                                        let s2 = o.shape[(j + 1) % o.shape.length];
                                        if (Math2D.SegmentSegmentIntersection(p1.position, p2.position, s1, s2)) {
                                            crossOtherShape = true;
                                        }
                                    }
                                }
                            }
                            if (!crossOtherShape) {
                                NavGraphPoint.Connect(p1, p2);
                            }
                        }
                    }
                }
            }
        }
        this.end.distanceToEnd = 0;
        this.end.propagateDistanceToEnd();
        this.path = [this.start];
        this.start.appendNextPathPoint(this.path); 
    }

    public display(scene: BABYLON.Scene): void {
        for (let i = 0; i < this.points.length; i++) {
            let p = this.points[i];
            BABYLON.MeshBuilder.CreateSphere("p-" + i, { diameter: 0.1 }, scene).position.copyFromFloats(p.position.x, - 0.2, p.position.y);
            for (let j = 0; j < p.neighbourgs.length; j++) {
                let p2 = p.neighbourgs[j];
                if (p.index < p2.index) {
                    BABYLON.MeshBuilder.CreateLines(
                        "line",
                        { 
                            points: [
                                new BABYLON.Vector3(p.position.x, - 0.1, p.position.y),
                                new BABYLON.Vector3(p2.position.x, - 0.1, p2.position.y)
                            ],
                            colors: [
                                new BABYLON.Color4(0.5, 0.5, 0.5, 1),
                                new BABYLON.Color4(0.5, 0.5, 0.5, 1)
                            ]
                        },
                        scene);
                }
            }
        }
        if (this.path) {
            let points: BABYLON.Vector3[] = [];
            let colors: BABYLON.Color4[] = [];
            for (let i = 0; i < this.path.length; i++) {
                let p = this.path[i];
                points.push(new BABYLON.Vector3(p.position.x, 0.1, p.position.y));
                colors.push(new BABYLON.Color4(1, 0, 0, 1));
            }
            BABYLON.MeshBuilder.CreateLines("shape", { points: points, colors: colors }, scene);
        }
    }
}