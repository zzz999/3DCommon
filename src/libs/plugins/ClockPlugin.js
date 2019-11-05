import {BasePlugin} from './BasePlugin';
import {Util} from '../Util';

function ClockPlugin(viewer, options) {   
    this.name = 'ClockPlugin';
    BasePlugin.call(this, viewer, options);

    var mainObj = viewer.getMainObj();
    if(mainObj){   
        var hour, minute, second;
        mainObj.traverse(function(m){
            if(m.name === 'AZDyaA8u7pzQ'){
                hour = m;
            }
            if(m.name === '8PF7qHl9l2CKM'){
                minute = m;
            }
            if(m.name === '7eesyL2uvBksh'){
                second = m;
            }
        });

        if(hour && minute && second){
            //时间模拟
            var TimeSimulateDate = new Date();
            var TimeSimulateDateH = TimeSimulateDate.getHours();
            var TimeSimulateDateM = TimeSimulateDate.getMinutes();
            var TimeSimulateDateS = TimeSimulateDate.getSeconds();
            TimeSimulateDateM += TimeSimulateDateS / 60;
            TimeSimulateDateH += TimeSimulateDateM / 60;
            viewer.onUpdate.add(function(delta){
                TimeSimulateDateS += delta;
                if(TimeSimulateDateS >= 60 ){
                    TimeSimulateDateS = 0;
                }
                TimeSimulateDateM += delta / 60;
                if(TimeSimulateDateM >= 60){
                    TimeSimulateDateM = 0;
                }
                TimeSimulateDateH += delta / 3600;
                if(TimeSimulateDateH >= 24){
                    TimeSimulateDateH = 0;
                }
                hour.rotation.z = THREE.Math.degToRad(TimeSimulateDateH % 12 * 30);
                minute.rotation.z = THREE.Math.degToRad(TimeSimulateDateM * 6);
                second.rotation.z = THREE.Math.degToRad(TimeSimulateDateS * 6);
            });
        }

        Util.extend(viewer[this.name], {
          
        }, this.alias);
    }else{
        console.error('无法获取模型主对象');
    }
}

export {ClockPlugin};