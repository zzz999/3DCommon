import {ViewerNoValid} from './libs/ViewerNoValid';
import TWEEN from '@tweenjs/tween.js';

$(function () {
    var timer;
    var viewer = new ViewerNoValid('mainContainer',
        //options
        {
            autoFit:false,
            enablePan:true
        },
        //plugins
        {
            MatOpPlugin:{},
            HotspotPlugin:{}
        });

    viewer.setLoadingPage('loadingDiv', 'pecentageWidth');

    function findObject(name, callback){
        var obj = viewer.getObjectByName(name);
        if(obj){
            if(callback && callback instanceof Function){
                callback(obj);
            }
        }
    }

    //监听网格加载完成 
    var cams = [],
        fzs = [];
    var config = [
        //默认黑色
        {
            JS:'Mat3d66-545157-6-524',
            FZ:'FZ',
            TW:'Mat3d66-545157-12-407'
        },
        //白色
        {
            JS:'Mat3d66-545157-6-526',
            FZ:'FZ 2',
            TW:'Mat3d66-545157-12-408'
        },
        //橙色
        {
            JS:'Mat3d66-545157-6-525',
            FZ:'FZ 1',
            TW:'Mat3d66-545157-12-407'
        }
    ];

    var hotspotsConfig = [
    {
        dummy:'Hotspot_Cam',
        camPos:{x: 0.00856534101764033, y: -0.030230112219348557, z: 0.46403359652112913},
        camRot:new THREE.Euler(0.3028088709525418, 0.03803974145901113, -0.011880821082602943),
        text:["4K视频拍摄 94°广角定焦镜头", "可实现每秒60帧的1080P高清录像，1200万像素的静态照片拍摄"]
    },
    {
        dummy:'Hotspot_Battery',
        camPos:{x: -0.027924551630520596, y: 0.13120067640630476, z: -0.41639666939016334},
        camRot:new THREE.Euler(-3.102083734057804, -0.04313834348607121, -3.1398879473761547),
        text:["25分钟续航 电源发光灯效", "全新姿态算法，配合智能空调，提高机动性，带来流畅操控体验"]
    },
    {
        dummy:'Hotspot_Propeller',
        camPos:{x: 0.011031617733268401, y: 0.6915839071768046, z: 0.6311672584177603},
        camRot:new THREE.Euler(-0.36165264094603666, 0.015479661952946028, 0.006005653858528872),
        text:["六轴陀螺仪及加速度计", "快拆螺旋桨，复合材料，稳固锁定，更快加速"]
    }
    ];

    var canClick = true;
    function fitPosAndAngle(idx){
        $(".textexplan").show();
        $(".toplogo").hide();
        $(".textexplan h3").html(hotspotsConfig[idx].text[0]);
        $(".textexplan h4").html(hotspotsConfig[idx].text[1]);
        new TWEEN.Tween(viewer.camera.position)
                .to(hotspotsConfig[idx].camPos, 1000)
                .onComplete(function(){ 
                    viewer.camera.rotation.copy(hotspotsConfig[idx].camRot);
                    canClick = true;
                })
                .start();
        canClick = false;
    }

    var city;
    var mainPart,followCam;
    var hotspots;
    var initCamParams = {};
    var shadow;
    var mixer, totalTime, pauseTime;
    viewer.onMeshLoaded.add(function(){
        //viewer.scene.getObjectByProperty('type', 'DirectionalLight').visible = false; 

        shadow = viewer.getObjectByName('shadow');

        //查找相机
        findObject('Camera01', function(o){
            cams.push(o);
        });
        findObject('Camera02', function(o){
            o.visible = false;
            cams.push(o);
        });
        findObject('Camera03', function(o){
            o.visible = false;
            cams.push(o);
        });

        //隐藏替换材质球载体
        ['JS_01','JS_02','FZ_01','FZ_02','TW_01'].forEach(function(name){
            findObject(name, function(o){
                o.visible = false;
            });
        });

        //查找FZ
        findObject('FZ01', function(o){
            fzs.push(o);
        });

        findObject('FZ02', function(o){
            o.visible = false;
            fzs.push(o);
        });

        //隐藏场景模型
        findObject('city', function(o){
            city = o;
            o.visible = false;
        });
        
        //无人机主体
        findObject('Move', function(o){
            mainPart = o;
            followCam = viewer.setFollowCamera(o);

            var pos = viewer.camera.position;
            initCamParams.pos = {x:pos.x, y:pos.y, z:pos.z};
            initCamParams.rot = viewer.camera.rotation.clone();
        });  
        
        viewer.onAnimationLoaded.add(function () {
            mixer = viewer.loader.cacheAnimations[0];
            var clip = viewer.loader.cacheActions[0].getClip();
            totalTime = clip.duration;  
            var trackLen = clip.tracks.length; 
            pauseTime = 15 * totalTime / trackLen;
        });
        
        //热点
        viewer.HotspotPlugin.onAfterAddHotspot = function (hp) {
            var ele = $('<li class="hot1" style="top: ' + hp.screenPos.y + 'px; left: ' + hp.screenPos.x + 'px;"><span></span><span></span></li>');
            $('.hotlist').append(ele);
            hp.ele = ele;

            ele.on('click', function(){
                if(canClick){
                    var idx = hp.userData.index;
                    fitPosAndAngle(idx);
                    $(".xjlist li").eq(idx + 1).addClass("active").siblings().removeClass("active");
                }
            });

            hp.onUpdate = function (screenPos) {
                ele.css('left', screenPos.x + 'px').css('top', screenPos.y + 'px');
            }
        };

        hotspotsConfig.forEach(function(hpc, idx){  
            var pos = viewer.getObjectByName(hpc.dummy).getWorldPosition(new THREE.Vector3());
            pos.x *= -1;
            viewer.HotspotPlugin.addHotspot({
                pos: pos,
                camPos:hpc.camPos,
                camRot:hpc.camRot,
                userData:{
                    index:idx
                }
            });
        });

        hotspots = viewer.HotspotPlugin.getHotspots();

        //初始化UI
        initUI();      
    });

    function lessF(f1, f2) {
        return parseFloat(Number(f1).toFixed(10)) < parseFloat(Number(f2).toFixed(10));
    }

    var preRotZ;
    var timer, prePauseTime;
    viewer.onAnimationUpdate.add(function(i, delta){
        if(!preRotZ){
            preRotZ = mainPart.rotation.y;
        }else{
            followCam.rotation.z -= (mainPart.rotation.y - preRotZ);
            preRotZ = mainPart.rotation.y;
        }

        //显示电量不足
        if(lessF(Math.abs((mixer.time % totalTime) - pauseTime), delta)){
            if(!prePauseTime || (prePauseTime && lessF(totalTime * 0.5, (mixer.time - prePauseTime)))){
                prePauseTime = mixer.time;
                $('.nopower').show();
                viewer.pauseAnim(true);
                timer = setTimeout(function(){
                    $('.nopower').hide();
                    viewer.pauseAnim(false);
                    timer = null;
                },3000);
            }else{
                console.log([prePauseTime, mixer.time]);
            }
        }
    });
    
    viewer.onUpdate.add(function(){
        TWEEN.update();
    });

    viewer.loadModel(paths);

    function initUI(){    
        var startEventType = ((document.ontouchstart !== null) ? 'mousedown' : 'touchstart');  

        //下方按钮操作
        $('.bottomtablist li').on("click", function() {
            if(!$(this).hasClass("active")){ 
                $(this).addClass("active").siblings().removeClass("active");
                
                $(".toplogo").show();
                $(".textexplan").hide();
                $(".optionlist").hide();

                if(canClick){
                    new TWEEN.Tween(viewer.camera.position)
                            .to(initCamParams.pos, 1000)
                            .onComplete(function(){ 
                                viewer.camera.rotation.copy(initCamParams.rot);
                                canClick = true;
                            })
                            .start();
                    canClick = false;
                }

                hotspots.forEach(function(hp){
                    hp.ele.hide();
                });

                if(timer){
                    $('.nopower').hide();
                    viewer.pauseAnim(false);
                    timer = null;
                }

                //停止动作播放
                viewer.playAnim(false); 
                prePauseTime = 0;
                city.visible = false;
                viewer.setRenderCamera(viewer.camera);

                if(shadow) {shadow.visible = true};

                if ($(this).hasClass("xjzs")) {
                    $('.xjlist li').first().addClass("active").siblings().removeClass("active");
                    $('.xjlist').show();

                    hotspots.forEach(function(hp){
                        hp.ele.show();
                    });
                } else if ($(this).hasClass("yssz")) {
                    $(".colorlist").show();
                } else if ($(this).hasClass("xjpz")) {
                    $(".paizhao").show();
                } else if ($(this).hasClass("bwth")) {
                    $(".rightlist").show();
                } else {
                    viewer.playAnim(true); 
                    city.visible = true;
                    viewer.setRenderCamera(followCam);
                    if(shadow) {shadow.visible = false};
                }
            }
        });

        //细节展示
        $('.xjlist li').on("click", function() {
            if(canClick){
                $(this).addClass("active").siblings().removeClass("active");
                var idx = $(this).index();
                if (idx === 0) {
                    $(".textexplan").hide();
                    $(".toplogo").show();
                
                    new TWEEN.Tween(viewer.camera.position)
                            .to(initCamParams.pos, 1000)
                            .onComplete(function(){ 
                                viewer.camera.rotation.copy(initCamParams.rot);
                                canClick = true;
                            })
                            .start();
                    canClick = false;               
                } else {                    
                    fitPosAndAngle(idx - 1);
                }
            }
        });
        
        var curColorIdx = 0;
        $('.colorlist li').on(startEventType, function(){
            var index = $(this).index();
            if(index !== curColorIdx){   
                $(this).addClass("active").siblings().removeClass("active");
                var originMats = config[0];
                var newMats = config[index];
                for(var key in originMats){
                    var originMat = originMats[key];
                    var newMat = viewer.MatOpPlugin.getMaterial(newMats[key]);
                    var objs = viewer.MatOpPlugin.getObjectsByMaterial(originMat);
                    objs.forEach(function(obj){
                        obj.mesh.material[obj.idx] = newMat;
                    });
                }
                curColorIdx = index;
            }
        });          
        
        $(".rightlist li.rightli").on("click",function(){
            if($(this).hasClass("active")){
                $(this).removeClass("active");
                $(this).children(".rightliul").hide();
            }else{
                $(".rightlist li.rightli.active").removeClass("active").children(".rightliul").hide();
                $(this).addClass("active");
                $(this).children(".rightliul").show();
            }
        });

        //关闭未隐藏的子模块
        viewer.dom.addEventListener(startEventType, function(){
            if($('.rightlist li.rightli').hasClass('active')){
                $('.rightlist li.rightli').removeClass("active");
                $('.rightlist li.rightli').children(".rightliul").hide();
            }
        }, true ); 

        //保护罩切换
        var curFZIdx = 0;
        $('.bhzlist div').on("click", function() {            
            var index = $(this).index();
            if(index !== curFZIdx){ 
                $(this).addClass("active").siblings().removeClass("active");
                curFZIdx = index;
                fzs.forEach(function(fz, idx){
                    if(idx === index){
                        fz.visible = true;
                    }else{
                        fz.visible = false;
                    }
                });
            }
        });   

        //摄像机切换
        var curCameraIdx = 0;
        $('.cmrlist div').on("click", function() {          
            var index = $(this).index();
            if(index !== curCameraIdx){  
                $(this).addClass("active").siblings().removeClass("active");
                curCameraIdx = index;
                cams.forEach(function(cam, idx){
                    if(idx === index){
                        cam.visible = true;
                    }else{
                        cam.visible = false;
                    }
                });
            }
        });


        $(".poppic").on('click', function() {
            $(this).hide();
        })
    }
});