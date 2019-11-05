import {BasePlugin} from './BasePlugin';
import {Util} from '../Util';

function ModelSizePlugin(viewer, options) {
    this.name = 'ModelSizePlugin';
    BasePlugin.call(this, viewer, options);

    var mainObj = viewer.getMainObj();
    if(mainObj){ 
        var box = new THREE.Box3();
        box.makeEmpty();
        //处理模型
        mainObj.scale.x *= -1;
        mainObj.children.forEach(function(m){
            if(m.name !== 'shadow'){
                box.expandByObject(m);
            }
        });
        mainObj.scale.x *= -1;
        //设置尺寸
        var size = box.getSize(new THREE.Vector3());
        var boxHelper = new THREE.Box3Helper(box, 0xffff00);
        boxHelper.visible = false;
        viewer.scene.add(boxHelper);
        Util.extend(viewer[this.name], {
            showSize:function(flag){
                boxHelper.visible = flag;
            }
        }, this.alias);
    }else{
        console.error('无法获取模型主对象');
    }
}

export {ModelSizePlugin};