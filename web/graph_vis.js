'use strict';

/**
 * Take a JSON document representing a Constellation graph and visualise
 * it using babylon.js (www.babylonjs.com).
 *
 * @param {JSON} data A JSON document representing a Constellation graph.
 */
const createGraph = function(data, nodeEvent) {
  const node_spritesVertexShader = `
    attribute vec4 position;
    attribute vec4 options;
    attribute vec2 inverts;
    attribute vec4 cellInfo;
    attribute vec4 color;

    uniform mat4 view;
    uniform mat4 projection;

    varying vec2 vUV;
    varying vec2 bgUV;
    varying vec4 vColor;
    #include<fogVertexDeclaration>
    void main(void) {
      vec3 viewPos = (view*vec4(position.xyz, 1.0)).xyz;
      vec2 cornerPos;
      float angle = position.w;
      vec2 size = vec2(options.x,options.y);
      vec2 offset = options.zw;
      cornerPos = vec2(offset.x-0.5, offset.y-0.5)*size;

      // vec3 rotatedCorner;
      // rotatedCorner.x = cornerPos.x*cos(angle)-cornerPos.y*sin(angle);
      // rotatedCorner.y = cornerPos.x*sin(angle)+cornerPos.y*cos(angle);
      // rotatedCorner.z = 0.;

      vec3 rotatedCorner;
      rotatedCorner.x = cornerPos.x;
      rotatedCorner.y = cornerPos.y;
      rotatedCorner.z = 0.;

      viewPos += rotatedCorner;
      gl_Position = projection*vec4(viewPos,1.0);

      vColor = color;

      vec2 uvOffset = vec2(abs(offset.x-inverts.x), abs(1.0-offset.y-inverts.y));
      vec2 uvPlace = cellInfo.xy;
      vec2 uvSize = cellInfo.zw;
      vUV.x = uvPlace.x+uvSize.x*uvOffset.x;
      vUV.y = uvPlace.y+uvSize.y*uvOffset.y;

      // Extract the background icon position from angle.
      // All of the icons are the same size, so we can reuse size and offset.
      //
      vec2 bgPlace = vec2(trunc(angle)/67108864.0, angle - trunc(angle));
      bgUV.x = bgPlace.x + uvSize.x*uvOffset.x;
      bgUV.y = bgPlace.y + uvSize.y*uvOffset.y;

      #ifdef FOG
      vFogDistance = viewPos;
      #endif
    }
    `;

  const node_spritesPixelShader = `
    uniform bool alphaTest;
    varying vec4 vColor;

    varying vec2 vUV;
    varying vec2 bgUV;
    uniform sampler2D diffuseSampler;

    #include<fogFragmentDeclaration>

    void main(void) {
      vec4 color = texture2D(diffuseSampler, vUV);
      if(true) // (alphaTest)
      {
        if (color.a<0.1)
        {
          vec4 bgColor = texture2D(diffuseSampler,bgUV);
          if(bgColor.a<0.1) discard;
          // bgColor.a = 1.0;
          color = bgColor * vColor;
        }
      }
      // color *= vColor;

      #include<fogFragment>

      gl_FragColor=color;
    }
    `;

  const canvas = document.getElementById('renderCanvas');
  const engine = new BABYLON.Engine(canvas, true);
  console.log('Maximum texture size:', engine.getCaps().maxTextureSize);

  const createScene = function () {
    const SIZE = 2.5;

    // Scene and lights.
    //
    const scene = new BABYLON.Scene(engine);

    // Camera.
    //
    const camera = new BABYLON.ArcRotateCamera('camera1', 0, 0, 0, new BABYLON.Vector3(0, 0, -0), scene);
    camera.wheelPrecision = 50;

    camera.attachControl(canvas, true);
    scene.activeCamera.panningSensibility = 50;

    const light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(1, 1, 0), scene);
    light.intensity = 0.9;
    const pl = new BABYLON.PointLight('pl', new BABYLON.Vector3(0, 0, 0), scene);
    // pl.diffuse = new BABYLON.Color3(1, 1, 1);
    // pl.specular = new BABYLON.Color3(0.5, 0.2, 0.2);
    pl.intensity = 0.75;

    // Which attributes are used for the label and node color attributes?
    //
    const label_attr = data.label_attr;
    const node_color_attr = data.node_color_attr;

    // Create a Rectangle containing a TextBlock to make a pretty node label.
    // Doing labels like Constellation is nasty and complicated.
    // Instead, we'll use BABYLON.GUI to create a single TextBlock and
    // make it visible when the cursor hovers over a node, resizing the
    // Rectangle to fix the text as we go..
    // To do this, we need to attach the Rectangle to a dummy mesh.
    //
    const label = new BABYLON.GUI.Rectangle('node label');
    label.isPointerBlocker = false;
    // label.adaptWidthToChildren = true;
    // label.adaptHeightToChildren = true;
    const text1 = new BABYLON.GUI.TextBlock('node text');
    console.log(text1);
    text1.isPointerBlocker = false;
    // text1.paddingTop = text1.paddingBottom = text1.paddingLeft = text1.paddingRight = '20px';

    var createLabel = function (advancedTexture, mesh) {
      label.background = 'black';
      // label.height = '30px';
      label.alpha = 0.85;
      // label.width = '400px';
      label.cornerRadius = 20;
      label.thickness = 1;
      label.linkOffsetY = 0;//90;
      advancedTexture.addControl(label);
      label.linkWithMesh(mesh);

      // var text1 = new BABYLON.GUI.TextBlock;
      text1.resizeToFit = true;
      text1.text = mesh.name;
      text1.color = data.label_color;
      text1.onLinesReadyObservable.add(function () {
        // Manually set the rectangle size.
        // We don't use label.adaptWidth/HeightToChildren() because
        // we want padding around the text, and setting paddingTop/Bottom/Left/Right()
        // doesn't seem to do the same as what we're doing here.
        //
        const w = parseFloat(text1.width.slice(0, -2)); // Remove the trailing 'px';
        const h = parseFloat(text1.height.slice(0, -2)); // Remove the trailing 'px';
        label.width = `${w + 20}px`;
        label.height = `${h + 20}px`;
        const hasText = text1.text !== '';
        label.isVisible = hasText;
        text1.isVisible = hasText;
      });
      label.addControl(text1)
    };

    scene.clearColor = new BABYLON.Color4(...data.background_color);

    data.camera.eye[2] = -data.camera.eye[2];
    data.camera.centre[2] = -data.camera.centre[2];
    data.camera.up[2] = -data.camera.up[2];
    camera.position = new BABYLON.Vector3(...data.camera.eye);
    camera.target = new BABYLON.Vector3(...data.camera.centre);
    camera.upVector = new BABYLON.Vector3(...data.camera.up);

    const NVX = Object.keys(data.vertex).length;
    console.log('Vertices: %s', NVX);
    console.log('Atlas   : %s', data.sprite_atlas)

    const createBlazes = function (vertices) {
      // Set up blazes (if there are any).
      //
      const vxs = Object.values(vertices).filter(vx => vx.blaze !== null);
      const nBlazes = vxs.length;

      const blazeMesh = BABYLON.MeshBuilder.CreateCylinder('blazes', {
        height: 1.25,
        diameterBottom: 0.5,
        diameterTop: 0.0,
        tessellation: 4
      }, scene);
      // blazeMesh.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL
      blazeMesh.alwaysSelectAsActiveMesh = true;
      blazeMesh.isVisible = false;

      let colorData = new Float32Array(4 * (nBlazes + 1));
      for (let ix = 0; ix < nBlazes; ix++) {
        colorData[ix * 4 + 0] = vxs[ix].blaze.color[0];
        colorData[ix * 4 + 1] = vxs[ix].blaze.color[1];
        colorData[ix * 4 + 2] = vxs[ix].blaze.color[2];
        colorData[ix * 4 + 3] = vxs[ix].blaze.color[3];
      }

      const buffer = new BABYLON.VertexBuffer(engine, colorData, BABYLON.VertexBuffer.ColorKind, false, false, 4, true);
      blazeMesh.setVerticesBuffer(buffer);

      blazeMesh.material = new BABYLON.StandardMaterial('blaze_mat');
      // blazeMesh.material.disableLighting = true;
      blazeMesh.material.emissiveColor = BABYLON.Color3.White();

      const toRadians = angle => angle * (Math.PI / 180);
      for (let ix = 0; ix < nBlazes; ix++) {
        const instance = blazeMesh.createInstance('blaze' + ix);
        // instance.enableEdgesRendering();
        // instance.edgesWidth = 1.0;
        // instance.edgesColor = new BABYLON.Color4(0, 0, 0, 1);
        const v = vxs[ix];
        const zangle = toRadians(v.blaze.angle)
        instance.rotation.x = Math.PI;
        instance.rotation.z = zangle;

        // The offset has to take the angle into account.
        //
        const offset = 1.25 / 2 + v.nradius * Math.sqrt(SIZE / 2); // offset by half height of cylinder + size of node
        instance.position.x = v.x + offset * Math.sin(zangle);
        instance.position.y = v.y + offset * Math.cos(zangle);
        instance.position.z = -v.z;
        instance.alwaysSelectAsActiveMesh = true;
      }
    };

    createBlazes(data.vertex);

    const createNodes = function () {
      // BABYLON.Effect.ShadersStore['spritesVertexShader'] = node_spritesVertexShader;
      // BABYLON.Effect.ShadersStore['spritesPixelShader']  = node_spritesPixelShader;
      BABYLON.Effect.RegisterShader('sprites', node_spritesPixelShader, node_spritesVertexShader);
      const spriteMgr = new BABYLON.SpriteManager('vxMgr', data.sprite_atlas.name, NVX, 256, scene);
      spriteMgr.fogEnabled = false;
      spriteMgr.isPickable = true;
      console.log('spriteMgr:', spriteMgr);
      console.log('texture: ', spriteMgr.texture.getBaseSize());

      // Labels are implemented by creating a single label, then setting
      // the text and position when OnPointerOverTrigger happens.
      // // We can't attach a label to a SpriteManager, so create a dummy label mesh.
      //
      const labelMesh = new BABYLON.TransformNode();

      const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
      advancedTexture.useInvalidateRectOptimization = false;
      createLabel(advancedTexture, labelMesh);
      text1.text = '';
      label.isVisible = false;
      text1.isVisible = false;

      const w = data.sprite_atlas.width;
      const h = data.sprite_atlas.height;

      for(let [i, vx] of Object.entries(data.vertex)) {
        const sprite = new BABYLON.Sprite(i, spriteMgr);
        sprite.position.x = vx.x;
        sprite.position.y = vx.y;
        sprite.position.z = -vx.z;
        sprite.cellIndex = vx.fg_icon_index;
        sprite.size = SIZE * vx.nradius; // make the node sizees approximate Constellation.

        // We need to pass the x,y of the background icon to the shaders.
        // We don't use angle, so let's put them in there by abusing maths.
        // 67108864 = 2**26.
        //
        sprite.angle = Math.trunc(vx.bg_icon_index / w * 67108864) + vx.bg_icon_index / h;
        sprite.color = new BABYLON.Color4(...vx[node_color_attr]);

        // https://doc.babylonjs.com/how_to/how_to_use_actions
        //
        sprite.isPickable = true;
        sprite.actionManager = new BABYLON.ActionManager(scene);
        sprite.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, event => {
          // console.log('Over '+event.source.name);
          // text1.text = data.vertex[event.source.name].label_;
          text1.text = data.vertex[event.source.name][label_attr];
          labelMesh.position.x = event.source.position.x;
          labelMesh.position.y = event.source.position.y;
          labelMesh.position.z = event.source.position.z;
          // console.log(`wxh ${text1.width} ${text1.height}`);
          label.isVisible = true;
          text1.isVisible = true;
        }));

        sprite.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, event => {
          // console.log('Out '+event.source.name);
          text1.text = '';
          label.isVisible = false;
          text1.isVisible = false;
        }));

        sprite.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, event => {
          console.log('PickP ' + event.source.name);
          nodeEvent(event.source.name);
        }));

        sprite.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnCenterPickTrigger, event => {
          const v = data.vertex[event.source.name];
          console.log('PickC', v);
          camera.target = new BABYLON.Vector3(v.x, v.y, v.z);
        }));
      }
    };

    createNodes();

    // Lines.
    //
    const createLines = function () {
      // const NTX = data.transaction.length;
      const vxs = data.vertex;
      const lines = [];
      const lineColors = [];
      data.transaction.forEach(tx => {
        const sv = vxs[tx['sid_']];
        const dv = vxs[tx['did_']];
        const hypot = Math.hypot(sv.x - dv.x, sv.y - dv.y, sv.z - dv.z);
        const soffset = sv.nradius * Math.sqrt(SIZE / 2); // offset by size of node
        const osx = soffset * (sv.x - dv.x) / hypot;
        const osy = soffset * (sv.y - dv.y) / hypot;
        const osz = soffset * (sv.z - dv.z) / hypot;
        const doffset = dv.nradius * Math.sqrt(SIZE / 2); // offset by size of node
        const odx = doffset * (dv.x - sv.x) / hypot;
        const ody = doffset * (dv.y - sv.y) / hypot;
        const odz = doffset * (dv.z - sv.z) / hypot;
        const line = [
          new BABYLON.Vector3(sv.x - osx, sv.y - osy, -sv.z + osz),
          new BABYLON.Vector3(dv.x - odx, dv.y - ody, -dv.z + odz)
        ];
        lines.push(line);

        const color = new BABYLON.Color4(...tx.color);
        lineColors.push([color, color]);
      });

      const liness = BABYLON.MeshBuilder.CreateLineSystem('liness', { lines: lines, colors: lineColors, useVertexAlpha: false, width: 10 }, scene);
    }

    createLines();

    // Direction indicators.
    //
    const createDirections = function (transactions) {
      const arrows = []
      transactions.forEach(tx => {
        const dirs = tx.directions;
        if (dirs.includes('>')) {
          arrows.push({ sid_: tx.sid_, did_: tx.did_, color: tx.color })
        }
        if (dirs.includes('<')) {
          arrows.push({ sid_: tx.did_, did_: tx.sid_, color: tx.color })
        }
      });

      const nArrows = arrows.length;
      const arrowMesh = BABYLON.MeshBuilder.CreateCylinder('arrowheads', {
        height: 0.5,
        diameterBottom: 0.25,
        diameterTop: 0.0,
        tessellation: 4
      }, scene);
      arrowMesh.alwaysSelectAsActiveMesh = true;
      arrowMesh.isVisible = false;

      let colorData = new Float32Array(4 * (nArrows + 1));
      for (let ix = 0; ix < nArrows; ix++) {
        colorData[ix * 4 + 0] = arrows[ix].color[0];
        colorData[ix * 4 + 1] = arrows[ix].color[1];
        colorData[ix * 4 + 2] = arrows[ix].color[2];
        colorData[ix * 4 + 3] = arrows[ix].color[3];
      }

      const buffer = new BABYLON.VertexBuffer(engine, colorData, BABYLON.VertexBuffer.ColorKind, false, false, 4, true);
      arrowMesh.setVerticesBuffer(buffer);

      arrowMesh.material = new BABYLON.StandardMaterial('arrow_mat');
      // arrowMesh.material.disableLighting = true;
      arrowMesh.material.emissiveColor = BABYLON.Color3.White();

      const vxs = data.vertex;
      const toRadians = angle => angle * (Math.PI / 180);
      for (let ix = 0; ix < nArrows; ix++) {
        const instance = arrowMesh.createInstance('arrow' + ix);
        instance.enableEdgesRendering();
        instance.edgesWidth = 1.0;
        instance.edgesColor = new BABYLON.Color4(0, 0, 0, 1);

        // Figure out the offset of the arrowhead from the node.
        //
        const sv = vxs[arrows[ix].sid_];
        const dv = vxs[arrows[ix].did_];
        const hypot = Math.hypot(sv.x - dv.x, sv.y - dv.y, sv.z - dv.z);
        const offset = 0.5 / 2 + dv.nradius * Math.sqrt(SIZE / 2); // offset by half height of cylinder + size of node
        const ox = offset * (sv.x - dv.x) / hypot;
        const oy = offset * (sv.y - dv.y) / hypot;
        const oz = offset * (sv.z - dv.z) / hypot;
        instance.position.x = dv.x + ox;
        instance.position.y = dv.y + oy;
        instance.position.z = -dv.z - oz;

        // Make the arrowhead look at the destination node.
        // The pitch and roll make the cylinder line up in the correct direction.
        //
        instance.lookAt(new BABYLON.Vector3(dv.x, dv.y, -dv.z), 0, -Math.PI / 2, Math.PI);
        instance.alwaysSelectAsActiveMesh = true;
      }
    };

    createDirections(data.transaction);

    return scene;
  }
  // );
  //.catch(error => {console.log('Error:', error);});

  // scene.freezeActiveMeshes();

  const scene = createScene();
  console.log(scene.activeCamera);

  // scene.registerBeforeRender(function() {
  //   scene.activeCamera.alpha += 0.01;
  //   // scene.activeCamera.beta += 0.01;
  // })

  // Register a render loop to repeatedly render the scene
  engine.runRenderLoop(function () {
    scene.render();
  });

  // Watch for browser/canvas resize events
  window.addEventListener('resize', function () {
    engine.resize();
  });
}