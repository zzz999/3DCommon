import {BasePlugin} from './BasePlugin';
import {Util} from '../Util';

function TVPlugin(viewer, options) {
    this.name = 'TVPlugin';
    BasePlugin.call(this, viewer, options);

    var mainObj = viewer.getMainObj();
    if(mainObj){ 
        var tvMeshs = [],
            tvMats = [],
            tvBakMaps = [],
            hideOnPlay = [];         
        mainObj.traverse(function(m){
            if(m.geometry && m.name === 'TVplay'){
                tvMeshs.push(m);
                //存储材质
                if (m.material instanceof Array) {
                    m.material.forEach(function(mat){
                        tvMats.push(mat);  
                    });
                } else {
                    if(!mats[m.material.name]){
                        tvMats.push(m.material);
                    }
                }     
            }
        });
        var _hasTV = false, video, texture;
        if(tvMeshs.length > 0){
            _hasTV = true;
            //查找播放视频需隐藏对象
            tvMeshs.forEach(function(tv){
                tv.parent.children.forEach(function(o){
                    if(o !== tv){
                        hideOnPlay.push(o);
                    }
                });
            });

            //视频贴图
            video = document.createElement('video');
            video.setAttribute('crossorigin','anonymous');
            video.setAttribute('preload','auto');
            video.setAttribute('loop','loop');
            video.setAttribute('webkit-playsinline','true');
            video.setAttribute('playsinline','true');
            video.setAttribute('x5-playsinline','true');
            video.setAttribute('x-webkit-airplay', 'true');
            video.setAttribute('x5-video-player-type', 'h5');
            video.setAttribute('x5-video-player-fullscreen', 'true');
            var sourceMp4 = document.createElement('source');
            sourceMp4.src = 'https://laozi-auto-east.obs.cn-east-2.myhuaweicloud.com:443/fEKfrikbDfyrjKdDvweu/media/f2f9f24d221a468c9c81f365559551ec.mp4?AccessKeyId=CE8VVPAZZC3QJRYICFXD&amp;Expires=1560923180&amp;Signature=Cx6sNwDEBgjfzHuzx8qY42ukYN0%3D';
            sourceMp4.type = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
            video.appendChild(sourceMp4);
            var sourceOgg = document.createElement('source');
            sourceOgg.src = 'https://laozi-auto-east.obs.cn-east-2.myhuaweicloud.com:443/fEKfrikbDfyrjKdDvweu/media/bf5fb7addf6e4ebaa56d48e6464f834c.Ogg?AccessKeyId=CE8VVPAZZC3QJRYICFXD&amp;Expires=1560923180&amp;Signature=MF%2F3X9JA%2FaO%2FQLrjbtWbYOSRUc4%3D';
            sourceOgg.type = 'video/ogg; codecs="theora, vorbis"';
            video.appendChild(sourceOgg);

            texture = new THREE.VideoTexture(video);
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.format = THREE.RGBFormat;

            //所有贴图都加在完成
            viewer.onTextureLoaded.add(function(){
                tvMats.forEach(function(mat){
                    tvBakMaps[mat.name] = mat.map;
                });
            });
        }

        Util.extend(viewer[this.name], {
            hasTV:function(){
                return _hasTV;
            },
            playTV:function(flag){
                tvMats.forEach(function(mat){
                    mat.map = flag ? texture : tvBakMaps[mat.name];
                });  
                
                hideOnPlay.forEach(function(o){
                    o.visible = flag;
                });

                if(flag){
                    video.play(); 
                }else{
                    video.pause(); 
                }
            }
        }, this.alias);
    }else{
        console.error('无法获取模型主对象');
    }
}

export {TVPlugin};