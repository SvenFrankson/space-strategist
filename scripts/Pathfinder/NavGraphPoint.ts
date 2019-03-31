class NavGraphLink {

    public p1: NavGraphPoint;
    public p2: NavGraphPoint;
    public length: number;

    public other(current: NavGraphPoint): NavGraphPoint {
        if (this.p1 === current) {
            return this.p2;
        }
        if (this.p2 === current) {
            return this.p1;
        }
        console.warn("Undefined request for other NavGraphPoint.");
        return undefined;
    }
}

class NavGraphPoint {

    public index: number = 0;
    public obstacle: Obstacle;
    public path: BABYLON.Vector2[] = [];
    public position: BABYLON.Vector2;
    public links: NavGraphLink[] = [];
    public distanceToEnd: number = Infinity;
    public unreachable: boolean = false;

    constructor(index: number, obstacle: Obstacle, shape: BABYLON.Vector2[]) {
        this.index = index;
        this.obstacle = obstacle;
        this.path = shape;
    }

    public remove(): void {
        while (this.links.length > 0) {
            let other = this.links[0].other(this);
            NavGraphPoint.Disconnect(this, other);
        }
    }

    public hasNeighbour(n: NavGraphPoint): NavGraphLink {
        for (let i = 0; i < this.links.length; i++) {
            if (this.links[i].other(this) === n) {
                return this.links[i];
            }
        }
        return undefined;
    }

    public propagateDistanceToEnd(): void {
        for (let i = 0; i < this.links.length; i++) {
            let n = this.links[i].other(this);
            let distanceToEnd = this.links[i].length + this.distanceToEnd;
            if (distanceToEnd < n.distanceToEnd) {
                n.distanceToEnd = distanceToEnd;
                n.propagateDistanceToEnd();
            }
        }
    }

    public appendNextPathPoint(path: BABYLON.Vector2[]): void {
        this.links.sort((l1, l2) => { return (l1.length + l1.other(this).distanceToEnd) - (l2.length + l2.other(this).distanceToEnd); });
        if (this.links[0]) {
            let other = this.links[0].other(this);
            if (other.distanceToEnd < Infinity) {
                path.push(other.position);
                if (other.distanceToEnd > 0) {
                    other.appendNextPathPoint(path);
                }
            }
        }
    }

    public static Connect(p1: NavGraphPoint, p2: NavGraphPoint): void {
        let link = new NavGraphLink();
        link.p1 = p1;
        link.p2 = p2;
        link.length = Math2D.Distance(p1.position, p2.position);
        let checkFineConnection = 0
        if (!p1.hasNeighbour(p2)) {
            p1.links.push(link);
            checkFineConnection++;
        }
        if (!p2.hasNeighbour(p1)) {
            p2.links.push(link);
            checkFineConnection++;
        }
        if (checkFineConnection % 2 !== 0) {
            console.warn("Connect between 2 NavGraphPoint went wrong : Only one was already connected to the other.");
        }
    }

    public static Disconnect(p1: NavGraphPoint, p2: NavGraphPoint): void {
        let l = p1.hasNeighbour(p2);
        if (l === p2.hasNeighbour(p1)) {
            let p1LIndex = p1.links.indexOf(l);
            let p2LIndex = p2.links.indexOf(l);
            p1.links.splice(p1LIndex, 1);
            p2.links.splice(p2LIndex, 1);
        }
        else {
            if (!p1.hasNeighbour(p2) && !p2.hasNeighbour(p1)) {
                console.warn("Disconnection between 2 NavGraphPoint went wrong : Points were already disconnected.");
            }
            else {
                console.warn("Disconnection between 2 NavGraphPoint went wrong : Only one was connected to the other.");
            }
        }
    }
}