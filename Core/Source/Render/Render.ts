namespace FudgeCore {
  export type MapLightTypeToLightList = Map<TypeOfLight, ComponentLight[]>;

  /**
   * The main interface to the render engine, here WebGL, which is used mainly in the superclass [[RenderWebGL]]
   * TODO: move all WebGL-specifica to RenderWebGL
   */
  export abstract class Render extends RenderWebGL {
    public static rectClip: Rectangle = new Rectangle(-1, 1, 2, -2);
    public static pickTexture: WebGLTexture;
    public static pickBuffer: Int32Array;
    private static timestampUpdate: number;
    private static ƒpicked: Pick[];
    private static pickSize: Vector2;

    //#region Picking
    /**
     * Creates a texture buffer to be used as pick-buffer
     */
    public static createPickTexture(_width: number, _height: number): WebGLTexture {
      Render.pickSize = new Vector2(_width, _height);
      // create to render to
      const targetTexture: WebGLTexture = Render.crc3.createTexture();
      Render.crc3.bindTexture(WebGL2RenderingContext.TEXTURE_2D, targetTexture);

      {
        const internalFormat: number = WebGL2RenderingContext.RGBA32I;
        const format: number = WebGL2RenderingContext.RGBA_INTEGER;
        const type: number = WebGL2RenderingContext.INT;
        Render.pickBuffer = new Int32Array(_width * _height * 4);
        Render.crc3.texImage2D(
          WebGL2RenderingContext.TEXTURE_2D, 0, internalFormat, _width, _height, 0, format, type, Render.pickBuffer
        );

        // set the filtering so we don't need mips
        Render.crc3.texParameteri(WebGL2RenderingContext.TEXTURE_2D, WebGL2RenderingContext.TEXTURE_MIN_FILTER, WebGL2RenderingContext.LINEAR);
        Render.crc3.texParameteri(WebGL2RenderingContext.TEXTURE_2D, WebGL2RenderingContext.TEXTURE_WRAP_S, WebGL2RenderingContext.CLAMP_TO_EDGE);
        Render.crc3.texParameteri(WebGL2RenderingContext.TEXTURE_2D, WebGL2RenderingContext.TEXTURE_WRAP_T, WebGL2RenderingContext.CLAMP_TO_EDGE);
      }

      return targetTexture;
    }

    /**
     * Used with a [[Picker]]-camera, this method renders one pixel with picking information 
     * for each node in the line of sight and return that as an unsorted [[Pick]]-array
     */
    public static drawBranchForPicking(_branch: Node, _cmpCamera: ComponentCamera): Pick[] { // TODO: see if third parameter _world?: Matrix4x4 would be usefull
      Render.ƒpicked = [];
      // bind framebuffer and texture
      const framebuffer: WebGLFramebuffer = Render.crc3.createFramebuffer();
      Render.crc3.bindFramebuffer(WebGL2RenderingContext.FRAMEBUFFER, framebuffer);
      const attachmentPoint: number = WebGL2RenderingContext.COLOR_ATTACHMENT0;
      Render.crc3.framebufferTexture2D(WebGL2RenderingContext.FRAMEBUFFER, attachmentPoint, WebGL2RenderingContext.TEXTURE_2D, Render.pickTexture, 0);

      // draw nodes
      Render.setBlendMode(BLEND.OPAQUE);
      Render.drawBranch(_branch, _cmpCamera, Render.drawNodeForPicking);
      Render.setBlendMode(BLEND.TRANSPARENT);

      // evaluate texture by reading pixels and extract, convert and store the information about each mesh hit
      let data: Int32Array = new Int32Array(Render.pickSize.x * Render.pickSize.y * 4);
      Render.crc3.readPixels(0, 0, Render.pickSize.x, Render.pickSize.x, WebGL2RenderingContext.RGBA_INTEGER, WebGL2RenderingContext.INT, data);

      let mtxViewToWorld: Matrix4x4 = Matrix4x4.INVERSION(_cmpCamera.mtxWorldToView);
      let picked: Pick[] = [];
      for (let i: number = 0; i < Render.ƒpicked.length; i++) {
        let zBuffer: number = data[4 * i + 0] + data[4 * i + 1] / 256;
        if (zBuffer == 0) // discard misses 
          continue;
        let pick: Pick = Render.ƒpicked[i];
        pick.zBuffer = convertInt32toFloat32(data, 4 * i + 0) * 2 - 1;
        pick.color = convertInt32toColor(data, 4 * i + 1);
        pick.textureUV = Recycler.get(Vector2);
        pick.textureUV.set(convertInt32toFloat32(data, 4 * i + 2), convertInt32toFloat32(data, 4 * i + 3))
        pick.mtxViewToWorld = mtxViewToWorld;

        picked.push(pick);
      }

      Render.resetFrameBuffer();
      return picked;

      function convertInt32toFloat32(_int32Array: Int32Array, _index: number): number {
        let buffer: ArrayBuffer = new ArrayBuffer(4);
        let view: DataView = new DataView(buffer);
        view.setInt32(0, _int32Array[_index]);
        return view.getFloat32(0);
      }

      function convertInt32toColor(_int32Array: Int32Array, _index: number): Color {
        let buffer: ArrayBuffer = new ArrayBuffer(4);
        let view: DataView = new DataView(buffer);
        view.setInt32(0, _int32Array[_index]);
        let color: Color = Color.CSS(`rgb(${view.getUint8(0)}, ${view.getUint8(1)}, ${view.getUint8(2)})`, view.getUint8(3) / 255);
        return color;
      }
    }

    //#endregion

    //#region Transformation & Lights
    /**
     * Recursively iterates over the branch starting with the node given, recalculates all world transforms, 
     * collects all lights and feeds all shaders used in the graph with these lights
     */
    public static setupTransformAndLights(_branch: Node, _mtxWorld: Matrix4x4 = Matrix4x4.IDENTITY(), _lights: MapLightTypeToLightList = new Map(), _shadersUsed: (typeof Shader)[] = null): number {
      Render.timestampUpdate = performance.now();
      let firstLevel: boolean = (_shadersUsed == null);
      if (firstLevel)
        _shadersUsed = [];

      let mtxWorld: Matrix4x4 = _mtxWorld;
      _branch.nNodesInBranch = 1;

      if (_branch.cmpTransform)
        mtxWorld = Matrix4x4.MULTIPLICATION(_mtxWorld, _branch.cmpTransform.local);

      _branch.mtxWorld.set(mtxWorld); // overwrite readonly mtxWorld of the current node
      _branch.timestampUpdate = Render.timestampUpdate;

      let cmpMesh: ComponentMesh = _branch.getComponent(ComponentMesh);
      if (cmpMesh)  // TODO: careful when using particlesystem, pivot must not change node position
        cmpMesh.mtxWorld = Matrix4x4.MULTIPLICATION(_branch.mtxWorld, cmpMesh.pivot);

      let cmpLights: ComponentLight[] = _branch.getComponents(ComponentLight);
      for (let cmpLight of cmpLights) {
        let type: TypeOfLight = cmpLight.light.getType();
        let lightsOfType: ComponentLight[] = _lights.get(type);
        if (!lightsOfType) {
          lightsOfType = [];
          _lights.set(type, lightsOfType);
        }
        lightsOfType.push(cmpLight);
      }

      let cmpMaterial: ComponentMaterial = _branch.getComponent(ComponentMaterial);
      if (cmpMaterial) {
        let shader: typeof Shader = cmpMaterial.material.getShader();
        if (_shadersUsed.indexOf(shader) < 0)
          _shadersUsed.push(shader);
      }

      for (let child of _branch.getChildren()) {
        _branch.nNodesInBranch += Render.setupTransformAndLights(child, mtxWorld, _lights, _shadersUsed);
      }

      if (firstLevel)
        for (let shader of _shadersUsed)
          Render.setLightsInShader(shader, _lights);

      return _branch.nNodesInBranch;
    }
    //#endregion

    //#region Drawing
    /**
     * The main rendering function to be called from [[Viewport]].
     * Draws the branch starting with the given [[Node]] using the camera given [[ComponentCamera]].
     */
    public static drawBranch(_branch: Node, _cmpCamera: ComponentCamera, _drawNode: Function = Render.drawNode): void {
      let mtxWorldToView: Matrix4x4 = _cmpCamera.mtxWorldToView;

      // TODO: Move physics rendering to RenderPhysics extension of RenderManager
      if (Physics.world && Physics.world.mainCam != _cmpCamera)
        Physics.world.mainCam = _cmpCamera; //DebugDraw needs to know the main camera beforehand, _cmpCamera is the viewport camera. | Marko Fehrenbach, HFU 2020
      Render.setupPhysicalTransform(_branch);

      //if (Physics.settings && Physics.settings.debugMode != PHYSICS_DEBUGMODE.PHYSIC_OBJECTS_ONLY) //Give users the possibility to only show physics displayed | Marko Fehrenbach, HFU 2020
      Render.drawBranchRecursive(_branch, mtxWorldToView, _drawNode);

      if (Physics.settings && Physics.settings.debugDraw == true) {
        Physics.world.debugDraw.end();
      }
    }

    /**
     * Recursivly iterates over the graph and renders each node and all successors with the given render function
     */
    private static drawBranchRecursive(_branch: Node, _mtxWorldToView: Matrix4x4, _drawNode: Function = Render.drawNode): void {
      // TODO: see if third parameter _world?: Matrix4x4 would be usefull
      if (!_branch.isActive)
        return;

      let cmpMesh: ComponentMesh = _branch.getComponent(ComponentMesh);
      if (cmpMesh && cmpMesh.isActive) {
        let mtxMeshToView: Matrix4x4 = Matrix4x4.MULTIPLICATION(_mtxWorldToView, cmpMesh.mtxWorld);
        // TODO: create drawNode method for particle system using _node.mtxWorld instead of finalTransform
        _drawNode(_branch, _branch.mtxWorld, mtxMeshToView);
        // RenderParticles.drawParticles();
        Recycler.store(mtxMeshToView);
      }

      for (let childNode of _branch.getChildren())
        Render.drawBranchRecursive(childNode, _mtxWorldToView, _drawNode); //, world);
    }

    /**
     * The standard render function for drawing a single node
     */
    private static drawNode(_node: Node, _mtxMeshToWorld: Matrix4x4, _mtxWorldToView: Matrix4x4, _lights: MapLightTypeToLightList, _cmpCamera: ComponentCamera): void {
      try {
        let cmpMaterial: ComponentMaterial = _node.getComponent(ComponentMaterial);
        if (!cmpMaterial.isActive) return;
        let mesh: Mesh = _node.getComponent(ComponentMesh).mesh;
        // RenderManager.setLightsInShader(shader, _lights);
        Render.draw(mesh, cmpMaterial, _mtxMeshToWorld, _mtxWorldToView); //, _lights);
      } catch (_error) {
        // Debug.error(_error);
      }
      //Should be drawn only once, last after anything else, which i believe it does because graphic card only draws each pixel in a certain depth once | Marko Fehrenbach
      // if (Physics.settings.debugDraw == true) {
      //   Physics.world.debugDraw.end();
      // }
    }
    //#endregion

    //#region Picking
    /**
    * The render function for picking a single node. 
    * A cameraprojection with extremely narrow focus is used, so each pixel of the buffer would hold the same information from the node,  
    * but the fragemnt shader renders only 1 pixel for each node into the render buffer, 1st node to 1st pixel, 2nd node to second pixel etc.
    */
    private static drawNodeForPicking(_node: Node, _mtxMeshToWorld: Matrix4x4, _mtxWorldToView: Matrix4x4, _lights: MapLightTypeToLightList): void { // create Texture to render to, int-rgba
      try {
        let cmpMaterial: ComponentMaterial = _node.getComponent(ComponentMaterial);
        let cmpMesh: ComponentMesh = _node.getComponent(ComponentMesh);

        if (!cmpMesh.isActive || !cmpMaterial.isActive)
          return;

        let coat: Coat = cmpMaterial.material.getCoat();
        let shader: typeof Shader = coat instanceof CoatTextured ? ShaderPickTextured : ShaderPick;

        shader.useProgram();
        coat.useRenderData(shader, cmpMaterial);

        let sizeUniformLocation: WebGLUniformLocation = shader.uniforms["u_size"];
        RenderWebGL.getRenderingContext().uniform2fv(sizeUniformLocation, Render.pickSize.get());

        let mesh: Mesh = cmpMesh.mesh;
        mesh.useRenderBuffers(shader, _mtxMeshToWorld, _mtxWorldToView, Render.ƒpicked.length);
        RenderWebGL.crc3.drawElements(WebGL2RenderingContext.TRIANGLES, mesh.renderBuffers.nIndices, WebGL2RenderingContext.UNSIGNED_SHORT, 0);

        let pick: Pick = new Pick(_node);
        Render.ƒpicked.push(pick);
      } catch (_error) {
        //
      }
    }

    //#endregion

    //#region Lights
    /**
     * Set light data in shaders
     */
    private static setLightsInShader(_shader: typeof Shader, _lights: MapLightTypeToLightList): void {
      _shader.useProgram();
      let uni: { [name: string]: WebGLUniformLocation } = _shader.uniforms;

      // Ambient
      let ambient: WebGLUniformLocation = uni["u_ambient.color"];
      if (ambient) {
        let cmpLights: ComponentLight[] = _lights.get(LightAmbient);
        if (cmpLights) {
          // TODO: add up ambient lights to a single color
          let result: Color = new Color(0, 0, 0, 1);
          for (let cmpLight of cmpLights)
            result.add(cmpLight.light.color);
          RenderWebGL.crc3.uniform4fv(ambient, result.getArray());
        }
      }

      // Directional
      let nDirectional: WebGLUniformLocation = uni["u_nLightsDirectional"];
      if (nDirectional) {
        let cmpLights: ComponentLight[] = _lights.get(LightDirectional);
        if (cmpLights) {
          let n: number = cmpLights.length;
          RenderWebGL.crc3.uniform1ui(nDirectional, n);
          for (let i: number = 0; i < n; i++) {
            let cmpLight: ComponentLight = cmpLights[i];
            RenderWebGL.crc3.uniform4fv(uni[`u_directional[${i}].color`], cmpLight.light.color.getArray());
            let direction: Vector3 = Vector3.Z();
            direction.transform(cmpLight.pivot, false);
            direction.transform(cmpLight.getContainer().mtxWorld);
            RenderWebGL.crc3.uniform3fv(uni[`u_directional[${i}].direction`], direction.get());
          }
        }
      }
    }
    //#endregion

    //#region Physics
    /**
    * Physics Part -> Take all nodes with cmpRigidbody, and overwrite their local position/rotation with the one coming from 
    * the rb component, which is the new "local" WORLD position.
    */
    private static setupPhysicalTransform(_branch: Node): void {
      if (Physics.world != null && Physics.world.getBodyList().length >= 1) {
        let mutator: Mutator = {};
        for (let name in _branch.getChildren()) {
          let childNode: Node = _branch.getChildren()[name];
          Render.setupPhysicalTransform(childNode);
          let cmpRigidbody: ComponentRigidbody = childNode.getComponent(ComponentRigidbody);
          if (childNode.getComponent(ComponentTransform) != null && cmpRigidbody != null) {
            cmpRigidbody.checkCollisionEvents();
            cmpRigidbody.checkTriggerEvents();
            if (cmpRigidbody.physicsType != PHYSICS_TYPE.KINEMATIC) { //Case of Dynamic/Static Rigidbody
              //Override any position/rotation, Physical Objects do not know hierachy unless it's established through physics
              mutator["rotation"] = cmpRigidbody.getRotation();
              mutator["translation"] = cmpRigidbody.getPosition();
              childNode.mtxLocal.mutate(mutator);
            }
            if (cmpRigidbody.physicsType == PHYSICS_TYPE.KINEMATIC) { //Case of Kinematic Rigidbody
              cmpRigidbody.setPosition(childNode.mtxWorld.translation);
              cmpRigidbody.setRotation(childNode.mtxWorld.rotation);
            }
          }
        }
      }
    }
    //#endregion
  }
}