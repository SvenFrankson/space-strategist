class Fongus extends Character {

    public currentPath: BABYLON.Vector2[];

    public fongis: BABYLON.Mesh[] = [];
    public animsCleanUp: Map<BABYLON.Mesh, () => void> = new Map<BABYLON.Mesh, () => void>();

    constructor() {
        super("fongus");
        this.getScene().onBeforeRenderObservable.add(this._update);
    }

    public async instantiate(): Promise<void> {
        this._timeout = 0;
    }

    public dispose(doNotRecurse?: boolean, disposeMaterialAndTextures?: boolean): void {
        this.animsCleanUp.forEach(
            (cleanUp) => {
                cleanUp();
            }
        )
        this.getScene().onBeforeRenderObservable.add(this._update);
        super.dispose(doNotRecurse, disposeMaterialAndTextures);
    }

    public kill(): void {
        super.kill();
        this.dispose();
    }

    private _timeout: number = Infinity;
    private _update = () => {
        this._timeout--;
        if (this._timeout <= 0) {
            this._generateNewFongi();
            this._timeout = Math.round(5 + Math.random() * 10);
        }
        if (!this.currentPath || this.currentPath.length === 0) {
            this._findPath();
        }
        this._moveOnPath();

        this.position.x = this.position2D.x;
        this.position.z = this.position2D.y;
        this.rotation.y = - this.rotation2D;

        if (this.fongis.length > this.currentHitPoint) {
            let speed = Math.round(5 + Math.random() * 15);
            let index = Math.floor(Math.random() * 3)
            index = Math.min(index, this.fongis.length - 1);
            console.log(index + " " + this.fongis.length);
            let oldFongi = this.fongis.splice(index, 1)[0];
            let animCleanUp = this.animsCleanUp.get(oldFongi);
            if (animCleanUp) {
                animCleanUp();
                this.animsCleanUp.delete(oldFongi);
            }
            let k = 0;
            let size = oldFongi.scaling.x;
            let oldFongiAnim = () => {
                k++;
                let scale = (1 - k / speed * k / speed) * size;
                if (k < speed) {
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

    private async _generateNewFongi(): Promise<void> {
        if (!this.alive) {
            return;
        }
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
        let colorBase = new BABYLON.Color3(
            color.r * 0.4 + 0.6,    
            color.g * 0.4 + 0.6,
            color.b * 0.4 + 0.6,
        )
        let model = Math.floor(Math.random() * 3);
        let data = await VertexDataLoader.instance.getColorized("fongus-" + model, colorBase.toHexString(), "", color.toHexString());
        data.applyToMesh(newFongi);
        newFongi.material = Main.cellShadingMaterial;

        let top: BABYLON.Vector3 = BABYLON.Vector3.Zero();
        let positions = data.positions;
        for (let i = 0; i < positions.length / 3; i++) {
            if (top.y < positions[3 * i + 1]) {
                top.copyFromFloats(
                    positions[3 * i],
                    positions[3 * i + 1],
                    positions[3 * i + 2]
                );
            }
        }

        let speed = Math.round(100 + Math.random() * 200);
        let k = 0;
        let size = 0.5 + Math.random();

        // SPS creation
        let particleMaterial = new BABYLON.StandardMaterial(name + "-material", this.getScene());
        particleMaterial.specularColor.copyFromFloats(0, 0, 0);
        particleMaterial.emissiveColor = BABYLON.Color3.Gray();

        var plane = BABYLON.Mesh.CreatePlane("plane", 0.2, this.getScene());
        let earthParticle = new BABYLON.SolidParticleSystem('SPS', this.getScene());
        earthParticle.addShape(plane, 15);
        var mesh = earthParticle.buildMesh();
        mesh.material = particleMaterial;
        var particleSpeed = 0.05;
        var gravity = -0.003;
        earthParticle.initParticles = () => {
            for (var p = 0; p < earthParticle.nbParticles; p++) {
                earthParticle.recycleParticle(earthParticle.particles[p]);
            }
        };

        earthParticle.recycleParticle = (particle) => {
            particle.position.x = 0;
            particle.position.y = 0;
            particle.position.z = 0;
            particle.velocity.x = (Math.random() - 0.5) * particleSpeed;
            particle.velocity.y = Math.random() * particleSpeed;
            particle.velocity.z = (Math.random() - 0.5) * particleSpeed;
            particle.rotation.x = Math.random() * 3.5;
            particle.rotation.y = Math.random() * 3.5;
            particle.rotation.z = Math.random() * 3.5;
            let color = Math.random() * 0.4 + 0.3;
            particle.color.r = color;
            particle.color.g = color;
            particle.color.b = color;
            particle.color.a = 1;
            return particle;
        };

        earthParticle.updateParticle = (particle) => {
            if (particle.position.y < 0) {
                earthParticle.recycleParticle(particle);
            }
            particle.velocity.y += gravity;
            (particle.position).addInPlace(particle.velocity);
            particle.position.y += particleSpeed / 2;
            particle.scale.scaleInPlace(0.95);
            return particle;
        };


        // init all particle values and set them once to apply textures, colors, etc
        earthParticle.initParticles();
        earthParticle.setParticles();

        earthParticle.billboard = true;
        earthParticle.computeParticleRotation = false;
        earthParticle.computeParticleColor = false;
        earthParticle.computeParticleTexture = false;

        earthParticle.mesh.position.copyFrom(newFongi.position);

        let rSpeed = 0.8 * Math.random() - 0.4;
        let newFongiAnim = () => {
            rSpeed *= 0.95;
            newFongi.rotation.y += rSpeed;
            k++;
            if (k < speed) {
                let scale = SpaceMath.easeOutElastic(k / speed) * size;
                earthParticle.setParticles();
                newFongi.scaling.copyFromFloats(scale, scale, scale);
            }
            else {
                newFongi.scaling.copyFromFloats(size, size, size);
                earthParticle.dispose();
            }
        }
        this.animsCleanUp.set(
            newFongi, 
            () => {
                this.getScene().onBeforeRenderObservable.removeCallback(newFongiAnim);
                earthParticle.dispose();
            }
        );
        this.getScene().onBeforeRenderObservable.add(newFongiAnim);
        this.fongis.push(newFongi);
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