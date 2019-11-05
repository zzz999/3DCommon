import {BasePlugin} from './BasePlugin';
import {Util} from '../Util';

function BgMusicPlugin(viewer, options) {
    this.name = 'BgMusicPlugin';
    BasePlugin.call(this, viewer, options);

    if(viewer.camera){ 
            var isIOS = /iP[ao]d|iPhone/i.test(navigator.userAgent);
            var bgMusic;

            var scope = this;

            if (isIOS){
                bgMusic = document.createElement("AUDIO");
                bgMusic.preload = 'preload';
                bgMusic.loop = 'loop';
                Object.defineProperty(bgMusic, 'isPlaying', {
                    configurable: true,
                    enumerable: true,
                    get: function() {
                        return !bgMusic.paused;
                    }
                });
            }
            else{           
                var listener = new THREE.AudioListener();
                viewer.camera.add(listener);
                bgMusic = new THREE.Audio(listener);
                bgMusic.setLoop(true);
                bgMusic.setVolume(1);
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

            Util.extend(viewer[this.name], {
                setBackgroudMusic:function(url, callback){
                    if (isIOS){
                        bgMusic.src = url;
                        bgMusic.oncanplay = function(){
                            if(callback && callback instanceof Function){
                                callback();
                            }
                        }
                    }
                    else{           
                        new THREE.AudioLoader().load(url, function (buffer) {                                        
                            bgMusic.setBuffer(buffer); 
                            if(callback && callback instanceof Function){
                                callback();
                            }
                        });
                    }
                },
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
                },
                setPlayEventForIOS:function(func){
                    bgMusic.addEventListener('play', func);
                },
                playForIOS:function(){
                    bgMusic.load();
                    bgMusic.play();
                }
            }, this.alias);
    }else{
        console.error('未定义相机！');
    }
}

export {BgMusicPlugin};