import MD5 from './MD5';

function AuthorizationValidation(options) {
    this.options = {
        developerID:'',
        appID:'',
        secretKey:'',
        apiUrl: 'https://open.laozicloud.com/'
    };

    if(options){
        if(options.developerID){
            this.options.developerID = options.developerID;
        }
        if(options.appID){
            this.options.appID = options.appID;
        }
        if(options.secretKey){
            this.options.secretKey = options.secretKey;
        }
        if(options.apiUrl){
            var apiUrl = options.apiUrl;
            if(apiUrl.lastIndexOf('/') !== apiUrl.length -1){
                apiUrl += '/';
            }
            this.options.apiUrl = apiUrl;
        }  
    }
}

AuthorizationValidation.prototype = {
    constructor: AuthorizationValidation,
    checkDevloper:function(onSuccess, onFaild){
        function onError(err){
            if(onFaild && onFaild instanceof Function){
                onFaild(err);
            }  
        }
        setTimeout(onSuccess);
        // if(!this.options.developerID){
        //     onError('开发者参数[developerID]缺失!');
        //     return;
        // }
        // if(!this.options.appID){
        //     onError('开发者参数[appID]缺失!');
        //     return;
        // }
        // if(!this.options.secretKey){
        //     onError('开发者参数[secretKey]缺失!');
        //     return;
        // }

        // var req = new XMLHttpRequest(); 
        // req.responseType = 'json';
        // req.open('POST', this.options.apiUrl + 'dev/v2/sdkAuthH5');
        // req.setRequestHeader("Content-type","application/x-www-form-urlencoded");
        // req.onreadystatechange = function(){
        //     if (req.readyState == 4 && req.status == 200){
        //         var res = req.response;
        //         if(res.code === '000000'){
        //             if(onSuccess && onSuccess instanceof Function){
        //                 onSuccess();
        //             }
        //         }else{
        //             onError(res.msg);                                           
        //         }
        //     }
        // };
        // req.send('developer_id=' + this.options.developerID + '&appid=' + this.options.appID + '&sign=' + MD5.hex_md5('appid=' + this.options.appID + '&developer_id=' + this.options.developerID + this.options.secretKey));   
    }
};

export {AuthorizationValidation};