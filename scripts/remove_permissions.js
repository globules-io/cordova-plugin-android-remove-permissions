const fs = require('fs');
const xml2js = require('xml2js');
const root = context.opts.projectRoot;
const configPath = 'config.xml';
const configXml = fs.readFileSync(configPath);
let config;
let unwantedPermissions = [];
let permissionRemoved = [];
//Config
xml2js.parseStringPromise(configXml).then(function(result){
	config = result;
	for(let i = 0; i < config.widget.preference.length; i++){	 
		if(config.widget.preference[i]['$'].name === 'AndroidRemovePermissions'){
			unwantedPermissions = config.widget.preference[i]['$'].value.split(',');
			break;
		}		 
	}
	if(unwantedPermissions.length){            
        const manifestPath = root + '/platforms/android/app/src/main/AndroidManifest.xml';
        const manifestXml = fs.readFileSync(manifestPath);
        const manifest = xml2js.parseString(manifestXml);
        const usesPermissions = manifest.manifest['uses-permission'];
        if(Array.isArray(usesPermissions)){
            manifest.manifest['uses-permission'] = usesPermissions.filter(usesPermission => {
                const attrs = usesPermission.$ || {};
                const name = attrs['android:name'] ;
                if(unwantedPermissions.includes('android.permission.'+name)){
                    permissionRemoved.push(name);				
                    return false;
                }else{
                    return true;
                }
            });
        }
        //log
        cosole.log('cordova-plugin-android-remove-permissions found and removed ', permissionRemoved.length, 'permissions: ', permissionRemoved.join(', '));
        //Save
        const newManifest = (new xml2js.Builder()).buildObject(manifest);
        fs.writeFileSync(manifestPath, newManifest);	
    }   
		
});