import { BasePlugin } from './BasePlugin';
import { Util } from '../Util';

function ExplodePlugin(viewer, options) {
    this.name = 'ExplodePlugin';
    BasePlugin.call(this, viewer, options);

    if (this.options.exposeFactor === undefined) {
        this.options.exposeFactor = 1;
    }
    if (this.options.exposeByPart === undefined) {//是否按部位拆分：部位是指与阴影同级的节点的子级
        this.options.exposeByPart = false;
    }
    if (this.options.exposeType === undefined) {//'SPHERE':球形爆炸 'NORMAL':轴线方向
        this.options.exposeType = 'NORMAL';
    }

    var digits = 10;
    function equalF(f1, f2) {
        return parseFloat(Number(f1).toFixed(digits)) === parseFloat(Number(f2).toFixed(digits));
    }

    function equalV(v1, v2) {
        return equalF(v1.x, v2.x) && equalF(v1.y, v2.y) && equalF(v1.z, v2.z);
    }

    //数组去重
    function removeRepeat(arr) {
        var newArr = [];
        arr.forEach(function (item) {
            var findItem = newArr.find(function (item1) {
                return equalV(item, item1);
            });
            if (!findItem) {
                newArr.push(item);
            }
        });
        return newArr;
    }

    //生成球
    function genSphereGeo(factor, minVerticesNum) {
        var geo = new THREE.SphereGeometry(1, factor, factor);
        var arr = removeRepeat(geo.vertices);
        if (arr.length < minVerticesNum) {
            return genSphereGeo(factor + 1, minVerticesNum);
        }
        return arr;
    }

    //获取不重复随机数
    function getRandom(total, arr) {
        var randNum = Math.floor(Math.random() * total);
        if (arr.indexOf(randNum) > -1) {
            return getRandom(total, arr);
        }
        return randNum;
    }

    var scope = this;

    var mainObj = viewer.getMainObj();
    if (mainObj) {
        var allModels = [];
        //处理模型
        var shadow = mainObj.getObjectByName('shadow');
        if (scope.options.exposeByPart) {
            shadow.parent.children.forEach(function (obj) {
                if (obj !== shadow) {
                    obj.children.forEach(function (o) {
                        allModels.push(o);
                    });
                }
            });
        } else {
            mainObj.traverse(function (m) {
                if (m.geometry && m.name !== 'shadow') {
                    allModels.push(m);
                }
            });
        }

        //设置炸开方向(球形爆炸)
        switch (scope.options.exposeType) {
            case 'SPHERE':
                var nodeNum = allModels.length;
                var vecNum = Math.ceil(Math.sqrt(nodeNum));
                var vertices = genSphereGeo(vecNum, nodeNum);
                var len = vertices.length;
                var hasNum = [];
                allModels.forEach(function (m) {
                    var box = new THREE.Box3().setFromObject(m);
                    var size = box.getSize(new THREE.Vector3());
                    var maxAxis = Math.max(size.x, size.y, size.z);
                    var randNum = getRandom(len, hasNum);
                    hasNum.push(randNum);
                    var nor = vertices[randNum].clone().normalize();
                    m.direct = nor.clone().multiplyScalar(maxAxis * scope.options.exposeFactor);
                });
                break;
            default:
                var mainBox = new THREE.Box3().setFromObject(mainObj);
                var mainCenter = mainBox.getCenter(new THREE.Vector3());
                allModels.forEach(function (m) {
                    var box = new THREE.Box3().setFromObject(m);
                    m.direct = box.getCenter(new THREE.Vector3()).sub(mainCenter).clone().multiplyScalar(scope.options.exposeFactor);
                    m.direct.x *= -1;//因为场景X被镜像了
                });
                break;
        }

        var prePercent = 0;
        Util.extend(viewer[this.name], {
            isInExposeState: function () {
                return prePercent > 0;
            },
            Disperse: function (percent) {
                var orientation = percent - prePercent;
                prePercent = percent;

                allModels.forEach(function (m) {
                    var worldPos = m.getWorldPosition(new THREE.Vector3());
                    worldPos.add(m.direct.clone().multiplyScalar(orientation));
                    var localPos = m.parent.worldToLocal(worldPos);
                    m.position.copy(localPos);
                });
            }
        }, this.alias);
    } else {
        console.error('无法获取模型主对象');
    }
}

export { ExplodePlugin };