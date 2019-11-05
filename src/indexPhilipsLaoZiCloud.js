import {ViewerNoValid} from './libs/ViewerNoValid';
import 'extrajs/TTFLoader';
import TWEEN from '@tweenjs/tween.js';

$(function () {
    //设置背景(添加水印)
    function setSceneBg(){
        var isPortrait = ('orientation' in window) ? (window.orientation == 180 || window.orientation == 0) : (window.innerWidth < window.innerHeight);

        var image = new Image();
        image.setAttribute('crossorigin', 'anonymous');
        image.addEventListener('load', function (event) {
            var myCanvas = document.createElement("canvas");
            myCanvas.width = window.innerWidth * window.devicePixelRatio;
            myCanvas.height = window.innerHeight * window.devicePixelRatio;
            var ctx = myCanvas.getContext("2d");           
            //背景
            ctx.globalCompositeOperation = "destination-over";
            ctx.drawImage(this, 0, 0, myCanvas.width, myCanvas.height);

            if(Api.removeLogo){
                viewer.setBackgroud(myCanvas.toDataURL('image/jpeg', 1.0));
            }else{
                if(Api.customLogo){
                    var myCanvas1 = document.createElement("canvas");
                    myCanvas1.width = this.width;
                    myCanvas1.height = 98;
                    var ctx1 = myCanvas1.getContext("2d");
                    var img = new Image();
                    img.setAttribute('crossorigin', 'anonymous');
                    img.addEventListener('load', function (event) {
                        var w = this.width * (myCanvas1.height / this.height);
                        ctx1.drawImage(this, (myCanvas1.width - w) * 0.5, 0, w, myCanvas1.height);

                        //合成logo
                        ctx.globalCompositeOperation = "source-over";
                        var h = myCanvas1.height * (myCanvas.width / myCanvas1.width);
                        ctx.drawImage(myCanvas1, 0, myCanvas.height - h * 1.5, myCanvas.width, h);

                        viewer.setBackgroud(myCanvas.toDataURL('image/jpeg', 1.0));                                                    
                    }, false);
                    img.src = Api.customLogo;  
                }else{
                    var img = new Image();
                    img.setAttribute('crossorigin', 'anonymous');
                    img.addEventListener('load', function (event) {
                        //户型内容
                        ctx.globalCompositeOperation = "source-over";
                        var h = img.height * (myCanvas.width / img.width);
                        ctx.drawImage(this, 0, myCanvas.height - h * 1.5, myCanvas.width, h);

                        viewer.setBackgroud(myCanvas.toDataURL('image/jpeg', 1.0));                           
                    }, false);
                    img.src = Api.prefix + (isPortrait ? 'img/plogo.png' : 'img/llogo.png');  
                }
            }
        }, false);
        image.src = Api.prefix + (isPortrait ? ('img/p1.jpg') : ('img/l1.jpg'));        
    }

    var shells = [];
    function findShell(name, callback){
        var shell = viewer.getObjectByName(name);
        if(shell){
            shells.push(shell);
            if(callback && callback instanceof Function){
                callback(shell);
            }
        }
    }

    var shellMats = [];
    function findShellMat(name, callback){
        var mat = viewer.MatOpPlugin.getMaterial(name);
        if(mat){
            shellMats.push(mat);
            if(callback && callback instanceof Function){
                callback(mat);
            }
        }
    }

    var timer;
    var viewer = new ViewerNoValid('mainContainer',
        //options
        {
            enablePan:true
        },
        //plugins
        {
            MatOpPlugin:{}
        });

    viewer.setLoadingPage('loadingDiv', 'pecentageWidth', 'pecentageText');

    viewer.onUpdate.add(function(){
        TWEEN.update();
    });

    //监听网格加载完成 
    var font;
    viewer.onMeshLoaded.add(function(){
        //查找外壳
        findShell('Shell01');
        findShell('Shell02', function(o){
            o.visible = false;
        });
       
        //设置背景
        setSceneBg();

        var loader = new THREE.TTFLoader();
        loader.load('fonts/font.ttf', function (json) {
            font = new THREE.Font(json);
            //初始化UI
            initUI();
        });       
    });

    //监听贴图加载完成 
    var fontMat;
    viewer.onTextureLoaded.add(function(){
        //查找外壳材质及字体材质
        findShellMat('主体色', function(m){
            fontMat = m.clone();
            fontMat.aoMap = null;
            fontMat.normalMap = null;
            fontMat.needsUpdate = true;
            shellMats.push(fontMat);
        });
        findShellMat('主体颜色');
        findShellMat('Logo');
    });
    
    viewer.loadModel(paths);

    function initUI(){    
        var startEventType = ((document.ontouchstart !== null) ? 'mousedown' : 'touchstart');

        //窗口大小改变事件(有的浏览器只执行一次，有的执行两次。为防止不能拿到(特别是只执行一次的时候)准确的值，故延迟执行尺寸改变操作)
        var isResizing = false;
        window.addEventListener('resize', function () {
            if (!isResizing) {
                setTimeout(function () {                  
                    if(viewer.scene){
                        setSceneBg();
                    }
                    isResizing = false;
                }, 100);
            }
            isResizing = true;
        }, false);  

        //互斥按钮
        $('.gray-model-list .line-btn').on(startEventType, function() {
            if($(this).hasClass('active')){
                $(this).removeClass('active');
            }else{
                $('.gray-model-list .line-btn').removeClass('active'); 
                $(this).addClass('active');              
            }
        });

        //背景
        var curShellIdx = 0;
        $('.productsList li').on(startEventType, function(){            
            var index = $(this).index();
            if(index !== curShellIdx){  
                $(this).addClass('active').siblings().removeClass('active');
                if(index === 0){
                    $('#liCenter').hide();
                    $('#liLeft').show();
                    $('#liRight').show();
                }else{
                    $('#liCenter').show();
                    $('#liLeft').hide();
                    $('#liRight').hide();
                }
                curShellIdx = index;
                shells.forEach(function(shell,idx){
                    if(idx === index){
                        shell.visible = true;
                    }else{
                        shell.visible = false;
                    }
                });
            }
        });     

        //颜色
        var curColorIdx = 0;
        var colors = [new THREE.Color(0, 119/255, 200/255),new THREE.Color(1, 209/255, 0),new THREE.Color(53/255, 87/255, 73/255),new THREE.Color(196/255, 98/255, 45/255),new THREE.Color(72/255, 162/255, 63/255)];
        $('.colorList li').on(startEventType, function(){
            var index = $(this).index();
            if(index !== curColorIdx){ 
                $(this).addClass('active').siblings().removeClass('active');
                curColorIdx = index;
                shellMats.forEach(function(mat){
                    mat.color.copy(colors[index]);
                });
            }
        });
       
        function genTextGeometry(text){
            var textGeo = new THREE.TextBufferGeometry(text, {
                font: font,
                size: 10,
                height: 2,
                curveSegments: 4,
                bevelThickness: 2,
                bevelSize: 1.5,
                bevelEnabled: true
            } );

            textGeo.computeBoundingBox();
            textGeo.computeVertexNormals();

            var xMid = - 0.5 * (textGeo.boundingBox.max.x - textGeo.boundingBox.min.x);
            var yMid = - 0.5 * (textGeo.boundingBox.max.y - textGeo.boundingBox.min.y);
            var zMid = - 0.5 * (textGeo.boundingBox.max.z - textGeo.boundingBox.min.z);
            textGeo.translate(xMid, yMid, zMid); 
            return textGeo;
        }
     
        var textConfigs = [
            {
                pos:new THREE.Vector3(0.016, -0.006, -0.0078),
                rot:new THREE.Euler(-0.12, -1, 1.48)
            }, 
            {
                pos:new THREE.Vector3(-0.017, -0.006, -0.0065),
                rot:new THREE.Euler(-0.12, 1, 1.66)
            }
        ];

        function detach( child, parent, scene ) {
            child.applyMatrix( parent.matrixWorld );
            parent.remove( child );
            scene.add( child );
        }

        function attach( child, scene, parent ) {
            child.applyMatrix( new THREE.Matrix4().getInverse( parent.matrixWorld ) );
            scene.remove( child );
            parent.add( child );
        }

        function manageText(idx, txt){
            var tc = textConfigs[idx];
            var textGeo = genTextGeometry(txt);
            if(!tc.obj){
                var textMesh = new THREE.Mesh(textGeo, fontMat);
                textMesh.name = txt;
                textMesh.scale.multiplyScalar(0.00025);
                textMesh.rotation.copy(tc.rot);
                textMesh.position.copy(tc.pos);

                viewer.scene.add(textMesh);
                textMesh.updateMatrixWorld(true);
                detach( textMesh, viewer.scene, viewer.scene );
                textMesh.updateMatrixWorld(true);
                attach(textMesh, viewer.scene, shells[0]);
                textMesh.updateMatrixWorld(true);

                tc.obj = textMesh;
            }else{
                tc.obj.geometry = textGeo;
                tc.obj.updateMatrix();
            }
        }

        $('#iptLeftText').on('input',function(){
            var txt = $('#iptLeftText').val();
            $('#liLeft span').text(txt.length);
            manageText(0, txt);
        });

        $('#iptLeftText').on('focus',function(){
            new TWEEN.Tween(viewer.camera.position)
                .to({
                    x: -0.20691840978611434, 
                    y: -0.05273253225438971, 
                    z: -0.10638408912024339
                },500)
                .onUpdate(function(){
                    viewer.camera.lookAt(new THREE.Vector3());
                })
                .onComplete(function(){ 
                    viewer.camera.rotation.set(2.6814065077965514, -1.0498408774223078, 2.7355573536742672);
                })
                .start();
        });

        $('#iptRightText').on('input',function(){
            var txt = $('#iptRightText').val();
            $('#liRight span').text(txt.length);
            manageText(1, txt);
        });

        $('#iptRightText').on('focus',function(){
            new TWEEN.Tween(viewer.camera.position)
                .to({
                    x: 0.18926747899846194, 
                    y: -0.02078453121635594, 
                    z: -0.10050992285131449}
                ,500)
                .onUpdate(function(){
                    viewer.camera.lookAt(new THREE.Vector3());
                })
                .onComplete(function(){ 
                    viewer.camera.rotation.set(2.9376760499947636, 1.0738975188279534, -2.9617735824104465);
                })
                .start();
        });

        var poss = [
            [0.0147,0.048,-0.0012],//A
            [0.0164, 0.0455, 0.0014],//B
            [0.0175, 0.0431, 0.0044],//C
            [0.0181, 0.041, 0.0078],//D
            [0.018, 0.0388, 0.0112],//E
            [0.0172, 0.0367, 0.0146],//F
            [0.0157, 0.0348, 0.0178],//G
            [0.0135, 0.03305, 0.0207],//H
            [0.0108, 0.0315, 0.0232],//I
            [0.0075, 0.0302, 0.025],//J
            [0.0038, 0.0294, 0.0261],//K
            [0, 0.029, 0.0265],//L
            [-0.0038, 0.0294, 0.0261],//M
            [-0.0075, 0.0302, 0.025],//N
            [-0.0108, 0.0315, 0.0232],//O
            [-0.0135, 0.03305, 0.0207],//P
            [-0.0157, 0.0348, 0.0178],//Q
            [-0.0172, 0.0367, 0.0146],//R
            [-0.018, 0.0388, 0.0112],//S
            [-0.0181, 0.041, 0.0078],//T
            [-0.0175, 0.0431, 0.0044],//U
            [-0.0164, 0.0455, 0.0014],//V
            [-0.0147, 0.048, -0.0012],//W
            [-0.0126, 0.0506,-0.0033]];//X

        var rots = [[-1.1, 3.7,-2.2],//A
            [-1.1, 3.76, -2],//B
            [-1.1, 3.75, -1.8],//C
            [-1, 3.8, -1.6],//D
            [-1, 3.73,-1.4],//E
            [-0.85, 3.65, -1.2],//F
            [-0.75, 3.65, -1],//G
            [-0.7, 3.55,-0.8],//H
            [-0.55, 3.48,-0.6],//I
            [-0.5, 3.35,-0.4],//J
            [-0.45, 3.23, -0.2],//K
            [-0.45, 3.1415926, 0],//L
            [-0.45, 3.05, 0.2],//M
            [-0.5, 2.9, 0.4],//N
            [-0.55, 2.8, 0.6],//O
            [ -0.65, 2.7, 0.8],//P
            [-0.75, 2.65, 1],//Q
            [-0.85, 2.6, 1.2],//R
            [-0.95, 2.6, 1.4],//S
            [-1.05, 2.55, 1.6],//T
            [-1.1, 2.55, 1.8],//U
            [-1.15, 2.5, 2],//V
            [-1.15, 2.5, 2.2],//W
            [-1.25, 2.5, 2.4]];//X
        var centerTextMeshs = [];
        var deltaAngle = THREE.Math.degToRad(180 / 24);
        $('#iptCenterText').on('input',function(){
            //去除原来的
            centerTextMeshs.forEach(function(m){
                m.parent.remove(m);
            });
            centerTextMeshs = [];

            var txt = $('#iptCenterText').val();
            $('#liCenter span').text(txt.length);
            var len = txt.length;            
            var halfLen = Math.ceil(len / 2);
            var startPos = 12 - halfLen;
            var i = 0;
            for(i; i < len; i++){
                if(txt[i] !== ' '){
                    var textGeo = genTextGeometry(txt[i]);
                    var textMesh = new THREE.Mesh(textGeo, fontMat);
                    textMesh.name = txt[i];
                    textMesh.scale.multiplyScalar(0.00025);
                    textMesh.rotation.fromArray(rots[(i + startPos)]);
                    textMesh.position.fromArray(poss[(i + startPos)]);

                    viewer.scene.add(textMesh);
                    textMesh.updateMatrixWorld(true);
                    detach(textMesh, viewer.scene, viewer.scene );
                    textMesh.updateMatrixWorld(true);
                    attach(textMesh, viewer.scene, shells[1]);
                    textMesh.updateMatrixWorld(true);

                    centerTextMeshs.push(textMesh);
                }
            }
        });

        $('#iptCenterText').on('focus',function(){
            new TWEEN.Tween(viewer.camera.position)
                .to({
                    x: 0.004318929959495493, 
                    y: 0.08551605358805521, 
                    z: 0.1857552702209933
                },500)
                .onUpdate(function(){
                    viewer.camera.lookAt(new THREE.Vector3());
                })
                .onComplete(function(){ 
                    viewer.camera.rotation.set(-0.4314436342050262, 0.021116886665458193, 0.009720541059093098);
                })
                .start();
        });
    }
});