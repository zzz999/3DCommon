import {BaseViewer} from './libs/BaseViewer';
import {AnimationKeyFrameHelper} from './libs/plugins/AnimationKeyFrameHelper';

$(function () {    
    var timer;
    var viewer = new BaseViewer('mainContainer',{scaleFactor: 1.5, moveToZero:false}, {
        //LensflarePlugin:{}
    });
    //viewer.controls.enabled = false;
    viewer.setLoadingPage('loadingDiv', 'pecentageWidth', 'pecentageText');
    viewer.onMeshLoaded.add(function () {
        //var mainObj = viewer.getMainObj();

        //addLensflare('CarLight_FL');
        //addLensflare('CarLight_FR');

        //初始化UI
        viewer.onAnimationLoaded.add(function(){           
            viewer.onAnimationUpdate.add(function(idx, delta){
                //var _mixer = viewer.loader.cacheAnimations[idx];
                //var _clip = viewer.loader.cacheActions[0].getClip();
                //var totalTime = _clip.duration;  
                //var trackLen = _clip.tracks.length; 
                ////开灯
                //if(lessF(Math.abs(_mixer.time - (15 * totalTime / trackLen)), delta)){
                    
                //}
                ////关灯
                //else if(lessF(Math.abs(_mixer.time - (210 * totalTime / trackLen)), delta)){
                
                //}
            });

            //动画抠帧帮助器
            new AnimationKeyFrameHelper(viewer);
            //viewer.playAnim(true)
        });         
    });
    viewer.loadModel({
        m: ['u3d/BMWI8/models/m_part1.json', 'u3d/BMWI8/models/m_part2.json', 'u3d/BMWI8/models/m_part3.json', 'u3d/BMWI8/models/m_part4.json'],
        s: 'u3d/BMWI8/tm.txt',
        t: [
            'u3d/BMWI8/textures/t_1.txt','u3d/BMWI8/textures/t_2.txt','u3d/BMWI8/textures/t_3.txt','u3d/BMWI8/textures/t_4.txt','u3d/BMWI8/textures/t_5.txt','u3d/BMWI8/textures/t_6.txt','u3d/BMWI8/textures/t_7.txt','u3d/BMWI8/textures/t_8.txt','u3d/BMWI8/textures/t_9.txt','u3d/BMWI8/textures/t_10.txt','u3d/BMWI8/textures/t_11.txt','u3d/BMWI8/textures/t_12.txt','u3d/BMWI8/textures/t_13.txt','u3d/BMWI8/textures/t_14.txt','u3d/BMWI8/textures/t_15.txt','u3d/BMWI8/textures/t_16.txt','u3d/BMWI8/textures/t_17.txt','u3d/BMWI8/textures/t_18.txt','u3d/BMWI8/textures/t_19.txt','u3d/BMWI8/textures/t_20.txt','u3d/BMWI8/textures/t_21.txt','u3d/BMWI8/textures/t_22.txt','u3d/BMWI8/textures/t_23.txt','u3d/BMWI8/textures/t_24.txt','u3d/BMWI8/textures/t_25.txt','u3d/BMWI8/textures/t_26.txt','u3d/BMWI8/textures/t_27.txt','u3d/BMWI8/textures/t_28.txt','u3d/BMWI8/textures/t_29.txt','u3d/BMWI8/textures/t_30.txt','u3d/BMWI8/textures/t_31.txt','u3d/BMWI8/textures/t_32.txt','u3d/BMWI8/textures/t_33.txt','u3d/BMWI8/textures/t_34.txt','u3d/BMWI8/textures/t_35.txt','u3d/BMWI8/textures/t_36.txt','u3d/BMWI8/textures/t_37.txt','u3d/BMWI8/textures/t_38.txt','u3d/BMWI8/textures/t_39.txt','u3d/BMWI8/textures/t_40.txt','u3d/BMWI8/textures/t_41.txt','u3d/BMWI8/textures/t_42.txt','u3d/BMWI8/textures/t_43.txt','u3d/BMWI8/textures/t_44.txt','u3d/BMWI8/textures/t_45.txt','u3d/BMWI8/textures/t_46.txt','u3d/BMWI8/textures/t_47.txt'],
        a: 'u3d/BMWI8/animations/a_1.json',
        e: 'u3d/BMWI8/envmap/e.txt'
            //[
            //'u3d/BMWI8/envmap/e.txt','u3d/BMWI8/envmap/e1.txt','u3d/BMWI8/envmap/e2.txt','u3d/BMWI8/envmap/e3.txt'
            //{
            //    'name':'skybox',
            //    'urls':['u3d/BMWI8/envmap/25/px.hdr', 'u3d/BMWI8/envmap/25/nx.hdr', 'u3d/BMWI8/envmap/25/py.hdr', 'u3d/BMWI8/envmap/25/ny.hdr', 'u3d/BMWI8/envmap/25/pz.hdr', 'u3d/BMWI8/envmap/25/nz.hdr']
            //},
            //{
            //    'name':'83136',
            //    'urls':['u3d/BMWI8/envmap/CBS/px.hdr', 'u3d/BMWI8/envmap/CBS/nx.hdr', 'u3d/BMWI8/envmap/CBS/py.hdr', 'u3d/BMWI8/envmap/CBS/ny.hdr', 'u3d/BMWI8/envmap/CBS/pz.hdr', 'u3d/BMWI8/envmap/CBS/nz.hdr']
            //},
            //{
            //    'name':'39012',
            //    'urls':['u3d/BMWI8/envmap/25/px.hdr', 'u3d/BMWI8/envmap/25/nx.hdr', 'u3d/BMWI8/envmap/25/py.hdr', 'u3d/BMWI8/envmap/25/ny.hdr', 'u3d/BMWI8/envmap/25/pz.hdr', 'u3d/BMWI8/envmap/25/nz.hdr']
            //},
            //{
            //    'name':'11130',
            //    'urls':['u3d/BMWI8/envmap/25/px.hdr', 'u3d/BMWI8/envmap/25/nx.hdr', 'u3d/BMWI8/envmap/25/py.hdr', 'u3d/BMWI8/envmap/25/ny.hdr', 'u3d/BMWI8/envmap/25/pz.hdr', 'u3d/BMWI8/envmap/25/nz.hdr']
            //},
            //{
            //    'name':'11850',
            //    'urls':['u3d/BMWI8/envmap/25/px.hdr', 'u3d/BMWI8/envmap/25/nx.hdr', 'u3d/BMWI8/envmap/25/py.hdr', 'u3d/BMWI8/envmap/25/ny.hdr', 'u3d/BMWI8/envmap/25/pz.hdr', 'u3d/BMWI8/envmap/25/nz.hdr']
            //},
            //{
            //    'name':'46964',
            //    'urls':['u3d/BMWI8/envmap/CJHDR/px.hdr', 'u3d/BMWI8/envmap/CJHDR/nx.hdr', 'u3d/BMWI8/envmap/CJHDR/py.hdr', 'u3d/BMWI8/envmap/CJHDR/ny.hdr', 'u3d/BMWI8/envmap/CJHDR/pz.hdr', 'u3d/BMWI8/envmap/CJHDR/nz.hdr']
            //},
            //{
            //    'name':'46950',
            //    'urls':['u3d/BMWI8/envmap/CJHDR/px.hdr', 'u3d/BMWI8/envmap/CJHDR/nx.hdr', 'u3d/BMWI8/envmap/CJHDR/py.hdr', 'u3d/BMWI8/envmap/CJHDR/ny.hdr', 'u3d/BMWI8/envmap/CJHDR/pz.hdr', 'u3d/BMWI8/envmap/CJHDR/nz.hdr']
            //}
        //]
    });

    function addLensflare(name){
        var carLight = mainObj.getObjectByName(name);
        if(carLight){
            viewer.LensflarePlugin.addLensflare({
                url:'u3d/BMWI8/lensflare.png',
                color:0x00ffff,
                pos:carLight.getWorldPosition()
            });
        }
    }

    function switchLight(flag){
        var lensflares = viewer.LensflarePlugin.getLensflares();
        lensflares.forEach(function(item){
            item.visible = flag;
        });
    }

    function preloadSource(url){
       var srcPrms = new Promise(function(resolve,reject){
            var image = new Image();
            image.setAttribute('crossorigin', 'anonymous');
            image.addEventListener('load', function (event) {
                resolve(image);
            });
            image.addEventListener('error', function (event) {
                reject(event);
            });
            image.src = url;
        });
    }

});