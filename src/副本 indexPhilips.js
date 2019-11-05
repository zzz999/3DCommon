import {ViewerNoValid} from './libs/ViewerNoValid';
import 'three-examples/loaders/TTFLoader';

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

    var timer;
    var viewer = new ViewerNoValid('mainContainer',
        //options
        {
            scaleFactor:Api.scaleFactor || 1.5,
            initYFactor:Api.initYFactor || 0.5,
            useHDR:Api.useHDR
        },
        //plugins
        {
            MatOpPlugin:{}
        });

    viewer.setLoadingPage('loadingDiv', 'pecentageWidth', 'pecentageText');

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

    //监听网格加载完成 
    var font;
    var fontMats = [];
    viewer.onMeshLoaded.add(function(){
        //查找外壳
        findShell('Shell01');
        findShell('Shell02', function(o){
            o.visible = false;
        });
       
        //查找外壳材质及字体材质
        findShellMat('主体色', function(m){
            fontMats.push(m);
        });
        findShellMat('主体颜色');

        var mat = viewer.MatOpPlugin.getMaterial('黑色塑料');
        if(mat){
            fontMats.push(mat);
        }

        //设置背景
        setSceneBg();

        var loader = new THREE.TTFLoader();
        loader.load('fonts/font.ttf', function (json) {
            font = new THREE.Font(json);
            //初始化UI
            initUI();
        });       
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
        $('.line-content .body-bg').on(startEventType, function(){
            var index = $(this).index();
            if(index !== curShellIdx){  
                curShellIdx = index;
                //TODO
                shells.forEach(function(shell,idx){
                    if(idx === index){
                        shell.visible = true;
                    }else{
                        shell.visible = false;
                    }
                });
            }
        });     

        //速度
        var curColorIdx = 0;
        var colors = [new THREE.Color(0, 119/255, 200/255),new THREE.Color(1, 209/255, 0),new THREE.Color(53/255, 87/255, 73/255),new THREE.Color(196/255, 98/255, 45/255),new THREE.Color(72/255, 162/255, 63/255)];
        $('.line-content .btn-state').on(startEventType, function(){
            var index = $(this).index();
            if(index !== curColorIdx){ 
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
                var textMesh = new THREE.Mesh(textGeo, fontMats[0]);
                textMesh.name = txt;
                textMesh.scale.multiplyScalar(0.00025);
                textMesh.rotation.copy(tc.rot);
                textMesh.position.copy(tc.pos);

                viewer.scene.add(textMesh);
                //textMesh.updateMatrixWorld(true);
                //detach( textMesh, viewer.scene, viewer.scene );
                //textMesh.updateMatrixWorld(true);
                //attach(textMesh, viewer.scene, shells[0]);
                //textMesh.updateMatrixWorld(true);

                tc.obj = textMesh;
            }else{
                tc.obj.geometry = textGeo;
                tc.obj.updateMatrix();
            }
        }

        $('#iptLeftText').on('change',function(){
            var txt = $('#iptLeftText').val();
            manageText(0, txt);
        });

        $('#iptRightText').on('change',function(){
            var txt = $('#iptRightText').val();
            manageText(1, txt);
        });

        var poss = [[0.018,0.045,0],
            [0.0178, 0.0438, 0.003],
            [0.0175, 0.0424, 0.006],
            [0.017, 0.041, 0.009],
            [0.016, 0.0396, 0.012],
            [0.0149, 0.038, 0.0148],
            [0.0136, 0.03625, 0.0175],
            [0.012, 0.0343, 0.02],
            [0.01, 0.0328, 0.022],
            [0.0081, 0.0316, 0.0234],
            [0.0055, 0.0305, 0.0245],
            [0.003, 0.0293, 0.0255],
            [0, 0.0288, 0.026],
            [-0.004, 0.0285, 0.0258],
            [-0.0073, 0.0289, 0.025],
            [-0.0101, 0.0302, 0.0235],
            [-0.0124, 0.032, 0.0215],
            [-0.0144, 0.0337, 0.019],
            [-0.0156, 0.0358, 0.0165],
            [-0.0166, 0.0378, 0.0136],
            [-0.0172, 0.0395, 0.0108],
            [-0.0175, 0.0415, 0.0075],
            [-0.0178, 0.0432, 0.004],
            [-0.018, 0.045,0]];

        var rots = [[-1.2, 3.76,-1.57],
            [-1.1, 3.76, -1.35],
            [-1.05, 3.75, -1.3],
            [-1, 3.8, -1.3],
            [-1, 3.73, -1.3],
            [-0.85, 3.65, -1.15],
            [-0.8, 3.55, -1.1],
            [-0.75, 3.45, -0.9],
            [-0.7, 3.7, -0.75],
            [-0.65, 3.3, -0.65],
            [-0.6, 3.2, -0.5],
            [-0.55, 3.25, -0.4],
            [-0.45, 3.15, -0.2],
            [-0.45, 3.05, 0.1],
            [-0.45, 2.95, 0.35],
            [ -0.5, 2.85, 0.7],
            [-0.55, 2.75, 0.9],
            [-0.7, 2.7, 1.1],
            [-0.8, 2.65, 1.25],
            [-0.85, 2.65, 1.3],
            [-0.95, 2.65, 1.4],
            [-1, 2.6, 1.45],
            [-1.1, 2.48, 1.5],
            [-1.2, 2.48, 1.57]];
        var centerTextMeshs = [];
        var deltaAngle = THREE.Math.degToRad(180 / 24);
        $('#iptCenterText').on('change',function(){
            //去除原来的
            centerTextMeshs.forEach(function(m){
                m.parent.remove(m);
            });
            centerTextMeshs = [];

            var txt = $('#iptCenterText').val();
            var len = txt.length;            
            var halfLen = Math.floor(len / 2);
            var startPos = 12 - halfLen;
            var i = 0;
            for(i; i < len; i++){
                if(txt[i] !== ' '){
                    var textGeo = genTextGeometry(txt[i]);
                    var textMesh = new THREE.Mesh(textGeo, fontMats[1]);
                    textMesh.name = txt[i];
                    textMesh.scale.multiplyScalar(0.00025);
                    textMesh.rotation.fromArray(rots[(i + startPos)]);
                    textMesh.position.fromArray(poss[(i + startPos)]);

                    viewer.scene.add(textMesh);
                    //textMesh.updateMatrixWorld(true);
                    //detach(textMesh, viewer.scene, viewer.scene );
                    //textMesh.updateMatrixWorld(true);
                    //attach(textMesh, viewer.scene, shells[1]);
                    //textMesh.updateMatrixWorld(true);

                    centerTextMeshs.push(textMesh);
                }
            }
        });
    }
});