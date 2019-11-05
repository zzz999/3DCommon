import {BasePlugin} from './BasePlugin';
import {Util} from '../Util';

function MatOpPlugin(viewer, options) {
    this.name = 'MatOpPlugin';
    BasePlugin.call(this, viewer, options);

    var mainObj = viewer.getMainObj();
    var scope = this;
    var targetMaterials = [],
        rawMaterials = {},
        name2mats = {},
        mat2objs = {};

    //存储材质
    function storeMat(mesh, mat){
        if(!mat.isShadow){
            if (targetMaterials.indexOf(mat) == -1) {
                name2mats[mat.name] = mat;
                targetMaterials.push(mat);           
                if (mat2objs[mat.name] === undefined) {
                    mat2objs[mat.name] = [{mesh:mesh, idx:mesh.material.indexOf(mat)}];
                }
            } else {
                mat2objs[mat.name].push({mesh:mesh, idx:mesh.material.indexOf(mat)});
            } 
        }
    }

    //监听贴图加载完成
    viewer.onTextureLoaded.add(function(){
        targetMaterials.forEach(function(mat){
            rawMaterials[mat.name] = mat.clone();
        });
    });

    if(mainObj){  
        //获取材质列表     
        mainObj.traverse(function (m) {
            if (m.geometry && m.name !== 'shadow') {
                var mat = m.material;
                if (mat instanceof Array) {
                    mat.forEach(function(mt){
                        storeMat(m, mt);
                    });
                } else {
                    storeMat(m, mat);
                }              
            }
        });

        Util.extend(viewer[this.name], {
            getMaterials:function(){
                return targetMaterials;
            },
            getMaterial:function(name){
                return name2mats[name];
            },
            getObjectsByMaterial:function(name){
                return mat2objs[name];
            },
            setMaterial:function(name, data){
                var mat = name2mats[name];
                if(mat){
                    mat.setValues(data);
                }
            },
            resetMaterial:function(name){
                var mat = name2mats[name];
                if(mat){
                    mat.copy(rawMaterials[name]);
                }
            }
        }, this.alias);
    }else{
        console.log('无法获取模型主对象！');
    }
}

export {MatOpPlugin};