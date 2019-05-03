class SceneData {

    public wallSystemDatas: WallSystemData[] = [];
}

class Serializer {

    public static findProps(scene: BABYLON.Scene): Prop[] {
        let props = [];
        for (let i = 0; i < scene.meshes.length; i++) {
            let mesh = scene.meshes[i];
            if (mesh instanceof Prop) {
                props.push(mesh);
            }
        }
        return props;
    }

    public static findWallSystems(scene: BABYLON.Scene): WallSystem[] {
        let wallSystems = [];
        for (let i = 0; i < scene.meshes.length; i++) {
            let mesh = scene.meshes[i];
            if (mesh instanceof WallNode) {
                let wallSystem = mesh.wallSystem;
                if (wallSystems.indexOf(wallSystem) === -1) {
                    wallSystems.push(wallSystem);
                }
            }
        }
        return wallSystems;
    }

    public static Serialize(scene: BABYLON.Scene): SceneData {
        let data = new SceneData();
        let wallSystems = Serializer.findWallSystems(scene);
        for (let i = 0; i < wallSystems.length; i++) {
            data.wallSystemDatas.push(wallSystems[i].serialize());
        }
        return data;
    }

    public static Deserialize(scene: BABYLON.Scene, data: SceneData): void {
        let wallSystems = Serializer.findWallSystems(scene);
        // Note : Wrong actually, should delete and rebuild.
        for (let i = 0; i < wallSystems.length; i++) {
            wallSystems[0].deserialize(data.wallSystemDatas[0]);
        }
    }
}