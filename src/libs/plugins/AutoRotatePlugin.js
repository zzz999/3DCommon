import {BasePlugin} from './BasePlugin';
import {Util} from '../Util';

function AutoRotatePlugin(viewer, options) {
    this.name = 'AutoRotatePlugin';
    BasePlugin.call(this, viewer, options);

    if(viewer.controls){
        //相机控制
        viewer.controls = new THREE.OrbitControls(viewer.camera, viewer.dom);  
        viewer.controls.rotateSpeed = 0.5;
        viewer.controls.autoRotateSpeed = 0.5;
        viewer.controls.enablePan = false; 
    } 

    if(this.options.enableDamping){
        viewer.controls.enableDamping = true;
    }

    if(this.options.dampingFactor){
        viewer.controls.dampingFactor = this.options.dampingFactor;
    }

    if(this.options.autoRotateSpeed){
        viewer.controls.autoRotateSpeed = this.options.autoRotateSpeed;
    }

    if(this.options.resetTime === undefined){
        this.options.resetTime = 1500;
    }

    var timer;
    function enableRotate(){
        viewer.controls.autoRotate = false;
        if(timer){
            clearTimeout(timer);
        }
    }

    function disableRotate(){
        timer = setTimeout(function(){
            viewer.controls.autoRotate = true;
        }, scope.options.resetTime);
    }

    var startEventType = ((document.ontouchstart !== null) ? 'mousedown' : 'touchstart'),
        endEventType = ((document.ontouchend !== null) ? 'mouseup' : 'touchend');
    var dom = viewer.dom ? viewer.dom : viewer.renderer.domElement;   
    var scope = this;
    Util.extend(viewer[this.name], {
        enableAutoRotate:function(flag){
            viewer.controls.autoRotate = flag;
            if(flag){
                dom.addEventListener(startEventType, enableRotate);
                dom.addEventListener(endEventType, disableRotate);
            }else{
                if(timer){
                    clearTimeout(timer);
                }
                dom.removeEventListener(startEventType, enableRotate);
                dom.removeEventListener(endEventType, disableRotate);
            }
        }
    }, this.alias);
    
}

export {AutoRotatePlugin};