import Detector from './Detector';
import HashMap from './HashMap';
import * as signals from 'signals';
import 'extrajs/AMRTLoader';
import 'three-examples/controls/OrbitControls';
import 'three-examples/shaders/CopyShader';
import 'three-examples/postprocessing/EffectComposer';
import 'three-examples/postprocessing/SSAARenderPass';
import 'three-examples/postprocessing/RenderPass';
import 'three-examples/postprocessing/MaskPass';
import 'three-examples/postprocessing/ShaderPass';
import {LoadingPage} from './LoadingPage';

//hdr
import 'three-examples/loaders/RGBELoader';
import 'three-examples/loaders/HDRCubeTextureLoader';
import 'three-examples/pmrem/PMREMGenerator';
import 'three-examples/pmrem/PMREMCubeUVPacker';

    //工具参数和方法---START
    //检测对WebGL的支持
    if (!Detector.webgl) {
        Detector.addGetWebGLMessage();
    }
    
    //如果内置Map没实现
    if (typeof (Map) == 'undefined') {
        Map = HashMap;
    } 

    //平台判断
    var u = navigator.userAgent;
    var isAndroid = u.indexOf('Android') > -1 || u.indexOf('Adr') > -1 || u.indexOf('Linux') > -1;

    //事件兼容
    var startEventType = ((document.ontouchstart !== null) ? 'mousedown' : 'touchstart'),
        moveEventType = ((document.ontouchmove !== null) ? 'mousemove' : 'touchmove'),
        endEventType = ((document.ontouchend !== null) ? 'mouseup' : 'touchend');

    //工具参数和方法---END
    function BaseViewer(ele, options){
        //3D容器
        this.container;
        if(ele){
            if(typeof ele === 'string'){
                this.container = document.getElementById(ele);
            }else if(ele instanceof HTMLElement){
                this.container = ele;
            }else{
                console.log('请提供3D容器或容器ID！');
                return;
            }
        }else{
            console.log('请提供3D容器或容器ID！');
            return;
        }

        if(this.container){
            this.options = {
                minCamZoom: 1,//相机拉近系数
                maxCamZoom: 5,//相机拉远系数
                camNear: 0.1,//相机近切系数
                camFar: 10000,//相机远切系数
                scaleFactor: 1.5,//初始相机z系数
                initYFactor: 0.5,//初始相机y系数
                moveToZero:true,
                autoFit:true,
                enablePostProcessing:true,//启用后处理
                useHDR:false,
                enablePan:false,
                fogFactor:undefined,
                cameraAngle:0,//相机旋转角度
                mScaleFactor:2//移动端的相机拉近系数
            }

            //配置信息
            if(options && (typeof options === 'object')){
                if(options.minCamZoom){
                    this.options.minCamZoom = options.minCamZoom;
                }
                if(options.maxCamZoom){
                    this.options.maxCamZoom = options.maxCamZoom;
                }
                if(options.camNear){
                    this.options.camNear = options.camNear;
                }
                if(options.camFar){
                    this.options.camFar = options.camFar;
                }
                if(options.scaleFactor){
                    this.options.scaleFactor = options.scaleFactor;
                }
                if(options.initYFactor){
                    this.options.initYFactor = options.initYFactor;
                }
                if(options.moveToZero !== undefined){
                    this.options.moveToZero = options.moveToZero;
                }
                if(options.autoFit !== undefined){
                    this.options.autoFit = options.autoFit;
                }
                if(options.enablePan !== undefined){
                    this.options.enablePan = options.enablePan;
                }
                if(options.enablePostProcessing !== undefined){
                    this.options.enablePostProcessing = options.enablePostProcessing;
                }
                if(options.useHDR !== undefined){
                    this.options.useHDR = options.useHDR;
                }
                if(options.fogFactor!==undefined){
                    this.options.fogFactor = options.fogFactor;
                }
                if(options.cameraAngle!==undefined){
                    this.options.cameraAngle = options.cameraAngle;
                }
                if(options.mScaleFactor!==undefined){
                    this.options.mScaleFactor = options.mScaleFactor;
                }
            }     
        
            this.scene;//场景

            //渲染器
            this.renderer = new THREE.WebGLRenderer({
                antialias: true,
                alpha: true
            });

            if(this.options.useHDR){
                this.renderer.gammaInput = true; 
                this.renderer.gammaOutput = true;
                this.renderer.gammaFactor = 1.35;
            }

            var rect = this.container.getBoundingClientRect();
            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.renderer.setSize(rect.width, rect.height);
            this.renderer.domElement.style.position = 'absolute';
            this.renderer.domElement.style.top = '0';
            this.renderer.domElement.style.left = '0';
            this.renderer.domElement.style.bottom = '0';
            this.renderer.domElement.style.right = '0';

            this.dom = this.renderer.domElement;

            //阻止在Canvas中的鼠标移动浏览器默认事件
            this.dom.addEventListener(moveEventType, function(e){
                e.preventDefault();
            }, true);

            this.container.prepend(this.dom);
                       
            //相机
            this.camera = new THREE.PerspectiveCamera(50, rect.width / rect.height, 0.01, 10000);
            this._renderCamera = this.camera;

            //加载器
            this.loader = new THREE.AMRTLoader();
            this.loader.isAndroid = isAndroid;
            
            //主对象(一般为场景的第三个子节点)
            this.mainObj;
            //动画控制
            this._playing = false;
            this._paused = false;
            this._speed = 1;
            //渲染控制
            this._enableRender = true;

            //将this存储到变量
            var scope = this;

            //事件监听
            //窗口大小改变事件(有的浏览器只执行一次，有的执行两次。为防止不能拿到(特别是只执行一次的时候)准确的值，故延迟执行尺寸改变操作)
            var isResizing = false;
            window.addEventListener('resize', function () {
                if (!isResizing) {
                    setTimeout(function () {
                        var newRect = scope.container.getBoundingClientRect();
                        var width = newRect.width,
                            height = newRect.height;

                        scope.camera.aspect = width / height;
                        scope.camera.updateProjectionMatrix();
                        scope.renderer.setSize(width, height);

                        if(scope.options.enablePostProcessing && scope.composer){
                            var pixelRatio = scope.renderer.getPixelRatio();
                            var newWidth = Math.floor(width * pixelRatio) || 1;
                            var newHeight = Math.floor(height * pixelRatio) || 1;
                            scope.composer.setSize(newWidth, newHeight);
                        }

                        isResizing = false;
                    }, 100);
                }
                isResizing = true;
            }, false);  

            //取消移动端手势长按弹出提示框的操作
            document.addEventListener('contextmenu', function (e) {
                e.preventDefault();
            });

            //相机控制
            this.controls = new THREE.OrbitControls(this.camera, this.dom);  
            this.controls.rotateSpeed = 0.5;
            this.controls.enablePan = scope.options.enablePan; 
            this.controls.screenSpacePanning = true;

            var Signal = signals.Signal;

            //外部实现
            this.onMeshLoaded = new Signal();//网格加载完成
            this.onTextureLoaded = new Signal();//所有贴图加载完成
            this.onUpdate = new Signal();//更新
            this.onAnimationLoaded = new Signal();//动画加载完成
            this.onAnimationUpdate = new Signal();// 播放动画
        }
    }

    BaseViewer.prototype = {
        constructor: BaseViewer,
        getMainObj:function(){
            return this.mainObj;
        },
        enableRender:function(flag){
            this._enableRender = flag;
        },
        //渲染
        render:function(){
            var scope = this;
            function update(){  
                requestAnimationFrame(update); 
                if(scope._enableRender){
                    if(scope.controls.enabled){
                        scope.controls.update();
                    }

                    var delta = clock.getDelta();
                    if(!scope._paused && scope._playing){  
                        var i = 0,
                            len = scope.loader.cacheAnimations.length,
                            delta = delta * scope._speed;
                        for(i; i < len; i++){
                            scope.loader.cacheAnimations[i].update(delta);
                            scope.onAnimationUpdate.dispatch(i, delta);
                        }                    
                    }

                    if(scope.options.enablePostProcessing){
                        if(!scope.onUI){
                            scope.composer.render();
                        }else{
                            scope.renderer.render(scope.scene, scope._renderCamera);   
                        }    
                    }else{
                        scope.renderer.render(scope.scene, scope._renderCamera); 
                    }

                    scope.onUpdate.dispatch(delta);
                }
            }

            if(this.loadingPage){
                this.loadingPage.hide();
            }
            //网格加载完成
            this.onMeshLoaded.dispatch();

            //计时器
            var clock = new THREE.Clock(); 

            update();
        },
        //设置加载页
        setLoadingPage:function(divId, progressBarId, progressTextId){
            if(divId){
                this.loadingPage = new LoadingPage(divId, progressBarId, progressTextId);
            }else{
                console.log('请提供加载页元素ID！');
            }
        },
        //设置背景
        setBackgroud:function(base64){
            var scope = this;
            if(base64.indexOf('#') === 0){
                scope.scene.background = new THREE.Color().setStyle(base64);
            }else{
                new THREE.TextureLoader().load(base64, function (texture) {
                    texture.minFilter = THREE.LinearFilter;
                    scope.scene.background = texture;
                });
            }
        },
        getObjectById:function(id){
            return this.mainObj.getObjectById(id);
        },
        getObjectByName:function(name){
            return this.mainObj.getObjectByName(name);
        },
        getRaycaster:function(e){
            var raycaster = new THREE.Raycaster();
            var mouse = new THREE.Vector2();
            //兼容移动端
            if(e.touches && e.touches.length > 0) {    
                e = e.touches[0];
            }else{
                if(e.changedTouches && e.changedTouches.length > 0) {    
                    e = e.changedTouches[0];
                }
            }
            var rect = this.container.getBoundingClientRect();
            mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            raycaster.setFromCamera(mouse, this.camera);
            return raycaster;
        },
        isPlaying:function(){
            return this._playing;
        },
        detach:function ( child, oldParent, newParent ) {
            child.applyMatrix( oldParent.matrixWorld );
            oldParent.remove( child );
            newParent.add( child );
        },
        attach:function(child, oldParent, newParent) {
            child.applyMatrix( new THREE.Matrix4().getInverse( newParent.matrixWorld ) );
            oldParent.remove(child);
            newParent.add(child);
        },
        setSpeed:function(num){
            this._speed = num;
        },
        //播放动画
        playAnim:function(flag){
            var scope = this;
            //重置动画
            function resetAnim(){
                var i = 0,
                    len = scope.loader.cacheAnimations.length;
                for(i; i < len; i++){
                    scope.loader.cacheAnimations[i].update(-scope.loader.cacheAnimations[i].time);
                }
            }
            this._playing = flag;
            if(!this._playing){
                // resetAnim();
            }
        },
        //重置动画
        resetAnim: function () {
            var scope=this;
            var i = 0,
                len = scope.loader.cacheAnimations.length;
            for (i; i < len; i++) {
                scope.loader.cacheAnimations[i].update(-scope.loader.cacheAnimations[i].time);
            }
        },
        pauseAnim:function(flag){
            this._paused = flag;
        },
        isPause:function(){
            return this._paused;
        },
        setFollowCamera:function(obj){
            var boundingBox = new THREE.Box3().setFromObject(obj);
            var size = boundingBox.getSize(new THREE.Vector3());
            var center = boundingBox.getCenter(new THREE.Vector3());
            var maxDim = Math.max(size.x, size.y, size.z);  
            var fov = this.camera.fov * ( Math.PI / 180 );
            var cameraZ = Math.abs(maxDim / (2 * Math.tan(fov / 2)));

            //跟随相机
            var followCamera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 10000);                                               
            var fov = followCamera.fov * ( Math.PI / 180 );
            var cameraZ = Math.abs(maxDim / (2 * Math.tan(fov / 2)));

            var posY = cameraZ * this.options.initYFactor,
                posZ = -cameraZ * this.options.scaleFactor;

            followCamera.position.set(0, posY, posZ);
            followCamera.lookAt(center); 

            this.scene.add(followCamera);
            followCamera.updateMatrixWorld(true);
            this.detach(followCamera, this.scene, this.scene );
            followCamera.updateMatrixWorld(true);
            this.attach(followCamera, this.scene, obj);
            followCamera.updateMatrixWorld(true);

            //原相机没有被镜像，而添加为对象子级时会被镜像，所以镜像回来
            followCamera.scale.x *= -1;

            //设置普通相机
            this.camera.position.set(center.x, center.y + posY, center.z + posZ);
            this.camera.lookAt(center);
            var minDim = Math.min(size.x, size.y, size.z);
            this.camera.near = minDim * (this.options.camNear || 0.1);
            this.camera.far = minDim * (this.options.camFar || 10000);
            this.camera.updateProjectionMatrix();

            if (this.controls) {
                this.controls.target = center.clone();
                this.controls.saveState();
            }

            return followCamera;
        },
        setRenderCamera:function(cam){
            this._renderCamera = cam;
            this.ssaaRenderPass.camera = cam;
        },
        //加载模型
        loadModel:function(paths){
            var scope = this;
            //自适应相机
            function fitCamera(object, boundingBox) {
                if(scope.options.moveToZero){
                    var center = boundingBox.getCenter(new THREE.Vector3());
                    object.translateX(-center.x);
                    object.translateY(-center.y);
                    object.translateZ(-center.z);
                }

                var size = boundingBox.getSize(new THREE.Vector3());
                var maxDim = Math.max(size.x, size.y, size.z);     
                var fov = scope.camera.fov * ( Math.PI / 180 );
                var cameraZ = Math.abs(maxDim / (2 * Math.tan(fov / 2)));
                var isPortrait = ('orientation' in window) ? (window.orientation == 180 || window.orientation == 0) : (window.innerWidth < window.innerHeight);
                if(isPortrait){
                    scope.camera.position.z = cameraZ * scope.options.mScaleFactor;
                }else{
                    scope.camera.position.z = cameraZ * scope.options.scaleFactor;
                }
                
                scope.camera.position.y = cameraZ * scope.options.initYFactor;//俯视
                scope.camera.position.x=scope.options.cameraAngle;
                var minDim = Math.min(size.x, size.y, size.z);
                scope.camera.near = minDim * (scope.options.camNear || 0.1);

                scope.camera.far = minDim * (scope.options.camFar || 10000);
                scope.camera.updateProjectionMatrix();

                if (scope.controls) {
                    scope.controls.target = new THREE.Vector3();
                    scope.controls.maxDistance =scope.options.fogFactor?scope.options.fogFactor:scope.camera.far;
                    scope.controls.minDistance =  scope.camera.near;
                    scope.controls.saveState();
                }
            }

            //加载细节贴图   
            function LoadThumbnils() {
                scope.loader.loadThumbTexture(
                    paths.s,
                    function(xhr){},
                    function (err){
                        console.error( err );
                    }
                );
            }

            //加载贴图
            function LoadTextures(callback) {       
                if(paths.t instanceof Array){
                    scope.loader.textureNum = paths.t.length;
                    for(var i = 0; i < paths.t.length; i++){
                        scope.loader.loadRealTexture(
                            paths.t[i],
                            callback,
                            function(xhr){},
                            function (err){
                                console.error( err );
                            }
                        );
                    }
                }
                else{
                    scope.loader.loadTexture(
                        paths.t,
                        callback,
                        function(xhr){},
                        function (err){
                            console.error(err);
                        }
                    );
                }
            }

            //检查环境贴图是否加载完成
            function checkAllEnvMapLoaded(callback){
                scope.loader.envMapCount++;
                if(scope.loader.envMapCount === scope.loader.envMapNum){
                    if (callback && callback instanceof Function) {
                        callback();
                    }
                }
            }

            //加载环境贴图
            function LoadEnvMap(callback) {
                if(paths.e instanceof Array){
                    scope.loader.envMapNum = paths.e.length;
                    paths.e.forEach(function(path){
                        if(typeof path === 'object'){
                            loadHDREnvmap(path, function(){
                                checkAllEnvMapLoaded(callback);
                            });
                        }else{
                            scope.loader.loadEnvMap(
                                path,
                                callback,
                                function(xhr){},
                                function (err){
                                    console.error( err );
                                }
                            );
                        }
                    });
                }else{
                    if(typeof paths.e === 'object'){
                        loadHDREnvmap(paths.e, callback);
                    }else{
                        scope.loader.loadEnvMap(
                            paths.e,
                            callback,
                            function(xhr){},
                            function (err){
                                console.error( err );
                            }
                        );                
                    }
                }
            }

            //加载动画
            function LoadAnimations(){
                scope.loader.loadAnimations(
                    paths.a,
                    function(){
                        scope.onAnimationLoaded.dispatch();
                    },
                    function(xhr){},
                    function (err){
                        console.error( err );
                    }
                );
            }

            //初始化后处理
            function initPostprocess(){
                scope.onUI = false;
                scope.composer = new THREE.EffectComposer(scope.renderer);

                var ssaaRenderPass = new THREE.SSAARenderPass(scope.scene, scope.camera);
                ssaaRenderPass.sampleLevel = isAndroid ? 2 : 4;
                ssaaRenderPass.unbiased = true;
                scope.composer.addPass(ssaaRenderPass);
                scope.ssaaRenderPass = ssaaRenderPass;

                var copyPass = new THREE.ShaderPass(THREE.CopyShader);
                copyPass.renderToScreen = true;
                scope.composer.addPass(copyPass);

                //点击开始
                scope.dom.addEventListener(startEventType, function(e) {
                    scope.onUI = true;
                    ssaaRenderPass.enabled = false;     
                });
                //点击结束
                scope.dom.addEventListener(endEventType, function(e) {
                    scope.onUI = false;
                    ssaaRenderPass.enabled = true;                
                });
                //点击取消
                scope.dom.addEventListener('touchcancel', function(e) {
                    scope.onUI = false;
                    ssaaRenderPass.enabled = true;
                });
                //鼠标离开
                scope.dom.addEventListener('mouseleave', function(e) {
                    scope.onUI = false;
                    ssaaRenderPass.enabled = true;
                });
            }

            //加载HDR环境贴图
            function loadHDREnvmap(path, callback){                  
                var hdrCubeMap = new THREE.HDRCubeTextureLoader().load(THREE.UnsignedByteType, path.urls, function () {
                    var pmremGenerator = new THREE.PMREMGenerator( hdrCubeMap );
                    pmremGenerator.update( scope.renderer );

                    var pmremCubeUVPacker = new THREE.PMREMCubeUVPacker( pmremGenerator.cubeLods );
                    pmremCubeUVPacker.update( scope.renderer );

                    var hdrCubeRenderTarget = pmremCubeUVPacker.CubeUVRenderTarget;   
                    
                    if (path.name === 'skybox') {
                        for (var matIndex = 0; matIndex < scope.loader.cacheMats.length; matIndex++) {
                            scope.loader.cacheMats[matIndex].envMap = hdrCubeRenderTarget.texture;
                            scope.loader.cacheMats[matIndex].needsUpdate = true;
                        }
                    } else {
                        for (var matIndex = 0; matIndex < scope.loader.cacheMats.length; matIndex++) {
                            var mat = scope.loader.cacheMats[matIndex];
                            if (mat.envmapname === path.name) {
                                mat.matEnvMap = hdrCubeRenderTarget.texture;
                                mat.mixweight = mat.envmapintensity;                               
                                mat.defines.USE_MATENVMAP_CUBE_UV = '';
                                //叠加方式混合
                                mat.defines.MIX_ADD = '';
                                mat.needsUpdate = true;
                            }
                        }
                    }

                    pmremGenerator.dispose();
                    pmremCubeUVPacker.dispose();

                    callback();
                } );
            }

            //加载完成
            function LoadComplete(obj){ 
                scope.scene = obj;

                //是否启用后处理
                if(scope.options.enablePostProcessing){
                    initPostprocess();
                }
        
                //移到原点
                scope.mainObj = scope.scene.children[2];
                //scope.mainObj.scale.x = -1;
                scope.mainObj.updateMatrixWorld(true);

                //自适应  
                if(scope.options.autoFit){
                    var box = new THREE.Box3();
                    box.makeEmpty();

                    //处理模型
                    var shadow = scope.mainObj.getObjectByName('shadow');
                    if(shadow){
                        shadow.renderOrder = -1;
                        var sdParent = shadow.parent;
                        sdParent.remove(shadow);
                        box.expandByObject(scope.mainObj);
                        sdParent.add(shadow);
                    }else{
                        box.expandByObject(scope.mainObj);
                    }
                    

                    //设置相机
                    fitCamera(scope.mainObj, box);  
                    scope.hosObj=scope.mainObj.getObjectByName('Material #182');
                    var gridHelper = new THREE.GridHelper( 100, 100,0x363c54,0x363c54 );
                    gridHelper.position.y=-scope.camera.position.y/2;
                    scope.scene.add( gridHelper );
                    scope.scene.fog = new THREE.Fog( 0x1e1e28, 30, 40 );
                    // scope.scene.fog = new THREE.FogExp2( 0x1e1e28, 0.04 );
                }

                //加载其他资源
                LoadThumbnils();
                LoadTextures(function(){
                    if(paths.e){
                        LoadEnvMap(function(){
                            scope.onTextureLoaded.dispatch();//全部贴图加载完成
                        });
                    }                   
                });

                if(paths.a){
                    LoadAnimations();
                }
                              
                //渲染
                scope.render();
            }

            function loadMulti(){
                if(scope.loader.mi === scope.loader.maxmi){
                    scope.loader.endLoad = true;
                }
                scope.loader.load(paths.m[scope.loader.mi],
                    function(obj){
                        if(scope.loader.mi === 0){                   
                            scope.loader.mi += 1;
                            loadMulti();
                        } else if(scope.loader.mi === scope.loader.maxmi) {                 
                            LoadComplete(obj);
                        }else{
                            scope.loader.mi += 1;
                            loadMulti();
                        }
                    },function(xhr){
                        if(scope.loadingPage){
                            if((xhr.total === undefined || xhr.total === 0)){
                                pct += 1;
                                if(pct >= parseInt(100 * (scope.loader.mi + 1) / (scope.loader.maxmi + 1))){
                                    pct = parseInt(100 * (scope.loader.mi + 1) / (scope.loader.maxmi + 1));
                                }
                                scope.loadingPage.setPercent(pct);
                            }else{
                                pct = parseInt(100 * (scope.loader.mi) / (scope.loader.maxmi + 1) + xhr.loaded / xhr.total * 100 / (scope.loader.maxmi + 1));
                                if(pct > 100){
                                    pct = 100;
                                }
                                scope.loadingPage.setPercent(pct);
                            }
                        }
                    },function(err){
                        console.error( err );
                    });
            }

            //判断是单个还是多个模型网格文件
            var pct = 0;
            if(paths.m instanceof Array){
                scope.loader.mi = 0;
                scope.loader.maxmi = paths.m.length - 1;
                loadMulti();
            }else{
                scope.loader.endLoad = true;
                scope.loader.load(paths.m, function (obj) {
                    LoadComplete(obj);
                },
                function (xhr) {   
                    if(scope.loadingPage){
                        if((xhr.total === undefined || xhr.total === 0)){
                            pct += 1;
                            if(pct >= 100){
                                pct = 100;
                            }
                            scope.loadingPage.setPercent(pct);
                        }else{
                            pct = parseInt(xhr.loaded * 100 / xhr.total);
                            scope.loadingPage.setPercent(pct);
                        }   
                    }
                },
                function (err) {
                    console.error(err);
                });
            }     
        }
    }

export {BaseViewer};