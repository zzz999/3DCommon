import {HXBaseViewer} from './libs/HXBaseViewer';

$(function () {    
    var viewer = new HXBaseViewer('mainContainer',{}, {});
    viewer.controls.maxPolarAngle = 1.2;
    viewer.controls.minDistance = 1;
    viewer.controls.maxDistance = 1.7;
    viewer.setLoadingPage('loadingDiv', 'pecentageWidth', 'pecentageText');

    function GetQueryString(name) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
        var r = window.location.search.substr(1).match(reg);
        if (r != null) {
            return decodeURIComponent(r[2]);
        }
        return null;
    }

    var modelName = 'diban';
    if (window.location.search) {
        modelName = GetQueryString('mn');
    }

    if (modelName && !(['diban','diban1'].indexOf(modelName) > -1)) {
        modelName = 'diban';
    }

    var pathConfig = {
        paths: (modelName === 'diban' ? {
            m: 'u3d/HX/hx/models/m.json',
            s: 'u3d/HX/hx/tm.txt',
            t: ['u3d/HX/hx/textures/t_1.txt','u3d/HX/hx/textures/t_2.txt','u3d/HX/hx/textures/t_3.txt','u3d/HX/hx/textures/t_4.txt','u3d/HX/hx/textures/t_5.txt','u3d/HX/hx/textures/t_6.txt','u3d/HX/hx/textures/t_7.txt','u3d/HX/hx/textures/t_8.txt','u3d/HX/hx/textures/t_9.txt','u3d/HX/hx/textures/t_10.txt','u3d/HX/hx/textures/t_11.txt','u3d/HX/hx/textures/t_12.txt','u3d/HX/hx/textures/t_13.txt','u3d/HX/hx/textures/t_14.txt','u3d/HX/hx/textures/t_15.txt','u3d/HX/hx/textures/t_16.txt','u3d/HX/hx/textures/t_17.txt','u3d/HX/hx/textures/t_18.txt','u3d/HX/hx/textures/t_19.txt','u3d/HX/hx/textures/t_20.txt','u3d/HX/hx/textures/t_21.txt','u3d/HX/hx/textures/t_22.txt'],
            l: ['u3d/HX/hx/lightmaps/l_1.txt'],
            e:['u3d/HX/hx/envmaps/e.txt','u3d/HX/hx/envmaps/e1.txt']   
        } : {
            m: 'u3d/HX/hx1/models/m.json',
            s: 'u3d/HX/hx1/tm.txt',
            t: ['u3d/HX/hx1/textures/t_1.txt','u3d/HX/hx1/textures/t_2.txt','u3d/HX/hx1/textures/t_3.txt','u3d/HX/hx1/textures/t_4.txt','u3d/HX/hx1/textures/t_5.txt','u3d/HX/hx1/textures/t_6.txt','u3d/HX/hx1/textures/t_7.txt','u3d/HX/hx1/textures/t_8.txt','u3d/HX/hx1/textures/t_9.txt','u3d/HX/hx1/textures/t_10.txt','u3d/HX/hx1/textures/t_11.txt','u3d/HX/hx1/textures/t_12.txt','u3d/HX/hx1/textures/t_13.txt','u3d/HX/hx1/textures/t_14.txt','u3d/HX/hx1/textures/t_15.txt','u3d/HX/hx1/textures/t_16.txt','u3d/HX/hx1/textures/t_17.txt','u3d/HX/hx1/textures/t_18.txt','u3d/HX/hx1/textures/t_19.txt','u3d/HX/hx1/textures/t_20.txt','u3d/HX/hx1/textures/t_21.txt','u3d/HX/hx1/textures/t_22.txt'],
            l: ['u3d/HX/hx1/lightmaps/l_1.txt'],
            e:['u3d/HX/hx1/envmaps/e.txt','u3d/HX/hx1/envmaps/e1.txt']           
        }),
        objPaths:{
            m: ['u3d/HX/wp/models/m_part1.json', 'u3d/HX/wp/models/m_part2.json', 'u3d/HX/wp/models/m_part3.json', 'u3d/HX/wp/models/m_part4.json', 'u3d/HX/wp/models/m_part5.json'],
            s: 'u3d/HX/wp/tm.txt',
            t: ['u3d/HX/wp/textures/t_1.txt','u3d/HX/wp/textures/t_2.txt','u3d/HX/wp/textures/t_3.txt','u3d/HX/wp/textures/t_4.txt','u3d/HX/wp/textures/t_5.txt','u3d/HX/wp/textures/t_6.txt','u3d/HX/wp/textures/t_7.txt','u3d/HX/wp/textures/t_8.txt','u3d/HX/wp/textures/t_9.txt','u3d/HX/wp/textures/t_10.txt','u3d/HX/wp/textures/t_11.txt','u3d/HX/wp/textures/t_12.txt','u3d/HX/wp/textures/t_13.txt','u3d/HX/wp/textures/t_14.txt','u3d/HX/wp/textures/t_15.txt','u3d/HX/wp/textures/t_16.txt','u3d/HX/wp/textures/t_17.txt','u3d/HX/wp/textures/t_18.txt','u3d/HX/wp/textures/t_19.txt','u3d/HX/wp/textures/t_20.txt','u3d/HX/wp/textures/t_21.txt','u3d/HX/wp/textures/t_22.txt','u3d/HX/wp/textures/t_23.txt','u3d/HX/wp/textures/t_24.txt','u3d/HX/wp/textures/t_25.txt','u3d/HX/wp/textures/t_26.txt','u3d/HX/wp/textures/t_27.txt','u3d/HX/wp/textures/t_28.txt','u3d/HX/wp/textures/t_29.txt','u3d/HX/wp/textures/t_30.txt','u3d/HX/wp/textures/t_31.txt','u3d/HX/wp/textures/t_32.txt','u3d/HX/wp/textures/t_33.txt','u3d/HX/wp/textures/t_34.txt','u3d/HX/wp/textures/t_35.txt','u3d/HX/wp/textures/t_36.txt','u3d/HX/wp/textures/t_37.txt','u3d/HX/wp/textures/t_38.txt','u3d/HX/wp/textures/t_39.txt','u3d/HX/wp/textures/t_40.txt','u3d/HX/wp/textures/t_41.txt','u3d/HX/wp/textures/t_42.txt','u3d/HX/wp/textures/t_43.txt','u3d/HX/wp/textures/t_44.txt','u3d/HX/wp/textures/t_45.txt','u3d/HX/wp/textures/t_46.txt','u3d/HX/wp/textures/t_47.txt','u3d/HX/wp/textures/t_48.txt','u3d/HX/wp/textures/t_49.txt','u3d/HX/wp/textures/t_50.txt','u3d/HX/wp/textures/t_51.txt','u3d/HX/wp/textures/t_52.txt','u3d/HX/wp/textures/t_53.txt','u3d/HX/wp/textures/t_54.txt','u3d/HX/wp/textures/t_55.txt','u3d/HX/wp/textures/t_56.txt','u3d/HX/wp/textures/t_57.txt','u3d/HX/wp/textures/t_58.txt','u3d/HX/wp/textures/t_59.txt','u3d/HX/wp/textures/t_60.txt','u3d/HX/wp/textures/t_61.txt','u3d/HX/wp/textures/t_62.txt','u3d/HX/wp/textures/t_63.txt','u3d/HX/wp/textures/t_64.txt','u3d/HX/wp/textures/t_65.txt','u3d/HX/wp/textures/t_66.txt','u3d/HX/wp/textures/t_67.txt','u3d/HX/wp/textures/t_68.txt','u3d/HX/wp/textures/t_69.txt','u3d/HX/wp/textures/t_70.txt','u3d/HX/wp/textures/t_71.txt','u3d/HX/wp/textures/t_72.txt','u3d/HX/wp/textures/t_73.txt','u3d/HX/wp/textures/t_74.txt','u3d/HX/wp/textures/t_75.txt','u3d/HX/wp/textures/t_76.txt','u3d/HX/wp/textures/t_77.txt','u3d/HX/wp/textures/t_78.txt','u3d/HX/wp/textures/t_79.txt','u3d/HX/wp/textures/t_80.txt','u3d/HX/wp/textures/t_81.txt','u3d/HX/wp/textures/t_82.txt','u3d/HX/wp/textures/t_83.txt','u3d/HX/wp/textures/t_84.txt','u3d/HX/wp/textures/t_85.txt','u3d/HX/wp/textures/t_86.txt','u3d/HX/wp/textures/t_87.txt','u3d/HX/wp/textures/t_88.txt','u3d/HX/wp/textures/t_89.txt','u3d/HX/wp/textures/t_90.txt','u3d/HX/wp/textures/t_91.txt','u3d/HX/wp/textures/t_92.txt','u3d/HX/wp/textures/t_93.txt','u3d/HX/wp/textures/t_94.txt','u3d/HX/wp/textures/t_95.txt','u3d/HX/wp/textures/t_96.txt','u3d/HX/wp/textures/t_97.txt','u3d/HX/wp/textures/t_98.txt'],
            e:'u3d/HX/wp/envmap/e.txt'
        }
    }

    viewer.loadModel(pathConfig);
});