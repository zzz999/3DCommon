import {Util} from '../Util';

function BgMusicPlugin(viewer, options) {
    var options = options || {};
    this._enableMusic = !!options.enableDefault;
    if(viewer.camera){ 
        if(options.url){
            var u = navigator.userAgent;
            var isIOS = /iP[ao]d|iPhone/i.test(u);
            var bgMusic;

            var scope = this;

            if (isIOS){
                bgMusic = document.createElement("AUDIO");
                bgMusic.src = options.url;
                bgMusic.preload = 'preload';
                bgMusic.loop = 'loop';
                //document.body.appendChild(bgMusic);
                if(scope._enableMusic){
                    bgMusic.play();
                }
            }
            else{           
                var listener = new THREE.AudioListener();
                viewer.camera.add(listener);
                new THREE.AudioLoader().load(options.url, function (buffer) {
                    bgMusic = new THREE.Audio(listener);            
                    bgMusic.setBuffer(buffer);
                    bgMusic.setLoop(true);
                    bgMusic.setVolume(1);
                    if(scope._enableMusic){
                        bgMusic.play();
                    }
                });
            }

            //前后台切换，焦点切换时停止播放声音
            document.addEventListener("visibilitychange", function () {
                if (document.visibilityState == "hidden") {
                    bgMusic.pause();
                }
                else {
                    if (scope._enableMusic) {
                        bgMusic.play();
                    }
                }
            }, false);


            Util.extend(viewer, {
                enableMusic:function(flag){
                    scope._enableMusic = flag;
                    if (flag) {
                        if(!bgMusic.isPlaying){
                            bgMusic.play();  
                        }            
                    } else {
                        if(bgMusic.isPlaying){
                            bgMusic.pause();            
                        }
                    }
                }
            });
        }else{
            console.error('背景音乐路径错误！');
        }
    }else{
        console.error('未定义相机！');
    }
}

export {BgMusicPlugin};