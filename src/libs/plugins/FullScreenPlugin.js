import {BasePlugin} from './BasePlugin';
import {Util} from '../Util';
import screenfull from 'screenfull';

function FullScreenPlugin(viewer, options) {  
    this.name = 'FullScreenPlugin';
    BasePlugin.call(this, viewer, options);

    screenfull.on('error', function(event){
        console.error('无法全屏！原因:', event);
    });
    var _isFullScreen = false;

    function isFullscreen(){
        return document.fullscreenElement    ||
               document.msFullscreenElement  ||
               document.mozFullScreenElement ||
               document.webkitFullscreenElement || false;
    }

    //无法判断 F11 触发的全屏(因为 F11 全屏只是把地址栏隐藏了，并非把dom元素全屏了)
    window.addEventListener('resize', function () {
        _isFullScreen = !!isFullscreen();
    });

    Util.extend(viewer[this.name], {
        isFullScreen:function(){
            return _isFullScreen;
        },
        toggleFullScreen:function(){
            if(screenfull.enabled){
                if(!_isFullScreen){
                    screenfull.request();
                }else{
                    screenfull.exit();
                }
            }
        }
    }, this.alias);
}

export {FullScreenPlugin};