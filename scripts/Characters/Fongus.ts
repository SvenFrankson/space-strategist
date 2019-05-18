class Fongus extends BABYLON.Mesh {

    public position2D: BABYLON.Vector2 = BABYLON.Vector2.Zero();
    public rotation2D: number = 0;

    public currentPath: BABYLON.Vector2[];

    public fongis: BABYLON.Mesh[] = [];
    public anims: Map<BABYLON.Mesh, () => void> = new Map<BABYLON.Mesh, () => void>(); 

    constructor() {
        super("fongus");
        this.getScene().onBeforeRenderObservable.add(this._update);
    }

    public async instantiate(): Promise<void> {
        this._timeout = 0;
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

        let speed = Math.round(60 + Math.random() * 120);
        let k = 0;
        let size = 0.5 + Math.random();

         // SPS creation
         let particleMaterial = new BABYLON.StandardMaterial(name + "-material", this.getScene());
        particleMaterial.specularColor.copyFromFloats(0, 0, 0);
        particleMaterial.emissiveColor = BABYLON.Color3.Red();

         var plane = BABYLON.Mesh.CreatePlane("plane", 0.2, this.getScene());
         let repairParticle = new BABYLON.SolidParticleSystem('SPS', this.getScene());
         repairParticle.addShape(plane, 20);
         var mesh = repairParticle.buildMesh();
         mesh.material = particleMaterial;
         plane.dispose();  // free memory
         

         // SPS behavior definition
         var particleSpeed = 0.05;
         var gravity = -0.005;

         // init
         repairParticle.initParticles = () => {
             // just recycle everything
             for (var p = 0; p < repairParticle.nbParticles; p++) {
                 repairParticle.recycleParticle(repairParticle.particles[p]);
             }
         };

         // recycle
         repairParticle.recycleParticle = (particle) => {
             // Set particle new velocity, scale and rotation
             // As this function is called for each particle, we don't allocate new
             // memory by using "new BABYLON.Vector3()" but we set directly the
             // x, y, z particle properties instead
             particle.position.x = 0;
             particle.position.y = 0;
             particle.position.z = 0;
             particle.velocity.x = (Math.random() - 0.5) * particleSpeed;
             particle.velocity.y = Math.random() * particleSpeed;
             particle.velocity.z = (Math.random() - 0.5) * particleSpeed;
             particle.rotation.x = Math.random() * 3.5;
             particle.rotation.y = Math.random() * 3.5;
             particle.rotation.z = Math.random() * 3.5;
             particle.color.r = Math.random() * 0.4 + 0.3;
             particle.color.g = 1;
             particle.color.b = particle.color.r;
             particle.color.a = 1;
             return particle;
         };

         // update : will be called by setParticles()
         repairParticle.updateParticle = (particle) => {  
             // some physics here 
             if (particle.position.y < 0) {
                 repairParticle.recycleParticle(particle);
             }
             particle.velocity.y += gravity;                         // apply gravity to y
             (particle.position).addInPlace(particle.velocity);      // update particle new position
             particle.position.y += particleSpeed / 2;
             particle.scale.scaleInPlace(0.95);
             return particle;
         };


         // init all particle values and set them once to apply textures, colors, etc
         repairParticle.initParticles();
         repairParticle.setParticles();
         
         // Tuning : plane particles facing, so billboard and no rotation computation
         // colors not changing then, neither textures
         repairParticle.billboard = true;
         repairParticle.computeParticleRotation = false;
         repairParticle.computeParticleColor = false;
         repairParticle.computeParticleTexture = false;

         repairParticle.mesh.position.copyFrom(newFongi.position);

        let newFongiAnim = () => {
            k++;
            let scale = SpaceMath.easeOutElastic(k / speed) * size;
            repairParticle.setParticles();
            if (k < speed) {
                newFongi.scaling.copyFromFloats(scale, scale, scale);
            }
            else {
                newFongi.scaling.copyFromFloats(size, size, size);
                this.anims.delete(newFongi);
                this.getScene().onBeforeRenderObservable.removeCallback(newFongiAnim);
                repairParticle.dispose();
            }
        }
        this.anims.set(newFongi, newFongiAnim);
        this.getScene().onBeforeRenderObservable.add(newFongiAnim);
        this.fongis.push(newFongi);

        if (this.fongis.length > 20) {
            let speed = Math.round(5 + Math.random() * 15);
            let index = Math.floor(Math.random() * 3)
            let oldFongi = this.fongis.splice(index, 1)[0];
            let newAnim = this.anims.get(oldFongi);
            if (newAnim) {
                this.anims.delete(oldFongi);
                this.getScene().onBeforeRenderObservable.removeCallback(newAnim);
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