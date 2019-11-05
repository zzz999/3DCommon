import {BasePlugin} from './BasePlugin';
import {Util} from '../Util';

function HierarchyPlugin(viewer, options) {
    this.name = 'HierarchyPlugin';
    BasePlugin.call(this, viewer, options);

    function iterate(children, parentData){
        children.forEach(function(child){
            if(child.name !== 'shadow'){
                var childData = {
                    id:child.id,
                    name:child.name,
                    uuid:child.uuid,
                    type:child.type,
                    children:[]
                }

                parentData.children.push(childData);

                if(child.children.length >0){
                    iterate(child.children, childData);
                }
            }
        });
    }

    function getHierarchyData(){
        var rootData = {
            id:mainObj.id,
            name:mainObj.name,
            uuid:mainObj.uuid,
            type:mainObj.type,
            children:[]
        };
        iterate(mainObj.children, rootData);
        return rootData;
    }

    var mainObj = viewer.getMainObj();
    if(mainObj){   
        Util.extend(viewer[this.name], {
            getHierarchyData:function(){
                return getHierarchyData();
            }
        }, this.alias);
    }else{
        console.error('无法获取模型主对象');
    }
}

export {HierarchyPlugin};