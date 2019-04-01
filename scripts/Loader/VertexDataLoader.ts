class VertexDataLoader {

    public static instance: VertexDataLoader;

    public scene: BABYLON.Scene;
    private _vertexDatas: Map<string, BABYLON.VertexData>;

    constructor(scene: BABYLON.Scene) {
        this.scene = scene;
        this._vertexDatas = new Map<string, BABYLON.VertexData>();
        VertexDataLoader.instance = this;
    }

    public static clone(data: BABYLON.VertexData): BABYLON.VertexData {
        let clonedData = new BABYLON.VertexData();
        clonedData.positions = [...data.positions];
        clonedData.indices = [...data.indices];
        clonedData.normals = [...data.normals];
        if (data.uvs) {
            clonedData.uvs = [...data.uvs];
        }
        if (data.colors) {
            clonedData.colors = [...data.colors];
        }
        return clonedData;
    }

    public async get(name: string): Promise<BABYLON.VertexData> {
        if (this._vertexDatas.get(name)) {
            return this._vertexDatas.get(name);
        }
        let request = new XMLHttpRequest();
        return new Promise<BABYLON.VertexData> (
            (resolve) => {
                request.onload = () => {
                    console.log("?");
                    if (request.status >= 200 && request.status < 400) {
                        console.log("!");
                        let rawData = JSON.parse(request.responseText);
                        let data = new BABYLON.VertexData();
                        data.positions = rawData.meshes[0].positions;
                        data.indices = rawData.meshes[0].indices;
                        if (rawData.meshes[0].normals) {
                            data.normals = rawData.meshes[0].normals;
                        }
                        if (rawData.meshes[0].uvs) {
                            data.uvs = rawData.meshes[0].uvs;
                        }
                        if (rawData.meshes[0].colors) {
                            data.colors = rawData.meshes[0].colors;
                        }
                        this._vertexDatas.set(name, data);
                        resolve(this._vertexDatas.get(name));
                    }
                }
                console.log(".");
                request.open("GET", "./datas/" + name + ".babylon");
                request.send();
                console.log(";");
            }
        )
    }

    public async getColorized(
        name: string, 
		baseColorHex: string = "#FFFFFF",
        frameColorHex: string = "",
        color1Hex: string = "", // Replace red
        color2Hex: string = "", // Replace green
        color3Hex: string = "" // Replace blue
    ): Promise<BABYLON.VertexData> {
        let baseColor: BABYLON.Color3;
        if (baseColorHex !== "") {
            baseColor = BABYLON.Color3.FromHexString(baseColorHex);
        }
        let frameColor: BABYLON.Color3;
        if (frameColorHex !== "") {
            frameColor = BABYLON.Color3.FromHexString(frameColorHex);
        }
        let color1: BABYLON.Color3;
        if (color1Hex !== "") {
            color1 = BABYLON.Color3.FromHexString(color1Hex);
        }
        let color2: BABYLON.Color3;
        if (color2Hex !== "") {
            color2 = BABYLON.Color3.FromHexString(color2Hex);
        }
        let color3: BABYLON.Color3;
        if (color3Hex !== "") {
            color3 = BABYLON.Color3.FromHexString(color3Hex);
        }
        let data = VertexDataLoader.clone(await VertexDataLoader.instance.get(name));
        if (data.colors) {
			for (let i = 0; i < data.colors.length / 4; i++) {
				let r = data.colors[4 * i];
				let g = data.colors[4 * i + 1];
                let b = data.colors[4 * i + 2];
                if (baseColor) {
                    if (r === 1 && g === 1 && b === 1) {
                        data.colors[4 * i] = baseColor.r;
                        data.colors[4 * i + 1] = baseColor.g;
                        data.colors[4 * i + 2] = baseColor.b;
                        continue;
                    }
                }
                if (frameColor) {
                    if (r === 0.502 && g === 0.502 && b === 0.502) {
                        data.colors[4 * i] = frameColor.r;
                        data.colors[4 * i + 1] = frameColor.g;
                        data.colors[4 * i + 2] = frameColor.b;
                        continue;
                    }
                }
                if (color1) {
                    if (r === 1 && g === 0 && b === 0) {
                        data.colors[4 * i] = color1.r;
                        data.colors[4 * i + 1] = color1.g;
                        data.colors[4 * i + 2] = color1.b;
                        continue;
                    }
                }
                if (color2) {
                    if (r === 0 && g === 1 && b === 0) {
                        data.colors[4 * i] = color2.r;
                        data.colors[4 * i + 1] = color2.g;
                        data.colors[4 * i + 2] = color2.b;
                        continue;
                    }
                }
                if (color3) {
                    if (r === 0 && g === 0 && b === 1) {
                        console.log("!");
                        data.colors[4 * i] = color3.r;
                        data.colors[4 * i + 1] = color3.g;
                        data.colors[4 * i + 2] = color3.b;
                        continue;
                    }
                }
			}
        }
        else {
            let colors: number[] = [];
            for (let i = 0; i < data.positions.length / 3; i++) {
                colors[4 * i] = baseColor.r;
                colors[4 * i + 1] = baseColor.g;
                colors[4 * i + 2] = baseColor.b;
                colors[4 * i + 3] = 1;
            }
            data.colors = colors;
        }
        return data;
    }
}