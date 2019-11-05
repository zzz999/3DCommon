import {BasePlugin} from './BasePlugin';
import {Util} from '../Util';
import 'extrajs/TransformControls';

function ClippingPlugin(viewer, options) {
    this.name = 'ClippingPlugin';
    BasePlugin.call(this, viewer, options);

    var _axis = 'X';
    var clipPlane = new THREE.Plane( new THREE.Vector3( -1, 0, 0 ), 0 );

    var Empty = Object.freeze([]);
    viewer.renderer.localClippingEnabled = true;

    var clipPlanes = [clipPlane];

    var _flag = false;
    window.addEventListener( 'keydown', function ( event ) {
        switch ( event.keyCode ) {
            case 32: 
                _flag = !_flag;
                viewer.ClippingPlugin.enableClipping(_flag);
                break;
        }
    });

    //存储材质
    var targetMaterials = [];
    function storeMat(mat){
        if (targetMaterials.indexOf(mat) == -1) {
            mat.clippingPlanes = Empty;
            mat.side = THREE.DoubleSide;
            //mat.clipIntersection = true;
            targetMaterials.push(mat);           
        }        
    }

    var mainObj = viewer.getMainObj();
    if(mainObj){ 
        //获取材质列表     
        mainObj.traverse(function (m) {
            if (m.geometry) {
                var mat = m.material;
                if (mat instanceof Array) {
                    mat.forEach(function(mt){
                        storeMat(mt);
                    });
                } else {
                    storeMat(mat);
                }              
            }
        });

        var halfPI = Math.PI * 0.5;

        var box = new THREE.Box3().setFromObject(mainObj);
        var size = box.getSize(new THREE.Vector3());
        var maxAxis = Math.max(size.x, size.y, size.z);
        var geometry = new THREE.PlaneBufferGeometry(maxAxis, maxAxis);
        var material = new THREE.MeshBasicMaterial( {color: 0xff0000, side: THREE.DoubleSide,opacity: 0.2, transparent: true} );
        var helper = new THREE.Mesh( geometry, material );
        helper.rotation.y = halfPI;
        helper.visible = false;
        viewer.scene.add(helper); 

        var control = new THREE.TransformControls( viewer.camera, viewer.dom );   
        control.attach(helper);
        control.scale.x *= -1;//此处应注意，因为scene 的x轴被镜像了
        control.visible = false;
        viewer.scene.add(control);
        control.addEventListener( 'dragging-changed', function (event) {
            viewer.controls.enabled = !event.value;
        } );      

        control.addEventListener( 'change', function (event) {
            var axis = event.axis;
            if(axis){
                var pos = helper.getWorldPosition(new THREE.Vector3());
                var max = _axis === 'X' ? pos.x : (_axis === 'Y' ? pos.y : pos.z);
                if(axis !== _axis){             
                    _axis = axis;
                    helper.rotation.set(0, 0, 0);
                    switch(axis){
                        case 'X':
                            clipPlane.normal = new THREE.Vector3( -1, 0, 0 );
                            helper.position.set(max, 0, 0);
                            helper.rotation.y = halfPI;
                            break;
                        case 'Y':
                            clipPlane.normal = new THREE.Vector3( 0, -1, 0 );
                            helper.position.set(0, max, 0);
                            helper.rotation.x = halfPI;
                            break;
                        case 'Z':
                            clipPlane.normal = new THREE.Vector3( 0, 0, -1 );
                            helper.position.set(0, 0, max);
                            break;
                    }
                }
            
                switch(axis){
                    case 'X':
                        clipPlane.constant = max;
                        break;
                    case 'Y':
                        clipPlane.constant = max;
                        break;
                    case 'Z':
                        clipPlane.constant = max;
                        break;
                }
            }
        });

        Util.extend(viewer[this.name], {
            enableClipping:function(flag){
                if(flag){
                    control.visible = true;
                    helper.visible = true;
                    targetMaterials.forEach(function(mat){
                        mat.clippingPlanes = clipPlanes;
                    });
                }else{
                    control.visible = false;
                    helper.visible = false;
                    targetMaterials.forEach(function(mat){
                        mat.clippingPlanes = Empty;
                    });
                }
            }
        }, this.alias);
    }else{
        console.log('无法获取模型主对象！');
    }
}

export {ClippingPlugin};