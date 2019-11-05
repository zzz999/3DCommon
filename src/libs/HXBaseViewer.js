import Detector from './Detector';
import HashMap from './HashMap';
import * as signals from 'signals';
import 'extrajs/AMRTLoader';
import 'extrajs/AMRTSceneLoader';
import 'three-examples/controls/OrbitControls';
import {LoadingPage} from './LoadingPage';


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
    function HXBaseViewer(ele, options){
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
                scaleFactor: 1//初始相机z系数
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
            }     
        
            this.scene;//场景

            //渲染器
            this.renderer = new THREE.WebGLRenderer({
                antialias: true,
                alpha: true
            });

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
            this.camera = new THREE.PerspectiveCamera(75, rect.width / rect.height, 0.1, 1000);           

            //加载器
            this.wpLoader = new THREE.AMRTLoader();
            this.wpLoader.isAndroid = isAndroid;
            this.hxLoader = new THREE.AMRTSceneLoader();
            this.hxLoader.isAndroid = isAndroid;
            

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
            this.controls.enablePan = false; 

            var Signal = signals.Signal;

            //外部实现
            this.onMeshLoaded = new Signal();//网格加载完成
            this.onTextureLoaded = new Signal();//所有贴图加载完成
            this.onUpdate = new Signal();//更新
        }
    }

    HXBaseViewer.prototype = {
        constructor: HXBaseViewer,
        //渲染
        render:function(){
            var scope = this;
            function update(){  
                requestAnimationFrame(update); 
                if(scope.controls.enabled){
                    scope.controls.update();
                }

                var delta = clock.getDelta();

                scope.renderer.render(scope.scene, scope.camera);   

                scope.onUpdate.dispatch(delta);
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
        //加载模型
        loadModel:function(pathConfig){
            var scope = this;

            var hx;
            var wp;  

            function readyToRender(){
                wp.position.x *= -1;

                //兼容户型导出时，户型未归零的情况
                wp.position.x += hx.position.x * 2;

                wp.position.y += hx.position.y;
                scope.camera.position.y = hx.position.y * 2;

                scope.scene.add(wp); 

                //渲染
                scope.render();
            }
           
            var progressing = 0;
            function setPercent(){
                var loaded = 0;
                for(var key in loadeds){
                    loaded += loadeds[key];
                }
                progressing = parseInt(loaded * 100 / totalSize);
                scope.loadingPage.setPercent(progressing);
            }

            var totalSize = 0;
            var totals = {};
            var loadeds = {};

            function LoadHX(paths){
                //加载细节贴图   
                function LoadThumbnils() {
                    scope.hxLoader.loadThumbTexture(
                        paths.s,
                        function(){},
                        function(xhr){},
                        function (err){
                            console.error( err );
                        }
                    );
                }

                //加载贴图
                function LoadTextures() {
                    paths.t.forEach(function (url) {
                        scope.hxLoader.loadTexture(
                            url,
                            function(){},
                            function(xhr){},
                            function (err){
                                console.error( err );
                            }
                        );
                    });
                }

                //加载环境贴图
                function LoadEnvMap() {
                    paths.e.forEach(function (url) {
                        scope.hxLoader.loadEnvMap(
                            url,
                            function(xhr){},
                            function (err){
                                console.error( err );
                            });      
                    });
                }

                //加载光照贴图
                function LoadLightMap() {
                    paths.l.forEach(function (url) {
                        scope.hxLoader.loadLightMap(
                            url,
                            function(xhr){},
                            function (err){
                                console.error( err );
                            }
                        );
                    });
                }
        
                scope.hxLoader.load(paths.m, function ( obj ) {
                    scope.scene = obj;

                    hx = obj.children[2];                     
                    hx.scale.x = -1; 
                    hx.updateMatrixWorld(true);

                    //加载其他资源
                    LoadThumbnils();
                    LoadTextures();
                    LoadEnvMap();
                    LoadLightMap();            

                    if(wp){
                        readyToRender();
                    }
                },
                function ( xhr ) {      
                    if((xhr.total === undefined || xhr.total === 0)){
                        progressing+=1;
                        if(progressing >= 100){
                            progressing = 100;
                        }
                        scope.loadingPage.setPercent(progressing);
                    }else{
                        if(!totals[xhr.total]){
                            totals[xhr.total] = xhr.total;
                            totalSize += xhr.total;
                        }
                        loadeds[xhr.total] = xhr.loaded;
                        setPercent();
                    }        
                },
                function ( err ) {
                    console.error( err );
                });  
            }
          
            function LoadHXModel(paths){
                function LoadTexs(callback){
                    var len = paths.t.length;
                    scope.wpLoader.textureNum = len;
                    for(var i = 0; i < len; i++){
                        scope.wpLoader.loadRealTexture(
                            paths.t[i],
                            callback,
                            function(xhr){},
                            function (err){
                                console.error( err );
                            }
                        );
                    }
                }

                function LoadThumb() {
                    scope.wpLoader.loadThumbTexture(
                        paths.s,
                        function(xhr){},
                        function (err){
                            console.error( err );
                        }
                    );
                }

                //加载环境图
                function LoadEnv(callback) {
                    if(paths.e instanceof Array){
                        scope.wpLoader.envMapNum = paths.e.length;
                        paths.e.forEach(function(path){
                            scope.wpLoader.loadEnvMap(
                                path,
                                callback,
                                function(xhr){
                                },
                                function (err){
                                    console.error( err );
                                }
                            );
                        });          
                    } else {
                        scope.wpLoader.loadEnvMap(
                            paths.e,
                            callback,
                            function(xhr){
                            },
                            function (err){
                                console.error( err );
                            }
                        );
                    }
                }

                function allLoad(obj){
                    wp = obj.children[2];
                    wp.scale.x = -1;                    
                    wp.updateMatrixWorld(true);                                                     

                    LoadThumb();
                    LoadTexs(function(){
                        LoadEnv(function(){
                            if(hx){
                                readyToRender();
                            }
                        });
                    });           
                }

                function loadMulti(){
                    if(scope.wpLoader.mi === scope.wpLoader.maxmi){
                        scope.wpLoader.endLoad = true;
                    }
                    scope.wpLoader.load(paths.m[scope.wpLoader.mi], function(obj){
                        if(scope.wpLoader.mi === 0){                   
                            scope.wpLoader.mi = scope.wpLoader.mi + 1;                       
                            loadMulti();
                        } else if(scope.wpLoader.mi === scope.wpLoader.maxmi) {  
                            allLoad(obj);
                        } else {
                            scope.wpLoader.mi = scope.wpLoader.mi + 1;
                            loadMulti();
                        }
                    },
                    function(xhr){
                        if((xhr.total === undefined || xhr.total === 0)){
                            progressing += 1;
                            if(progressing >= 100){
                                progressing = 100;
                            }
                            scope.loadingPage.setPercent(progressing);
                        }else{
                            if(!totals[xhr.total]){
                                totals[xhr.total] = xhr.total;
                                totalSize += xhr.total;
                            }
                            loadeds[xhr.total] = xhr.loaded;
                            setPercent();
                        }
                    },
                    function(err){
                        console.error( err );
                    });
                }
                     
                if(paths.m instanceof Array && paths.m.length > 1){
                    scope.wpLoader.mi = 0;
                    scope.wpLoader.maxmi = paths.m.length - 1;
                    loadMulti();
                }else{
                    scope.wpLoader.endLoad = true;
                    scope.wpLoader.load((paths.m instanceof Array) ? paths.m[0] : paths.m, 
                    function ( obj ) {                       
                        allLoad(obj);
                    },
                    function ( xhr ) {   
                        if((xhr.total === undefined || xhr.total === 0)){
                            progressing+=1;
                            if(progressing >= 100){
                                progressing = 100;
                            }
                            scope.loadingPage.setPercent(progressing);
                        }else{
                            progressing = parseInt(xhr.loaded * 100 / xhr.total);
                            scope.loadingPage.setPercent(progressing);
                        }   
                    },
                    function ( err ) {
                        console.error( err );
                    });
                }  
            }

            LoadHX(pathConfig.paths);
            LoadHXModel(pathConfig.objPaths);
        }
    }

export {HXBaseViewer};