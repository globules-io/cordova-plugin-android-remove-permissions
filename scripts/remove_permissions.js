const fs = require('fs');
const xml2js = require('xml2js');
module.exports = async function(context) {
    const root = context.opts.projectRoot;
    const configPath = 'config.xml';
    const configXml = fs.readFileSync(configPath);
    let config, manifest;
    let unwantedPermissions = [];
    let permissionRemoved = [];
    //Config
    xml2js.parseString(configXml, function(__err, __res){
        config = __res;  
        for(let i = 0; i < config.widget.preference.length; i++){	 
            if(config.widget.preference[i]['$'].name === 'AndroidRemovePermissions'){
                unwantedPermissions = config.widget.preference[i]['$'].value.split(',');
                break;
            }		 
        }
        let perm;
        for(let i = 0; i < unwantedPermissions.length; i++){
            perm = unwantedPermissions[i].trim();
            if(perm.indexOf('.') === -1){
                unwantedPermissions[i] = 'android.permission.'+perm;
            }
        }
        if(unwantedPermissions.length){        
            const paths = ['/platforms/android/app/src/main/', '/platforms/android/app/build/intermediates/merged_manifest/debug/processDebugMainManifest/', '/platforms/android/app/build/intermediates/merged_manifest/release/processReleaseMainManifest/'];
            let manifestPath, manifestXml;
            paths.forEach(path => {  
                manifestPath = root + path + 'AndroidManifest.xml';
                if(fs.existsSync(manifestPath)){
                    manifestXml = fs.readFileSync(manifestPath);   
                    if(manifestXml){ 
                        xml2js.parseString(manifestXml, function(__err, __res){
                            manifest = __res;
                            let usesPermissions = manifest.manifest['uses-permission'];
                            if(Array.isArray(usesPermissions)){
                                manifest.manifest['uses-permission'] = usesPermissions.filter(usesPermission => {
                                    let attrs = usesPermission.$ || {};
                                    let name = attrs['android:name'] ; 
                                    if(unwantedPermissions.includes(name)){
                                        if(!permissionRemoved.includes(name)){
                                            permissionRemoved.push(name);	
                                        }			
                                        return false;
                                    }else{
                                        return true;
                                    }
                                });
                            }
                        }); 
                        //Save
                        const newManifest = (new xml2js.Builder()).buildObject(manifest);          
                        fs.writeFileSync(manifestPath, newManifest);        
                    }
                }
                
            }); 
            //log
            console.log('cordova-plugin-android-remove-permissions found and removed ', permissionRemoved.length, 'permissions: ', permissionRemoved.join(', '), 'expected:', unwantedPermissions.join(', '));
        };
    });

}