import {BasePlugin} from './BasePlugin';
import {Util} from '../Util';
import 'three-examples/objects/Lensflare';

function LensflarePlugin(viewer, options) {
    this.name = 'LensflarePlugin';
    BasePlugin.call(this, viewer, options);    

    var _lensflares = [];

    Util.extend(viewer[this.name], {
        getLensflares:function(){
            return _lensflares;
        },
        addLensflare:function(params){
            if(!params.url){
                throw new Error('请定义光晕贴图！');
            }

            var light = new THREE.PointLight( params.color || 0xffffff, 1, params.size || 1);
            if(params.pos){
                light.position.copy(params.pos);
            }
            viewer.scene.add(light);

            var lensTexture = new THREE.TextureLoader().load(params.url);

            var lensflare = new THREE.Lensflare();
            lensflare.addElement( new THREE.LensflareElement( lensTexture, params.size || 1, 0, light.color) );
            light.add( lensflare );

            _lensflares.push(light);
        }
    }, this.alias);
}

export {AmbientPlugin};