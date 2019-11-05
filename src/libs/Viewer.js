import {BaseViewer} from './BaseViewer';
import {ExplodePlugin} from './plugins/ExplodePlugin';
import {HierarchyPlugin} from './plugins/HierarchyPlugin';
import {OperatePlugin} from './plugins/OperatePlugin';
//import {ModelSizePlugin} from './plugins/ModelSizePlugin';
//import {BgMusicPlugin} from './plugins/BgMusicPlugin';
import {AmbientPlugin} from './plugins/AmbientPlugin';
import {HotspotPlugin} from './plugins/HotspotPlugin';
import {ClippingPlugin} from './plugins/ClippingPlugin';

import {MatOpPlugin} from './plugins/MatOpPlugin';
import {AuthorizationValidation} from './AuthorizationValidation';

function Viewer(ele, options, plugins){
    this.onInited = function(){};//初始化完成
    var scope = this;
    var valid = new AuthorizationValidation(options);
    valid.checkDevloper(function(){
        BaseViewer.call(scope, ele, options);
    
        var Plugins = {
            ExplodePlugin:ExplodePlugin,
            HierarchyPlugin:HierarchyPlugin,
            OperatePlugin:OperatePlugin,
            //ModelSizePlugin:ModelSizePlugin,
            //BgMusicPlugin:BgMusicPlugin,
            AmbientPlugin:AmbientPlugin,
            HotspotPlugin:HotspotPlugin,
            MatOpPlugin:MatOpPlugin,
            ClippingPlugin:ClippingPlugin
        };
  
        scope.onMeshLoaded.add(function(){
            if(plugins && typeof plugins === "object"){
                for(var key in plugins){
                    new Plugins[key](scope, plugins[key]);
                }
            }
        });

        scope.onInited();
    },function(err){
        throw new Error(err);
    });
}

Viewer.prototype = Object.create(BaseViewer.prototype);

export {Viewer};