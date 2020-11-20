///<reference types="../../Core/Build/FudgeCore.js"/>


import f = FudgeCore;



class Scene {
  public static app: HTMLCanvasElement = document.querySelector("canvas");
  public static viewPort: f.Viewport;
  public static hierarchy: f.Node;
  public static fps: number;
  public static times: number[] = [];
  public static cubes: f.Node[] = new Array();
  public static fpsDisplay: HTMLElement = document.querySelector("h2#FPS");

  constructor() {
    this.init();
  }

  public init(): void {
    f.Debug.log(Scene.app);
    Scene.hierarchy = new f.Node("Scene");

    let ground: f.Node = this.createCompleteMeshNode("Ground", new f.Material("Ground", f.ShaderFlat, new f.CoatColored(new f.Color(0.2, 0.2, 0.2, 1))), new f.MeshCube());
    let cmpGroundMesh: f.ComponentTransform = ground.getComponent(f.ComponentTransform);

    cmpGroundMesh.local.scale(new f.Vector3(20, 0.3, 20));
    Scene.hierarchy.appendChild(ground);
    ground.addComponent(new f.ComponentRigidbody(0, ground));

    Scene.cubes[0] = this.createCompleteMeshNode("Cube_1", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(1, 0, 0, 1))), new f.MeshCube());
    let cmpCubeTransform: f.ComponentTransform = Scene.cubes[0].getComponent(f.ComponentTransform);
    cmpCubeTransform.local.translate(new f.Vector3(0, 2, 0));
    Scene.cubes[0].mtxWorld.rotateX(45);
    Scene.hierarchy.appendChild(Scene.cubes[0]);
    Scene.cubes[0].addComponent(new f.ComponentRigidbody(1, Scene.cubes[0]));

    Scene.cubes[1] = this.createCompleteMeshNode("Cube_2", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(1, 0, 0, 1))), new f.MeshCube());
    let cmpCubeTransform2: f.ComponentTransform = Scene.cubes[1].getComponent(f.ComponentTransform);
    cmpCubeTransform2.local.translate(new f.Vector3(0, 6.5, 0.4));
    Scene.hierarchy.appendChild(Scene.cubes[1]);

    let cmpLight: f.ComponentLight = new f.ComponentLight(new f.LightDirectional(f.Color.CSS("WHITE")));
    cmpLight.pivot.lookAt(new f.Vector3(0.5, -1, -0.8));
    Scene.hierarchy.addComponent(cmpLight);

    let cmpCamera: f.ComponentCamera = new f.ComponentCamera();
    cmpCamera.backgroundColor = f.Color.CSS("GREY");
    cmpCamera.pivot.translate(new f.Vector3(2, 2, 10));
    cmpCamera.pivot.lookAt(f.Vector3.ZERO());



    Scene.viewPort = new f.Viewport();
    Scene.viewPort.initialize("Viewport", Scene.hierarchy, cmpCamera, Scene.app);
    f.Debug.log(Scene.viewPort);

    Scene.viewPort.showSceneGraph();

    f.Loop.addEventListener(f.EVENT.LOOP_FRAME, this.update);
    f.Loop.start(f.LOOP_MODE.TIME_GAME, 60);
  }


  public update(): void {
    Scene.viewPort.draw();;
    f.Physics.simulate(1 / 60);
    Scene.measureFPS();
  }

  public static measureFPS(): void {
    window.requestAnimationFrame(() => {
      const now = performance.now();
      while (Scene.times.length > 0 && Scene.times[0] <= now - 1000) {
        Scene.times.shift();
      }
      Scene.times.push(now);
      Scene.fps = Scene.times.length;
      Scene.fpsDisplay.textContent = "FPS: " + Scene.fps.toString();
    });
  }



  public createCompleteMeshNode(_name: string, _material: f.Material, _mesh: f.Mesh): f.Node {
    let node: f.Node = new f.Node(_name);
    let cmpMesh: f.ComponentMesh = new f.ComponentMesh(_mesh);
    let cmpMaterial: f.ComponentMaterial = new f.ComponentMaterial(_material);

    let cmpTransform: f.ComponentTransform = new f.ComponentTransform();
    node.addComponent(cmpMesh);
    node.addComponent(cmpMaterial);
    node.addComponent(cmpTransform);

    return node;
  }
}

let scene = f.Physics.initializePhysics(Scene);








