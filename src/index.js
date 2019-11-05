import { Viewer } from './libs/Viewer';

(function () {


    //设置背景(添加水印)

    function setSceneBg(bgurl, customLogo,removeLogo) {
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

            if (removeLogo) {
                viewer.setBackgroud(myCanvas.toDataURL('image/jpeg', 1.0));
            } else {
                if (customLogo) {
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
                    img.src = customLogo;
                } else {
                    var img = new Image();
                    img.setAttribute('crossorigin', 'anonymous');
                    img.addEventListener('load', function (event) {
                        //户型内容
                        ctx.globalCompositeOperation = "source-over";
                        var h = img.height * (myCanvas.width / img.width);
                        ctx.drawImage(this, 0, myCanvas.height - h * 1.5, myCanvas.width, h);

                        viewer.setBackgroud(myCanvas.toDataURL('image/jpeg', 1.0));
                    }, false);
                    img.src = isPortrait ? 'img/plogo.png' : 'img/llogo.png';
                }
            }
        }, false);
        // image.src = isPortrait ? ('img/p' + bgIdx + '.jpg') : ('img/l' + bgIdx + '.jpg');
        image.src = bgurl;
    }

    function getQueryVariable(variable) {
        var query=decodeURIComponent(window.location.search);
        query =query.substring(1);
        var vars = query.split("&");
        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split("=");
            if (pair[0] == variable) { return pair[1]; }
        }
        return (false);
    }

    var timer;
    var viewer = new Viewer('mainContainer',
        //options
        {
            scaleFactor: 1.1,
            exposeFactor: 1,
            enableDefault: true,
            imgContainer: 'mainContainer',
            onUnSelectError: function () {
                if (timer) {
                    $('.model-msg-tips').hide();
                    clearTimeout(timer);
                }
                $('.model-msg-tips').show();
                timer = setTimeout(function () {
                    $('.model-msg-tips').hide();
                }, 2000);
            }
        }

    );
    viewer.setLoadingPage('loadingDiv', 'pecentageWidth', 'pecentageText');
    viewer.onMeshLoaded.add(function () {
        //设置背景
        var logoUrl=getQueryVariable("logoUrl");
        if(logoUrl){
            setSceneBg("img/l1.jpg",logoUrl,false);
        }else{
            setSceneBg("img/l1.jpg","img/llogo.png",false);
        }
        //初始化UI
        initUI();
    });


    viewer.loadModel(paths);

    function initUI() {
        //窗口大小改变事件(有的浏览器只执行一次，有的执行两次。为防止不能拿到(特别是只执行一次的时候)准确的值，故延迟执行尺寸改变操作)
        var isResizing = false;
        window.addEventListener('resize', function () {
            if (!isResizing) {
                setTimeout(function () {
                    if (viewer.scene) {
                        setSceneBg();
                    }
                    isResizing = false;
                }, 100);
            }
            isResizing = true;
        }, false);


    }

})();