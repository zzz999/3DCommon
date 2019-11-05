import {BasePlugin} from './BasePlugin';
import {Util} from '../Util';
import TWEEN from '@tweenjs/tween.js';

/**
 * 热点处理插件
 * @class
 * @implements {BasePlugin}
 * @param {object} viewer - 基础预览框架.
 * @param {object} options - 参数设置.
 * @hideconstructor
 * @classdesc 热点处理插件
 */
function HotspotPlugin(viewer, options) {
    /**
     * 热点对象
     * @class
     * @param {object} params - 热点参数.
     */
    function Hotspot(params) {
        /**
        * UUID
        * @member {string}
        */
        this.uuid = params.uuid || THREE.Math.generateUUID();
        /**
        * 热点对应html元素
        * @member {HTMLElement}
        */
        this.ele = null;
         /**
        * 3D虚拟体对象
        * @member {Object3d}
        */
        this.obj=params.obj?params.obj:undefined;
        /**
        * 3D坐标
        * @member {Vector3}
        */
        this.pos = params.pos ? params.pos.clone() : new THREE.Vector3();
        /**
        * 屏幕坐标
        * @member {Vector2}
        */
        this.screenPos = params.screenPos ? params.screenPos.clone() : new THREE.Vector2();
        /**
        * 对应相机位置
        * @member {Vector3}
        */
        this.camPos = params.camPos ? params.camPos : viewer.camera.position.clone();
        /**
        * 对应相机角度
        * @member {Euler}
        */
        this.camRot = params.camRot ? params.camRot : viewer.camera.rotation.clone();
        /**
        * 用户自定义数据
        * @member {object}
        */
        this.userData = params.userData || {};

        /**
        * 热点更新事件
        * @event Hotspot#onUpdate
        * @example
        * hotspot.onUpdate = function(screePos){
        *     //更新html元素位置
        * };
        */
        this.onUpdate = function(screePos){};
    }

    /**
     * 插件名，一般为类名 
     * @member {string}
     */
    this.name = 'HotspotPlugin';
    BasePlugin.call(this, viewer, options);

    var hotspots = [];   
    var _adding = false;

    var dom = viewer.dom ? viewer.dom : viewer.renderer.domElement;

    //获取三维世界投射屏幕位置
    function GetProjectPos(v){
        var rect = dom.getBoundingClientRect();
        var widthHalf = rect.width / 2, heightHalf = rect.height / 2;
        var pos = v.clone();
        pos.project(viewer.camera);
        return new THREE.Vector2((pos.x * widthHalf) + widthHalf, -(pos.y * heightHalf) + heightHalf);
    }

    viewer.onUpdate.add(function(){
        TWEEN.update();
        hotspots.forEach(function(hp){
            if(hp.obj){
                hp.screenPos = GetProjectPos(hp.obj.getWorldPosition(new THREE.Vector3()));
            }else{
                hp.screenPos = GetProjectPos(hp.pos);
            }
            hp.onUpdate(hp.screenPos);
        });
    });

    var mainObj = viewer.getMainObj();
    var scope = this;
    if(mainObj){          
        var startEventType = ((document.ontouchstart !== null) ? 'mousedown' : 'touchstart'),
            endEventType = ((document.ontouchend !== null) ? 'mouseup' : 'touchend');
        var curTime, clickObj;
        dom.addEventListener(startEventType, function(e) {
            if(_adding){
                var raycaster = viewer.getRaycaster(e);
                var intersects = raycaster.intersectObject(mainObj, true);
                if(intersects.length > 0){ 
                    curTime = Date.now();
                    clickObj = intersects[0].object;
                }else{
                    curTime = Date.now();
                    clickObj = null;
                }   
            }
        });

        dom.addEventListener(endEventType, function(e) {
            if(_adding){
                var raycaster = viewer.getRaycaster(e);
                var intersects = raycaster.intersectObject(mainObj, true);
                if(intersects.length > 0){     
                    var object = intersects[0].object;                   
                    if(object === clickObj && (Date.now() - curTime) < 300){                
                        var pos = intersects[0].point;
                        // console.log(pos);
                        // console.log(viewer.camera);
                        viewer.HotspotPlugin.onBeforeAddHotspot({ pos:pos, screenPos:GetProjectPos(pos), camPos:viewer.camera.position.clone(), camRot:viewer.camera.rotation.clone()});
                    }
                }
            }
        });

        Util.extend(viewer[this.name], {
            /**
             * 设置热点添加(可添加热点)状态
             * @function HotspotPlugin#setAddState
             * @param flag {bool} 添加状态
             */
            setAddState:function(flag){
                _adding = flag;
            },
            /**
             * 根据热点UUID获取热点
             * @function HotspotPlugin#getHotspot
             * @param uuid {string} UUID
             * @returns {Hotspot} 热点对象
             */
            getHotspot:function(uuid){
                var hp = hotspots.find(function(item){
                    return item.uuid === uuid;
                });
                return hp;
            },
            /**
             * 获取热点结合
             * @function HotspotPlugin#getHotspots
             * @returns {array} 热点集合
             */
            getHotspots:function(){
                return hotspots;
            },
            /**
             * 添加热点
             * @function HotspotPlugin#addHotspot
             * @param params {object} 热点参数
             */
            addHotspot:function(params){
                if(params.pos){
                    if(params.pos instanceof Array){
                        params.pos = new THREE.Vector3().fromArray(params.pos);
                    }else{
                        params.pos = new THREE.Vector3(params.pos.x,params.pos.y,params.pos.z);
                    }
                }
                if(params.camPos && params.camPos instanceof Array){
                    params.camPos = new THREE.Vector3().fromArray(params.camPos);
                }
                if(params.camRot && params.camRot instanceof Array){
                    params.camRot = new THREE.Euler().fromArray(params.camRot);
                }
                if(params.objName){
                   var parentObj= viewer.mainObj.getObjectByName(params.objName);
                   params.obj=new THREE.Object3D();
                   parentObj.add(params.obj);
                   var localPos = parentObj.worldToLocal(params.pos);
                   params.obj.position.copy(localPos);
                 

                }
                params.screenPos = GetProjectPos(params.pos);
              
                var hp = new Hotspot(params);
                hotspots.push(hp);
                _adding = false;
                viewer.HotspotPlugin.onAfterAddHotspot(hp);             
            },
            /**
             * 移除热点
             * @function HotspotPlugin#removeHotspot
             */
            removeHotspot:function(uuid){
                var hp = viewer.HotspotPlugin.getHotspot(uuid);
                if(hp){
                    var idx = hotspots.indexOf(hp);
                    hotspots.splice(idx, 1);
                }
            },
            /**
             * 热点添加前事件
             * @event HotspotPlugin#onBeforeAddHotspot
             * @example
             * viewer.HotspotPlugin.onBeforeAddHotspot = function(params){
             *     //TODO
             * };
             */
            onBeforeAddHotspot:function(params){},
            /**
             * 热点添加后事件
             * @event HotspotPlugin#onAfterAddHotspot
             * @example
             * viewer.HotspotPlugin.onAfterAddHotspot = function(hp){
             *     //TODO
             * };
             */
            onAfterAddHotspot:function(hp){},
             /**
             * 确认添加热点后热点创建成功后之后添加热点点击事件，用于点击热点定位
             * @event HotspotPlugin#fitPosAndAngle
             * @example
             */
            fitPosAndAngle:function(hp, callback){
                new TWEEN.Tween(viewer.camera.position)
                .to(hp.camPos, 500)
                .onComplete(function(){ 
                    viewer.camera.rotation.copy(hp.camRot);
                    if(callback && callback instanceof Function){
                        callback();
                    }
                })
                .start();
            }
        }, this.alias);
        
    }else{
        console.error('无法获取模型主对象');
    }
}

export {HotspotPlugin};