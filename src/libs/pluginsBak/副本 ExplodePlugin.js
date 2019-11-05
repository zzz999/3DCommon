import {Util} from '../Util';

function ExplodePlugin(viewer, options) {
    var options = options || {};

    this.options = {
        exposeFactor:1,
        exposeByPart:false//是否按部位拆分：部位是指与阴影同级的节点的子级
    };

    if(options){
        if(options.exposeFactor){
            this.options.exposeFactor = options.exposeFactor;
        }
        if(options.exposeByPart){
            this.options.exposeByPart = options.exposeByPart;
        }
    }

    //生成球
    function genSphereGeo(factor, minVerticesNum){
        var geo = new THREE.SphereGeometry(1, factor, factor);
        if(geo.vertices.length < minVerticesNum){
            return genSphereGeo(factor + 1, minVerticesNum);
        }
        return geo;
    }

    //获取不重复随机数
    function getRandom(total, arr){
        var randNum = Math.floor(Math.random() * total);
        if(arr.indexOf(randNum) > -1){
            return getRandom(total, arr);
        }
        return randNum;
    }

    var scope = this;

    var mainObj = viewer.getMainObj();
    if(mainObj){
        var allModels = [];
        //处理模型
        var shadow = mainObj.getObjectByName('shadow'); 
        if(scope.options.exposeByPart){
            shadow.parent.children.forEach(function(obj){
                if(obj !== shadow){
                    obj.children.forEach(function(o){
                        allModels.push(o);
                    });                   
                }
            });
        }else{
            mainObj.traverse(function(m){
                if(m.geometry && m.name !== 'shadow'){           
                    allModels.push(m);
                }
            });
        }

        //设置炸开方向(球形爆炸)
        var nodeNum = allModels.length;
        var vecNum =  Math.ceil(Math.sqrt(nodeNum));
        var geo = genSphereGeo(vecNum, nodeNum);
        var vertices = geo.vertices;
        var len = vertices.length;
        var hasNum = [];
        allModels.forEach(function(m){
            var box = new THREE.Box3().setFromObject(m);
            var size = box.getSize(new THREE.Vector3());
            var maxAxis = Math.max(size.x, size.y, size.z);
            var randNum = getRandom(len, hasNum);
            hasNum.push(randNum);
            var nor = vertices[randNum].clone().normalize();
            m.direct = nor.clone().multiplyScalar(maxAxis * scope.options.exposeFactor);
        });

        var prePercent = 0;
        Util.extend(viewer, {
            isInExposeState:function(){
                return prePercent > 0;
            },
            Disperse:function(percent){
                var orientation = percent - prePercent;
                prePercent = percent;

                allModels.forEach(function(m){
                    var worldPos = m.getWorldPosition(new THREE.Vector3());
                    worldPos.add(m.direct.clone().multiplyScalar(orientation));
                    var localPos = m.parent.worldToLocal(worldPos);
                    m.position.copy(localPos);     
                });
            }
        });
    }else{
        console.error('无法获取模型主对象');
    }
}

export {ExplodePlugin};