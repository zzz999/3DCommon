import * as dat from 'dat.gui';

function AnimationKeyFrameHelper(viewer) {
    //处理动画
    var mixer = viewer.loader.cacheAnimations[0];
    var clip = viewer.loader.cacheActions[0].getClip();
    var totalTime = clip.duration;  
    var trackLen = clip.tracks.length; 
    var gui = new dat.GUI({ width: window.innerWidth * 0.5 });
    var ui = { curVal:1 };
    gui.add(ui, 'curVal', 1, trackLen, 1 ).name('当前帧').onChange(function(val){
        var destTime = val * totalTime / trackLen;
        mixer.update(destTime - mixer.time);
    });

    viewer.container.appendChild(gui.domElement);
}

export {AnimationKeyFrameHelper};