import {BasePlugin} from './BasePlugin';
import {Util} from '../Util';
import 'extrajs/DragControls';

function OperatePlugin(viewer, options) {
    this.name = 'OperatePlugin';
    BasePlugin.call(this, viewer, options);

    this.onUnSelectError = function(){console.error('请选择模型！');};//外部实现,当未选择对象时
    if(this.options.onUnSelectError && this.options.onUnSelectError instanceof Function){
        this.onUnSelectError = this.options.onUnSelectError;
    }    

    if(this.options.selectByPart === undefined){//是否按部位选择：部位是指与阴影同级的节点的子级
        this.options.selectByPart = false;
    }

    var _operating = false,
        canDrag = false,
        canReset = false,
        allModels = [],
        hideModels = [],
        bakPositions = {},
        mats = {},
        bakMats = {},
        curSelectObj;

    //存储和备份材质
    function storeMat(mat){
        if(!mat.isShadow && !mats[mat.name]){
            mats[mat.name] = mat;
            bakMats[mat.name] = {
                transparent:mat.transparent,
                opacity:mat.opacity
            };
        }
    }

    //是否已透明
    function hasTransparent(mat){
        var bm = bakMats[mat.name];
        return (bm.transparent !== mat.transparent || bm.opacity != mat.opacity);
    }

    //恢复到不透明
    function unTransparent(targetMat){
        var bm = bakMats[targetMat.name];
        targetMat.transparent = bm.transparent;
        targetMat.opacity =  bm.opacity;                
    }

    //恢复本来材质
    function restoreMat(){
        if(curSelectObj){
            curSelectObj.traverse(function(m){
                if(m.name !== 'shadow' && m.material){
                    if(m.material instanceof Array){
                        var originMats = [];
                        m.material.forEach(function(mat){  
                            originMats.push(mats[mat.name]);                               
                        });
                        m.material = originMats;
                    }else{
                        m.material = mats[m.material.name];
                    }  
                }
            });         
        }
    }

    //设置选中效果
    var cloneMatCache = {};
    function setSelect(setCurSelect){
        //还原材质
        if (curSelectObj) {
            restoreMat();                    
        }

        //设置当前选中对象
        setCurSelect();

        curSelectObj.traverse(function(m){
            if(m.name !== 'shadow' && m.material){
                if(m.material instanceof Array){
                    var clMats = [];
                    m.material.forEach(function(mat){
                        if(!cloneMatCache[mat.name]){
                            var clMat = mat.clone();
                            clMat.color.setHex(0xff0000);
                            clMat.emissive.setHex(0xff0000);
                            cloneMatCache[mat.name] = clMat;
                        }                   
                        clMats.push(cloneMatCache[mat.name]);
                    });
                    m.material = clMats;
                } else {
                    if(!cloneMatCache[m.material.name]){
                        var clMat = m.material.clone();
                        clMat.color.setHex(0xff0000);
                        clMat.emissive.setHex(0xff0000);
                        cloneMatCache[m.material.name] = clMat;
                    }
                    m.material = cloneMatCache[m.material.name];
                }
            }
        });
    }

    //恢复上次选中的对象
    function resetPreSelect(){
        if (curSelectObj){
            restoreMat();
            curSelectObj = null;
        } 
    }

    //取消移动状态
    function disableDrag(){
        canDrag = false;
        dragControls.enabled = false;
        dragControls.deactivate();
    }

    //取消移动和复位
    function cancelMoveAndReset(){
        if(canDrag){
            disableDrag();
        }
        if(canReset){
            canReset = false;
        }
    }

    //获取部位
    function getPart(obj){
        if(allModels.indexOf(obj) > -1){
            return obj;
        }else {
            if(obj.parent){
                return getPart(obj.parent);
            }else{
                return null;
            }
        }
    }

    //还原模型
    function restoreModel(){
        resetPreSelect(); 
            
        //复位所有模型
        hideModels = [];
        allModels.forEach(function(m){
            m.visible = true;
            m.position.copy(bakPositions[m.id]);
        });

        //恢复材质
        for(var key in mats){
            unTransparent(mats[key]);
        }
                                
        cancelMoveAndReset();
    }

    var mainObj = viewer.getMainObj();
    var scope = this;
    if(mainObj){  
        var allModels = [];
        //处理模型
        var shadow = mainObj.getObjectByName('shadow'); 
        if(scope.options.selectByPart){
            shadow.parent.children.forEach(function(obj){
                if(obj !== shadow){
                    obj.children.forEach(function(o){
                        allModels.push(o);
                        bakPositions[o.id] = o.position.clone();
                    });                   
                }
            });
        }else{
            mainObj.traverse(function(m){
                if(m.geometry && m.name !== 'shadow'){           
                    allModels.push(m);
                    bakPositions[m.id] = m.position.clone();
                }
            });
        }

        //存储材质
        mainObj.traverse(function(m){
            if(m.geometry && m.name !== 'shadow'){           
                //存储材质
                if (m.material instanceof Array) {
                    m.material.forEach(function(mat){
                        storeMat(mat);
                    });
                } else {
                    storeMat(m.material);
                }            
            }
        });

        //模型拖拽控制器
        var dom = viewer.dom ? viewer.dom : viewer.renderer.domElement;
        var dragControls = new THREE.DragControls(allModels, viewer.camera,  dom);
        dragControls.enabled = false;
        dragControls.deactivate();
        dragControls.addEventListener('dragstart', function (event){ 
            if(viewer.controls){
                viewer.controls.enabled = false; 
            }
            setSelect(function(){
                curSelectObj = event.object;
            });
        });

        dragControls.addEventListener('dragend', function (event) {
            if(viewer.controls){
                viewer.controls.enabled = true; 
            }
        });

        var startEventType = ((document.ontouchstart !== null) ? 'mousedown' : 'touchstart'),
            endEventType = ((document.ontouchend !== null) ? 'mouseup' : 'touchend');
        var curTime, clickObj;
        dom.addEventListener(startEventType, function(e) {
            if(_operating && !canDrag){
                var raycaster = viewer.getRaycaster(e);
                var intersects = raycaster.intersectObjects(allModels, true);
                if(intersects.length > 0){    
                    var hitObject;
                    if(scope.options.selectByPart){
                        hitObject = getPart(intersects[0].object);//部位级别(第一级节点)
                    }else{
                        hitObject = intersects[0].object;//零件级别
                    }
                    if(!curSelectObj){ 
                        curTime = Date.now();
                        clickObj = hitObject;
                    }else{
                        if(hitObject !== curSelectObj){ 
                            curTime = Date.now();
                            clickObj = hitObject;
                        }
                    }
                }else{
                    curTime = Date.now();
                    clickObj = null;
                }
            }
        });

        dom.addEventListener(endEventType, function(e) {
            if(_operating && !canDrag){
                var raycaster = viewer.getRaycaster(e);
                var intersects = raycaster.intersectObjects(allModels, true);
                if(intersects.length > 0){      
                    var hitObject;
                    if(scope.options.selectByPart){
                        hitObject = getPart(intersects[0].object);//部位级别(第一级节点)
                    }else{
                        hitObject = intersects[0].object;//零件级别
                    }
                    console.log(hitObject);  
                    if(hitObject === clickObj && (Date.now() - curTime) < 300){   
                                   
                        if (curSelectObj !== hitObject) { 
                            //设置选中效果
                            setSelect(function(){
                                curSelectObj = hitObject;
                                
                            });
                    
                            if(canReset){
                                hitObject.position.copy(bakPositions[hitObject.id]);
                            }
                        }
                    }
                }else{
                    if(!clickObj && (Date.now() - curTime) < 300){
                        //还原材质
                        if (curSelectObj) {
                            restoreMat();  
                            curSelectObj = null;
                        }
                    }
                }
            }
        });
        Util.extend(viewer[this.name], {
            getSelected:function(){
                return curSelectObj;
            },
            isInOpState:function(){
                return _operating;
            },
            setOpState:function(flag){
                if(_operating !== flag){
                    _operating = flag;
                    if(!_operating){
                        restoreModel();
                    }
                }
            },
            setMoveState:function(flag){
                if(canDrag !== flag){
                    resetPreSelect();

                    if(!flag){
                        disableDrag();
                    }else{
                        if(canReset){
                            canReset = false;
                        }
                        canDrag = true;
                        dragControls.enabled = true;
                        dragControls.activate();
                    } 
                }
            },
            setResetState:function(flag){
                if(canReset !== flag){
                    resetPreSelect();

                    canReset = flag;
                    if(flag){
                        if(canDrag){
                            disableDrag();
                        }
                    }
                }
            },
            selectObj:function(obj){
                if(obj){
                    setSelect(function(){
                        curSelectObj = obj;
                    });
                }else{
                    resetPreSelect();
                }
            },
            switchShowHide:function(){
                hideModels.forEach(function(m){
                    m.visible = true;
                });           

                var copyArr = hideModels.splice(0, hideModels.length);
                allModels.forEach(function(m){
                    if(copyArr.indexOf(m)===-1){
                        m.visible = false;
                        hideModels.push(m);
                    }
                });   
            
                cancelMoveAndReset();
            },
            hide:function(){
                if(curSelectObj){
                    if(curSelectObj.visible){
                        curSelectObj.visible = false;
                        hideModels.push(curSelectObj);

                        //恢复材质并清除选中状态
                        restoreMat();
                        curSelectObj = null;
                    }
                } else {
                    scope.onUnSelectError();
                    console.error('请选择模型！');
                }

                cancelMoveAndReset();
            },
            showAll:function(){
                if(hideModels.length > 0){
                    hideModels.forEach(function(m){
                        m.visible = true;
                    });
                    hideModels.splice(0, hideModels.length);
                }

                cancelMoveAndReset();
            },
            transparent:function(){
                if(curSelectObj){
                    //恢复材质
                    restoreMat();
                    //透明或恢复透明
                    curSelectObj.traverse(function(m){
                        if(m.material){
                            var flag = m.material instanceof Array;                
                            if(hasTransparent(flag ? m.material[0] : m.material)){
                                if(flag){
                                    m.material.forEach(function(mat){
                                        unTransparent(mat);
                                    });
                                }else{
                                    unTransparent(m.material);
                                }                
                            }
                            else{
                                if(flag){
                                    m.material.forEach(function(mat){
                                        mat.transparent = true;
                                        mat.opacity = 0.3;
                                    });
                                }else{
                                    var mat = m.material;
                                    mat.transparent = true;
                                    mat.opacity = 0.3;
                                }                   
                            }
                        }
                    });
                    //清除选中状态
                    curSelectObj = null;
                } else {
                    scope.onUnSelectError();
                    console.error('请选择模型！');
                }

                cancelMoveAndReset();
            },
            transparentOthers:function(obj){
                restoreModel();

                var clMats = {};
                obj.traverse(function(m){
                    if(m.material){
                        if(m.material instanceof Array){
                            var newMats = [];
                            m.material.forEach(function(mat){
                                if(!clMats[mat.name]){
                                    clMats[mat.name] = mat.clone();
                                }
                                newMats.push(clMats[mat.name]);
                            });
                            m.material = newMats;
                        }else{
                            if(!clMats[m.material.name]){
                                clMats[m.material.name] = m.material.clone();
                            }
                            m.material = clMats[m.material.name];
                        }
                    }
                });

                for(var key in mats){
                    var mat = mats[key];
                    mat.transparent = true;
                    mat.opacity = 0.3;
                }
            }
        }, this.alias);
    }else{
        console.error('无法获取模型主对象');
    }
}

export {OperatePlugin};