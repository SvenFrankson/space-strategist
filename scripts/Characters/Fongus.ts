class Fongus extends BABYLON.Mesh {

    public position2D: BABYLON.Vector2 = BABYLON.Vector2.Zero();
    public rotation2D: number = 0;

    public currentPath: BABYLON.Vector2[];

    public fongis: BABYLON.Mesh[] = [];

    constructor() {
        super("fongus");
        this.getScene().onBeforeRenderObservable.add(this._update);
    }

    public async instantiate(): Promise<void> {
        this._generateNewFongi();
    }

    private _update = () => {
        if (!this.currentPath || this.currentPath.length === 0) {
            this._findPath();
        }
        this._moveOnPath();

        this.position.x = this.position2D.x;
        this.position.z = this.position2D.y;
        this.rotation.y = - this.rotation2D;
    }

    private async _generateNewFongi(): Promise<void> {
        let newFongi = new BABYLON.Mesh("fongi");
        newFongi.position.copyFrom(this.position);
        newFongi.position.x += Math.random() * 2 - 1;
        newFongi.position.y = -0.1;
        newFongi.position.z += Math.random() * 2 - 1;
        newFongi.rotation.x = Math.random() - 0.5 * Math.PI * 0.25;
        newFongi.rotation.y = Math.random() * 2 * Math.PI;
        newFongi.rotation.z = Math.random() - 0.5 * Math.PI * 0.25;
        newFongi.scaling.copyFromFloats(0.01, 0.01, 0.01);

        let color = BABYLON.Color3.FromHexString("#38bad1");
        color.r += Math.random() * 0.2 - 0.1;
        color.g += Math.random() * 0.2 - 0.1;
        color.b += Math.random() * 0.2 - 0.1;
        let model = Math.floor(Math.random() * 3);
        let data = await VertexDataLoader.instance.getColorized("fongus-" + model, color.toHexString());
        data.applyToMesh(newFongi);
        newFongi.material = Main.cellShadingMaterial;

        let k = 0;
        let size = 0.5 + Math.random();
        let newFongiAnim = () => {
            k++;
            let scale = k / 20 * k / 20 * size;
            if (k < 20) {
                newFongi.scaling.copyFromFloats(scale, scale, scale);
            }
            else {
                newFongi.scaling.copyFromFloats(size, size, size);
                this.getScene().onBeforeRenderObservable.removeCallback(newFongiAnim);
                this._generateNewFongi();
            }
        }
        this.getScene().onBeforeRenderObservable.add(newFongiAnim);
        this.fongis.push(newFongi);

        if (this.fongis.length > 20) {
            let index = Math.floor(Math.random() * 3)
            let oldFongi = this.fongis.splice(index, 1)[0];
            let k = 0;
            let size = oldFongi.scaling.x;
            let oldFongiAnim = () => {
                k++;
                let scale = (1 - k / 15 * k / 15) * size;
                if (k < 15) {
                    oldFongi.scaling.copyFromFloats(scale, scale, scale);
                }
                else {
                    oldFongi.dispose();
                    this.getScene().onBeforeRenderObservable.removeCallback(oldFongiAnim);
                }
            }
            this.getScene().onBeforeRenderObservable.add(oldFongiAnim);
        }
    }

    public findRandomDestination(radius: number = 10): BABYLON.Vector2 {
        let attempts: number = 0;
        while (attempts++ < 10) {
            let random = new BABYLON.Vector2(Math.random() * 2 * radius - radius, Math.random() * 2 * radius - radius);
            random.addInPlace(this.position2D);
            let graph = NavGraphManager.GetForRadius(1);
            for (let i = 0; i < graph.obstacles.length; i++) {
                let o = graph.obstacles[i];
                if (o.contains(random, 1)) {
                    random = undefined;
                    break;
                }
            }
            if (random) {
                return random;
            }
        }
        return undefined;
    }

    private _findPath(): void {
        let dest = this.findRandomDestination();
        if (dest) {
            BABYLON.MeshBuilder.CreateBox("box", {size: 0.5}).position.copyFromFloats(dest.x, 1, dest.y);
            let navGraph = NavGraphManager.GetForRadius(1);
            navGraph.update();
            navGraph.computePathFromTo(this.position2D, dest);
            this.currentPath = navGraph.path;
        }
    }

    private _moveOnPath = () => {
        if (this.currentPath && this.currentPath.length > 0) {
            let next = this.currentPath[0];
            let distanceToNext = Math2D.Distance(this.position2D, next);
            if (distanceToNext <= 0.05) {
                this.currentPath.splice(0, 1);
                return this._moveOnPath();
            }
            let stepToNext = next.subtract(this.position2D).normalize();
            let rotationToNext = Math2D.AngleFromTo(new BABYLON.Vector2(0, 1), stepToNext);
            stepToNext.scaleInPlace(Math.min(distanceToNext, 0.02));
            this.position2D.addInPlace(stepToNext);
            if (isFinite(rotationToNext)) {
                this.rotation2D = Math2D.StepFromToCirular(this.rotation2D, rotationToNext, Math.PI / 60);
            }
        }
    }
}