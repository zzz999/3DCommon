import {ViewerNoValid} from './libs/ViewerNoValid';

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
                    myCanvas1.height = 128;
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
            BgMusicPlugin:{}
        });
    viewer.setLoadingPage('loadingDiv', 'pecentageWidth', 'pecentageText');

    function forcePlaySound(){
        viewer.BgMusicPlugin.playForIOS();
    }

    //监听网格加载完成
    viewer.onMeshLoaded.add(function(){
        //设置背景
        setSceneBg();

        //设置背景音效
        if(Api.bgMusic){
            viewer.BgMusicPlugin.setBackgroudMusic(Api.bgMusic, function(){
                viewer.BgMusicPlugin.enableMusic(true);               
            });
            if(/iP[ao]d|iPhone/i.test(navigator.userAgent)){
                window.addEventListener('touchstart', forcePlaySound);
                viewer.BgMusicPlugin.setPlayEventForIOS(function(){
                    window.removeEventListener('touchstart', forcePlaySound);
                });
            }
        }

        //初始化UI
        initUI();
    });

    viewer.loadModel(paths);

    function initUI(){    
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
        
        var startEventType = ((document.ontouchstart !== null) ? 'mousedown' : 'touchstart');


        $('#btn-switchMusic').on(startEventType,function(){
            if($(this).hasClass('active')){
                $(this).removeClass('active');
                $(this).find('img').attr('src','img/music-switch1.png');
                viewer.BgMusicPlugin.enableMusic(false);
            }else{
                $(this).addClass('active');
                $(this).find('img').attr('src','img/music-switch.png');
                viewer.BgMusicPlugin.enableMusic(true);
            }
        });
    }
});