class Math2D {

    public static StepFromToCirular(from: number, to: number, step: number = Math.PI / 30): number {
        while (from < 0) {
            from += 2 * Math.PI;
        }
        while (from >= 2 * Math.PI) {
            from -= 2 * Math.PI;
        }
        while (to < 0) {
            to += 2 * Math.PI;
        }
        while (to >= 2 * Math.PI) {
            to -= 2 * Math.PI;
        }
        if (Math.abs(to - from) <= step) {
            return to;
        }
        if (Math.abs(to - from) >= 2 * Math.PI - step) {
            return to;
        }
        if (to - from >= 0) {
            if (Math.abs(to - from) <= Math.PI) {
                return from + step;
            }
            return from - step;
        }
        if (to - from < 0) {
            if (Math.abs(to - from) <= Math.PI) {
                return from - step;
            }
            return from + step;
        }
    }

    public static Dot(vector1: BABYLON.Vector2, vector2: BABYLON.Vector2): number {
        return vector1.x * vector2.x + vector1.y * vector2.y;
    }

    public static DistanceSquared(from: BABYLON.Vector2, to: BABYLON.Vector2): number {
        return (from.x - to.x) * (from.x - to.x) + (from.y - to.y) * (from.y - to.y);
    }

    public static Distance(from: BABYLON.Vector2, to: BABYLON.Vector2): number {
        return Math.sqrt(Math2D.DistanceSquared(from, to));
    }

    public static AngleFromTo(from: BABYLON.Vector2, to: BABYLON.Vector2, keepPositive: boolean = false): number {
        let dot = Math2D.Dot(from, to) / from.length() / to.length();
        let angle = Math.acos(dot);
        let cross = from.x * to.y - from.y * to.x;
        angle *= Math.sign(cross);
        if (keepPositive && angle < 0) {
            angle += Math.PI * 2;
        }
        return angle;
    }

    public static RotateInPlace(vector: BABYLON.Vector2, alpha: number): void {
        let x = Math.cos(alpha) * vector.x - Math.sin(alpha) * vector.y;
        let y = Math.cos(alpha) * vector.y + Math.sin(alpha) * vector.x;
        vector.x = x;
        vector.y = y;
    }

    private static __Tmp0: BABYLON.Vector2;
    public static get _Tmp0(): BABYLON.Vector2 {
        if (!Math2D.__Tmp0) {
            Math2D.__Tmp0 = new BABYLON.Vector2(1, 0);
        }
        return Math2D.__Tmp0;
    }
    private static __Tmp1: BABYLON.Vector2;
    public static get _Tmp1(): BABYLON.Vector2 {
        if (!Math2D.__Tmp1) {
            Math2D.__Tmp1 = new BABYLON.Vector2(1, 0);
        }
        return Math2D.__Tmp1;
    }
    private static __Tmp2: BABYLON.Vector2;
    public static get _Tmp2(): BABYLON.Vector2 {
        if (!Math2D.__Tmp2) {
            Math2D.__Tmp2 = new BABYLON.Vector2(1, 0);
        }
        return Math2D.__Tmp2;
    }
    private static __Tmp3: BABYLON.Vector2;
    public static get _Tmp3(): BABYLON.Vector2 {
        if (!Math2D.__Tmp3) {
            Math2D.__Tmp3 = new BABYLON.Vector2(1, 0);
        }
        return Math2D.__Tmp3;
    }
    public static PointSegmentABDistanceSquared(point: BABYLON.Vector2, segA: BABYLON.Vector2, segB: BABYLON.Vector2): number {
        Math2D._Tmp0.copyFrom(segB).subtractInPlace(segA).normalize();
        Math2D._Tmp1.copyFrom(point).subtractInPlace(segA);
        let projectionDistance = Math2D.Dot(Math2D._Tmp1, Math2D._Tmp0);
        if (projectionDistance < 0) {
            return Math2D.DistanceSquared(point, segA);
        }
        if (projectionDistance * projectionDistance > Math2D.DistanceSquared(segB, segA)) {
            return Math2D.DistanceSquared(point, segB);
        }
        Math2D._Tmp0.scaleInPlace(projectionDistance);
        return Math2D.Dot(Math2D._Tmp1, Math2D._Tmp1) - Math2D.Dot(Math2D._Tmp0, Math2D._Tmp0);
    }

    public static PointSegmentAxAyBxByDistanceSquared(point: BABYLON.Vector2, segAx: number, segAy: number, segBx: number, segBy: number): number {
        Math2D._Tmp2.x = segAx;
        Math2D._Tmp2.y = segAy;
        Math2D._Tmp3.x = segBx;
        Math2D._Tmp3.y = segBy;
        return Math2D.PointSegmentABDistanceSquared(point, Math2D._Tmp2, Math2D._Tmp3);
    }

    public static PointSegmentABUDistanceSquared(point: BABYLON.Vector2, segA: BABYLON.Vector2, segB: BABYLON.Vector2, u: BABYLON.Vector2): number {
        Math2D._Tmp1.copyFrom(point).subtractInPlace(segA);
        let projectionDistance = Math2D.Dot(Math2D._Tmp1, u);
        if (projectionDistance < 0) {
            return Math2D.DistanceSquared(point, segA);
        }
        if (projectionDistance * projectionDistance > Math2D.DistanceSquared(segB, segA)) {
            return Math2D.DistanceSquared(point, segB);
        }
        Math2D._Tmp0.copyFrom(u).scaleInPlace(projectionDistance);
        return Math2D.Dot(Math2D._Tmp1, Math2D._Tmp1) - Math2D.Dot(Math2D._Tmp0, Math2D._Tmp0);
    }

    public static IsPointInSegment(point: BABYLON.Vector2, segA: BABYLON.Vector2, segB: BABYLON.Vector2): boolean {
        if ((point.x - segA.x) * (segB.x - segA.x) + (point.y - segA.y) * (segB.y - segA.y) < 0) {
            return false;
        }
        if ((point.x - segB.x) * (segA.x - segB.x) + (point.y - segB.y) * (segA.y - segB.y) < 0) {
            return false;
        }
        return true;
    }

    public static IsPointInRay(point: BABYLON.Vector2, rayOrigin: BABYLON.Vector2, rayDirection: BABYLON.Vector2): boolean {
        if ((point.x - rayOrigin.x) * rayDirection.x + (point.y - rayOrigin.y) * rayDirection.y < 0) {
            return false;
        }
        return true;
    }

    public static IsPointInRegion(point: BABYLON.Vector2, region: number[][]): boolean {
        let count = 0;
        let randomDir = Math.random() * Math.PI * 2;
        Math2D._Tmp0.x = Math.cos(randomDir);
        Math2D._Tmp0.y = Math.sin(randomDir);
        for (let i = 0; i < region.length; i++) {
            Math2D._Tmp1.x = region[i][0];
            Math2D._Tmp1.y = region[i][1];
            Math2D._Tmp2.x = region[(i + 1) % region.length][0];
            Math2D._Tmp2.y = region[(i + 1) % region.length][1];
            if (Math2D.RaySegmentIntersection(point, Math2D._Tmp0, Math2D._Tmp1, Math2D._Tmp2)) {
                count++;
            }
        }
        return count % 2 === 1;
    }

    public static IsPointInPath(point: BABYLON.Vector2, path: BABYLON.Vector2[]): boolean {
        let count = 0;
        let randomDir = Math.random() * Math.PI * 2;
        Math2D._Tmp0.x = Math.cos(randomDir);
        Math2D._Tmp0.y = Math.sin(randomDir);
        for (let i = 0; i < path.length; i++) {
            if (Math2D.RaySegmentIntersection(point, Math2D._Tmp0, path[i], path[(i + 1) % path.length])) {
                count++;
            }
        }
        return count % 2 === 1;
    }

    public static SegmentShapeIntersection(segA: BABYLON.Vector2, segB: BABYLON.Vector2, shape: BABYLON.Vector2[]): BABYLON.Vector2[] {
        let intersections: BABYLON.Vector2[] = [];
        for (let i = 0; i < shape.length; i++) {
            let shapeA = shape[i];
            let shapeB = shape[(i + 1) % shape.length];
            let intersection = Math2D.SegmentSegmentIntersection(segA, segB, shapeA, shapeB);
            if (intersection) {
                intersections.push(intersection);
            }
        }
        return intersections;
    }

    /*
    public static IsPointInShape(point: BABYLON.Vector2, shape: IShape): boolean {
        for (let i = 0; i < shape.regions.length; i++) {
            let region = shape.regions[i];
            if (Math2D.IsPointInRegion(point, region)) {
                return true;
            }
        }
        return false;
    }
    */

    public static RaySegmentIntersection(rayOrigin: BABYLON.Vector2, rayDirection: BABYLON.Vector2, segA: BABYLON.Vector2, segB: BABYLON.Vector2): BABYLON.Vector2 {
        let x1: number = rayOrigin.x;
        let y1: number = rayOrigin.y;
        let x2: number = x1 + rayDirection.x;
        let y2: number = y1 + rayDirection.y;
        let x3: number = segA.x;
        let y3: number = segA.y;
        let x4: number = segB.x;
        let y4: number = segB.y;

        let det: number = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

        if (det !== 0) {
            let x: number = (x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4);
            let y: number = (x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4);
            let intersection = new BABYLON.Vector2(x / det, y / det);
            if (Math2D.IsPointInRay(intersection, rayOrigin, rayDirection)) {
                if (Math2D.IsPointInSegment(intersection, segA, segB)) {
                    return intersection;
                }
            }
        }
        return undefined;
    }

    public static SegmentSegmentIntersection(seg1A: BABYLON.Vector2, seg1B: BABYLON.Vector2, seg2A: BABYLON.Vector2, seg2B: BABYLON.Vector2): BABYLON.Vector2 {
        let x1: number = seg1A.x;
        let y1: number = seg1A.y;
        let x2: number = seg1B.x;
        let y2: number = seg1B.y;
        let x3: number = seg2A.x;
        let y3: number = seg2A.y;
        let x4: number = seg2B.x;
        let y4: number = seg2B.y;

        let det: number = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

        if (det !== 0) {
            let x: number = (x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4);
            let y: number = (x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4);
            let intersection = new BABYLON.Vector2(x / det, y / det);
            if (Math2D.IsPointInSegment(intersection, seg1A, seg1B)) {
                if (Math2D.IsPointInSegment(intersection, seg2A, seg2B)) {
                    return intersection;
                }
            }
        }
        return undefined;
    }

    public static PointRegionDistanceSquared(point: BABYLON.Vector2, region: number[][]): number {
        let minimalSquaredDistance: number = Infinity;
        for (let i = 0; i < region.length; i++) {
            Math2D._Tmp1.x = region[i][0];
            Math2D._Tmp1.y = region[i][1];
            Math2D._Tmp2.x = region[(i + 1) % region.length][0];
            Math2D._Tmp2.y = region[(i + 1) % region.length][1];
            let distSquared = Math2D.PointSegmentAxAyBxByDistanceSquared(
                point,
                region[i][0],
                region[i][1],
                region[(i + 1) % region.length][0],
                region[(i + 1) % region.length][1]
            );
            minimalSquaredDistance = Math.min(minimalSquaredDistance, distSquared);
        }
        return minimalSquaredDistance;
    }

    /*
    public static PointShapeDistance(point: BABYLON.Vector2, shape: IShape): number {
        let minimalSquaredDistance: number = Infinity;
        let minimalRegion: number[][];
        for (let i = 0; i < shape.regions.length; i++) {
            let region = shape.regions[i];
            let distSquared = Math2D.PointRegionDistanceSquared(point, region);
            if (distSquared < minimalSquaredDistance) {
                minimalSquaredDistance = distSquared;
                minimalRegion = region;
            }
        }
        let sign = 1;
        if (minimalRegion) {
            if (Math2D.IsPointInRegion(point, minimalRegion)) {
                sign = -1;
            }
        }
        return sign * Math.sqrt(minimalSquaredDistance);
    }

    public static ShapeShapeUnion(shape1: IShape, shape2: IShape): IShape {
        return PolyBool.union(shape1, shape2);
    }

    public static ShapeShapeIntersect(shape1: IShape, shape2: IShape): IShape {
        return PolyBool.intersect(shape1, shape2);
    }

    public static ShapeShapeSubtract(shape1: IShape, shape2: IShape): IShape {
        return PolyBool.difference(shape1, shape2);
    }
    */
}