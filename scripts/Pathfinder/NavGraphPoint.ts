class NavGraphPoint {

    public index: number = 0;
    public shape: BABYLON.Vector2[] = [];
    public position: BABYLON.Vector2;
    public neighbourgs: NavGraphPoint[] = [];
    public distanceToEnd: number = Infinity;
    public unreachable: boolean = false;

    constructor(index: number, shape: BABYLON.Vector2[]) {
        this.index = index;
        this.shape = shape;
    }

    public propagateDistanceToEnd(): void {
        for (let i = 0; i < this.neighbourgs.length; i++) {
            let n = this.neighbourgs[i];
            let distanceToEnd = Math2D.Distance(this.position, n.position) + this.distanceToEnd;
            if (distanceToEnd < n.distanceToEnd) {
                n.distanceToEnd = distanceToEnd;
                n.propagateDistanceToEnd();
            }
        }
    }

    public appendNextPathPoint(path: NavGraphPoint[]): void {
        this.neighbourgs.sort((a, b) => { return (Math2D.Distance(this.position, a.position) + a.distanceToEnd) - (Math2D.Distance(this.position, b.position) + b.distanceToEnd); });
        if (this.neighbourgs[0]) {
            if (this.neighbourgs[0].distanceToEnd < Infinity) {
                path.push(this.neighbourgs[0]);
                if (this.neighbourgs[0].distanceToEnd > 0) {
                    this.neighbourgs[0].appendNextPathPoint(path);
                }
            }
        }
    }

    public static Connect(p1: NavGraphPoint, p2: NavGraphPoint): void {
        if (p1.neighbourgs.indexOf(p2) === -1) {
            p1.neighbourgs.push(p2);
        }
        if (p2.neighbourgs.indexOf(p1) === -1) {
            p2.neighbourgs.push(p1);
        }
    }
}