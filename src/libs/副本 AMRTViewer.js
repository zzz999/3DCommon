import {BaseViewer} from './BaseViewer';
import {ExplodePlugin} from './plugins/ExplodePlugin';
import {HierarchyPlugin} from './plugins/HierarchyPlugin';
import {OperatePlugin} from './plugins/OperatePlugin';
import {ModelSizePlugin} from './plugins/ModelSizePlugin';
import {BgMusicPlugin} from './plugins/BgMusicPlugin';
import {AmbientPlugin} from './plugins/AmbientPlugin';
import {FullScreenPlugin} from './plugins/FullScreenPlugin';
import MD5 from './MD5';

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
        var scope = this;

        if(options){
            if(!options.developerID){
                throw new Error('developerID为空');
            }
            if(!options.appID){
                throw new Error('appID为空');
            }
            if(!options.secretKey){
                throw new Error('secretKey为空');
            }
            if(!options.developerApiUrl){
                throw new Error('developerApiUrl为空');
            }
            var req = new XMLHttpRequest();
            req.onreadystatechange = function(){
                if (req.readyState == 4 && req.status == 200)
                {
                    var res = JSON.parse(req.responseText);
                    if(res.code === '000000'){
                        BaseViewer.call(scope, ele, options);

                        var Plugins = {
                            ExplodePlugin:ExplodePlugin,
                            HierarchyPlugin:HierarchyPlugin,
                            OperatePlugin:OperatePlugin,
                            ModelSizePlugin:ModelSizePlugin,
                            BgMusicPlugin:BgMusicPlugin,
                            AmbientPlugin:AmbientPlugin,
                            FullScreenPlugin:FullScreenPlugin
                        };

                        scope.onMeshLoaded.add(function(){
                            if(plugins && typeof plugins === "object"){
                                for(var key in plugins){
                                    new Plugins[key](scope, plugins[key]);
                                }
                            }
                        });
                    }else{
                        throw new Error(res.msg);
                    }
                }else{
                    throw new Error('请求服务器失败！');
                }
            }
            req.open('POST', options.developerApiUrl + '/dev2/sdkAuthH5', true);
            req.send('developer_id=' + options.developerID + '&appid=' + options.appID + '&sign=' + MD5.hex_md5('appid='+options.appID+'&developer_id='+ options.developerID + options.secretKey ));      
        }else{
            throw new Error('开发者参数缺失！');
        }
    }

    AMRTViewer.prototype = Object.create(BaseViewer.prototype);

    return AMRTViewer;
}));