import { ViewerNoValid } from './libs/ViewerNoValid';

$(function () {
    //设置背景(添加水印)
    var bgIdx = 1,
        removeLogo = false,
        customLogo = '';
    function setSceneBg() {
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
            scaleFactor: Api.scaleFactor || 1.5,
            initYFactor: Api.initYFactor || 0.5
        },
        //plugins
        {
            ExplodePlugin: {
                exposeFactor: 2,
                //exposeByPart:true
            },
            OperatePlugin: {
                //selectByPart:true,
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
            },
            AmbientPlugin: { alias: 'Ambient' },
            ClippingPlugin:{}
        });
    viewer.setLoadingPage('loadingDiv', 'pecentageWidth', 'pecentageText');
    //监听网格加载完成
    viewer.onMeshLoaded.add(function () {
        //设置背景
        // setSceneBg();
        viewer.setBackgroud("#1e1e28");
        //初始化UI
        initUI();
    });
    //动画加载完成
    viewer.onAnimationLoaded.add(function(){
        viewer.playAnim(true);
    });
    viewer.loadModel(paths);

    function initUI() {
        var startEventType = ((document.ontouchstart !== null) ? 'mousedown' : 'touchstart'),
            moveEventType = ((document.ontouchmove !== null) ? 'mousemove' : 'touchmove'),
            endEventType = ((document.ontouchend !== null) ? 'mouseup' : 'touchend');

        //窗口大小改变事件(有的浏览器只执行一次，有的执行两次。为防止不能拿到(特别是只执行一次的时候)准确的值，故延迟执行尺寸改变操作)
        var isResizing = false;
        window.addEventListener('resize', function () {
            if (!isResizing) {
                setTimeout(function () {
                    if (viewer.scene) {
                        // setSceneBg();
                        viewer.setBackgroud("#1e1e28");
                    }
                    isResizing = false;
                }, 100);
            }
            isResizing = true;
        }, false);



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



        //重置拆分
        function resetExposeUI() {
            document.getElementById('minDiv1').style.left = "0px";
            if ($('#expose').hasClass('active')) {
                $('#expose').removeClass('active');
            }
        }

        //拆分模型
        moveLine($('#exposeSlider'), $('#lineDiv1'), $('#minDiv1'), function (pct) {
            viewer.ExplodePlugin.Disperse(pct);
        });

        //播放
        $('#playbtn').on(startEventType, function () {
            var flag = viewer.isPlaying();
            flag = !flag;
            $('.btn-play').attr('src', Api.prefix + (flag ? 'img/btn-sport0.png' : 'img/btn-play.png'));
            viewer.playAnim(flag);
            if (flag) {
                if (viewer.ExplodePlugin.isInExposeState()) {
                    viewer.ExplodePlugin.Disperse(0);
                }
                resetExposeUI();
                //收起操作栏
                if (viewer.OperatePlugin.isInOpState()) {
                    viewer.OperatePlugin.setOpState(false);
                    resetHandleUI();
                }
            }
        });

        //互斥按钮
        $('.gray-model-list .line-btn').on(startEventType, function () {
            if ($(this)[0].id === 'expose') {
                $('.btn-play').attr('src', Api.prefix + 'img/btn-play.png');
                viewer.playAnim(false);
                viewer.resetAnim();
                $(this).addClass('active');
            } else {
                if ($(this).hasClass('active')) {
                    $(this).removeClass('active');
                } else {
                    if ($(this)[0].id === 'expose' && viewer.OperatePlugin.isInOpState()) {
                        
                        viewer.OperatePlugin.setOpState(false);
                        resetHandleUI();
                    }
                    $('.gray-model-list .line-btn').removeClass('active');
                    $(this).addClass('active');
                }
            }
        });
    }

});