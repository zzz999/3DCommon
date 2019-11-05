import {BaseViewer} from './BaseViewer';
import {ExplodePlugin} from './plugins/ExplodePlugin';
//import {HierarchyPlugin} from './plugins/HierarchyPlugin';
import {OperatePlugin} from './plugins/OperatePlugin';
//import {ModelSizePlugin} from './plugins/ModelSizePlugin';
//import {BgMusicPlugin} from './plugins/BgMusicPlugin';
import {AmbientPlugin} from './plugins/AmbientPlugin';
//import {FullScreenPlugin} from './plugins/FullScreenPlugin';
//import {TVPlugin} from './plugins/TVPlugin';
//import {ClockPlugin} from './plugins/ClockPlugin';
//import {AutoRotatePlugin} from './plugins/AutoRotatePlugin';

import {HotspotPlugin} from './plugins/HotspotPlugin';
import {MatOpPlugin} from './plugins/MatOpPlugin';
import {ClippingPlugin} from './plugins/ClippingPlugin';

function ViewerNoValid(ele, options, plugins){
    BaseViewer.call(this, ele, options);
    
    var Plugins = {
        ExplodePlugin:ExplodePlugin,
        //HierarchyPlugin:HierarchyPlugin,
        OperatePlugin:OperatePlugin,
        //ModelSizePlugin:ModelSizePlugin,
        //BgMusicPlugin:BgMusicPlugin,
        AmbientPlugin:AmbientPlugin,
        //FullScreenPlugin:FullScreenPlugin,
        //TVPlugin:TVPlugin,
        //ClockPlugin:ClockPlugin,
        //AutoRotatePlugin:AutoRotatePlugin,

        HotspotPlugin:HotspotPlugin,
        MatOpPlugin:MatOpPlugin,
        ClippingPlugin:ClippingPlugin
    };
  
    var scope = this;
    this.onMeshLoaded.add(function(){
        if(plugins && typeof plugins === "object"){
            for(var key in plugins){
                new Plugins[key](scope, plugins[key]);
            }
        }
    });
}

ViewerNoValid.prototype = Object.create(BaseViewer.prototype);

export {ViewerNoValid};