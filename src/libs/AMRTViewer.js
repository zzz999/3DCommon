import {BaseViewer} from './BaseViewer';
// import {ExplodePlugin} from './plugins/ExplodePlugin';
// import {HierarchyPlugin} from './plugins/HierarchyPlugin';
import {OperatePlugin} from './plugins/OperatePlugin';
// import {ModelSizePlugin} from './plugins/ModelSizePlugin';
// import {BgMusicPlugin} from './plugins/BgMusicPlugin';
// import {AmbientPlugin} from './plugins/AmbientPlugin';
// import {FullScreenPlugin} from './plugins/FullScreenPlugin';
import {HotspotPlugin} from './plugins/HotspotPlugin';
import {AuthorizationValidation} from './AuthorizationValidation';

(function (globals, factory) {
    /* global define */
    if(typeof exports === 'object' && typeof module === 'object'){
        module.exports = factory();     
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else if (typeof exports === 'object') {
        exports.AMRTViewer = factory();
    } else {
        // Browser globals 
        globals.AMRTViewer = factory();
    }
}(window, function () {
    function AMRTViewer(ele, options, plugins){
        this.onInited = function(){};//初始化完成
        var scope = this;
        var valid = new AuthorizationValidation(options);
        valid.checkDevloper(function(){
            BaseViewer.call(scope, ele, options);

            var Plugins = {
                // HierarchyPlugin:HierarchyPlugin,
                OperatePlugin:OperatePlugin,
                // ModelSizePlugin:ModelSizePlugin,
                // BgMusicPlugin:BgMusicPlugin,
                // AmbientPlugin:AmbientPlugin,
                HotspotPlugin:HotspotPlugin
                // FullScreenPlugin:FullScreenPlugin
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

    AMRTViewer.prototype = Object.create(BaseViewer.prototype);

    return AMRTViewer;
}));