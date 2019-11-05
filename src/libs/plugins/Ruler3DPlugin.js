import {BasePlugin} from './BasePlugin';
import {Util} from '../Util';
import TWEEN from '@tweenjs/tween.js';
import 'three-examples/loaders/TTFLoader';

function Ruler3DPlugin(viewer, options) {
    this.name = 'Ruler3DPlugin';
    BasePlugin.call(this, viewer, options);

    var FadeType = {
        ENDTOEND:0,
        ENDTOCENTER:1
    };

    var font;
    var loader = new THREE.TTFLoader();
    loader.load(Api.prefix + 'fonts/font.ttf', function (rep) {
        font = rep;
    });

    var lineRoot = new THREE.Group();
    viewer.scene.add(lineRoot);
    var defaultMat = new THREE.LineBasicMaterial({ color: 0xff0000 })

    function genLine(s, e, m){
        var geometry = new THREE.Geometry();
        geometry.vertices.push(s, e);
        var mat = m || defaultMat;
        var line = new THREE.Line(geometry, mat);
        line.updateLine = function(ns, ne){
            geometry.vertices = [ns, ne];
            geometry.verticesNeedUpdate = true;
        }  
        lineRoot.add(line);
        return line;
    }

    function genText(text) {
        var xMid, yMid, textMesh;
        var matLite = new THREE.MeshBasicMaterial({
            color: 0x000000,
            side: THREE.DoubleSide
        });
        var textShape = new THREE.TextGeometry(text + '', {
            font: font,
            size: 20,
            height: 20,
            curveSegments: 4,
            bevelThickness: 2,
            bevelSize: 1.5,
            bevelEnabled: true
        });
        geometry.computeBoundingBox();
        xMid = -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);
        yMid = 0.5 * (geometry.boundingBox.max.y - geometry.boundingBox.min.y);
        geometry.translate(xMid, yMid, 0);
        textShape = new THREE.BufferGeometry().fromGeometry( textShape );
        textMesh = new THREE.Mesh(textShape, matLite);
        lineRoot.add(textMesh);
        return textMesh;
    }

    var digits = 10;
    function equalF(f1, f2) {
        return parseFloat(Number(f1).toFixed(digits)) === parseFloat(Number(f2).toFixed(digits));
    }

    viewer.onUpdate.add(function(){
        TWEEN.update();
    });
      
    Util.extend(viewer[this.name], {
        //上下浮动 1
        addRuler:function(sp, ep, text, color, fadeIn, fadeTime, fadeType){   
            var center = sp.clone().add(ep).multiplyScalar(0.5);
            var distance = text;
            if(!text){
                distance = (sp.distanceTo(ep) * 1000).toFixed(1) + 'mm';
            }
            var text = genText(distance);
            text.scale.x = -1;
            text.scale.y = 0;
            text.position.copy(center);
            var halfPI = Math.PI * 0.5;
            if(equalF(sp.x, ep.x) && equalF(sp.y, ep.y)){
                text.rotation.set(-halfPI, 0, -halfPI);
            }else if(equalF(sp.x, ep.x) && equalF(sp.z, ep.z)){
                text.rotation.set(0, 0, -halfPI);
            }else if(equalF(sp.z, ep.z) && equalF(sp.y, ep.y)){
                text.rotation.set(-halfPI, 0, 0);
            }
            var ruler;
            var mat = defaultMat;
            if(color){
                mat = defaultMat.clone();
                mat.color.set(color);
            }
            if(fadeIn){
                var ft = fadeType || FadeType.ENDTOCENTER,
                    fTime = fadeTime  || 1000,
                    halfTime = fTime * 0.5;
                switch(ft){
                    case FadeType.ENDTOCENTER:
                        ruler = [];                       
                        var line1 = genLine(sp, sp, mat);
                        var ep1 = sp.clone();
                        new TWEEN.Tween(ep1)
                                 .to({
                                     x:center.x,
                                     y:center.y,
                                     z:center.z
                                 }, halfTime)
                                 .onComplete(function(){  
                                     new TWEEN.Tween(text.scale)
                                              .to({
                                                  x:text.scale.x,
                                                  y:1,
                                                  z:text.scale.z
                                              }, halfTime)
                                              .start(); 
                                 })
                                 .onUpdate(function(){
                                     line1.updateLine(sp, ep1);
                                 })
                                 .start(); 
                        ruler.push(line1);
                        var line2 = genLine(ep, ep, mat);
                        var ep2 = ep.clone();
                        new TWEEN.Tween(ep2)
                                 .to({
                                     x:center.x,
                                     y:center.y,
                                     z:center.z
                                 }, halfTime)
                                 .onUpdate(function(){
                                     line2.updateLine(ep, ep2);
                                 })
                                 .start(); 
                        ruler.push(line2);
                        break;
                    default:
                        break;
                }
            }else{
                ruler = genLine(sp, ep, mat);
            }  
            return ruler;
        }
    }, this.alias);
}

export {Ruler3DPlugin};