class Spaceship extends BABYLON.TransformNode {

    constructor(name: string) {
        super(name);
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
                            mesh.parent = this;
                        }
                        resolve();
                    }
                )
            }
        )
    }
}