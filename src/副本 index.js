import {BaseViewer} from './libs/BaseViewer';
import {ExplodePlugin} from './libs/plugins/ExplodePlugin';
import {HierarchyPlugin} from './libs/plugins/HierarchyPlugin';
import {OperatePlugin} from './libs/plugins/OperatePlugin';
import {ModelSizePlugin} from './libs/plugins/ModelSizePlugin';
import {BgMusicPlugin} from './libs/plugins/BgMusicPlugin';

$(function () {
    function iterate(children, parentData){
        children.forEach(function(child){
            var childData = {
                title:child.name,
                icon:false,
                data:{
                    type:child.type,
                    id:child.id,
                    uuid:child.uuid
                },
                children:[]
            }               

            parentData.children.push(childData);

            if(child.children.length >0){
                iterate(child.children, childData);
            }
        });
    }

    var baseViewer = new BaseViewer('mainContainer');
    baseViewer.setLoadingPage('loadingDiv', 'pecentageWidth');
    //背景音效插件
    new BgMusicPlugin(baseViewer, 'sound/bgMusic.mp3');
    baseViewer.onMeshLoaded = function(){
        //模型炸开插件
        new ExplodePlugin(baseViewer);

        //尺寸插件
        new ModelSizePlugin(baseViewer);
        //baseViewer.showSize(true);

        //层级关系插件
        new HierarchyPlugin(baseViewer);
        var data = baseViewer.getHierarchyData();
        var treeData = [{
            title:data.name,
            icon:false,
            expanded:true,
            data:{
                type:data.type,
                id:data.id,
                uuid:data.uuid
            },
            children:[]
        }];

        iterate(data.children, treeData[0]);

        $('#treeDiv').fancytree({
            source: treeData,
            activate: function(event, data){
                var obj = baseViewer.getObjectById(data.node.data.id);
                if(obj && baseViewer.selectObj){
                    baseViewer.selectObj(obj);
                }
            },
            click:function(event, data){
                if(data.targetType === 'title' && data.node.isActive()){
                    data.node.setActive(false);
                    baseViewer.selectObj(false);
                    return false;
                }
            }
        });
        $('#treeDiv').addClass('fancytree-connectors');

        //模型操作插件
        var opPlugin = new OperatePlugin(baseViewer);
        opPlugin.onUnSelectError = function(){
            console.error('请选择模型！');
        };
        //baseViewer.setOpState(true);
        //baseViewer.setMoveState(true);
    };
    baseViewer.loadModel({
        m:['u3d/jiaguwen/models/m_part1.json', 'u3d/jiaguwen/models/m_part2.json', 'u3d/jiaguwen/models/m_part3.json'],
        s:'u3d/jiaguwen/tm.txt',
        t:['u3d/jiaguwen/textures/t_1.txt', 'u3d/jiaguwen/textures/t_2.txt', 'u3d/jiaguwen/textures/t_3.txt', 'u3d/jiaguwen/textures/t_4.txt'],
        e:'u3d/jiaguwen/envmap/e.txt'
    });

    //拖拽条
    function moveLine(lineDiv, minDiv, onMove, onStart, onEnd){
        var ifBool = false; //判断鼠标是否按下
           
        //事件
        var start = function(e) {
            ifBool = true;
            if(onStart){
                onStart();
            }
        }
        var move = function(e) {
            if(e && e.preventDefault){  
                //阻止浏览器默认行为(如鼠标移动时会选择html元素)
                e.preventDefault();  
            } 
            if(ifBool) {
                if(!e.touches) {    //兼容移动端
                    var x = e.clientX;
                } else {     //兼容PC端
                    var x = e.touches[0].pageX;
                }
                //获取元素的绝对位置  
                var lineDiv_left = lineDiv.offset().left; //长线条的横坐标
                var minDiv_left = x - lineDiv_left; //小方块相对于父元素（长线条）的left值
                if(minDiv_left >= lineDiv[0].offsetWidth - 15) {
                    minDiv_left = lineDiv[0].offsetWidth - 15;
                }
                if(minDiv_left < 0) {
                    minDiv_left = 0;
                }
                //设置拖动后小方块的left值
                minDiv.css({'left': minDiv_left + 'px'});
                onMove(minDiv_left / (lineDiv[0].offsetWidth - 15));
                //console.log(minDiv_left / (lineDiv[0].offsetWidth - 15));
            }
        }

        var end = function(e) {
            if(ifBool){
                ifBool = false;
                if(onEnd){
                    onEnd();
                }
            }
        }

        //监听触摸事件
        $(minDiv).on('mousedown',start);	        
        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', end);	             
    }

    //拆分模型
    moveLine($('#lineDiv1'),$('#minDiv1'), function(pct){
        baseViewer.Disperse(pct);
    }, function(){
    },  function(){
    });

    $('#expose').on('click',function(){
        if($(this).hasClass('active')){
            $(this).removeClass('active');
        }else{
            $(this).addClass('active');
        }
    }); 
    

});