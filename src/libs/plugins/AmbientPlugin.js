import {BasePlugin} from './BasePlugin';
import {Util} from '../Util';

function AmbientPlugin(viewer, options) {
    this.name = 'AmbientPlugin';
    BasePlugin.call(this, viewer, options);

    var ambientLight = viewer.scene.getObjectByProperty('type', 'AmbientLight'); 
    if(ambientLight){
        var intensity = ambientLight.intensity;       
        Util.extend(viewer[this.name], {
            //上下浮动 1
            changeAmbient:function(pct){
                var it = intensity + 2 * (pct - 0.5);
                if(it < 0){
                    it = 0;
                }
                ambientLight.intensity = it;
            }
        }, this.alias);
    }else{
        console.log('未定义环境光！');
    }
}

export {AmbientPlugin};