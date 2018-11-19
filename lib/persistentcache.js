import { InMemoryCache } from './cache';
const fs = require('fs');

export class PersistentCache extends InMemoryCache {

  constructor(file) {
    super();
    this.saveFile = file;
    // Initialise from file for persistence
    this.load();
  }

  store(key,data,expiresIn,callback) {
    // Call baseclass to do the actual store
    super.store(key,data,expiresIn,callback);
    // Save new values to file for persistence
    this.save();
  }

  remove(key, callback) {
    // Call baseclass to do the actual remove
    super.remove(key,callback);
    // Save new values to file for persistence
    this.save();
  }

  load() {
    fs.readFile(this.saveFile,(err,fileData) => {
      if (!err) {
        this.cache = new Map(JSON.parse(fileData));
      }
    });
  }

  save() {
    fs.writeFile(this.saveFile,JSON.stringify([...this.cache]));
  }

}