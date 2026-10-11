/**
 * CareerDNA Local Offline Database Adapter
 * Automatically activates when MONGO_URI is not configured or unreachable,
 * allowing full local authentication, user profiles, professors, and resources
 * to work seamlessly out-of-the-box without requiring cloud database credentials.
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const STORE_FILE = path.resolve(__dirname, '..', '..', '.local_db_cache.json');
let collections = {};
let isOfflineMode = false;

function loadStore() {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf8');
      collections = JSON.parse(raw);
    }
  } catch (e) {
    collections = {};
  }
}

function saveStore() {
  try {
    const clean = {};
    for (const [k, list] of Object.entries(collections)) {
      clean[k] = list.map(doc => {
        const copy = { ...doc };
        delete copy.save;
        delete copy.toObject;
        delete copy.toJSON;
        return copy;
      });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(clean, null, 2), 'utf8');
  } catch (e) {
    // ignore write errors
  }
}

function getCollection(name) {
  if (!collections[name]) collections[name] = [];
  return collections[name];
}

function getNestedValue(obj, keyPath) {
  if (!obj || !keyPath) return undefined;
  if (keyPath in obj) return obj[keyPath];
  const parts = keyPath.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function setNestedValue(obj, keyPath, val) {
  const parts = keyPath.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (cur[p] == null || typeof cur[p] !== 'object') cur[p] = {};
    cur = cur[p];
  }
  cur[parts[parts.length - 1]] = val;
}

function matchCondition(val, cond) {
  if (cond instanceof RegExp) {
    if (Array.isArray(val)) return val.some(v => cond.test(String(v)));
    return cond.test(String(val ?? ''));
  }
  if (cond && typeof cond === 'object' && !Array.isArray(cond) && !(cond instanceof Date)) {
    if ('$regex' in cond) {
      const re = cond.$regex instanceof RegExp ? cond.$regex : new RegExp(cond.$regex, cond.$options || '');
      if (Array.isArray(val)) return val.some(v => re.test(String(v)));
      return re.test(String(val ?? ''));
    }
    if ('$in' in cond && Array.isArray(cond.$in)) {
      if (Array.isArray(val)) return val.some(v => cond.$in.includes(v));
      return cond.$in.includes(val);
    }
    if ('$ne' in cond) return val !== cond.$ne;
    if ('$gt' in cond) return val > cond.$gt;
    if ('$gte' in cond) return val >= cond.$gte;
    if ('$lt' in cond) return val < cond.$lt;
    if ('$lte' in cond) return val <= cond.$lte;
  }
  if (Array.isArray(val) && !Array.isArray(cond)) {
    return val.includes(cond);
  }
  return String(val ?? '') === String(cond ?? '');
}

function matchesFilter(doc, filter = {}) {
  if (!filter || Object.keys(filter).length === 0) return true;
  for (const [k, cond] of Object.entries(filter)) {
    if (k === '$or' && Array.isArray(cond)) {
      if (!cond.some(sub => matchesFilter(doc, sub))) return false;
      continue;
    }
    if (k === '$and' && Array.isArray(cond)) {
      if (!cond.every(sub => matchesFilter(doc, sub))) return false;
      continue;
    }
    const val = getNestedValue(doc, k);
    if (!matchCondition(val, cond)) return false;
  }
  return true;
}

function wrapDoc(colName, doc) {
  if (!doc || typeof doc !== 'object') return doc;
  if (!doc._id) doc._id = new mongoose.Types.ObjectId().toString();
  if (!doc.createdAt) doc.createdAt = new Date().toISOString();
  if (!doc.updatedAt) doc.updatedAt = new Date().toISOString();

  Object.defineProperty(doc, 'save', {
    enumerable: false,
    configurable: true,
    writable: true,
    value: async function () {
      this.updatedAt = new Date().toISOString();
      const col = getCollection(colName);
      const idx = col.findIndex(item => String(item._id) === String(this._id));
      if (idx >= 0) col[idx] = this;
      else col.push(this);
      saveStore();
      return this;
    }
  });

  Object.defineProperty(doc, 'toObject', {
    enumerable: false,
    configurable: true,
    writable: true,
    value: function () {
      const copy = { ...this };
      return copy;
    }
  });

  Object.defineProperty(doc, 'toJSON', {
    enumerable: false,
    configurable: true,
    writable: true,
    value: function () {
      const copy = { ...this };
      return copy;
    }
  });

  return doc;
}

function createQueryChain(colName, executor) {
  const state = {
    sortSpec: null,
    limitVal: null,
    skipVal: 0
  };

  const chain = {
    sort(spec) { state.sortSpec = spec; return chain; },
    limit(n) { state.limitVal = n; return chain; },
    skip(n) { state.skipVal = n; return chain; },
    select() { return chain; },
    lean() { return chain; },
    exec() { return Promise.resolve().then(() => executor(state)); },
    then(resolve, reject) { return chain.exec().then(resolve, reject); },
    catch(reject) { return chain.exec().catch(reject); }
  };
  return chain;
}

function applyUpdate(target, update = {}) {
  for (const [k, v] of Object.entries(update)) {
    if (k === '$set' && v && typeof v === 'object') {
      for (const [sk, sv] of Object.entries(v)) setNestedValue(target, sk, sv);
    } else if (k === '$push' && v && typeof v === 'object') {
      for (const [pk, pv] of Object.entries(v)) {
        const arr = getNestedValue(target, pk);
        if (Array.isArray(arr)) arr.push(pv);
        else setNestedValue(target, pk, [pv]);
      }
    } else if (k === '$inc' && v && typeof v === 'object') {
      for (const [ik, iv] of Object.entries(v)) {
        const cur = Number(getNestedValue(target, ik) || 0);
        setNestedValue(target, ik, cur + Number(iv));
      }
    } else if (!k.startsWith('$')) {
      setNestedValue(target, k, v);
    }
  }
  target.updatedAt = new Date().toISOString();
}

function patchModel(model) {
  const colName = model.modelName;

  model.find = function (filter = {}) {
    return createQueryChain(colName, (state) => {
      let list = getCollection(colName).filter(d => matchesFilter(d, filter)).map(d => wrapDoc(colName, d));
      if (state.sortSpec) {
        const entries = Object.entries(state.sortSpec);
        list.sort((a, b) => {
          for (const [k, dir] of entries) {
            const va = getNestedValue(a, k);
            const vb = getNestedValue(b, k);
            if (va === vb) continue;
            return (va > vb ? 1 : -1) * (dir < 0 ? -1 : 1);
          }
          return 0;
        });
      }
      if (state.skipVal > 0) list = list.slice(state.skipVal);
      if (state.limitVal != null) list = list.slice(0, state.limitVal);
      return list;
    });
  };

  model.findOne = function (filter = {}) {
    return createQueryChain(colName, () => {
      const found = getCollection(colName).find(d => matchesFilter(d, filter));
      return found ? wrapDoc(colName, found) : null;
    });
  };

  model.findById = function (id) {
    return model.findOne({ _id: String(id) });
  };

  model.create = async function (docOrArray) {
    const col = getCollection(colName);
    if (Array.isArray(docOrArray)) {
      const created = docOrArray.map(d => {
        const wrapped = wrapDoc(colName, { ...d });
        col.push(wrapped);
        return wrapped;
      });
      saveStore();
      return created;
    }
    const wrapped = wrapDoc(colName, { ...docOrArray });
    col.push(wrapped);
    saveStore();
    return wrapped;
  };

  model.insertMany = async function (arr) {
    return model.create(arr);
  };

  model.findOneAndUpdate = function (filter = {}, update = {}, options = {}) {
    return createQueryChain(colName, () => {
      const col = getCollection(colName);
      let doc = col.find(d => matchesFilter(d, filter));
      if (!doc) {
        if (options.upsert) {
          doc = {};
          for (const [k, v] of Object.entries(filter)) {
            if (!k.startsWith('$') && typeof v !== 'object') setNestedValue(doc, k, v);
          }
          applyUpdate(doc, update);
          wrapDoc(colName, doc);
          col.push(doc);
          saveStore();
          return doc;
        }
        return null;
      }
      applyUpdate(doc, update);
      wrapDoc(colName, doc);
      saveStore();
      return doc;
    });
  };

  model.findByIdAndUpdate = function (id, update = {}, options = {}) {
    return model.findOneAndUpdate({ _id: String(id) }, update, options);
  };

  model.deleteOne = async function (filter = {}) {
    const col = getCollection(colName);
    const idx = col.findIndex(d => matchesFilter(d, filter));
    if (idx >= 0) {
      col.splice(idx, 1);
      saveStore();
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  };

  model.deleteMany = async function (filter = {}) {
    const col = getCollection(colName);
    const before = col.length;
    collections[colName] = col.filter(d => !matchesFilter(d, filter));
    saveStore();
    return { deletedCount: before - collections[colName].length };
  };

  model.countDocuments = async function (filter = {}) {
    return getCollection(colName).filter(d => matchesFilter(d, filter)).length;
  };
}

function enableOfflineDatabase() {
  if (isOfflineMode) return;
  isOfflineMode = true;
  loadStore();

  // Ensure all models are loaded and patched
  const modelsDir = path.resolve(__dirname, 'models');
  if (fs.existsSync(modelsDir)) {
    for (const file of fs.readdirSync(modelsDir)) {
      if (file.endsWith('.js')) {
        require(path.join(modelsDir, file));
      }
    }
  }

  for (const modelName of mongoose.modelNames()) {
    patchModel(mongoose.model(modelName));
  }

  console.log('📦 [Offline DB] Local JSON Database Fallback active (.local_db_cache.json)');
}

function isOfflineActive() {
  return isOfflineMode;
}

module.exports = { enableOfflineDatabase, isOfflineActive };
