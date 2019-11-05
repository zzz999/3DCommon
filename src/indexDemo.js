﻿import {ViewerNoValid} from './libs/ViewerNoValid';

$(function () {
    //设置背景(添加水印)
    var bgIdx = 1;
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
        image.src = Api.prefix + (isPortrait ? ('img/p' + bgIdx + '.jpg') : ('img/l' + bgIdx + '.jpg'));        
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
            BgMusicPlugin:{},
            AutoRotatePlugin:{
                enableDamping:false
            },
            ExplodePlugin:{
                exposeFactor:2,
                exposeByPart:Api.exposeByPart
            },
            OperatePlugin:{
                onUnSelectError:function(){
                    if(timer){
                        $('.model-msg-tips').hide();
                        clearTimeout(timer);
                    }
                    $('.model-msg-tips').show();
                    timer = setTimeout(function(){
                        $('.model-msg-tips').hide();
                    },2000);
                }
            },
            AmbientPlugin:{alias:'Ambient'},
            TVPlugin:{},
            ClockPlugin:{}
        });
    viewer.setLoadingPage('loadingDiv', 'pecentageWidth', 'pecentageText');
    //监听网格加载完成
    viewer.onMeshLoaded.add(function(){
        //设置背景
        setSceneBg();

        //自动旋转
        if(Api.autoRotate){
            viewer.AutoRotatePlugin.enableAutoRotate();
        }

        //设置背景音效
        if(Api.bgMusic){
            viewer.BgMusicPlugin.setBackgroudMusic(Api.bgMusic, function(){
                viewer.BgMusicPlugin.enableMusic(true);
            });
        }

        //初始化UI
        initUI();
    });
    //监听贴图加载完成
    viewer.onTextureLoaded.add(function(){
        if(viewer.TVPlugin.hasTV()){
            $('#btn-video-content').show();
        }
    });
    
    viewer.loadModel(paths);

    function initUI(){    
        var startEventType = ((document.ontouchstart !== null) ? 'mousedown' : 'touchstart'),
            moveEventType = ((document.ontouchmove !== null) ? 'mousemove' : 'touchmove'),
            endEventType = ((document.ontouchend !== null) ? 'mouseup' : 'touchend');

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

        //背景
        $('.line-content .body-bg').on(startEventType, function(){
            var index = $(this).index();
            if(index !== bgIdx){
                bgIdx = index;
                setSceneBg();               
            }
        });

        //速度
        $('.line-content .btn-state').on(startEventType, function(){
            var index = $(this).index();
            var val = index === 0 ? 0.5 : index;
            viewer.setSpeed(val);
            $('#btnSpeed').attr('src', Api.prefix + 'img/btn-state-' + val + '.png');
        });


        //重置拆分
        function resetExposeUI(){
            document.getElementById('minDiv1').style.left = "0px";   
            if($('#expose').hasClass('active')){
                $('#expose').removeClass('active');
            }
        }

        //收起操作栏
        function resetHandleUI(){
            $(".gray-model-left-list .line-btn").hide();
            $('.btn-handle').attr('src', Api.prefix + 'img/btn-handle.png');
            $('.btn-handle').removeClass('active');

            if($('#btnMove').hasClass('active')){
                $('#btnMove').removeClass('active');
            }
            if($('#btnReset').hasClass('active')){
                $('#btnReset').removeClass('active');
            }
        }
	    
        //播放
        $('#playbtn').on(startEventType, function() {
            var flag = viewer.isPlaying();
            flag = !flag;
            $('.btn-play').attr('src', Api.prefix + (flag ? 'img/btn-sport0.png' : 'img/btn-play.png'));
            viewer.playAnim(flag);
            if(flag){
                if(viewer.ExplodePlugin.isInExposeState()){
                    viewer.ExplodePlugin.Disperse(0);                   
                }
                resetExposeUI();

                //收起操作栏
                if(viewer.OperatePlugin.isInOpState()){
                    viewer.OperatePlugin.setOpState(false);
                    resetHandleUI();
                }
            }
        });


        //互斥按钮
        $('.gray-model-list .line-btn').on(startEventType, function() {
            if ($(this)[0].id === 'expose' && viewer.isPlaying()) {
                $('.btn-play').attr('src', Api.prefix + 'img/btn-play.png');
                viewer.playAnim(false);
                $(this).addClass('active');
            } else {
                if($(this).hasClass('active')){
                    $(this).removeClass('active');
                }else{
                    if ($(this)[0].id === 'expose' && viewer.OperatePlugin.isInOpState()){
                        viewer.OperatePlugin.setOpState(false);
                        resetHandleUI();                        
                    }
                    $('.gray-model-list .line-btn').removeClass('active');  
                    $(this).addClass('active');
                }
            }
        }); 
        
        //拖拽条
        function moveLine(mainDiv, lineDiv, minDiv, onMove, onStart, onEnd) {
            var ifBool = false; //判断鼠标是否按下

            //事件
            var start = function (e) {
                ifBool = true;
                if (onStart) {
                    onStart();
                }
                if (e && e.stopPropagation) {
                    e.stopPropagation();
                }
            }
            var move = function (e) {
                if (ifBool) {
                    if (e && e.preventDefault) {
                        //阻止浏览器默认行为(如鼠标移动时会选择html元素)
                        e.preventDefault();
                    }
                    if (!e.touches) {    //兼容移动端
                        var x = e.clientX;
                    } else {     //兼容PC端
                        var x = e.touches[0].pageX;
                    }
                    //获取元素的绝对位置  
                    var lineDiv_left = lineDiv.offset().left; //长线条的横坐标
                    var minDiv_left = x - lineDiv_left; //小方块相对于父元素（长线条）的left值
                    if (minDiv_left >= lineDiv[0].offsetWidth - 15) {
                        minDiv_left = lineDiv[0].offsetWidth - 15;
                    }
                    if (minDiv_left < 0) {
                        minDiv_left = 0;
                    }
                    //设置拖动后小方块的left值
                    minDiv.css({ 'left': minDiv_left + 'px' });
                    onMove(minDiv_left / (lineDiv[0].offsetWidth - 15));
                }
            }

            var end = function (e) {
                if (ifBool) {
                    ifBool = false;
                    if (onEnd) {
                        onEnd();
                    }
                }
            }

            //监听触摸事件
            minDiv.on(startEventType, start);
            document.addEventListener(moveEventType, move);
            document.addEventListener(endEventType, end);
        }

        //拆分模型
        moveLine($('#exposeSlider'), $('#lineDiv1'), $('#minDiv1'), function(pct){
            viewer.ExplodePlugin.Disperse(pct);
        });

        //环境光强度
        moveLine($('#ambientSlider'), $('#lineDiv2'),$('#minDiv2'),function(pct){   
            viewer.AmbientPlugin.changeAmbient(pct);
            //or if defined plugin alias
            //viewer.Ambient.changeAmbient(pct);
        });

        //操作
        $('.btn-handle').on(startEventType,  function(){
            if($(this).hasClass('active')){
                viewer.OperatePlugin.setOpState(false);
                resetHandleUI();          
            }else{
                $(".gray-model-left-list .line-btn").show();
                $(this).attr('src', Api.prefix + 'img/btn-handle-active.png');
                $(this).addClass('active');	 

                viewer.OperatePlugin.setOpState(true);

                if(viewer.isPlaying()){
                    $('.btn-play').attr('src', Api.prefix + 'img/btn-play.png');
                    viewer.playAnim(false);
                }

                if(viewer.ExplodePlugin.isInExposeState()){
                    viewer.ExplodePlugin.Disperse(0);
                }
                resetExposeUI();
            }
        });
        
        //操作
        $('.gray-model-left-list .btn-more-content').on(startEventType, function() {
            var idx = $(this).index();//4移动、5复位  
            if($(this).hasClass('active')){
                $(this).removeClass('active');
                if(idx === 5){
                    viewer.OperatePlugin.setMoveState(false);
                }
                else{
                    viewer.OperatePlugin.setResetState(false);
                }
            }else{
                $(this).addClass('active').siblings().removeClass('active');
                if(idx === 5){
                    viewer.OperatePlugin.setMoveState(true);
                    $('#btnReset').removeClass('active');
                }
                else{
                    viewer.OperatePlugin.setResetState(true);
                    $('#btnMove').removeClass('active');
                }
            }
        });

        //隐藏
        $('#btnHide').on(startEventType,function(){
            viewer.OperatePlugin.hide();
        });

        //显隐互换
        $('#btnSwitch').on(startEventType,function(){
            viewer.OperatePlugin.switchShowHide();
        });

        //全显
        $('#btnShowAll').on(startEventType,function(){
            viewer.OperatePlugin.showAll();
        });

        //透明
        $('#btnTransparent').on(startEventType,function(){
            viewer.OperatePlugin.transparent()
        });

        //关闭未隐藏的子模块
        viewer.dom.addEventListener(startEventType, function(){
            if($('.hasChildren').hasClass('active')){
                $('.hasChildren').removeClass('active');
            }
        }, true );     
        
        //视频播放
        $('#btn-video-content').on('click',function(){
            if($(this).hasClass('active')){
                $(this).removeClass('active');
                viewer.TVPlugin.playTV(false);
            }else{     
                $(this).addClass('active');
                viewer.TVPlugin.playTV(true);             
            }       
        });
    }

});