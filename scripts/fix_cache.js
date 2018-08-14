// Load the activities
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const cacheDir = path.join(__dirname, '..', 'server','cache');
const activies = path.join(cacheDir,'activities');

const cacheData = fs.readFileSync(activies);
const activities = JSON.parse(cacheData).data;

const combinedKey = function(key,...args) {
  if (args.length === 0 || args.length === 1 && args[0] == null) {
    return key;
  }
  let argString = JSON.stringify(args);
  const hash = crypto.createHash('sha256');
  hash.update(argString);
  const identifier = hash.digest('hex').slice(0,8);
  
  return key + '_' + identifier;
};
 
// Loop over activities
for (let activity of activities) {
  let id = activity.id;
  //console.log('activity id', id);
  const str_key = combinedKey('kudos', String(id));
  const num_key = combinedKey('kudos', id);
  //console.log(str_key);
  //console.log(num_key);
  const str_file = path.join(cacheDir, str_key);
  const num_file = path.join(cacheDir, num_key);
  let strFileExists = true;
  try {
    fs.accessSync(str_file);
  } catch(e) {
    strFileExists = false;
  }
  let numFileExists = true;
  try {
    fs.accessSync(num_file);
  } catch(e) {
    numFileExists = false;
  }
  if (strFileExists && numFileExists) {
    //console.log(`str_key_fle: ${str_key} num_key_file ${num_key}`);
    const strFileData = JSON.parse(fs.readFileSync(str_file));
    const numFileData = JSON.parse(fs.readFileSync(num_file));
    if (strFileData.cachedAt > numFileData.cachedAt) {
      console.log("String data more upto date for", id);
      fs.copyFileSync(num_file, num_file + '~');
      fs.copyFileSync(str_file, num_file);
    }
  }

}

