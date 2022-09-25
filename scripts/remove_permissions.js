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
        for(let i = 0; i < unwantedPermissions.length; i++){
            unwantedPermissions[i] = 'android.permission.'+unwantedPermissions[i].trim();
        }
        if(unwantedPermissions.length){            
            const manifestPath = root + '/platforms/android/app/src/main/AndroidManifest.xml';
            const manifestXml = fs.readFileSync(manifestPath);       
            xml2js.parseString(manifestXml, function(__err, __res){
                manifest = __res;
                const usesPermissions = manifest.manifest['uses-permission'];
                if(Array.isArray(usesPermissions)){
                    manifest.manifest['uses-permission'] = usesPermissions.filter(usesPermission => {
                        const attrs = usesPermission.$ || {};
                        const name = attrs['android:name'] ;                       
                        if(unwantedPermissions.includes(name)){
                            permissionRemoved.push(name);				
                            return false;
                        }else{
                            return true;
                        }
                    });
                }
            });        
            //log
            console.log('cordova-plugin-android-remove-permissions found and removed ', permissionRemoved.length, 'permissions: ', permissionRemoved.join(', '), 'expected:', unwantedPermissions.join(', '));
            //Save
            const newManifest = (new xml2js.Builder()).buildObject(manifest);
            fs.writeFileSync(manifestPath, newManifest);        
        };
    });

}