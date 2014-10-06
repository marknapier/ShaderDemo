/**
 * Display text using a sketch effect shader.
 * @author Mark Napier / http://marknapier.com/
 * 2014/09/27
 */

var ShaderDemo = (function () {
    var SCREEN_WIDTH = 1.1;
    var SCREEN_HEIGHT = 2.2;
    var NEAR = .5, FAR = 200, FOV=40;
    var FLOOR = -2.5;
    var camera, controls, scene, renderer, composer, light;
    var renderpass, cannypass, edgepass, multitexturepass;  // shaders
    var container = null;  // html element that wraps the canvas
    var message_obj = new THREE.Object3D();
    var message_size = 0;
    var ground = null;
    var cam_radius = 5;
    var overlay;
    var render_shaders = true;
    // to preload images
    var images = {};
    var sources = {
        paper_bg_white: 'img/white.png',
        paper_bg_lite: 'img/paper2.jpg',
        paper_bg_wc: 'img/watercolor-paper2_crop_white_t_960px.png',
        paper_bg_dark: 'img/paper1.png',
        pencil_texture_lite_A: 'img/pencil_texture_A_lite_200.png',
        pencil_texture_med_A: 'img/pencil_texture_A_medium_200.png',
        pencil_texture_dark_A: 'img/pencil_texture_A_dark_200.png',
        pencil_texture_lite_B: 'img/lines_horizontal_200_blue.png',
        pencil_texture_med_B: 'img/lines_vertical_200_blue.png',
        pencil_texture_dark_B: 'img/lines_diagonal_200_blue.png',
        pencil_texture_lite_C: 'img/pencil_texture_lite_200_tile.png',
        pencil_texture_med_C: 'img/pencil_texture_medium_200_tile.png',
        pencil_texture_dark_C: 'img/pencil_texture_dark_200_tile.png'
    };
    // beginnings of an app loader
    var app = {
        loadedImages: false,
        loadedModel: false,
        start: function() {
            hideWait();
            animate();
        },
        requestStart: function() {
            if (this.loadedImages && this.loadedModel) {
                this.start();
            }
        }
    };


    function show(words) {
        if (container) {
            // canvas is initialized
            addMessageToScene(message_text);
        }
        else {
            // initialize canvas (init will build mesh from message_text)
            init();  
        }
    }

    function init() {
        if ( !Detector.webgl ) {
            Detector.addGetWebGLMessage();
        }

        // start preloading images
        loadImages(sources, doneLoadingImages);

        // SCENE
        scene = new THREE.Scene();

        // overall light level
        scene.add( new THREE.AmbientLight( 0x060606 ) );

        // Light from above.  Will cast shadows on the ground
        light = new THREE.DirectionalLight( 0xe0e0e0);
        light.position.set( -10, 40, -20 );
        light.target.position.set( 0, 0, 0 ); 
        light.castShadow = true;
        light.shadowBias = 0.0001;
        light.shadowDarkness = 0.7;
        light.shadowMapWidth = 2048;
        light.shadowMapHeight = 512;
        // define the shadow area
        light.shadowCameraNear = 20;
        light.shadowCameraFar = 70;
        light.shadowCameraFov = 40;        
        // need these four lines for DirectionalLight shadow
        light.shadowCameraLeft = -20;
        light.shadowCameraRight = 20;
        light.shadowCameraTop = 10;
        light.shadowCameraBottom = -10;
        // for debug
        //light.shadowCameraVisible = true;
        scene.add( light );

        // RENDERER
        container = document.getElementById('three_canvas');
        var style = window.getComputedStyle(container);
        SCREEN_WIDTH = parseInt(style.getPropertyValue('width'), 10);
        SCREEN_HEIGHT = parseInt(style.getPropertyValue('height'), 10);

        renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true, preserveDrawingBuffer: true } );
        renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
        container.appendChild( renderer.domElement );
        renderer.autoClear = false;
        renderer.shadowMapEnabled = true;
        renderer.shadowMapType = THREE.PCFShadowMap;
        // renderer.setClearColor(0x000000, 0.0);  // transparent background

    	// CAMERA
        camera = new THREE.OrthographicCamera( SCREEN_WIDTH/-40, SCREEN_WIDTH/40, SCREEN_HEIGHT/40, SCREEN_HEIGHT/-40, NEAR, FAR );

        // EVENTS
        window.addEventListener( 'resize', onWindowResize, false );
        window.addEventListener( 'keydown', onKeyDown, false );

        //--------------------------------------------
        // LOAD MODELS

        // GROUND
        ground = new THREE.Mesh( new THREE.PlaneGeometry(150,80), new THREE.MeshPhongMaterial({color:0xf0f030, ambient:0xe0e000}) );
        ground.position.set( 0, FLOOR-1, 0 );
        ground.rotation.x = - Math.PI / 2;
        ground.castShadow = false;
        ground.receiveShadow = true;  // set to true to see shadow
        ground.visible = true;
        scene.add( ground );

        //--------------------------------------------
        // model
        (new THREE.OBJMTLLoader()).load('models/obj/word.obj', 'models/obj/word.mtl', function (object) {
            message_obj = object;
            message_size = dimensions(message_obj);
            message_obj.rotation.set(-THREE.Math.degToRad(90), 0, -THREE.Math.degToRad(-5), "XYZ");
            message_obj.position.set(-(message_size.x/2),FLOOR,1);
            setShadow(message_obj,true);
            scene.add(message_obj);
            setCameraView(camera, message_size.x, SCREEN_HEIGHT, SCREEN_WIDTH);
            resetCamera( {x:0, y:30, z:20} );
            camera.lookAt( new THREE.Vector3(0, 0, 0) );
            app.loadedModel = true;
            doneLoadingModel();
        });

        //--------------------------------------------
        // POSTPROCESSING

        renderpass = new THREE.RenderPass(scene, camera);
            renderpass.clearAlpha = 0.0;
            renderpass.clearColor = new THREE.Color(0,0,0);

        edgepass = new THREE.ShaderPass( THREE.EdgeShaderCannyFilled );
        edgepass.renderToScreen = false;

        cannypass = new THREE.ShaderPass( THREE.EdgeShaderCanny );
        cannypass.renderToScreen = false;

        multitexturepass = new THREE.ShaderPass( THREE.OverlayShaderMultitextureBlend );
        multitexturepass.renderToScreen = false;

        composer = makeComposer2();
    }

    // blue lines on white
    function makeComposer1() {
        setPaper("paper1.png");

        // edge detection shader
        edgepass.uniforms['edgewidth'].value = .5;

        // multitextured sketch effect shader
        multitexturepass.uniforms[ 'overlay1' ].value = THREE.ImageUtils.loadTexture('img/lines_horizontal_200_blue.png');
        multitexturepass.uniforms[ 'overlay2' ].value = THREE.ImageUtils.loadTexture('img/lines_vertical_200_blue.png');
        multitexturepass.uniforms[ 'overlay3' ].value = THREE.ImageUtils.loadTexture('img/lines_diagonal_200_blue.png');
        multitexturepass.uniforms['repeat'].value = new THREE.Vector2(SCREEN_WIDTH/200,SCREEN_HEIGHT/200);

        // prepare effects to render to a texture
        var compose = new THREE.EffectComposer( renderer );
        compose.addPass( renderpass );
        compose.addPass( edgepass );
        compose.addPass( multitexturepass );
        overlay = new Overlay(compose.renderTarget2); //1 or 2
        return compose;
    }

    // sepia toned fine pencil shading
    function makeComposer2() {
        setPaper("paper2.jpg");

        // edge detection shader
        edgepass.uniforms['edgewidth'].value = .35;

        // multitextured sketch effect shader
        multitexturepass.uniforms[ 'overlay1' ].value = THREE.ImageUtils.loadTexture('img/pencil_texture_lite_200_tile.png');
        multitexturepass.uniforms[ 'overlay2' ].value = THREE.ImageUtils.loadTexture('img/pencil_texture_medium_200_tile.png');
        multitexturepass.uniforms[ 'overlay3' ].value = THREE.ImageUtils.loadTexture('img/pencil_texture_dark_200_tile.png');
        multitexturepass.uniforms['repeat'].value = new THREE.Vector2(SCREEN_WIDTH/200,SCREEN_HEIGHT/200);

        // prepare effects to render to a texture
        var compose = new THREE.EffectComposer( renderer );
        compose.addPass( renderpass );
        compose.addPass( edgepass );
        compose.addPass( multitexturepass );
        overlay = new Overlay(compose.renderTarget2); //1 or 2
        return compose;
    }

    // coarse black pencil shading
    function makeComposer3() {
        setPaper("paper2.jpg");

        // edge detection shader
        edgepass.uniforms['edgewidth'].value = 1.0;

        // multitextured sketch effect shader
        multitexturepass.uniforms[ 'overlay1' ].value = THREE.ImageUtils.loadTexture('img/pencil_texture_A_lite_200.png');
        multitexturepass.uniforms[ 'overlay2' ].value = THREE.ImageUtils.loadTexture('img/pencil_texture_A_medium_200.png');
        multitexturepass.uniforms[ 'overlay3' ].value = THREE.ImageUtils.loadTexture('img/pencil_texture_A_dark_200.png');
        multitexturepass.uniforms['repeat'].value = new THREE.Vector2(4,4);

        // prepare effects to render to a texture
        var compose = new THREE.EffectComposer( renderer );
        compose.addPass( renderpass );
        compose.addPass( edgepass );
        compose.addPass( multitexturepass );
        overlay = new Overlay(compose.renderTarget2);
        return compose;
    }

    // EdgeShaderCannyFilled: gray scale with edges
    function makeComposer4() {
        setPaper("paper1.png");

        // edge detection shader
        edgepass.uniforms['edgewidth'].value = 2.0;

        // prepare effects to render to a texture
        var compose = new THREE.EffectComposer( renderer );
        compose.addPass( renderpass );
        compose.addPass( edgepass );
        overlay = new Overlay(compose.renderTarget1);
        return compose;
    }

    // Edges only
    function makeComposer5() {
        setPaper("paper2.jpg");

        // plain Canny edge detection shader
        cannypass.uniforms['edgewidth'].value = 2.0;

        // prepare effects to render to a texture
        var compose = new THREE.EffectComposer( renderer );
        compose.addPass( renderpass );
        compose.addPass( cannypass );
        overlay = new Overlay(compose.renderTarget1);
        return compose;
    }

    function setShadow(obj, shadow) {
        obj.traverse(function(child) {
            child.castShadow = shadow;
            child.receiveShadow = false;
        });
    }

    function dimensions(obj3d) {
        var box = new THREE.Box3().setFromObject(obj3d);
        return {x: box.max.x-box.min.x, y:box.max.y-box.min.y, z:box.max.z-box.min.z};
    }

    /**
     * OVERLAY class
     * Draws an image over the entire screen, can be used either for background or HUD.
     */
    var Overlay = (function(){
        function cls(texture) {
            makeOverlay(texture);

            // PRIVATE
            var bgScene, bgCamera, bgQuad, mat;

            function makeOverlay(texture) {
                bgQuad = new THREE.Mesh(
                  new THREE.PlaneGeometry(2, 2, 0),
                  (mat=new THREE.MeshBasicMaterial({map:texture, color:0xFFFFFF, transparent:true}))
                );

                // The bg plane shouldn't care about the z-buffer.
                bgQuad.material.depthTest = false;
                bgQuad.material.depthWrite = false;

                bgScene = new THREE.Scene();
                bgCamera = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 1 );
                bgScene.add(bgCamera);
                bgScene.add(bgQuad);
            }

            function draw() {
                renderer.render(bgScene, bgCamera);
            }

            // PUBLIC
            this.draw = draw;
            this.material = mat;
        }
        return cls;
    })();

    function resetCamera(pos, tgt) {
        tgt = tgt || {x:0, y:0, z:0};
        camera.position.set( pos.x, pos.y, pos.z );
        camera.up.set(0,1,-1);
        camera.lookAt( new THREE.Vector3( tgt.x, tgt.y, tgt.z ) );  // doesn't do anything when trackball is in use
        controls = new THREE.TrackballControls( camera, renderer.domElement );
        controls.target = ( new THREE.Vector3( tgt.x, tgt.y, tgt.z ) );  // trackball "lookAt"
        controls.rotateSpeed = 1.0;
        controls.zoomSpeed = 1.2;
        controls.panSpeed = 0.2;
        controls.noZoom = false;
        controls.noPan = false;
        controls.staticMoving = false;
        controls.dynamicDampingFactor = 0.3;
        controls.minDistance = cam_radius * .5;
        controls.maxDistance = cam_radius * 10;
        controls.keys = [ 65, 17, 18 ]; // [ rotateKey, zoomKey (CTRL), panKey(ALT) ]
    }

    function onWindowResize() {
    	// SCREEN_WIDTH = window.innerWidth;
    	// SCREEN_HEIGHT = window.innerHeight;
    	// camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
    	// camera.updateProjectionMatrix();
    	// renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
    }

    function onKeyDown ( event ) {
        return;

    	// console.log(event.keyCode);
    	switch( event.keyCode ) {
            case 66: //B
                break;
            case 48: //0
                break;
    		case 49: // 1
                render_shaders = false;
    			break;
    		case 50: // 2
                render_shaders = true;
                composer = makeComposer1();
    			break;
    		case 51: // 3
                render_shaders = true;
                composer = makeComposer2();
    			break;
            case 52: // 4
                render_shaders = true;
                composer = makeComposer3();
                break;
            case 53: // 5
                render_shaders = true;
                composer = makeComposer4();
                break;
    		case 54: // 6
                render_shaders = true;
                composer = makeComposer5();
    			break;
    		case 56: // 8
    			break;
    		case 38: // forward arrow
    			break;
    		case 40: // back arrow
    			break;
    	}
    }

    // called when models are loaded
    function doneLoadingModel() {
        console.log("DONE loading model len=" + message_size.x);
        app.loadedModel = true;
        app.requestStart();
    }

    // called when loadImages() completes
    function doneLoadingImages(arg) {
        console.log("DONE loading images");
        app.loadedImages = true;
        app.requestStart();
    }

    function setCameraView(cam, object_width, w, h) {
        var camratio = h / w;
        var camwidth = (object_width / 2);
        cam.left = -camwidth;
        cam.right = camwidth;
        cam.top = camwidth*camratio;
        cam.bottom = -camwidth*camratio;
        cam.updateProjectionMatrix();
    }

    // hide the spinner and show the canvas
    function hideWait() {
        var wait = document.getElementById("canvas_loading_prompt");
        wait.style.display = 'none';
        var div = document.getElementById("three_canvas");
        div.style.display = 'block';
        // have to do this AFTER canvas is visible (or TrackBall control does nothing)
        resetCamera( {x:0, y:30, z:20} );
        setCameraView(camera, message_size.x+4, SCREEN_WIDTH, SCREEN_HEIGHT);        
    }

    function loadImages(sources, callback) {
        console.log("loadimages()");
        var loadedImages = 0;
        var numImages = 0;
        for(var src in sources) {
            numImages++;
        }
        for(var imgid in sources) {
            images[imgid] = new Image();
            images[imgid].onload = function() {
                if(++loadedImages >= numImages) {
                    // console.log("loadImages finished - images[] now is:");
                    // console.log(images);
                    callback(sources);  // call function when done
                }
            };
            console.log("   new Image source=" + sources[imgid]);
            images[imgid].src = sources[imgid];
        }
    }


    var animationID = null;
    
    function animate() {
    	animationID = requestAnimationFrame( animate );
    	render();
    }

    function render() {
        // set camera as per the mouse movement
        controls.update();
        renderer.clear();

        if (render_shaders) {
            // render pendant into texture, draw rendered image
            composer.render();
            overlay.draw();
        }
        else {
            renderer.render(scene, camera);
        }

        // tilt the shadow camera
        // have to do this after render (until then shadowCamera is null)
        light.shadowCamera.up.set(.02, 0, 1);        
    }

    function setPaper(imgfilename) {
        document.getElementById("three_canvas").style.backgroundImage = 'url(' + 'img/' + imgfilename + ')';
    }

    function setOption(option) {
        render_shaders = true;
        if (option === "3D") {
            render_shaders = false;
        }
        else if (option === "blue_hatch") {
            composer = makeComposer1();
        }
        else if (option === "fine_sketch") {
            composer = makeComposer2();
        }
        else if (option === "coarse_sketch") {
            composer = makeComposer3();
        }
        else if (option === "grayscale") {
            composer = makeComposer4();
        }
        else if (option === "edges") {
            composer = makeComposer5();
        }
        else {
            composer = makeComposer2();
        }
    }

    // PUBLIC functions
    var my = {};
    my.show = show;
    my.option = setOption;
    return my;
}());
