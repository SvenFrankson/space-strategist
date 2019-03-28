class Spaceship extends BABYLON.TransformNode {

    private speed: number = 0;

    public thrust: number = 0;
    public pitch: number = 0;
    public yaw: number = 0;
    public roll: number = 0;

    constructor(name: string) {
        super(name);
        this.rotationQuaternion = BABYLON.Quaternion.Identity();
        this.getScene().onBeforeRenderObservable.add(this.update);
    }

    public async instantiate(): Promise<void> {
        return new Promise<void>(
            (resolve) => {
                BABYLON.SceneLoader.ImportMesh(
                    "",
                    "./datas/" + this.name + ".babylon",
                    "",
                    this.getScene(),
                    (meshes) => {
                        for (let i = 0; i < meshes.length; i++) {
                            let mesh = meshes[i];
                            if (mesh.material instanceof BABYLON.StandardMaterial) {
                                if (mesh.material.name.split(".")[1] === "transparentGlass") {
                                    console.log(mesh.material.name);
                                    mesh.material = SpaceshipMaterial.instance.transparentGlass;
                                }
                            }
                            mesh.parent = this;
                        }
                        resolve();
                    }
                )
            }
        )
    }

    private _deltaPosition = BABYLON.Vector3.Zero();
    public update = () => {
        let dt = this.getScene().getEngine().getDeltaTime() / 1000;
        this.speed += this.thrust * 10 * dt;
        this.speed *= 0.99;

        this.getDirectionToRef(BABYLON.Axis.Z, this._deltaPosition);
        this._deltaPosition.scaleInPlace(this.speed * dt);
        this.position.addInPlace(this._deltaPosition);

        let roll = BABYLON.Quaternion.RotationAxis(
            this.getDirection(BABYLON.Axis.Z),
            - this.roll * dt
        );
        this.rotationQuaternion = roll.multiply(this.rotationQuaternion);

        let yaw = BABYLON.Quaternion.RotationAxis(
            this.getDirection(BABYLON.Axis.Y),
            this.yaw * dt
        );
        this.rotationQuaternion = yaw.multiply(this.rotationQuaternion);

        let pitch = BABYLON.Quaternion.RotationAxis(
            this.getDirection(BABYLON.Axis.X),
            - this.pitch * dt
        );
        this.rotationQuaternion = pitch.multiply(this.rotationQuaternion);
    }
}