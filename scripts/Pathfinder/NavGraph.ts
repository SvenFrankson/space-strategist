class NavGraph {

    public offset: number = 1;
    public path: BABYLON.Vector2[];
    public start: NavGraphPoint;
    public end: NavGraphPoint;
    public points: NavGraphPoint[];
    public obstacles: Obstacle[] = [];

    public setStart(s: BABYLON.Vector2): void {
        if (!this.start) {
            this.start = new NavGraphPoint(0, undefined, undefined);
        }
        this.start.position = s;
    }

    public setEnd(e: BABYLON.Vector2): void {
        if (!this.end) {
            this.end = new NavGraphPoint(1, undefined, undefined);
        }
        this.end.position = e;
    }

    public update(): void {
        this.points = [];
        let counter = 2;
        this.obstacles.forEach(
            (o) => {
                o.computePath(this.offset);
            }
        )
        for (let i = 0; i < this.obstacles.length; i++) {
            let o = this.obstacles[i];
            let path = o.getPath(this.offset);
            let ngPoints = [];
            for (let j = 0; j < path.length; j++) {
                let ngPoint = new NavGraphPoint(counter++, o, path);
                ngPoint.position = path[j];
                this.obstacles.forEach(
                    (otherObstacle) => {
                        if (otherObstacle !== o) {
                            if (Math2D.IsPointInPath(ngPoint.position, otherObstacle.getPath(this.offset))) {
                                ngPoint.unreachable = true;
                            }
                        }
                    }
                )
                ngPoints.push(ngPoint);
            }
            for (let j = 0; j < ngPoints.length; j++) {
                let p1 = ngPoints[j];
                let p2 = ngPoints[(j + 1) % ngPoints.length];
                if (!p1.unreachable && !p2.unreachable) {
                    let crossesAnotherShape: boolean = false;
                    for (let k = 0; k < this.obstacles.length; k++) {
                        let otherObstacle = this.obstacles[k];
                        if (o !== otherObstacle) {
                            let intersections = Math2D.SegmentShapeIntersection(p1.position, p2.position, otherObstacle.getPath(this.offset));
                            if (intersections.length > 0) {
                                crossesAnotherShape = true;
                                break;
                            }
                        }
                    }
                    if (!crossesAnotherShape) {
                        NavGraphPoint.Connect(p1, p2);
                    }
                }
                // Deal with case where [P1P2] crosses another shape
                
                if (!p1.unreachable) {
                    this.points.push(p1);
                }
            }
        }
        for (let i = 0; i < this.points.length; i++) {
            for (let j = i + 1; j < this.points.length; j++) {
                let p1 = this.points[i];
                let p2 = this.points[j];
                if (p1.path !== p2.path || (!p1.path && !p2.path)) {
                    let d = p2.position.subtract(p1.position);
                    // Check if segment intersects p1.shape
                    let p1ShapeSelfIntersect = true;
                    if (p1.path) {
                        let index = p1.path.indexOf(p1.position);
                        let sNext = p1.path[(index + 1) % p1.path.length].subtract(p1.position);
                        let sPrev = p1.path[(index - 1 + p1.path.length) % p1.path.length].subtract(p1.position);
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
                        if (p2.path) {
                            let index = p2.path.indexOf(p2.position);
                            let sNext = p2.path[(index + 1) % p2.path.length].subtract(p2.position);
                            let sPrev = p2.path[(index - 1 + p2.path.length) % p2.path.length].subtract(p2.position);
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
                                if (o !== p1.obstacle && o !== p2.obstacle) {
                                    let path = o.getPath(this.offset);
                                    for (let j = 0; j < path.length; j++) {
                                        let s1 = path[j];
                                        let s2 = path[(j + 1) % path.length];
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
    }

    public computePathFromTo(from: BABYLON.Vector2, to: BABYLON.Vector2): BABYLON.Vector2[] {
        this.setStart(from);
        this.setEnd(to);        
        this.points.push(this.start, this.end);
        let newPoints = [this.start, this.end];

        for (let i = 0; i < newPoints.length; i++) {
            let p1 = newPoints[i];
            for (let j = 0; j < this.points.length; j++) {
                let p2 = this.points[j];
                if (p1 !== p2 && (p1.path !== p2.path || (!p1.path && !p2.path))) {
                    let d = p2.position.subtract(p1.position);
                    // Check if segment intersects p1.shape
                    let p1ShapeSelfIntersect = true;
                    if (p1.path) {
                        let index = p1.path.indexOf(p1.position);
                        let sNext = p1.path[(index + 1) % p1.path.length].subtract(p1.position);
                        let sPrev = p1.path[(index - 1 + p1.path.length) % p1.path.length].subtract(p1.position);
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
                        if (p2.path) {
                            let index = p2.path.indexOf(p2.position);
                            let sNext = p2.path[(index + 1) % p2.path.length].subtract(p2.position);
                            let sPrev = p2.path[(index - 1 + p2.path.length) % p2.path.length].subtract(p2.position);
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
                                let path = o.getPath(this.offset);
                                if (o !== p1.obstacle && o !== p2.obstacle) {
                                    for (let j = 0; j < path.length; j++) {
                                        let s1 = path[j];
                                        let s2 = path[(j + 1) % path.length];
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
        this.path = [this.start.position];
        this.start.appendNextPathPoint(this.path);

        this.start.remove();
        this.end.remove();
        this.points.pop();
        this.points.pop();

        return this.path;
    }

    public display(scene: BABYLON.Scene): void {
        for (let i = 0; i < this.points.length; i++) {
            let p = this.points[i];
            BABYLON.MeshBuilder.CreateSphere("p-" + i, { diameter: 0.1 }, scene).position.copyFromFloats(p.position.x, - 0.2, p.position.y);
            for (let j = 0; j < p.links.length; j++) {
                let p2 = p.links[j].other(p);
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
                        scene
                    );
                }
            }
        }
        if (this.path) {
            let points: BABYLON.Vector3[] = [];
            let colors: BABYLON.Color4[] = [];
            for (let i = 0; i < this.path.length; i++) {
                let p = this.path[i];
                points.push(new BABYLON.Vector3(p.x, 0.1, p.y));
                colors.push(new BABYLON.Color4(1, 0, 0, 1));
            }
            BABYLON.MeshBuilder.CreateLines("shape", { points: points, colors: colors }, scene);
        }
    }
}