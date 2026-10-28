var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// ../../node_modules/@modelcontextprotocol/server/dist/chunk-vYduTEsO.mjs
var __create = Object.create;
var __defProp2 = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJSMin = /* @__PURE__ */ __name((cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports), "__commonJSMin");
var __exportAll = /* @__PURE__ */ __name((all, symbols) => {
  let target = {};
  for (var name in all) {
    __defProp2(target, name, {
      get: all[name],
      enumerable: true
    });
  }
  if (symbols) {
    __defProp2(target, Symbol.toStringTag, { value: "Module" });
  }
  return target;
}, "__exportAll");
var __copyProps = /* @__PURE__ */ __name((to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
      key = keys[i];
      if (!__hasOwnProp.call(to, key) && key !== except) {
        __defProp2(to, key, {
          get: ((k) => from[k]).bind(null, key),
          enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
        });
      }
    }
  }
  return to;
}, "__copyProps");
var __toESM = /* @__PURE__ */ __name((mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp2(target, "default", {
  value: mod,
  enumerable: true
}) : target, mod)), "__toESM");

// ../../node_modules/@modelcontextprotocol/server/dist/dialects-CDpMbily.mjs
var DRAFT_2020_12_URIS = /* @__PURE__ */ new Set(["https://json-schema.org/draft/2020-12/schema", "http://json-schema.org/draft/2020-12/schema"]);
var DRAFT_2019_09_URIS = /* @__PURE__ */ new Set(["https://json-schema.org/draft/2019-09/schema", "http://json-schema.org/draft/2019-09/schema"]);
var DRAFT_07_URIS = /* @__PURE__ */ new Set(["https://json-schema.org/draft-07/schema", "http://json-schema.org/draft-07/schema"]);
var DRAFT_06_URIS = /* @__PURE__ */ new Set(["https://json-schema.org/draft-06/schema", "http://json-schema.org/draft-06/schema"]);
function declares2019Dialect($schema) {
  return typeof $schema === "string" && DRAFT_2019_09_URIS.has($schema.replace(/#$/, ""));
}
__name(declares2019Dialect, "declares2019Dialect");
function declaredDialect(schema, remedy) {
  if (!("$schema" in schema) || typeof schema.$schema !== "string") return "2020-12";
  const declared = schema.$schema.replace(/#$/, "");
  if (DRAFT_2020_12_URIS.has(declared)) return "2020-12";
  if (DRAFT_2019_09_URIS.has(declared)) return "2019-09";
  if (DRAFT_07_URIS.has(declared) || DRAFT_06_URIS.has(declared)) return "draft-7";
  throw new Error(`JSON Schema declares an unsupported dialect ("$schema": "${schema.$schema.slice(0, 200)}"). The default validator supports JSON Schema 2020-12, 2019-09, draft-07, and draft-06; ${remedy}`);
}
__name(declaredDialect, "declaredDialect");

// ../../node_modules/zod/v4/core/util.js
var util_exports = {};
__export(util_exports, {
  BIGINT_FORMAT_RANGES: () => BIGINT_FORMAT_RANGES,
  CONSTANT_CATCH: () => CONSTANT_CATCH,
  Class: () => Class,
  NUMBER_FORMAT_RANGES: () => NUMBER_FORMAT_RANGES,
  aborted: () => aborted,
  allowsEval: () => allowsEval,
  assert: () => assert,
  assertEqual: () => assertEqual,
  assertIs: () => assertIs,
  assertNever: () => assertNever,
  assertNotEqual: () => assertNotEqual,
  assignProp: () => assignProp,
  attachSchema: () => attachSchema,
  base64ToUint8Array: () => base64ToUint8Array,
  base64urlToUint8Array: () => base64urlToUint8Array,
  cached: () => cached,
  captureStackTrace: () => captureStackTrace,
  cleanEnum: () => cleanEnum,
  cleanRegex: () => cleanRegex,
  clone: () => clone,
  cloneDef: () => cloneDef,
  codePointLength: () => codePointLength,
  constantCatch: () => constantCatch,
  createTransparentProxy: () => createTransparentProxy,
  defineLazy: () => defineLazy,
  defineLazyInternal: () => defineLazyInternal,
  derived: () => derived,
  esc: () => esc,
  escapeRegex: () => escapeRegex,
  explicitlyAborted: () => explicitlyAborted,
  extend: () => extend,
  finalizeIssue: () => finalizeIssue,
  floatSafeRemainder: () => floatSafeRemainder,
  getElementAtPath: () => getElementAtPath,
  getEnumValues: () => getEnumValues,
  getLengthableOrigin: () => getLengthableOrigin,
  getParsedType: () => getParsedType,
  getSizableOrigin: () => getSizableOrigin,
  hexToUint8Array: () => hexToUint8Array,
  hide: () => hide,
  installLazyProp: () => installLazyProp,
  isObject: () => isObject,
  isPlainObject: () => isPlainObject,
  issue: () => issue,
  joinValues: () => joinValues,
  jsonStringifyReplacer: () => jsonStringifyReplacer,
  members: () => members,
  merge: () => merge,
  mergeDefs: () => mergeDefs,
  normalizeParams: () => normalizeParams,
  nullish: () => nullish,
  numKeys: () => numKeys,
  objectClone: () => objectClone,
  omit: () => omit,
  optionalKeys: () => optionalKeys,
  own: () => own,
  parsedType: () => parsedType,
  partial: () => partial,
  pick: () => pick,
  prefixIssues: () => prefixIssues,
  primitiveTypes: () => primitiveTypes,
  promiseAllObject: () => promiseAllObject,
  propertyKeyTypes: () => propertyKeyTypes,
  randomString: () => randomString,
  rawShape: () => rawShape,
  required: () => required,
  safeExtend: () => safeExtend,
  shallowClone: () => shallowClone,
  sizeCaps: () => sizeCaps,
  slugify: () => slugify,
  stringifyPrimitive: () => stringifyPrimitive,
  toZod: () => toZod,
  uint8ArrayToBase64: () => uint8ArrayToBase64,
  uint8ArrayToBase64url: () => uint8ArrayToBase64url,
  uint8ArrayToHex: () => uint8ArrayToHex,
  unwrapMessage: () => unwrapMessage
});
function assertEqual(val) {
  return val;
}
__name(assertEqual, "assertEqual");
function assertNotEqual(val) {
  return val;
}
__name(assertNotEqual, "assertNotEqual");
function toZod() {
  return (schema) => schema;
}
__name(toZod, "toZod");
function assertIs(_arg) {
}
__name(assertIs, "assertIs");
function assertNever(_x) {
  throw new Error("Unexpected value in exhaustive check");
}
__name(assertNever, "assertNever");
function assert(_) {
}
__name(assert, "assert");
function getEnumValues(entries) {
  const numericValues = Object.values(entries).filter((v) => typeof v === "number");
  const values = Object.entries(entries).filter(([k, _]) => numericValues.indexOf(+k) === -1).map(([_, v]) => v);
  return values;
}
__name(getEnumValues, "getEnumValues");
function joinValues(array2, separator = "|") {
  return array2.map((val) => stringifyPrimitive(val)).join(separator);
}
__name(joinValues, "joinValues");
function jsonStringifyReplacer(_, value) {
  if (typeof value === "bigint")
    return value.toString();
  return value;
}
__name(jsonStringifyReplacer, "jsonStringifyReplacer");
var Cached = class {
  static {
    __name(this, "Cached");
  }
  constructor(getter) {
    this._getter = getter;
    this._value = void 0;
  }
  get value() {
    const getter = this._getter;
    if (getter !== void 0) {
      this._value = getter();
      this._getter = void 0;
    }
    return this._value;
  }
};
function cached(getter) {
  return new Cached(getter);
}
__name(cached, "cached");
function nullish(input) {
  return input === null || input === void 0;
}
__name(nullish, "nullish");
function cleanRegex(source) {
  const start = source.startsWith("^") ? 1 : 0;
  const end = source.endsWith("$") ? source.length - 1 : source.length;
  return source.slice(start, end);
}
__name(cleanRegex, "cleanRegex");
function floatSafeRemainder(val, step) {
  const ratio = val / step;
  const roundedRatio = Math.round(ratio);
  const tolerance = 4 * Number.EPSILON * Math.max(Math.abs(ratio), 1);
  if (Math.abs(ratio - roundedRatio) < tolerance)
    return 0;
  return ratio - roundedRatio;
}
__name(floatSafeRemainder, "floatSafeRemainder");
var EVALUATING = /* @__PURE__ */ Symbol("evaluating");
function defineLazy(object3, key, getter) {
  let value = void 0;
  Object.defineProperty(object3, key, {
    get() {
      if (value === EVALUATING) {
        return void 0;
      }
      if (value === void 0) {
        value = EVALUATING;
        value = getter();
      }
      return value;
    },
    set(v) {
      Object.defineProperty(object3, key, {
        value: v
        // configurable: true,
      });
    },
    configurable: true
  });
}
__name(defineLazy, "defineLazy");
function objectClone(obj) {
  return Object.create(Object.getPrototypeOf(obj), Object.getOwnPropertyDescriptors(obj));
}
__name(objectClone, "objectClone");
function assignProp(target, prop, value) {
  Object.defineProperty(target, prop, {
    value,
    writable: true,
    enumerable: true,
    configurable: true
  });
}
__name(assignProp, "assignProp");
function rawShape(def) {
  const desc = Object.getOwnPropertyDescriptor(def, "shape");
  return desc?.get ? desc.get.raw : desc?.value;
}
__name(rawShape, "rawShape");
function sourceShape(schema) {
  return rawShape(schema._zod.def) ?? schema._zod.def.shape;
}
__name(sourceShape, "sourceShape");
function deferProp(target, key, getter) {
  Object.defineProperty(target, key, {
    get() {
      const value = getter();
      assignProp(this, key, value);
      return value;
    },
    enumerable: true,
    configurable: true
  });
}
__name(deferProp, "deferProp");
function putProp(target, key, value) {
  if (key in target)
    assignProp(target, key, value);
  else
    target[key] = value;
}
__name(putProp, "putProp");
function mirrorShape(target, source, keys, wrap) {
  const raw = sourceShape(source);
  for (const key of keys) {
    const desc = Object.getOwnPropertyDescriptor(raw, key);
    if (!desc.enumerable)
      continue;
    if (desc.get) {
      deferProp(target, key, () => {
        const value = source._zod.def.shape[key];
        return wrap ? wrap(value, key) : value;
      });
    } else
      putProp(target, key, wrap ? wrap(desc.value, key) : desc.value);
  }
}
__name(mirrorShape, "mirrorShape");
function mirrorProps(target, source) {
  for (const key of Reflect.ownKeys(source)) {
    const desc = Object.getOwnPropertyDescriptor(source, key);
    if (!desc.enumerable)
      continue;
    if (desc.get)
      deferProp(target, key, () => source[key]);
    else
      putProp(target, key, desc.value);
  }
}
__name(mirrorProps, "mirrorProps");
function mergeDefs(...defs) {
  const mergedDescriptors = {};
  for (const def of defs) {
    const descriptors = Object.getOwnPropertyDescriptors(def);
    Object.assign(mergedDescriptors, descriptors);
  }
  return Object.defineProperties({}, mergedDescriptors);
}
__name(mergeDefs, "mergeDefs");
function cloneDef(schema) {
  return mergeDefs(schema._zod.def);
}
__name(cloneDef, "cloneDef");
function getElementAtPath(obj, path) {
  if (!path)
    return obj;
  return path.reduce((acc, key) => acc?.[key], obj);
}
__name(getElementAtPath, "getElementAtPath");
function promiseAllObject(promisesObj) {
  const keys = Object.keys(promisesObj);
  const promises = keys.map((key) => promisesObj[key]);
  return Promise.all(promises).then((results) => {
    const resolvedObj = {};
    for (let i = 0; i < keys.length; i++) {
      resolvedObj[keys[i]] = results[i];
    }
    return resolvedObj;
  });
}
__name(promiseAllObject, "promiseAllObject");
function randomString(length = 10) {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  let str = "";
  for (let i = 0; i < length; i++) {
    str += chars[Math.floor(Math.random() * chars.length)];
  }
  return str;
}
__name(randomString, "randomString");
function esc(str) {
  return JSON.stringify(str);
}
__name(esc, "esc");
function slugify(input) {
  return input.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}
__name(slugify, "slugify");
var captureStackTrace = "captureStackTrace" in Error ? Error.captureStackTrace : (..._args) => {
};
function isObject(data) {
  return typeof data === "object" && data !== null && !Array.isArray(data);
}
__name(isObject, "isObject");
var allowsEval = /* @__PURE__ */ cached(() => {
  if (globalConfig.jitless) {
    return false;
  }
  if (typeof navigator !== "undefined" && "Cloudflare-Workers"?.includes("Cloudflare")) {
    return false;
  }
  try {
    const F = Function;
    new F("");
    return true;
  } catch (_) {
    return false;
  }
});
function isPlainObject(o) {
  if (isObject(o) === false)
    return false;
  const ctor = o.constructor;
  if (ctor === void 0)
    return true;
  if (typeof ctor !== "function")
    return true;
  const prot = ctor.prototype;
  if (isObject(prot) === false)
    return false;
  if (Object.prototype.hasOwnProperty.call(prot, "isPrototypeOf") === false) {
    return false;
  }
  return true;
}
__name(isPlainObject, "isPlainObject");
function shallowClone(o) {
  if (isPlainObject(o))
    return { ...o };
  if (Array.isArray(o))
    return [...o];
  if (o instanceof Map)
    return new Map(o);
  if (o instanceof Set)
    return new Set(o);
  return o;
}
__name(shallowClone, "shallowClone");
function numKeys(data) {
  let keyCount = 0;
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      keyCount++;
    }
  }
  return keyCount;
}
__name(numKeys, "numKeys");
var getParsedType = /* @__PURE__ */ __name((data) => {
  const t = typeof data;
  switch (t) {
    case "undefined":
      return "undefined";
    case "string":
      return "string";
    case "number":
      return Number.isNaN(data) ? "nan" : "number";
    case "boolean":
      return "boolean";
    case "function":
      return "function";
    case "bigint":
      return "bigint";
    case "symbol":
      return "symbol";
    case "object":
      if (Array.isArray(data)) {
        return "array";
      }
      if (data === null) {
        return "null";
      }
      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return "promise";
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return "map";
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return "set";
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return "date";
      }
      if (typeof File !== "undefined" && data instanceof File) {
        return "file";
      }
      return "object";
    default:
      throw new Error(`Unknown data type: ${t}`);
  }
}, "getParsedType");
var propertyKeyTypes = /* @__PURE__ */ new Set(["string", "number", "symbol"]);
var primitiveTypes = /* @__PURE__ */ new Set([
  "string",
  "number",
  "bigint",
  "boolean",
  "symbol",
  "undefined"
]);
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
__name(escapeRegex, "escapeRegex");
function clone(inst, def, params) {
  const cl = new inst._zod.constr(def ?? inst._zod.def);
  if (!def || params?.parent)
    cl._zod.parent = inst;
  return cl;
}
__name(clone, "clone");
function normalizeParams(_params) {
  const params = _params;
  if (!params)
    return {};
  if (typeof params === "string")
    return { error: /* @__PURE__ */ __name(() => params, "error") };
  if (params?.message !== void 0) {
    if (params?.error !== void 0)
      throw new Error("Cannot specify both `message` and `error` params");
    params.error = params.message;
  }
  delete params.message;
  if (typeof params.error === "string")
    return { ...params, error: /* @__PURE__ */ __name(() => params.error, "error") };
  return params;
}
__name(normalizeParams, "normalizeParams");
function createTransparentProxy(getter) {
  let target;
  return new Proxy({}, {
    get(_, prop, receiver) {
      target ?? (target = getter());
      return Reflect.get(target, prop, receiver);
    },
    set(_, prop, value, receiver) {
      target ?? (target = getter());
      return Reflect.set(target, prop, value, receiver);
    },
    has(_, prop) {
      target ?? (target = getter());
      return Reflect.has(target, prop);
    },
    deleteProperty(_, prop) {
      target ?? (target = getter());
      return Reflect.deleteProperty(target, prop);
    },
    ownKeys(_) {
      target ?? (target = getter());
      return Reflect.ownKeys(target);
    },
    getOwnPropertyDescriptor(_, prop) {
      target ?? (target = getter());
      return Reflect.getOwnPropertyDescriptor(target, prop);
    },
    defineProperty(_, prop, descriptor) {
      target ?? (target = getter());
      return Reflect.defineProperty(target, prop, descriptor);
    }
  });
}
__name(createTransparentProxy, "createTransparentProxy");
function stringifyPrimitive(value) {
  if (typeof value === "bigint")
    return value.toString() + "n";
  if (typeof value === "string")
    return `"${value}"`;
  return `${value}`;
}
__name(stringifyPrimitive, "stringifyPrimitive");
function optionalKeys(shape) {
  return Object.keys(shape).filter((k) => {
    return shape[k]._zod.optin !== void 0 && shape[k]._zod.optout === "optional";
  });
}
__name(optionalKeys, "optionalKeys");
var NUMBER_FORMAT_RANGES = /* @__PURE__ */ (() => ({
  safeint: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
  int32: [-2147483648, 2147483647],
  uint32: [0, 4294967295],
  float32: [-34028234663852886e22, 34028234663852886e22],
  float64: [-Number.MAX_VALUE, Number.MAX_VALUE]
}))();
var BIGINT_FORMAT_RANGES = {
  int64: [/* @__PURE__ */ BigInt("-9223372036854775808"), /* @__PURE__ */ BigInt("9223372036854775807")],
  uint64: [/* @__PURE__ */ BigInt(0), /* @__PURE__ */ BigInt("18446744073709551615")]
};
function pick(schema, mask) {
  const currDef = schema._zod.def;
  const checks = currDef.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    throw new Error(".pick() cannot be used on object schemas containing refinements");
  }
  const newShape = {};
  mirrorShape(newShape, schema, maskedKeys(schema, mask));
  return clone(schema, mergeDefs(currDef, { shape: newShape, checks: [] }));
}
__name(pick, "pick");
function maskedKeys(schema, mask) {
  const raw = sourceShape(schema);
  const keys = [];
  for (const key of Reflect.ownKeys(mask)) {
    if (!Object.getOwnPropertyDescriptor(raw, key)?.enumerable) {
      throw new Error(`Unrecognized key: "${String(key)}"`);
    }
    if (mask[key])
      keys.push(key);
  }
  return keys;
}
__name(maskedKeys, "maskedKeys");
function omit(schema, mask) {
  const currDef = schema._zod.def;
  const checks = currDef.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    throw new Error(".omit() cannot be used on object schemas containing refinements");
  }
  const omitted = new Set(maskedKeys(schema, mask));
  const newShape = {};
  mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)).filter((key) => !omitted.has(key)));
  return clone(schema, mergeDefs(currDef, { shape: newShape, checks: [] }));
}
__name(omit, "omit");
function extend(schema, shape) {
  if (!isPlainObject(shape)) {
    throw new Error("Invalid input to extend: expected a plain object");
  }
  const checks = schema._zod.def.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    const existingShape = sourceShape(schema);
    for (const key of Reflect.ownKeys(shape)) {
      if (Object.getOwnPropertyDescriptor(existingShape, key) !== void 0) {
        throw new Error("Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.");
      }
    }
  }
  return clone(schema, mergeDefs(schema._zod.def, { shape: extended(schema, shape) }));
}
__name(extend, "extend");
function extended(schema, shape) {
  const newShape = {};
  mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)));
  mirrorProps(newShape, shape);
  return newShape;
}
__name(extended, "extended");
function safeExtend(schema, shape) {
  if (!isPlainObject(shape)) {
    throw new Error("Invalid input to safeExtend: expected a plain object");
  }
  return clone(schema, mergeDefs(schema._zod.def, { shape: extended(schema, shape) }));
}
__name(safeExtend, "safeExtend");
function merge(a, b) {
  if (!b?._zod?.def) {
    throw new Error("Invalid input to merge: expected an object schema. To merge a plain shape, use `.extend()`.");
  }
  if (a._zod.def.checks?.length) {
    throw new Error(".merge() cannot be used on object schemas containing refinements. Use .safeExtend() instead.");
  }
  const newShape = {};
  mirrorShape(newShape, a, Reflect.ownKeys(sourceShape(a)));
  mirrorShape(newShape, b, Reflect.ownKeys(sourceShape(b)));
  const def = mergeDefs(a._zod.def, {
    shape: newShape,
    get catchall() {
      return b._zod.def.catchall;
    },
    checks: b._zod.def.checks ?? []
  });
  return clone(a, def);
}
__name(merge, "merge");
function partial(Class2, schema, mask, name = "partial") {
  const currDef = schema._zod.def;
  const checks = currDef.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    throw new Error(`.${name}() cannot be used on object schemas containing refinements`);
  }
  const selected = mask ? new Set(maskedKeys(schema, mask)) : void 0;
  const newShape = {};
  mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)), Class2 && ((value, key) => selected && !selected.has(key) ? value : new Class2({ type: "optional", innerType: value })));
  return clone(schema, mergeDefs(schema._zod.def, { shape: newShape, checks: [] }));
}
__name(partial, "partial");
function required(Class2, schema, mask) {
  const selected = mask ? new Set(maskedKeys(schema, mask)) : void 0;
  const newShape = {};
  mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)), (value, key) => (
    // overwrite with non-optional
    selected && !selected.has(key) ? value : new Class2({ type: "nonoptional", innerType: value })
  ));
  return clone(schema, mergeDefs(schema._zod.def, { shape: newShape }));
}
__name(required, "required");
function aborted(x, startIndex = 0) {
  if (x.aborted === true)
    return true;
  for (let i = startIndex; i < x.issues.length; i++) {
    if (x.issues[i]?.continue !== true) {
      return true;
    }
  }
  return false;
}
__name(aborted, "aborted");
function explicitlyAborted(x, startIndex = 0) {
  if (x.aborted === true)
    return true;
  for (let i = startIndex; i < x.issues.length; i++) {
    if (x.issues[i]?.continue === false) {
      return true;
    }
  }
  return false;
}
__name(explicitlyAborted, "explicitlyAborted");
function prefixIssues(path, issues) {
  return issues.map((iss) => {
    var _a3;
    (_a3 = iss).path ?? (_a3.path = []);
    iss.path.unshift(path);
    return iss;
  });
}
__name(prefixIssues, "prefixIssues");
function unwrapMessage(message) {
  return typeof message === "string" ? message : message?.message;
}
__name(unwrapMessage, "unwrapMessage");
function sizeCaps(defChecks) {
  const caps = [];
  for (const ch of defChecks ?? []) {
    const d = ch._zod.def;
    if (!/_(length|size)$|_equals$/.test(d.check))
      break;
    const max = d.maximum ?? d.length ?? d.size;
    if (max >= 0)
      caps.push([max, ch]);
  }
  return caps;
}
__name(sizeCaps, "sizeCaps");
function attachSchema(issues, start, inst) {
  var _a3;
  for (let i = start; i < issues.length; i++) {
    (_a3 = issues[i]).schema ?? (_a3.schema = inst);
  }
}
__name(attachSchema, "attachSchema");
function finalizeIssue(iss, ctx, config2) {
  var _a3;
  const traits = iss.inst?._zod?.traits;
  if (traits?.has("$ZodType")) {
    if (traits.has("$ZodCheck"))
      (_a3 = iss).schema ?? (_a3.schema = iss.inst);
    else
      iss.schema = iss.inst;
  }
  const schemaError = iss.schema !== iss.inst ? iss.schema?._zod.def?.error : void 0;
  const message = iss.message ? iss.message : unwrapMessage(iss.inst?._zod.def?.error?.(iss)) ?? unwrapMessage(schemaError?.(iss)) ?? unwrapMessage(ctx?.error?.(iss)) ?? unwrapMessage(config2.customError?.(iss)) ?? unwrapMessage(config2.localeError?.(iss)) ?? "Invalid input";
  const full = {};
  for (const k of Object.keys(iss)) {
    if (k === "inst" || k === "schema" || k === "continue" || k === "input" || k === "__proto__")
      continue;
    full[k] = iss[k];
  }
  full.path ?? (full.path = []);
  full.message = message;
  if (ctx?.reportInput) {
    full.input = iss.input;
  }
  return full;
}
__name(finalizeIssue, "finalizeIssue");
function getSizableOrigin(input) {
  if (input instanceof Set)
    return "set";
  if (input instanceof Map)
    return "map";
  if (input instanceof File)
    return "file";
  return "unknown";
}
__name(getSizableOrigin, "getSizableOrigin");
var highSurrogate = /[\uD800-\uDBFF]/;
function codePointLength(str) {
  const units = str.length;
  if (!highSurrogate.test(str))
    return units;
  let count = units;
  for (let i = 0; i < units - 1; i++) {
    if ((str.charCodeAt(i) & 64512) === 55296 && (str.charCodeAt(i + 1) & 64512) === 56320) {
      count--;
      i++;
    }
  }
  return count;
}
__name(codePointLength, "codePointLength");
function getLengthableOrigin(input) {
  if (Array.isArray(input))
    return "array";
  if (typeof input === "string")
    return "string";
  return "unknown";
}
__name(getLengthableOrigin, "getLengthableOrigin");
function parsedType(data) {
  const t = typeof data;
  switch (t) {
    case "number": {
      return Number.isNaN(data) ? "nan" : "number";
    }
    case "object": {
      if (data === null) {
        return "null";
      }
      if (Array.isArray(data)) {
        return "array";
      }
      const obj = data;
      if (obj && Object.getPrototypeOf(obj) !== Object.prototype && "constructor" in obj && obj.constructor) {
        return obj.constructor.name;
      }
    }
  }
  return t;
}
__name(parsedType, "parsedType");
function issue(...args) {
  const [iss, input, inst] = args;
  if (typeof iss === "string") {
    return {
      message: iss,
      code: "custom",
      input,
      inst
    };
  }
  return { ...iss };
}
__name(issue, "issue");
function cleanEnum(obj) {
  return Object.entries(obj).filter(([k, _]) => {
    return Number.isNaN(Number.parseInt(k, 10));
  }).map((el) => el[1]);
}
__name(cleanEnum, "cleanEnum");
function base64ToUint8Array(base642) {
  const binaryString = atob(base642);
  const bytes2 = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes2[i] = binaryString.charCodeAt(i);
  }
  return bytes2;
}
__name(base64ToUint8Array, "base64ToUint8Array");
function uint8ArrayToBase64(bytes2) {
  let binaryString = "";
  for (let i = 0; i < bytes2.length; i++) {
    binaryString += String.fromCharCode(bytes2[i]);
  }
  return btoa(binaryString);
}
__name(uint8ArrayToBase64, "uint8ArrayToBase64");
function base64urlToUint8Array(base64url2) {
  const base642 = base64url2.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - base642.length % 4) % 4);
  return base64ToUint8Array(base642 + padding);
}
__name(base64urlToUint8Array, "base64urlToUint8Array");
function uint8ArrayToBase64url(bytes2) {
  return uint8ArrayToBase64(bytes2).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
__name(uint8ArrayToBase64url, "uint8ArrayToBase64url");
function hexToUint8Array(hex) {
  const cleanHex = hex.replace(/^0x/, "");
  if (cleanHex.length % 2 !== 0) {
    throw new Error("Invalid hex string length");
  }
  const bytes2 = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes2[i / 2] = Number.parseInt(cleanHex.slice(i, i + 2), 16);
  }
  return bytes2;
}
__name(hexToUint8Array, "hexToUint8Array");
function uint8ArrayToHex(bytes2) {
  return Array.from(bytes2).map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(uint8ArrayToHex, "uint8ArrayToHex");
var Class = class {
  static {
    __name(this, "Class");
  }
  constructor(..._args) {
  }
};
function members(proto, table) {
  for (const key in table) {
    const desc = Object.getOwnPropertyDescriptor(table, key);
    if (desc.get)
      Object.defineProperty(proto, key, { ...desc, enumerable: false });
    else
      defineBound(proto, key, desc.value);
  }
}
__name(members, "members");
function own(inst, key, value, enumerable = true) {
  Object.defineProperty(inst, key, { configurable: true, writable: true, enumerable, value });
  return value;
}
__name(own, "own");
function hide(inst, key, value) {
  return own(inst, key, value, false);
}
__name(hide, "hide");
// @__NO_SIDE_EFFECTS__
function derived(computes, table) {
  for (const key in computes) {
    const compute = computes[key];
    Object.defineProperty(table, key, {
      configurable: true,
      enumerable: true,
      get() {
        return own(this, key, compute(this));
      },
      set(value) {
        own(this, key, value);
      }
    });
  }
  return table;
}
__name(derived, "derived");
function defineBound(proto, key, fn) {
  Object.defineProperty(proto, key, {
    configurable: true,
    get() {
      return this == null ? fn : own(this, key, fn.bind(this));
    },
    set(value) {
      own(this, key, value);
    }
  });
}
__name(defineBound, "defineBound");
function claim(inst, sentinel) {
  const proto = Object.getPrototypeOf(inst);
  return sentinel in proto ? void 0 : proto;
}
__name(claim, "claim");
var installing;
var broke = false;
var breaker = {
  configurable: true,
  get() {
    broke = true;
    return void 0;
  }
};
function defineLazyInternal(inst, key, compute) {
  const proto = Object.getPrototypeOf(inst._zod);
  if (key in proto && installing !== inst._zod) {
    installing = void 0;
    return;
  }
  installing = inst._zod;
  Object.defineProperty(proto, key, {
    configurable: true,
    get() {
      Object.defineProperty(this, key, breaker);
      const outer = broke;
      broke = false;
      try {
        const value = compute(this);
        if (broke)
          delete this[key];
        else
          Object.defineProperty(this, key, { configurable: true, writable: true, value });
        broke = broke || outer;
        return value;
      } catch (err) {
        delete this[key];
        broke = broke || outer;
        throw err;
      }
    },
    set(value) {
      Object.defineProperty(this, key, { configurable: true, writable: true, value });
    }
  });
}
__name(defineLazyInternal, "defineLazyInternal");
function installLazyProp(inst, key, make, enumerable) {
  const proto = claim(inst, key);
  if (!proto)
    return;
  Object.defineProperty(proto, key, {
    configurable: true,
    get() {
      const desc = { configurable: true, writable: true, enumerable, value: void 0 };
      Object.defineProperty(this, key, desc);
      desc.value = make(this);
      Object.defineProperty(this, key, desc);
      return desc.value;
    },
    set(value) {
      Object.defineProperty(this, key, { configurable: true, writable: true, enumerable, value });
    }
  });
}
__name(installLazyProp, "installLazyProp");
var CONSTANT_CATCH = "~constantCatch";
function constantCatch(value) {
  const fn = /* @__PURE__ */ __name(() => value, "fn");
  fn[CONSTANT_CATCH] = true;
  return fn;
}
__name(constantCatch, "constantCatch");

// ../../node_modules/zod/v4/core/core.js
var _a;
var NEVER = /* @__PURE__ */ Object.freeze({
  status: "aborted"
});
var _zodDesc = { value: void 0, enumerable: false };
var _E = "captureStackTrace" in Error ? Error : null;
function newError(Definition) {
  const E = _E;
  if (E) {
    const saved = E.stackTraceLimit;
    if (typeof saved === "number") {
      try {
        E.stackTraceLimit = 0;
      } catch {
        _E = null;
        return new Definition();
      }
      try {
        return new Definition();
      } finally {
        E.stackTraceLimit = saved;
      }
    }
  }
  return new Definition();
}
__name(newError, "newError");
// @__NO_SIDE_EFFECTS__
function $constructor(name, initializer3, proto, params) {
  const zodProto = {};
  function Internals(def) {
    this.def = def;
    this.constr = _;
    this.traits = /* @__PURE__ */ new Set();
  }
  __name(Internals, "Internals");
  Internals.prototype = zodProto;
  const protoMembers = proto;
  const initialized = protoMembers && /* @__PURE__ */ new WeakSet();
  function init(inst, def) {
    if (!inst._zod) {
      _zodDesc.value = new Internals(def);
      try {
        Object.defineProperty(inst, "_zod", _zodDesc);
      } finally {
        _zodDesc.value = void 0;
      }
    } else if (inst._zod.traits.has(name)) {
      return;
    }
    inst._zod.traits.add(name);
    initializer3(inst, def);
    if (initialized) {
      const own2 = Object.getPrototypeOf(inst);
      const ctorProto = inst._zod.constr.prototype;
      let up = own2;
      while (up && up !== ctorProto)
        up = Object.getPrototypeOf(up);
      const target = up ?? own2;
      if (!initialized.has(target)) {
        initialized.add(target);
        members(target, protoMembers);
      }
    }
    const proto2 = _.prototype;
    for (const k in proto2) {
      if (!Object.prototype.hasOwnProperty.call(proto2, k))
        continue;
      if (!(k in inst)) {
        inst[k] = proto2[k].bind(inst);
      }
    }
  }
  __name(init, "init");
  const Parent = params?.Parent ?? Object;
  class Definition extends Parent {
    static {
      __name(this, "Definition");
    }
  }
  Object.defineProperty(Definition, "name", { value: name });
  function _(def) {
    const inst = params?.Parent ? newError(Definition) : this;
    init(inst, def);
    const deferred = inst._zod.deferred;
    if (deferred) {
      for (const fn of deferred) {
        fn();
      }
      inst._zod.deferred = void 0;
    }
    const pp = globalThis.__zod_globalConfig?.postProcessor;
    if (pp)
      pp(inst);
    return inst;
  }
  __name(_, "_");
  Object.defineProperty(_, "init", { value: init });
  Object.defineProperty(_, Symbol.hasInstance, {
    value: /* @__PURE__ */ __name((inst) => {
      if (params?.Parent && inst instanceof params.Parent)
        return true;
      return inst?._zod?.traits?.has(name);
    }, "value")
  });
  Object.defineProperty(_, "name", { value: name });
  return _;
}
__name($constructor, "$constructor");
var $ZodAsyncError = class extends Error {
  static {
    __name(this, "$ZodAsyncError");
  }
  constructor() {
    super(`Encountered Promise during synchronous parse. Use .parseAsync() instead.`);
  }
};
var $ZodEncodeError = class extends Error {
  static {
    __name(this, "$ZodEncodeError");
  }
  constructor(name) {
    super(`Encountered unidirectional transform during encode: ${name}`);
    this.name = "ZodEncodeError";
  }
};
(_a = globalThis).__zod_globalConfig ?? (_a.__zod_globalConfig = {});
var globalConfig = globalThis.__zod_globalConfig;
function config(newConfig) {
  if (newConfig)
    Object.assign(globalConfig, newConfig);
  return globalConfig;
}
__name(config, "config");

// ../../node_modules/zod/v4/core/errors.js
function _getMessage() {
  const internals = this._zod;
  internals.message ?? (internals.message = JSON.stringify(internals.def, jsonStringifyReplacer, 2));
  return internals.message;
}
__name(_getMessage, "_getMessage");
function _setMessage(value) {
  this._zod.message = value;
}
__name(_setMessage, "_setMessage");
var _messageDesc = {
  get: _getMessage,
  set: _setMessage,
  enumerable: true,
  configurable: true
};
var _issuesDesc = { value: void 0, enumerable: false };
var _installedToString = /* @__PURE__ */ new WeakSet([Object.prototype, Error.prototype]);
var initializer = /* @__PURE__ */ __name((inst, def) => {
  inst.name = "$ZodError";
  _issuesDesc.value = def;
  Object.defineProperty(inst, "issues", _issuesDesc);
  _issuesDesc.value = void 0;
  Object.defineProperty(inst, "message", _messageDesc);
  const proto = Object.getPrototypeOf(inst);
  if (!_installedToString.has(proto)) {
    _installedToString.add(proto);
    Object.defineProperty(proto, "toString", {
      configurable: true,
      enumerable: false,
      get() {
        const value = /* @__PURE__ */ __name(() => this.message, "value");
        Object.defineProperty(this, "toString", { value, configurable: true, writable: true });
        return value;
      },
      set(value) {
        Object.defineProperty(this, "toString", { value, configurable: true, writable: true });
      }
    });
  }
}, "initializer");
var $ZodError = $constructor("$ZodError", initializer);
var $ZodRealError = $constructor("$ZodError", initializer, void 0, {
  Parent: Error
});
function node(obj, key, make) {
  if (!Object.prototype.hasOwnProperty.call(obj, key)) {
    if (key === "__proto__") {
      Object.defineProperty(obj, key, { value: make(), writable: true, enumerable: true, configurable: true });
    } else {
      obj[key] = make();
    }
  }
  return obj[key];
}
__name(node, "node");
function flattenError(error2, mapper = (issue2) => issue2.message) {
  const fieldErrors = {};
  const formErrors = [];
  for (const sub of error2.issues) {
    if (sub.path.length > 0) {
      node(fieldErrors, sub.path[0], () => []).push(mapper(sub));
    } else {
      formErrors.push(mapper(sub));
    }
  }
  return { formErrors, fieldErrors };
}
__name(flattenError, "flattenError");
function formatError(error2, mapper = (issue2) => issue2.message) {
  const fieldErrors = { _errors: [] };
  const processError = /* @__PURE__ */ __name((error3, path = []) => {
    for (const issue2 of error3.issues) {
      if (issue2.code === "invalid_union" && issue2.errors.length) {
        issue2.errors.map((issues) => processError({ issues }, [...path, ...issue2.path]));
      } else if (issue2.code === "invalid_key") {
        processError({ issues: issue2.issues }, [...path, ...issue2.path]);
      } else if (issue2.code === "invalid_element") {
        processError({ issues: issue2.issues }, [...path, ...issue2.path]);
      } else {
        const fullpath = [...path, ...issue2.path];
        if (fullpath.length === 0) {
          fieldErrors._errors.push(mapper(issue2));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < fullpath.length) {
            const el = fullpath[i];
            const terminal = i === fullpath.length - 1;
            if (el === "_errors") {
              if (terminal)
                curr._errors.push(mapper(issue2));
              i++;
              continue;
            }
            if (!Object.prototype.hasOwnProperty.call(curr, el)) {
              Object.defineProperty(curr, el, {
                value: { _errors: [] },
                enumerable: true,
                writable: true,
                configurable: true
              });
            }
            const node2 = curr[el];
            if (terminal) {
              node2._errors.push(mapper(issue2));
            }
            curr = node2;
            i++;
          }
        }
      }
    }
  }, "processError");
  processError(error2);
  return fieldErrors;
}
__name(formatError, "formatError");

// ../../node_modules/zod/v4/core/parse.js
function finalizeParams(callee, params) {
  return { callee: params?.callee ?? callee, Err: params?.Err };
}
__name(finalizeParams, "finalizeParams");
var _parse = /* @__PURE__ */ __name((_Err) => {
  const fn = /* @__PURE__ */ __name((schema, value, _ctx, _params) => {
    const ctx = _ctx ? { ..._ctx, async: false } : { async: false };
    const result = schema._zod.run({ value, issues: [] }, ctx);
    if (result instanceof Promise) {
      throw new $ZodAsyncError();
    }
    if (result.issues.length) {
      const e = new (_params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
      captureStackTrace(e, _params?.callee ?? fn);
      throw e;
    }
    return result.value;
  }, "fn");
  return fn;
}, "_parse");
var _parseAsync = /* @__PURE__ */ __name((_Err) => {
  const fn = /* @__PURE__ */ __name(async (schema, value, _ctx, params) => {
    const ctx = _ctx ? { ..._ctx, async: true } : { async: true };
    let result = schema._zod.run({ value, issues: [] }, ctx);
    if (result instanceof Promise)
      result = await result;
    if (result.issues.length) {
      const e = new (params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
      captureStackTrace(e, params?.callee ?? fn);
      throw e;
    }
    return result.value;
  }, "fn");
  return fn;
}, "_parseAsync");
var _safeParse = /* @__PURE__ */ __name((_Err) => (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, async: false } : { async: false };
  const result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise) {
    throw new $ZodAsyncError();
  }
  return result.issues.length ? failure(_Err, result.issues, ctx) : { success: true, data: result.value };
}, "_safeParse");
function failure(Err, issues, ctx) {
  let error2;
  return {
    success: false,
    get error() {
      if (!error2) {
        error2 = new Err(issues.map((iss) => finalizeIssue(iss, ctx, config())));
        issues = void 0;
        ctx = void 0;
      }
      return error2;
    },
    set error(e) {
      error2 = e;
      issues = void 0;
      ctx = void 0;
    }
  };
}
__name(failure, "failure");
var _safeParseAsync = /* @__PURE__ */ __name((_Err) => async (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, async: true } : { async: true };
  let result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise)
    result = await result;
  return result.issues.length ? failure(_Err, result.issues, ctx) : { success: true, data: result.value };
}, "_safeParseAsync");
var COMPILE_INVALID = /* @__PURE__ */ Symbol.for("zod.compile.invalid");
var COMPILE_FALLBACK = /* @__PURE__ */ Symbol.for("zod.compile.fallback");
var validate = /* @__PURE__ */ __name(((schema, value, _ctx) => {
  const validator = schema._zod.bag.validator;
  if (validator !== void 0) {
    if (validator(value) !== COMPILE_INVALID)
      return true;
    if (validator.definite === true && _ctx === void 0)
      return false;
  }
  return validateFallback(schema, value, _ctx);
}), "validate");
function validateFallback(schema, value, _ctx) {
  const ctx = _ctx ? { ..._ctx, async: false, abortEarly: true } : { async: false, abortEarly: true };
  const fallbackRun = schema._zod.bag.fallbackRun;
  let result;
  if (fallbackRun) {
    ctx[COMPILE_FALLBACK] = true;
    result = fallbackRun({ value, issues: [] }, ctx);
  } else {
    result = schema._zod.run({ value, issues: [] }, ctx);
  }
  if (result instanceof Promise) {
    throw new $ZodAsyncError();
  }
  return result.issues.length === 0;
}
__name(validateFallback, "validateFallback");
var validateAsync = /* @__PURE__ */ __name(async (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, async: true, abortEarly: true } : { async: true, abortEarly: true };
  let result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise)
    result = await result;
  return result.issues.length === 0;
}, "validateAsync");
var _encode = /* @__PURE__ */ __name((_Err) => {
  const parse2 = _parse(_Err);
  const fn = /* @__PURE__ */ __name((schema, value, _ctx, _params) => {
    const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
    return parse2(schema, value, ctx, finalizeParams(fn, _params));
  }, "fn");
  return fn;
}, "_encode");
var _decode = /* @__PURE__ */ __name((_Err) => {
  const parse2 = _parse(_Err);
  const fn = /* @__PURE__ */ __name((schema, value, _ctx, _params) => {
    return parse2(schema, value, _ctx, finalizeParams(fn, _params));
  }, "fn");
  return fn;
}, "_decode");
var _encodeAsync = /* @__PURE__ */ __name((_Err) => {
  const parseAsync2 = _parseAsync(_Err);
  const fn = /* @__PURE__ */ __name(async (schema, value, _ctx, _params) => {
    const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
    return await parseAsync2(schema, value, ctx, finalizeParams(fn, _params));
  }, "fn");
  return fn;
}, "_encodeAsync");
var _decodeAsync = /* @__PURE__ */ __name((_Err) => {
  const parseAsync2 = _parseAsync(_Err);
  const fn = /* @__PURE__ */ __name(async (schema, value, _ctx, _params) => {
    return await parseAsync2(schema, value, _ctx, finalizeParams(fn, _params));
  }, "fn");
  return fn;
}, "_decodeAsync");
var _safeEncode = /* @__PURE__ */ __name((_Err) => (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
  return _safeParse(_Err)(schema, value, ctx);
}, "_safeEncode");
var _safeDecode = /* @__PURE__ */ __name((_Err) => (schema, value, _ctx) => {
  return _safeParse(_Err)(schema, value, _ctx);
}, "_safeDecode");
var _safeEncodeAsync = /* @__PURE__ */ __name((_Err) => async (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
  return _safeParseAsync(_Err)(schema, value, ctx);
}, "_safeEncodeAsync");
var _safeDecodeAsync = /* @__PURE__ */ __name((_Err) => async (schema, value, _ctx) => {
  return _safeParseAsync(_Err)(schema, value, _ctx);
}, "_safeDecodeAsync");

// ../../node_modules/zod/v4/core/regexes.js
var cuid = /^[cC][0-9a-z]{6,}$/;
var cuid2 = /^[0-9a-z]+$/;
var ulid = /^[0-7][0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{25}$/;
var xid = /^[0-9a-vA-V]{20}$/;
var ksuid = /^[A-Za-z0-9]{27}$/;
var nanoid = /^[a-zA-Z0-9_-]{21}$/;
function nanoidOfLength(length) {
  return new RegExp(`^[a-zA-Z0-9_-]{${length}}$`);
}
__name(nanoidOfLength, "nanoidOfLength");
var duration = /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/;
var guid = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/;
var uuid = /* @__PURE__ */ __name((version3) => {
  if (!version3)
    return /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/;
  return new RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${version3}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`);
}, "uuid");
var email = /^(?:[A-Za-z0-9_'+\-]+\.)*[A-Za-z0-9_'+\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;
var _emoji = `^(?=[\\s\\S]*[\\p{Extended_Pictographic}\\p{Regional_Indicator}\\u20E3])[\\p{Extended_Pictographic}\\p{Emoji_Component}]+$`;
function emoji() {
  return new RegExp(_emoji, "u");
}
__name(emoji, "emoji");
var ipv4 = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;
var cidrv4 = /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/;
var cidrv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64 = /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/;
var base64url = /^(?:[A-Za-z0-9_-]{4})*(?:[A-Za-z0-9_-]{2,3})?$/;
var httpProtocol = /^https?$/;
var e164 = /^\+[1-9]\d{6,14}$/;
var dateSource = `(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))`;
function anchor(source) {
  return new RegExp(`^${source}$`);
}
__name(anchor, "anchor");
var date = /* @__PURE__ */ anchor(dateSource);
function timeSource(args) {
  const hhmm = `(?:[01]\\d|2[0-3]):[0-5]\\d`;
  const regex2 = typeof args.precision === "number" ? args.precision === -1 ? `${hhmm}` : args.precision === 0 ? `${hhmm}:[0-5]\\d` : `${hhmm}:[0-5]\\d\\.\\d{${args.precision}}` : args.seconds ? `${hhmm}:[0-5]\\d(?:\\.\\d+)?` : `${hhmm}(?::[0-5]\\d(?:\\.\\d+)?)?`;
  return regex2;
}
__name(timeSource, "timeSource");
function time(args) {
  return new RegExp(`^${timeSource(args)}$`);
}
__name(time, "time");
function datetime(args) {
  const opts = ["Z"];
  if (args.offset)
    opts.push(`([+-](?:[01]\\d|2[0-3]):[0-5]\\d)`);
  const qualified = `${timeSource({ precision: args.precision, seconds: true })}(?:${opts.join("|")})`;
  const timeRegex = args.local ? `${qualified}|${timeSource({ precision: args.precision })}` : qualified;
  return new RegExp(`^${dateSource}T(?:${timeRegex})$`);
}
__name(datetime, "datetime");
var anyString = /^[\s\S]{0,}$/;
var bigint = /^-?\d+n?$/;
var integer = /^-?\d+$/;
var number = /^-?\d+(?:\.\d+)?$/;
var boolean = /^(?:true|false)$/i;
var _null = /^null$/i;
var lowercase = /^[^A-Z]*$/;
var uppercase = /^[^a-z]*$/;

// ../../node_modules/zod/v4/core/checks.js
var $ZodCheck = /* @__PURE__ */ $constructor("$ZodCheck", (inst, def) => {
  var _a3;
  inst._zod ?? (inst._zod = {});
  inst._zod.def = def;
  (_a3 = inst._zod).onattach ?? (_a3.onattach = []);
});
var _whenHasLength = /* @__PURE__ */ __name((payload) => {
  const val = payload.value;
  return !nullish(val) && val.length !== void 0;
}, "_whenHasLength");
var numericOriginMap = {
  number: "number",
  bigint: "bigint",
  object: "date"
};
var $ZodCheckLessThan = /* @__PURE__ */ $constructor("$ZodCheckLessThan", (inst, def) => {
  $ZodCheck.init(inst, def);
  const origin = numericOriginMap[typeof def.value];
  inst._zod.check = (payload) => {
    if (def.inclusive ? payload.value <= def.value : payload.value < def.value) {
      return;
    }
    payload.issues.push({
      origin: numericOriginMap[typeof payload.value] ?? origin,
      code: "too_big",
      maximum: typeof def.value === "object" ? def.value.getTime() : def.value,
      input: payload.value,
      inclusive: def.inclusive,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckGreaterThan = /* @__PURE__ */ $constructor("$ZodCheckGreaterThan", (inst, def) => {
  $ZodCheck.init(inst, def);
  const origin = numericOriginMap[typeof def.value];
  inst._zod.check = (payload) => {
    if (def.inclusive ? payload.value >= def.value : payload.value > def.value) {
      return;
    }
    payload.issues.push({
      origin: numericOriginMap[typeof payload.value] ?? origin,
      code: "too_small",
      minimum: typeof def.value === "object" ? def.value.getTime() : def.value,
      input: payload.value,
      inclusive: def.inclusive,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckMultipleOf = /* @__PURE__ */ $constructor("$ZodCheckMultipleOf", (inst, def) => {
  $ZodCheck.init(inst, def);
  inst._zod.check = (payload) => {
    if (typeof payload.value !== typeof def.value)
      throw new Error("Cannot mix number and bigint in multiple_of check.");
    const isMultiple = typeof payload.value === "bigint" ? (
      // `value % 0n` throws, and nothing is a multiple of zero — the number branch already fails this way via NaN
      def.value !== BigInt(0) && payload.value % def.value === BigInt(0)
    ) : floatSafeRemainder(payload.value, def.value) === 0;
    if (isMultiple)
      return;
    payload.issues.push({
      origin: typeof payload.value,
      code: "not_multiple_of",
      divisor: def.value,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckNumberFormat = /* @__PURE__ */ $constructor("$ZodCheckNumberFormat", (inst, def) => {
  $ZodCheck.init(inst, def);
  def.format = def.format || "float64";
  const isInt = def.format?.includes("int");
  const origin = isInt ? "int" : "number";
  const [minimum, maximum] = NUMBER_FORMAT_RANGES[def.format];
  inst._zod.check = (payload) => {
    const input = payload.value;
    if (isInt) {
      if (!Number.isInteger(input)) {
        payload.issues.push({
          expected: origin,
          format: def.format,
          code: "invalid_type",
          continue: false,
          input,
          inst
        });
        return;
      }
      if (!Number.isSafeInteger(input)) {
        if (input > 0) {
          payload.issues.push({
            input,
            code: "too_big",
            maximum: Number.MAX_SAFE_INTEGER,
            note: "Integers must be within the safe integer range.",
            inst,
            origin,
            inclusive: true,
            continue: !def.abort
          });
        } else {
          payload.issues.push({
            input,
            code: "too_small",
            minimum: Number.MIN_SAFE_INTEGER,
            note: "Integers must be within the safe integer range.",
            inst,
            origin,
            inclusive: true,
            continue: !def.abort
          });
        }
        return;
      }
    }
    if (input < minimum) {
      payload.issues.push({
        origin: "number",
        input,
        code: "too_small",
        minimum,
        inclusive: true,
        inst,
        continue: !def.abort
      });
    }
    if (input > maximum) {
      payload.issues.push({
        origin: "number",
        input,
        code: "too_big",
        maximum,
        inclusive: true,
        inst,
        continue: !def.abort
      });
    }
  };
});
var $ZodCheckMaxLength = /* @__PURE__ */ $constructor("$ZodCheckMaxLength", (inst, def) => {
  var _a3;
  $ZodCheck.init(inst, def);
  (_a3 = inst._zod.def).when ?? (_a3.when = _whenHasLength);
  inst._zod.check = (payload) => {
    const input = payload.value;
    const units = input.length;
    const length = typeof input === "string" && units > def.maximum ? codePointLength(input) : units;
    if (length <= def.maximum)
      return;
    const origin = getLengthableOrigin(input);
    payload.issues.push({
      origin,
      code: "too_big",
      maximum: def.maximum,
      inclusive: true,
      input,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckMinLength = /* @__PURE__ */ $constructor("$ZodCheckMinLength", (inst, def) => {
  var _a3;
  $ZodCheck.init(inst, def);
  (_a3 = inst._zod.def).when ?? (_a3.when = _whenHasLength);
  inst._zod.check = (payload) => {
    const input = payload.value;
    const units = input.length;
    const length = typeof input === "string" && units >= def.minimum && units < def.minimum * 2 ? codePointLength(input) : units;
    if (length >= def.minimum)
      return;
    const origin = getLengthableOrigin(input);
    payload.issues.push({
      origin,
      code: "too_small",
      minimum: def.minimum,
      inclusive: true,
      input,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckLengthEquals = /* @__PURE__ */ $constructor("$ZodCheckLengthEquals", (inst, def) => {
  var _a3;
  $ZodCheck.init(inst, def);
  (_a3 = inst._zod.def).when ?? (_a3.when = _whenHasLength);
  inst._zod.check = (payload) => {
    const input = payload.value;
    const units = input.length;
    const length = typeof input === "string" && units >= def.length && units <= def.length * 2 ? codePointLength(input) : units;
    if (length === def.length)
      return;
    const origin = getLengthableOrigin(input);
    const tooBig = length > def.length;
    payload.issues.push({
      origin,
      ...tooBig ? { code: "too_big", maximum: def.length } : { code: "too_small", minimum: def.length },
      inclusive: true,
      exact: true,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckStringFormat = /* @__PURE__ */ $constructor("$ZodCheckStringFormat", (inst, def) => {
  var _a3, _b;
  $ZodCheck.init(inst, def);
  if (def.pattern)
    (_a3 = inst._zod).check ?? (_a3.check = (payload) => {
      def.pattern.lastIndex = 0;
      if (def.pattern.test(payload.value))
        return;
      payload.issues.push({
        origin: "string",
        code: "invalid_format",
        format: def.format,
        input: payload.value,
        ...def.pattern ? { pattern: def.pattern.toString() } : {},
        inst,
        continue: !def.abort
      });
    });
  else
    (_b = inst._zod).check ?? (_b.check = () => {
    });
});
var $ZodCheckRegex = /* @__PURE__ */ $constructor("$ZodCheckRegex", (inst, def) => {
  $ZodCheckStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    def.pattern.lastIndex = 0;
    if (def.pattern.test(payload.value))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "regex",
      input: payload.value,
      pattern: def.pattern.toString(),
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckLowerCase = /* @__PURE__ */ $constructor("$ZodCheckLowerCase", (inst, def) => {
  def.pattern ?? (def.pattern = lowercase);
  $ZodCheckStringFormat.init(inst, def);
});
var $ZodCheckUpperCase = /* @__PURE__ */ $constructor("$ZodCheckUpperCase", (inst, def) => {
  def.pattern ?? (def.pattern = uppercase);
  $ZodCheckStringFormat.init(inst, def);
});
var $ZodCheckIncludes = /* @__PURE__ */ $constructor("$ZodCheckIncludes", (inst, def) => {
  $ZodCheck.init(inst, def);
  const escapedRegex = escapeRegex(def.includes);
  const pattern = new RegExp(typeof def.position === "number" ? `^.{${def.position},}${escapedRegex}` : escapedRegex);
  def.pattern = pattern;
  inst._zod.check = (payload) => {
    if (payload.value.includes(def.includes, def.position))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "includes",
      includes: def.includes,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckStartsWith = /* @__PURE__ */ $constructor("$ZodCheckStartsWith", (inst, def) => {
  $ZodCheck.init(inst, def);
  const pattern = new RegExp(`^${escapeRegex(def.prefix)}.*`);
  def.pattern ?? (def.pattern = pattern);
  inst._zod.check = (payload) => {
    if (payload.value.startsWith(def.prefix))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "starts_with",
      prefix: def.prefix,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckEndsWith = /* @__PURE__ */ $constructor("$ZodCheckEndsWith", (inst, def) => {
  $ZodCheck.init(inst, def);
  const pattern = new RegExp(`.*${escapeRegex(def.suffix)}$`);
  def.pattern ?? (def.pattern = pattern);
  inst._zod.check = (payload) => {
    if (payload.value.endsWith(def.suffix))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "ends_with",
      suffix: def.suffix,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckOverwrite = /* @__PURE__ */ $constructor("$ZodCheckOverwrite", (inst, def) => {
  $ZodCheck.init(inst, def);
  inst._zod.check = (payload) => {
    payload.value = def.tx(payload.value);
  };
});

// ../../node_modules/zod/v4/core/doc.js
var Doc = class {
  static {
    __name(this, "Doc");
  }
  constructor(args = [], closed = {}) {
    this.content = [];
    this.indent = 0;
    this.args = args;
    this.closed = closed;
  }
  // the compiler catches a child's throw and keeps writing into this doc, so the indent has to unwind with it
  indented(fn) {
    this.indent += 1;
    try {
      fn(this);
    } finally {
      this.indent -= 1;
    }
  }
  write(arg) {
    if (typeof arg === "function") {
      arg(this, { execution: "sync" });
      arg(this, { execution: "async" });
      return;
    }
    const content = arg;
    const lines = content.split("\n").filter((x) => x);
    const minIndent = Math.min(...lines.map((x) => x.length - x.trimStart().length));
    const dedented = lines.map((x) => x.slice(minIndent)).map((x) => " ".repeat(this.indent * 2) + x);
    for (const line of dedented) {
      this.content.push(line);
    }
  }
  compile() {
    const F = Function;
    const content = this?.content ?? [``];
    const factory = new F(...Object.keys(this.closed), `return function (${this.args.join(", ")}) {
${content.join("\n")}
};`);
    return factory(...Object.values(this.closed));
  }
};

// ../../node_modules/zod/v4/core/versions.js
var version = {
  major: 4,
  minor: 6,
  patch: 7
};

// ../../node_modules/zod/v4/core/schemas.js
var $ZodType = /* @__PURE__ */ $constructor("$ZodType", (inst, def) => {
  var _a3;
  inst ?? (inst = {});
  inst._zod.def = def;
  inst._zod.bag = inst._zod.bag || {};
  inst._zod.version = version;
  const defChecks = inst._zod.def.checks;
  const checks = inst._zod.traits.has("$ZodCheck") ? [inst, ...defChecks ?? []] : defChecks?.length ? [...defChecks] : [];
  for (const ch of checks) {
    for (const fn of ch._zod.onattach) {
      fn(inst);
    }
  }
  if (checks.length === 0) {
    (_a3 = inst._zod).deferred ?? (_a3.deferred = []);
    inst._zod.deferred?.push(() => {
      inst._zod.run = inst._zod.parse;
    });
  } else {
    const runChecks = /* @__PURE__ */ __name((payload, checks2, ctx) => {
      if (payload.memo)
        return payload;
      let isAborted = aborted(payload);
      let asyncResult;
      for (const ch of checks2) {
        if (ch._zod.def.when) {
          if (explicitlyAborted(payload))
            continue;
          const shouldRun = ch._zod.def.when(payload);
          if (!shouldRun)
            continue;
        } else if (isAborted) {
          continue;
        }
        const currLen = payload.issues.length;
        const _ = ch._zod.check(payload);
        if (_ instanceof Promise && ctx?.async === false) {
          throw new $ZodAsyncError();
        }
        if (asyncResult || _ instanceof Promise) {
          asyncResult = (asyncResult ?? Promise.resolve()).then(async () => {
            await _;
            const nextLen = payload.issues.length;
            if (nextLen === currLen)
              return;
            attachSchema(payload.issues, currLen, inst);
            if (!isAborted)
              isAborted = aborted(payload, currLen);
          });
        } else {
          const nextLen = payload.issues.length;
          if (nextLen === currLen)
            continue;
          attachSchema(payload.issues, currLen, inst);
          if (!isAborted)
            isAborted = aborted(payload, currLen);
        }
      }
      if (asyncResult) {
        return asyncResult.then(() => {
          return payload;
        });
      }
      return payload;
    }, "runChecks");
    const handleCanaryResult = /* @__PURE__ */ __name((canary, payload, ctx) => {
      if (aborted(canary)) {
        canary.aborted = true;
        return canary;
      }
      const checkResult = runChecks(payload, checks, ctx);
      if (checkResult instanceof Promise) {
        if (ctx.async === false)
          throw new $ZodAsyncError();
        return checkResult.then((checkResult2) => inst._zod.parse(checkResult2, ctx));
      }
      return inst._zod.parse(checkResult, ctx);
    }, "handleCanaryResult");
    inst._zod.run = (payload, ctx) => {
      if (ctx.skipChecks) {
        return inst._zod.parse(payload, ctx);
      }
      if (ctx.direction === "backward") {
        const canary = inst._zod.parse({ value: payload.value, issues: [] }, { ...ctx, skipChecks: true });
        if (canary instanceof Promise) {
          return canary.then((canary2) => {
            return handleCanaryResult(canary2, payload, ctx);
          });
        }
        return handleCanaryResult(canary, payload, ctx);
      }
      const result = inst._zod.parse(payload, ctx);
      if (result instanceof Promise) {
        if (ctx.async === false)
          throw new $ZodAsyncError();
        return result.then((result2) => runChecks(result2, checks, ctx));
      }
      return runChecks(result, checks, ctx);
    };
  }
}, {
  // Wrappers extend this by installing a richer factory over it; reading it eagerly would defeat the laziness.
  get "~standard"() {
    return hide(this, "~standard", standardProps(this));
  },
  set "~standard"(value) {
    own(this, "~standard", value);
  }
});
var toStandardResult = /* @__PURE__ */ __name((r, ctx) => r.issues.length ? { issues: r.issues.map((iss) => finalizeIssue(iss, ctx, config())) } : { value: r.value }, "toStandardResult");
async function validateAsync2(inst, value) {
  const ctx = { async: true };
  return toStandardResult(await inst._zod.run({ value, issues: [] }, ctx), ctx);
}
__name(validateAsync2, "validateAsync");
function standardProps(inst) {
  return {
    validate: /* @__PURE__ */ __name((value) => {
      const ctx = { async: false };
      try {
        const r = inst._zod.run({ value, issues: [] }, ctx);
        if (!(r instanceof Promise))
          return toStandardResult(r, ctx);
      } catch (_) {
      }
      return validateAsync2(inst, value);
    }, "validate"),
    vendor: "zod",
    version: 1
  };
}
__name(standardProps, "standardProps");
var $ZodString = /* @__PURE__ */ $constructor("$ZodString", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = def.pattern ?? anyString;
  inst._zod.parse = (payload, _) => {
    if (def.coerce)
      try {
        payload.value = String(payload.value);
      } catch (_2) {
      }
    if (typeof payload.value === "string")
      return payload;
    payload.issues.push({
      expected: "string",
      code: "invalid_type",
      input: payload.value,
      inst
    });
    return payload;
  };
});
var $ZodStringFormat = /* @__PURE__ */ $constructor("$ZodStringFormat", (inst, def) => {
  $ZodCheckStringFormat.init(inst, def);
  $ZodString.init(inst, def);
});
var $ZodGUID = /* @__PURE__ */ $constructor("$ZodGUID", (inst, def) => {
  def.pattern ?? (def.pattern = guid);
  $ZodStringFormat.init(inst, def);
});
var $ZodUUID = /* @__PURE__ */ $constructor("$ZodUUID", (inst, def) => {
  if (def.version) {
    const versionMap = {
      v1: 1,
      v2: 2,
      v3: 3,
      v4: 4,
      v5: 5,
      v6: 6,
      v7: 7,
      v8: 8
    };
    const v = versionMap[def.version];
    if (v === void 0)
      throw new Error(`Invalid UUID version: "${def.version}"`);
    def.pattern ?? (def.pattern = uuid(v));
  } else
    def.pattern ?? (def.pattern = uuid());
  $ZodStringFormat.init(inst, def);
});
var $ZodEmail = /* @__PURE__ */ $constructor("$ZodEmail", (inst, def) => {
  def.pattern ?? (def.pattern = email);
  $ZodStringFormat.init(inst, def);
});
var URL_BAD_FORMAT = 1;
var URL_UNPARSEABLE = 2;
function canParseURL(input) {
  try {
    if (typeof URL !== "undefined" && typeof URL.canParse === "function")
      return URL.canParse(input);
    new URL(input);
    return true;
  } catch {
    return false;
  }
}
__name(canParseURL, "canParseURL");
function validateURL(trimmed, def) {
  if (!("normalize" in def) && !("hostname" in def) && !("protocol" in def)) {
    return canParseURL(trimmed) || URL_UNPARSEABLE;
  }
  return parseURLObject(trimmed, def);
}
__name(validateURL, "validateURL");
function parseURLObject(trimmed, def) {
  if (!def.normalize && def.protocol?.source === httpProtocol.source && !/^https?:\/\//i.test(trimmed)) {
    return URL_BAD_FORMAT;
  }
  try {
    if (typeof URL !== "undefined") {
      const URLStatic = URL;
      if (typeof URLStatic.parse === "function")
        return URLStatic.parse(trimmed) ?? URL_UNPARSEABLE;
    }
    return new URL(trimmed);
  } catch {
    return URL_UNPARSEABLE;
  }
}
__name(parseURLObject, "parseURLObject");
var asciiTabOrNewline = /[\t\n\r]/g;
function stripTabAndNewline(value) {
  return value.replace(asciiTabOrNewline, "");
}
__name(stripTabAndNewline, "stripTabAndNewline");
function urlHostnameOk(url2, hostname) {
  hostname.lastIndex = 0;
  return hostname.test(url2.hostname);
}
__name(urlHostnameOk, "urlHostnameOk");
function urlProtocolOk(url2, protocol) {
  protocol.lastIndex = 0;
  return protocol.test(url2.protocol.endsWith(":") ? url2.protocol.slice(0, -1) : url2.protocol);
}
__name(urlProtocolOk, "urlProtocolOk");
var $ZodURL = /* @__PURE__ */ $constructor("$ZodURL", (inst, def) => {
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    try {
      const trimmed = payload.value.trim();
      const url2 = validateURL(trimmed, def);
      if (url2 === URL_BAD_FORMAT) {
        payload.issues.push({
          code: "invalid_format",
          format: "url",
          note: "Invalid URL format",
          input: payload.value,
          inst,
          continue: !def.abort
        });
        return;
      }
      if (url2 === URL_UNPARSEABLE) {
        payload.issues.push({
          code: "invalid_format",
          format: "url",
          input: payload.value,
          inst,
          continue: !def.abort
        });
        return;
      }
      if (url2 === true) {
        payload.value = stripTabAndNewline(trimmed);
        return;
      }
      if (def.hostname && !urlHostnameOk(url2, def.hostname)) {
        payload.issues.push({
          code: "invalid_format",
          format: "url",
          note: "Invalid hostname",
          pattern: def.hostname.source,
          input: payload.value,
          inst,
          continue: !def.abort
        });
      }
      if (def.protocol && !urlProtocolOk(url2, def.protocol)) {
        payload.issues.push({
          code: "invalid_format",
          format: "url",
          note: "Invalid protocol",
          pattern: def.protocol.source,
          input: payload.value,
          inst,
          continue: !def.abort
        });
      }
      payload.value = def.normalize ? url2.href : stripTabAndNewline(trimmed);
      return;
    } catch (_) {
      payload.issues.push({
        code: "invalid_format",
        format: "url",
        input: payload.value,
        inst,
        continue: !def.abort
      });
    }
  };
});
var $ZodEmoji = /* @__PURE__ */ $constructor("$ZodEmoji", (inst, def) => {
  def.pattern ?? (def.pattern = emoji());
  $ZodStringFormat.init(inst, def);
});
var $ZodNanoID = /* @__PURE__ */ $constructor("$ZodNanoID", (inst, def) => {
  if (def.length !== void 0 && (!Number.isInteger(def.length) || def.length < 1))
    throw new Error(`Invalid nanoid length: ${def.length}`);
  def.pattern ?? (def.pattern = def.length === void 0 ? nanoid : nanoidOfLength(def.length));
  $ZodStringFormat.init(inst, def);
});
var $ZodCUID = /* @__PURE__ */ $constructor("$ZodCUID", (inst, def) => {
  def.pattern ?? (def.pattern = cuid);
  $ZodStringFormat.init(inst, def);
});
var $ZodCUID2 = /* @__PURE__ */ $constructor("$ZodCUID2", (inst, def) => {
  def.pattern ?? (def.pattern = cuid2);
  $ZodStringFormat.init(inst, def);
});
var $ZodULID = /* @__PURE__ */ $constructor("$ZodULID", (inst, def) => {
  def.pattern ?? (def.pattern = ulid);
  $ZodStringFormat.init(inst, def);
});
var $ZodXID = /* @__PURE__ */ $constructor("$ZodXID", (inst, def) => {
  def.pattern ?? (def.pattern = xid);
  $ZodStringFormat.init(inst, def);
});
var $ZodKSUID = /* @__PURE__ */ $constructor("$ZodKSUID", (inst, def) => {
  def.pattern ?? (def.pattern = ksuid);
  $ZodStringFormat.init(inst, def);
});
var $ZodISODateTime = /* @__PURE__ */ $constructor("$ZodISODateTime", (inst, def) => {
  def.pattern ?? (def.pattern = datetime(def));
  $ZodStringFormat.init(inst, def);
});
var $ZodISODate = /* @__PURE__ */ $constructor("$ZodISODate", (inst, def) => {
  def.pattern ?? (def.pattern = date);
  $ZodStringFormat.init(inst, def);
});
var $ZodISOTime = /* @__PURE__ */ $constructor("$ZodISOTime", (inst, def) => {
  def.pattern ?? (def.pattern = time(def));
  $ZodStringFormat.init(inst, def);
});
var $ZodISODuration = /* @__PURE__ */ $constructor("$ZodISODuration", (inst, def) => {
  def.pattern ?? (def.pattern = duration);
  $ZodStringFormat.init(inst, def);
});
var $ZodIPv4 = /* @__PURE__ */ $constructor("$ZodIPv4", (inst, def) => {
  def.pattern ?? (def.pattern = ipv4);
  $ZodStringFormat.init(inst, def);
});
var ipv6Alphabet = /^[0-9a-fA-F:.]+$/;
function isValidIPv6(value) {
  if (!ipv6Alphabet.test(value))
    return false;
  return canParseURL(`http://[${value}]`);
}
__name(isValidIPv6, "isValidIPv6");
var $ZodIPv6 = /* @__PURE__ */ $constructor("$ZodIPv6", (inst, def) => {
  def.pattern ?? (def.pattern = ipv6);
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    if (!isValidIPv6(payload.value)) {
      payload.issues.push({
        code: "invalid_format",
        format: "ipv6",
        input: payload.value,
        inst,
        continue: !def.abort
      });
    }
  };
});
var $ZodCIDRv4 = /* @__PURE__ */ $constructor("$ZodCIDRv4", (inst, def) => {
  def.pattern ?? (def.pattern = cidrv4);
  $ZodStringFormat.init(inst, def);
});
function isValidCIDRv6(value) {
  const parts = value.split("/");
  if (parts.length !== 2)
    return false;
  const [address, prefix] = parts;
  if (!prefix)
    return false;
  const prefixNum = Number(prefix);
  if (`${prefixNum}` !== prefix)
    return false;
  if (prefixNum < 0 || prefixNum > 128)
    return false;
  return isValidIPv6(address);
}
__name(isValidCIDRv6, "isValidCIDRv6");
var $ZodCIDRv6 = /* @__PURE__ */ $constructor("$ZodCIDRv6", (inst, def) => {
  def.pattern ?? (def.pattern = cidrv6);
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    if (!isValidCIDRv6(payload.value)) {
      payload.issues.push({
        code: "invalid_format",
        format: "cidrv6",
        input: payload.value,
        inst,
        continue: !def.abort
      });
    }
  };
});
function isValidBase64(data) {
  if (data === "")
    return true;
  if (/\s/.test(data))
    return false;
  if (data.length % 4 !== 0)
    return false;
  try {
    atob(data);
    return true;
  } catch {
    return false;
  }
}
__name(isValidBase64, "isValidBase64");
var base64Charset = /^[0-9a-zA-Z+/]*={0,2}$/;
var $ZodBase64 = /* @__PURE__ */ $constructor("$ZodBase64", (inst, def) => {
  def.pattern ?? (def.pattern = base64Charset);
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    if (isValidBase64(payload.value))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: "base64",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var base64urlCharset = /^[A-Za-z0-9_-]*$/;
function isValidBase64URL(data) {
  if (!base64urlCharset.test(data))
    return false;
  const base642 = data.replace(/[-_]/g, (c) => c === "-" ? "+" : "/");
  const padded = base642.padEnd(Math.ceil(base642.length / 4) * 4, "=");
  return isValidBase64(padded);
}
__name(isValidBase64URL, "isValidBase64URL");
var $ZodBase64URL = /* @__PURE__ */ $constructor("$ZodBase64URL", (inst, def) => {
  def.pattern ?? (def.pattern = base64urlCharset);
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    if (isValidBase64URL(payload.value))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: "base64url",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodE164 = /* @__PURE__ */ $constructor("$ZodE164", (inst, def) => {
  def.pattern ?? (def.pattern = e164);
  $ZodStringFormat.init(inst, def);
});
function isValidJWT(token, algorithm = null) {
  try {
    const tokensParts = token.split(".");
    if (tokensParts.length !== 3)
      return false;
    const [header] = tokensParts;
    if (!header)
      return false;
    const parsedHeader = JSON.parse(atob(header));
    if ("typ" in parsedHeader && parsedHeader?.typ !== "JWT")
      return false;
    if (!parsedHeader.alg)
      return false;
    if (algorithm && (!("alg" in parsedHeader) || parsedHeader.alg !== algorithm))
      return false;
    return true;
  } catch {
    return false;
  }
}
__name(isValidJWT, "isValidJWT");
var $ZodJWT = /* @__PURE__ */ $constructor("$ZodJWT", (inst, def) => {
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    if (isValidJWT(payload.value, def.alg))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: "jwt",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodNumber = /* @__PURE__ */ $constructor("$ZodNumber", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = number;
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce)
      try {
        payload.value = Number(payload.value);
      } catch (_) {
      }
    const input = payload.value;
    if (typeof input === "number" && !Number.isNaN(input) && Number.isFinite(input)) {
      return payload;
    }
    const received = typeof input === "number" ? Number.isNaN(input) ? "NaN" : !Number.isFinite(input) ? String(input) : void 0 : void 0;
    payload.issues.push({
      expected: "number",
      code: "invalid_type",
      input,
      inst,
      ...received ? { received } : {}
    });
    return payload;
  };
});
var $ZodNumberFormat = /* @__PURE__ */ $constructor("$ZodNumberFormat", (inst, def) => {
  $ZodCheckNumberFormat.init(inst, def);
  $ZodNumber.init(inst, def);
});
var $ZodBoolean = /* @__PURE__ */ $constructor("$ZodBoolean", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = boolean;
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce)
      try {
        payload.value = Boolean(payload.value);
      } catch (_) {
      }
    const input = payload.value;
    if (typeof input === "boolean")
      return payload;
    payload.issues.push({
      expected: "boolean",
      code: "invalid_type",
      input,
      inst
    });
    return payload;
  };
});
var $ZodBigInt = /* @__PURE__ */ $constructor("$ZodBigInt", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = bigint;
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce)
      try {
        payload.value = BigInt(payload.value);
      } catch (_) {
      }
    if (typeof payload.value === "bigint")
      return payload;
    payload.issues.push({
      expected: "bigint",
      code: "invalid_type",
      input: payload.value,
      inst
    });
    return payload;
  };
});
var $ZodNull = /* @__PURE__ */ $constructor("$ZodNull", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = _null;
  inst._zod.values = /* @__PURE__ */ new Set([null]);
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (input === null)
      return payload;
    payload.issues.push({
      expected: "null",
      code: "invalid_type",
      input,
      inst
    });
    return payload;
  };
});
var $ZodAny = /* @__PURE__ */ $constructor("$ZodAny", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload) => payload;
});
var $ZodUnknown = /* @__PURE__ */ $constructor("$ZodUnknown", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload) => payload;
});
var $ZodNever = /* @__PURE__ */ $constructor("$ZodNever", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    payload.issues.push({
      expected: "never",
      code: "invalid_type",
      input: payload.value,
      inst
    });
    return payload;
  };
});
var $ZodDate = /* @__PURE__ */ $constructor("$ZodDate", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce) {
      try {
        payload.value = new Date(payload.value);
      } catch (_err) {
      }
    }
    const input = payload.value;
    const isDate = input instanceof Date;
    const isValidDate = isDate && !Number.isNaN(input.getTime());
    if (isValidDate)
      return payload;
    payload.issues.push({
      expected: "date",
      code: "invalid_type",
      input,
      ...isDate ? { received: "Invalid Date" } : {},
      inst
    });
    return payload;
  };
});
function capSize(inst, size) {
  const caps = sizeCaps(inst._zod.def.checks);
  if (!caps.length)
    return;
  const cap = Math.min(...caps.map((c) => c[0]));
  const parse2 = inst._zod.parse;
  inst._zod.parse = (payload, ctx) => {
    const n = size(payload.value);
    if (n > cap && !ctx?.skipChecks && ctx?.direction !== "backward") {
      for (const [max, ch] of sizeCaps(inst._zod.def.checks)) {
        if (n > max && ch._zod.def.when(payload)) {
          const start = payload.issues.length;
          ch._zod.check(payload);
          payload.issues[start].continue = false;
          attachSchema(payload.issues, start, inst);
          return payload;
        }
      }
    }
    return parse2(payload, ctx);
  };
}
__name(capSize, "capSize");
var arraySize = /* @__PURE__ */ __name((input) => Array.isArray(input) ? input.length : -1, "arraySize");
function handleArrayResult(result, final, index) {
  if (result.issues.length) {
    final.issues.push(...prefixIssues(index, result.issues));
  }
  final.value[index] = result.value;
}
__name(handleArrayResult, "handleArrayResult");
var $ZodArray = /* @__PURE__ */ $constructor("$ZodArray", (inst, def) => {
  $ZodType.init(inst, def);
  const memo3 = globalConfig.memoizer;
  memo3?.attach(inst);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!Array.isArray(input)) {
      payload.issues.push({
        expected: "array",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    payload.value = memo3 ? memo3.alloc(inst, payload, Array(input.length), ctx) : Array(input.length);
    const proms = [];
    const abortEarly = ctx?.abortEarly;
    for (let i = 0; i < input.length; i++) {
      const item = input[i];
      const result = def.element._zod.run({
        value: item,
        issues: []
      }, ctx);
      if (result instanceof Promise) {
        proms.push(result.then((result2) => handleArrayResult(result2, payload, i)));
      } else {
        handleArrayResult(result, payload, i);
        if (abortEarly && result.issues.length !== 0 && aborted(result))
          break;
      }
    }
    if (proms.length) {
      return Promise.all(proms).then(() => payload);
    }
    return payload;
  };
  capSize(inst, arraySize);
});
function handlePropertyResult(result, final, key, input, optin, optout) {
  const isPresent = key in input;
  const isOptionalOut = optout === "optional";
  if (!isPresent && isOptionalOut && optin === "optional") {
    return;
  }
  if (result.issues.length) {
    if (optin !== void 0 && isOptionalOut && !isPresent) {
      return;
    }
    final.issues.push(...prefixIssues(key, result.issues));
  }
  if (!isPresent && optin === void 0) {
    if (!result.issues.length) {
      final.issues.push({
        code: "invalid_type",
        expected: "nonoptional",
        input: void 0,
        path: [key]
      });
    }
    return;
  }
  if (result.value === void 0) {
    if (isPresent || optin === "defaulted" && !isOptionalOut) {
      final.value[key] = void 0;
    }
  } else {
    final.value[key] = result.value;
  }
}
__name(handlePropertyResult, "handlePropertyResult");
var NO_SYMBOL_KEYS = [];
function normalizeDef(def) {
  const keys = Object.keys(def.shape);
  const ownSymbols = Object.getOwnPropertySymbols(def.shape);
  const symbolKeys = ownSymbols.length ? ownSymbols : NO_SYMBOL_KEYS;
  const allKeys = symbolKeys.length ? [...keys, ...symbolKeys] : keys;
  for (const k of allKeys) {
    if (!def.shape?.[k]?._zod?.traits?.has("$ZodType")) {
      throw new Error(`Invalid element at key "${String(k)}": expected a Zod schema`);
    }
  }
  const okeys = optionalKeys(def.shape);
  return {
    ...def,
    allKeys,
    symbolKeys,
    // string-only: handleCatchall matches it against `for...in`, which never yields a symbol
    keySet: new Set(keys),
    numKeys: keys.length,
    optionalKeys: new Set(okeys)
  };
}
__name(normalizeDef, "normalizeDef");
function handleCatchall(proms, input, payload, ctx, def, inst, abortEarly) {
  const unrecognized = [];
  const keySet = def.keySet;
  const _catchall = def.catchall._zod;
  const t = _catchall.def.type;
  const optin = _catchall.optin;
  const optout = _catchall.optout;
  let seen = 0;
  for (const key in input) {
    if (abortEarly && payload.issues.length !== seen) {
      if (aborted(payload, seen))
        break;
      seen = payload.issues.length;
    }
    if (keySet.has(key))
      continue;
    if (key === "__proto__") {
      if (t === "never")
        unrecognized.push(key);
      continue;
    }
    if (t === "never") {
      unrecognized.push(key);
      continue;
    }
    const r = _catchall.run({ value: input[key], issues: [] }, ctx);
    if (r instanceof Promise) {
      proms.push(r.then((r2) => handlePropertyResult(r2, payload, key, input, optin, optout)));
    } else {
      handlePropertyResult(r, payload, key, input, optin, optout);
    }
  }
  if (unrecognized.length) {
    payload.issues.push({
      code: "unrecognized_keys",
      keys: unrecognized,
      input,
      inst,
      // Describes the shape of the input, not the validity of the parsed value, so it never aborts. The parse still fails; the schema's own checks just get to run first, and an enclosing intersection can reconcile the key against a sibling operand.
      continue: true
    });
  }
  if (!proms.length)
    return payload;
  return Promise.all(proms).then(() => {
    return payload;
  });
}
__name(handleCatchall, "handleCatchall");
var $ZodObject = /* @__PURE__ */ $constructor("$ZodObject", (inst, def) => {
  $ZodType.init(inst, def);
  const desc = Object.getOwnPropertyDescriptor(def, "shape");
  const sh = desc?.get ? desc.get.raw : def.shape ?? {};
  if (sh) {
    const get = /* @__PURE__ */ __name(() => {
      const newSh = { ...sh };
      Object.defineProperty(def, "shape", { value: newSh });
      get.raw = newSh;
      return newSh;
    }, "get");
    get.raw = sh;
    Object.defineProperty(def, "shape", { get });
  }
  const _normalized = cached(() => normalizeDef(def));
  defineLazyInternal(inst, "propValues", (zod) => {
    const shape = zod.def.shape;
    const propValues = {};
    for (const key in shape) {
      const field = shape[key]._zod;
      if (field.values) {
        if (!Object.prototype.hasOwnProperty.call(propValues, key)) {
          assignProp(propValues, key, /* @__PURE__ */ new Set());
        }
        for (const v of field.values)
          propValues[key].add(v);
        if (field.optin !== void 0)
          propValues[key].add(void 0);
      }
    }
    return propValues;
  });
  const isObject2 = isObject;
  const catchall = def.catchall;
  let value;
  const memo3 = globalConfig.memoizer;
  memo3?.attach(inst);
  inst._zod.parse = (payload, ctx) => {
    value ?? (value = _normalized.value);
    const input = payload.value;
    if (!isObject2(input)) {
      payload.issues.push({
        expected: "object",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    payload.value = memo3 ? memo3.alloc(inst, payload, {}, ctx) : {};
    const proms = [];
    const shape = value.shape;
    const abortEarly = ctx?.abortEarly;
    let seen = payload.issues.length;
    for (const key of value.allKeys) {
      if (abortEarly && payload.issues.length !== seen) {
        if (aborted(payload, seen))
          break;
        seen = payload.issues.length;
      }
      if (key === "__proto__")
        continue;
      const el = shape[key];
      const optin = el._zod.optin;
      const optout = el._zod.optout;
      const r = el._zod.run({ value: input[key], issues: [] }, ctx);
      if (r instanceof Promise) {
        proms.push(r.then((r2) => handlePropertyResult(r2, payload, key, input, optin, optout)));
      } else {
        handlePropertyResult(r, payload, key, input, optin, optout);
      }
    }
    if (!catchall) {
      return proms.length ? Promise.all(proms).then(() => payload) : payload;
    }
    return handleCatchall(proms, input, payload, ctx, _normalized.value, inst, abortEarly === true);
  };
});
var $ZodObjectJIT = /* @__PURE__ */ $constructor("$ZodObjectJIT", (inst, def) => {
  $ZodObject.init(inst, def);
  const superParse = inst._zod.parse;
  const _normalized = cached(() => normalizeDef(def));
  const memo3 = globalConfig.memoizer;
  const generateFastpass = /* @__PURE__ */ __name((shape) => {
    const normalized = _normalized.value;
    const syms = normalized.symbolKeys;
    const doc = new Doc(["payload", "ctx"], { shape, inst, memo: memo3, syms });
    const parseStr = /* @__PURE__ */ __name((k) => `shape[${k}]._zod.run({ value: input[${k}], issues: [] }, ctx)`, "parseStr");
    const prefixStr = /* @__PURE__ */ __name((id, k) => `
          let ${id}_ab = false;
          for (let i = 0; i < ${id}.issues.length; i++) {
            const iss = ${id}.issues[i];
            iss.path = iss.path ? [${k}, ...iss.path] : [${k}];
            payload.issues.push(iss);
            if (iss.continue !== true) ${id}_ab = true;
          }
          if (${id}_ab && ctx && ctx.abortEarly) {
            payload.value = newResult;
            return payload;
          }`, "prefixStr");
    doc.write(`const input = payload.value;`);
    const ids = /* @__PURE__ */ Object.create(null);
    let counter = 0;
    for (const key of normalized.allKeys) {
      ids[key] = `key_${counter++}`;
    }
    doc.write(memo3 ? `const newResult = memo.alloc(inst, payload, {}, ctx);` : `const newResult = {};`);
    for (const key of normalized.allKeys) {
      if (key === "__proto__")
        continue;
      const id = ids[key];
      const k = typeof key === "symbol" ? `syms[${syms.indexOf(key)}]` : esc(key);
      const isPresent = `${k} in input`;
      const schema = shape[key];
      const optin = schema?._zod?.optin;
      const isOptionalIn = optin !== void 0;
      const isOptionalOut = schema?._zod?.optout === "optional";
      doc.write(`const ${id} = ${parseStr(k)};`);
      if (isOptionalIn && isOptionalOut) {
        const assign = optin === "optional" ? `${id}_present` : `${id}.value !== undefined || ${id}_present`;
        doc.write(`
        const ${id}_present = ${isPresent};
        if (!${id}.issues.length || ${id}_present) {
          if (${id}.issues.length) {${prefixStr(id, k)}
          }

          if (${assign}) {
            newResult[${k}] = ${id}.value;
          }
        }

      `);
      } else if (!isOptionalIn) {
        doc.write(`
        const ${id}_present = ${isPresent};
        if (${id}.issues.length) {${prefixStr(id, k)}
        }
        if (!${id}_present && !${id}.issues.length) {
          payload.issues.push({
            code: "invalid_type",
            expected: "nonoptional",
            input: undefined,
            path: [${k}]
          });
          if (ctx && ctx.abortEarly) {
            payload.value = newResult;
            return payload;
          }
        }

        if (${id}_present) {
          newResult[${k}] = ${id}.value;
        }

      `);
      } else {
        doc.write(`
        if (${id}.issues.length) {${prefixStr(id, k)}
        }
      `);
        if (optin === "defaulted") {
          doc.write(`newResult[${k}] = ${id}.value;`);
        } else {
          doc.write(`
        if (${id}.value !== undefined || ${isPresent}) {
          newResult[${k}] = ${id}.value;
        }
      `);
        }
      }
    }
    doc.write(`payload.value = newResult;`);
    doc.write(`return payload;`);
    return doc.compile();
  }, "generateFastpass");
  let fastpass;
  const isObject2 = isObject;
  const jit = !globalConfig.jitless;
  const allowsEval2 = allowsEval;
  const fastEnabled = jit && allowsEval2.value;
  const catchall = def.catchall;
  let value;
  inst._zod.parse = (payload, ctx) => {
    value ?? (value = _normalized.value);
    const input = payload.value;
    if (!isObject2(input)) {
      payload.issues.push({
        expected: "object",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    if (jit && fastEnabled && ctx?.async === false && ctx.jitless !== true) {
      if (!fastpass)
        fastpass = generateFastpass(def.shape);
      payload = fastpass(payload, ctx);
      if (!catchall)
        return payload;
      return handleCatchall([], input, payload, ctx, value, inst, ctx?.abortEarly === true);
    }
    return superParse(payload, ctx);
  };
});
function handleUnionResults(results, final, inst, ctx) {
  for (const result of results) {
    if (result.issues.length === 0) {
      final.value = result.value;
      return final;
    }
  }
  const nonaborted = results.filter((r) => !aborted(r));
  if (nonaborted.length === 1) {
    final.value = nonaborted[0].value;
    return nonaborted[0];
  }
  final.issues.push({
    code: "invalid_union",
    input: final.value,
    inst,
    errors: results.map((result) => result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
  });
  return final;
}
__name(handleUnionResults, "handleUnionResults");
var $ZodUnion = /* @__PURE__ */ $constructor("$ZodUnion", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazyInternal(inst, "optin", (zod) => zod.def.options.some((o) => o._zod.optin === "defaulted") ? "defaulted" : zod.def.options.some((o) => o._zod.optin !== void 0) ? "optional" : void 0);
  defineLazyInternal(inst, "optout", (zod) => zod.def.options.some((o) => o._zod.optout === "optional") ? "optional" : void 0);
  defineLazyInternal(inst, "values", (zod) => {
    if (zod.def.options.every((o) => o._zod.values)) {
      return new Set(zod.def.options.flatMap((option) => Array.from(option._zod.values)));
    }
    return void 0;
  });
  defineLazyInternal(inst, "pattern", (zod) => {
    if (zod.def.options.every((o) => o._zod.pattern)) {
      const patterns = zod.def.options.map((o) => o._zod.pattern);
      return new RegExp(`^(${patterns.map((p) => cleanRegex(p.source)).join("|")})$`);
    }
    return void 0;
  });
  const first = def.options.length === 1 ? def.options[0]._zod.run : null;
  inst._zod.parse = (payload, ctx) => {
    if (first) {
      return first(payload, ctx);
    }
    let async = false;
    const results = [];
    for (const option of def.options) {
      const result = option._zod.run({
        value: payload.value,
        issues: []
      }, ctx);
      if (result instanceof Promise) {
        results.push(result);
        async = true;
      } else {
        if (result.issues.length === 0)
          return result;
        results.push(result);
      }
    }
    if (!async)
      return handleUnionResults(results, payload, inst, ctx);
    return Promise.all(results).then((results2) => {
      return handleUnionResults(results2, payload, inst, ctx);
    });
  };
});
function discriminatorMap(def) {
  const map = /* @__PURE__ */ new Map();
  for (const option of def.options) {
    const values = option._zod.propValues?.[def.discriminator];
    if (!values || values.size === 0)
      throw new Error(`Invalid discriminated union option at index "${def.options.indexOf(option)}"`);
    for (const value of values) {
      if (map.has(value)) {
        if (value !== void 0)
          throw new Error(`Duplicate discriminator value "${String(value)}"`);
        map.set(value, null);
      } else {
        map.set(value, option);
      }
    }
  }
  return map;
}
__name(discriminatorMap, "discriminatorMap");
var $ZodDiscriminatedUnion = /* @__PURE__ */ $constructor("$ZodDiscriminatedUnion", (inst, def) => {
  def.inclusive = false;
  $ZodUnion.init(inst, def);
  const _super = inst._zod.parse;
  defineLazyInternal(inst, "propValues", (zod) => {
    const propValues = {};
    let undefinedCount = 0;
    for (const option of zod.def.options) {
      const pv = option._zod.propValues;
      if (!pv || Object.keys(pv).length === 0)
        throw new Error(`Invalid discriminated union option at index "${zod.def.options.indexOf(option)}"`);
      if (pv[zod.def.discriminator]?.has(void 0))
        undefinedCount++;
      for (const [k, v] of Object.entries(pv)) {
        if (!Object.prototype.hasOwnProperty.call(propValues, k)) {
          assignProp(propValues, k, /* @__PURE__ */ new Set());
        }
        for (const val of v) {
          propValues[k].add(val);
        }
      }
    }
    if (!zod.def.unionFallback && undefinedCount > 1)
      propValues[zod.def.discriminator]?.delete(void 0);
    return propValues;
  });
  def.options.forEach((option, i) => {
    const propShape = rawShape(option._zod.def);
    if (propShape && !Object.prototype.hasOwnProperty.call(propShape, def.discriminator)) {
      throw new Error(`Invalid discriminated union option at index "${i}"`);
    }
  });
  const disc = cached(() => discriminatorMap(def));
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!isObject(input)) {
      payload.issues.push({
        code: "invalid_type",
        expected: "object",
        input,
        inst
      });
      return payload;
    }
    const value = input?.[def.discriminator];
    const opt = disc.value.get(value);
    if (opt && (value !== void 0 || ctx.direction !== "backward")) {
      return opt._zod.run(payload, ctx);
    }
    if (def.unionFallback || ctx.direction === "backward") {
      return _super(payload, ctx);
    }
    payload.issues.push({
      code: "invalid_union",
      errors: [],
      note: "No matching discriminator",
      discriminator: def.discriminator,
      options: Array.from(disc.value.keys()).filter((value2) => disc.value.get(value2) !== null),
      input,
      path: [def.discriminator],
      inst
    });
    return payload;
  };
});
var $ZodIntersection = /* @__PURE__ */ $constructor("$ZodIntersection", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    const left = def.left._zod.run({ value: input, issues: [] }, ctx);
    const right = def.right._zod.run({ value: input, issues: [] }, ctx);
    const async = left instanceof Promise || right instanceof Promise;
    if (async) {
      return Promise.all([left, right]).then(([left2, right2]) => {
        return handleIntersectionResults(payload, left2, right2);
      });
    }
    return handleIntersectionResults(payload, left, right);
  };
});
function mergeValues(a, b) {
  if (a === b) {
    return { valid: true, data: a };
  }
  if (a instanceof Date && b instanceof Date && +a === +b) {
    return { valid: true, data: a };
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const bKeys = Object.keys(b);
    const sharedKeys = Object.keys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    if (Object.prototype.hasOwnProperty.call(newObj, "__proto__"))
      delete newObj.__proto__;
    for (const key of sharedKeys) {
      if (key === "__proto__")
        continue;
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return {
          valid: false,
          mergeErrorPath: [key, ...sharedValue.mergeErrorPath]
        };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return { valid: false, mergeErrorPath: [] };
    }
    const newArray = [];
    for (let index = 0; index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return {
          valid: false,
          mergeErrorPath: [index, ...sharedValue.mergeErrorPath]
        };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  }
  return { valid: false, mergeErrorPath: [] };
}
__name(mergeValues, "mergeValues");
function handleIntersectionResults(result, left, right) {
  const unrecKeys = /* @__PURE__ */ new Map();
  let unrecIssue;
  const keyIssues = /* @__PURE__ */ new Map();
  const collect = /* @__PURE__ */ __name((iss, side) => {
    let keys;
    if (iss.code === "unrecognized_keys" && !iss.path?.length) {
      unrecIssue ?? (unrecIssue = iss);
      keys = iss.keys;
    } else if (iss.code === "invalid_key" && iss.origin === "record" && iss.path?.length === 1) {
      const k = String(iss.path[0]);
      if (!keyIssues.has(k))
        keyIssues.set(k, iss);
      keys = [k];
    } else {
      return false;
    }
    for (const k of keys) {
      if (!unrecKeys.has(k))
        unrecKeys.set(k, {});
      unrecKeys.get(k)[side] = true;
    }
    return true;
  }, "collect");
  for (const iss of left.issues) {
    if (!collect(iss, "l"))
      result.issues.push(iss);
  }
  for (const iss of right.issues) {
    if (!collect(iss, "r"))
      result.issues.push(iss);
  }
  const bothKeys = [...unrecKeys].filter(([, f]) => f.l && f.r).map(([k]) => k);
  if (bothKeys.length) {
    const aggregated = unrecIssue ? bothKeys.filter((k) => unrecIssue.keys.includes(k)) : [];
    if (aggregated.length)
      result.issues.push({ ...unrecIssue, keys: aggregated });
    for (const k of bothKeys) {
      if (!aggregated.includes(k) && keyIssues.has(k))
        result.issues.push(keyIssues.get(k));
    }
  }
  const merged = mergeValues(left.value, right.value);
  if (!merged.valid) {
    if (aborted(result))
      return result;
    throw new Error(`Unmergable intersection. Error path: ${JSON.stringify(merged.mergeErrorPath)}`);
  }
  result.value = merged.data;
  return result;
}
__name(handleIntersectionResults, "handleIntersectionResults");
var $ZodRecord = /* @__PURE__ */ $constructor("$ZodRecord", (inst, def) => {
  $ZodType.init(inst, def);
  const memo3 = globalConfig.memoizer;
  memo3?.attach(inst);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!isPlainObject(input)) {
      payload.issues.push({
        expected: "record",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    const proms = [];
    const values = def.keyType._zod.values;
    if (values && !def.partial) {
      payload.value = memo3 ? memo3.alloc(inst, payload, {}, ctx) : {};
      const recordKeys = /* @__PURE__ */ new Set();
      for (const key of values) {
        if (typeof key === "string" || typeof key === "number" || typeof key === "symbol") {
          recordKeys.add(typeof key === "number" ? key.toString() : key);
          if (key === "__proto__")
            continue;
          const keyResult = def.keyType._zod.run({ value: key, issues: [] }, ctx);
          if (keyResult instanceof Promise) {
            throw new Error("Async schemas not supported in object keys currently");
          }
          if (keyResult.issues.length) {
            payload.issues.push({
              code: "invalid_key",
              origin: "record",
              issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config())),
              input: key,
              path: [key],
              inst
            });
            continue;
          }
          const outKey = keyResult.value;
          if (outKey === "__proto__")
            continue;
          const result = def.valueType._zod.run({ value: input[key], issues: [] }, ctx);
          if (result instanceof Promise) {
            proms.push(result.then((result2) => {
              if (result2.issues.length) {
                payload.issues.push(...prefixIssues(key, result2.issues));
              }
              payload.value[outKey] = result2.value;
            }));
          } else {
            if (result.issues.length) {
              payload.issues.push(...prefixIssues(key, result.issues));
            }
            payload.value[outKey] = result.value;
          }
        }
      }
      let unrecognized;
      for (const key in input) {
        if (!recordKeys.has(key)) {
          if (def.mode === "loose") {
            if (key === "__proto__")
              continue;
            payload.value[key] = input[key];
          } else {
            unrecognized = unrecognized ?? [];
            unrecognized.push(key);
          }
        }
      }
      if (unrecognized && unrecognized.length > 0) {
        payload.issues.push({
          code: "unrecognized_keys",
          input,
          inst,
          keys: unrecognized,
          continue: true
        });
      }
    } else {
      payload.value = memo3 ? memo3.alloc(inst, payload, {}, ctx) : {};
      let unrecognized;
      for (const key of Reflect.ownKeys(input)) {
        if (key === "__proto__")
          continue;
        if (!Object.prototype.propertyIsEnumerable.call(input, key))
          continue;
        let keyResult = def.keyType._zod.run({ value: key, issues: [] }, ctx);
        if (keyResult instanceof Promise) {
          throw new Error("Async schemas not supported in object keys currently");
        }
        const checkNumericKey = typeof key === "string" && number.test(key) && keyResult.issues.length;
        if (checkNumericKey) {
          const retryResult = def.keyType._zod.run({ value: Number(key), issues: [] }, ctx);
          if (retryResult instanceof Promise) {
            throw new Error("Async schemas not supported in object keys currently");
          }
          if (retryResult.issues.length === 0) {
            keyResult = retryResult;
          }
        }
        if (keyResult.issues.length) {
          if (def.mode === "loose") {
            payload.value[key] = input[key];
          } else if (values) {
            unrecognized = unrecognized ?? [];
            unrecognized.push(key);
          } else {
            payload.issues.push({
              code: "invalid_key",
              origin: "record",
              issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config())),
              input: key,
              path: [key],
              inst
            });
          }
          continue;
        }
        const outKey = keyResult.value;
        if (outKey === "__proto__")
          continue;
        const result = def.valueType._zod.run({ value: input[key], issues: [] }, ctx);
        if (result instanceof Promise) {
          proms.push(result.then((result2) => {
            if (result2.issues.length) {
              payload.issues.push(...prefixIssues(key, result2.issues));
            }
            payload.value[outKey] = result2.value;
          }));
        } else {
          if (result.issues.length) {
            payload.issues.push(...prefixIssues(key, result.issues));
          }
          payload.value[outKey] = result.value;
        }
      }
      if (unrecognized && unrecognized.length > 0) {
        payload.issues.push({
          code: "unrecognized_keys",
          input,
          inst,
          keys: unrecognized,
          continue: true
        });
      }
    }
    if (proms.length) {
      return Promise.all(proms).then(() => payload);
    }
    return payload;
  };
});
var $ZodEnum = /* @__PURE__ */ $constructor("$ZodEnum", (inst, def) => {
  $ZodType.init(inst, def);
  const values = getEnumValues(def.entries);
  const valuesSet = new Set(values);
  inst._zod.values = valuesSet;
  defineLazyInternal(inst, "pattern", (zod) => {
    const patternValues = getEnumValues(zod.def.entries).filter((k) => propertyKeyTypes.has(typeof k));
    return new RegExp(patternValues.length ? `^(${patternValues.map((o) => escapeRegex(o.toString())).join("|")})$` : "^[^\\s\\S]$");
  });
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (valuesSet.has(input)) {
      return payload;
    }
    payload.issues.push({
      code: "invalid_value",
      values,
      input,
      inst
    });
    return payload;
  };
});
var $ZodLiteral = /* @__PURE__ */ $constructor("$ZodLiteral", (inst, def) => {
  $ZodType.init(inst, def);
  const values = new Set(def.values);
  inst._zod.values = values;
  defineLazyInternal(inst, "pattern", (zod) => {
    const vals = zod.def.values;
    return new RegExp(vals.length ? `^(${vals.map((o) => typeof o === "string" ? escapeRegex(o) : o ? escapeRegex(o.toString()) : String(o)).join("|")})$` : "^[^\\s\\S]$");
  });
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (values.has(input)) {
      return payload;
    }
    payload.issues.push({
      code: "invalid_value",
      values: def.values,
      input,
      inst
    });
    return payload;
  };
});
var $ZodTransform = /* @__PURE__ */ $constructor("$ZodTransform", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "optional";
  globalConfig.memoizer?.guard(inst);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      throw new $ZodEncodeError(inst.constructor.name);
    }
    const _out = def.transform(payload.value, payload);
    if (ctx.async) {
      const output = _out instanceof Promise ? _out : Promise.resolve(_out);
      return output.then((output2) => {
        payload.value = output2;
        return payload;
      });
    }
    if (_out instanceof Promise) {
      throw new $ZodAsyncError();
    }
    payload.value = _out;
    return payload;
  };
});
function handleOptionalResult(payload, result) {
  payload.value = result.issues.length ? void 0 : result.value;
  return payload;
}
__name(handleOptionalResult, "handleOptionalResult");
var $ZodOptional = /* @__PURE__ */ $constructor("$ZodOptional", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazyInternal(inst, "optin", (zod) => zod.def.innerType._zod.optin === "defaulted" ? "defaulted" : "optional");
  inst._zod.optout = "optional";
  defineLazyInternal(inst, "values", (zod) => {
    const values = zod.def.innerType._zod.values;
    return values ? /* @__PURE__ */ new Set([...values, void 0]) : void 0;
  });
  defineLazyInternal(inst, "pattern", (zod) => {
    const pattern = zod.def.innerType._zod.pattern;
    return pattern ? new RegExp(`^(${cleanRegex(pattern.source)})?$`) : void 0;
  });
  inst._zod.parse = (payload, ctx) => {
    if (payload.value === void 0) {
      if (def.innerType._zod.optin !== "defaulted")
        return payload;
      const result = def.innerType._zod.run({ value: payload.value, issues: [] }, ctx);
      if (result instanceof Promise)
        return result.then((result2) => handleOptionalResult(payload, result2));
      return handleOptionalResult(payload, result);
    }
    return def.innerType._zod.run(payload, ctx);
  };
});
var $ZodExactOptional = /* @__PURE__ */ $constructor("$ZodExactOptional", (inst, def) => {
  $ZodOptional.init(inst, def);
  defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
  defineLazyInternal(inst, "pattern", (zod) => zod.def.innerType._zod.pattern);
  inst._zod.parse = (payload, ctx) => {
    return def.innerType._zod.run(payload, ctx);
  };
});
var $ZodNullable = /* @__PURE__ */ $constructor("$ZodNullable", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazyInternal(inst, "optin", (zod) => zod.def.innerType._zod.optin);
  defineLazyInternal(inst, "optout", (zod) => zod.def.innerType._zod.optout);
  defineLazyInternal(inst, "pattern", (zod) => {
    const pattern = zod.def.innerType._zod.pattern;
    return pattern ? new RegExp(`^(${cleanRegex(pattern.source)}|null)$`) : void 0;
  });
  defineLazyInternal(inst, "values", (zod) => {
    return zod.def.innerType._zod.values ? /* @__PURE__ */ new Set([...zod.def.innerType._zod.values, null]) : void 0;
  });
  inst._zod.parse = (payload, ctx) => {
    if (payload.value === null)
      return payload;
    return def.innerType._zod.run(payload, ctx);
  };
});
var $ZodDefault = /* @__PURE__ */ $constructor("$ZodDefault", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "defaulted";
  defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    if (payload.value === void 0) {
      payload.value = def.defaultValue;
      return payload;
    }
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then((result2) => handleDefaultResult(result2, def));
    }
    return handleDefaultResult(result, def);
  };
});
function handleDefaultResult(payload, def) {
  if (payload.value === void 0) {
    payload.value = def.defaultValue;
  }
  return payload;
}
__name(handleDefaultResult, "handleDefaultResult");
var $ZodPrefault = /* @__PURE__ */ $constructor("$ZodPrefault", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "defaulted";
  defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    if (payload.value === void 0) {
      payload.value = def.defaultValue;
    }
    return def.innerType._zod.run(payload, ctx);
  };
});
var $ZodNonOptional = /* @__PURE__ */ $constructor("$ZodNonOptional", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazyInternal(inst, "values", (zod) => {
    const v = zod.def.innerType._zod.values;
    return v ? new Set([...v].filter((x) => x !== void 0)) : void 0;
  });
  inst._zod.parse = (payload, ctx) => {
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then((result2) => handleNonOptionalResult(result2, inst));
    }
    return handleNonOptionalResult(result, inst);
  };
});
function handleNonOptionalResult(payload, inst) {
  if (!payload.issues.length && payload.value === void 0) {
    payload.issues.push({
      code: "invalid_type",
      expected: "nonoptional",
      input: payload.value,
      inst
    });
  }
  return payload;
}
__name(handleNonOptionalResult, "handleNonOptionalResult");
function handleCatchResult(payload, result, def, ctx) {
  if (!result.issues.length) {
    payload.value = result.value;
    if (result.memo)
      payload.memo = true;
    return payload;
  }
  payload.value = def.catchValue({
    ...result,
    value: payload.value,
    error: {
      issues: result.issues.map((iss) => finalizeIssue(iss, ctx, config()))
    },
    input: payload.value
  });
  return payload;
}
__name(handleCatchResult, "handleCatchResult");
var $ZodCatch = /* @__PURE__ */ $constructor("$ZodCatch", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazyInternal(inst, "optin", (zod) => zod.def.innerType._zod.optin === "defaulted" ? "defaulted" : "optional");
  defineLazyInternal(inst, "optout", (zod) => zod.def.innerType._zod.optout);
  defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    const result = def.innerType._zod.run({ value: payload.value, issues: [] }, ctx);
    if (result instanceof Promise) {
      return result.then((result2) => handleCatchResult(payload, result2, def, ctx));
    }
    return handleCatchResult(payload, result, def, ctx);
  };
});
var $ZodPipe = /* @__PURE__ */ $constructor("$ZodPipe", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazyInternal(inst, "values", (zod) => zod.def.in._zod.values);
  defineLazyInternal(inst, "optin", (zod) => zod.def.in._zod.optin);
  defineLazyInternal(inst, "optout", (zod) => zod.def.out._zod.optout);
  defineLazyInternal(inst, "propValues", (zod) => zod.def.in._zod.propValues);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      const right = def.out._zod.run(payload, ctx);
      if (right instanceof Promise) {
        return right.then((right2) => handlePipeResult(right2, def.in, ctx));
      }
      return handlePipeResult(right, def.in, ctx);
    }
    const left = def.in._zod.run(payload, ctx);
    if (left instanceof Promise) {
      return left.then((left2) => handlePipeResult(left2, def.out, ctx));
    }
    return handlePipeResult(left, def.out, ctx);
  };
});
function handlePipeResult(left, next, ctx) {
  if (left.issues.some((iss) => iss.code !== "unrecognized_keys")) {
    left.aborted = true;
    return left;
  }
  return next._zod.run({ value: left.value, issues: left.issues }, ctx);
}
__name(handlePipeResult, "handlePipeResult");
var $ZodPreprocess = /* @__PURE__ */ $constructor("$ZodPreprocess", (inst, def) => {
  $ZodPipe.init(inst, def);
});
var $ZodReadonly = /* @__PURE__ */ $constructor("$ZodReadonly", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazyInternal(inst, "propValues", (zod) => zod.def.innerType._zod.propValues);
  defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
  defineLazyInternal(inst, "optin", (zod) => zod.def.innerType?._zod?.optin);
  defineLazyInternal(inst, "optout", (zod) => zod.def.innerType?._zod?.optout);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then(handleReadonlyResult);
    }
    return handleReadonlyResult(result);
  };
});
function handleReadonlyResult(payload) {
  if (!payload.memo)
    payload.value = Object.freeze(payload.value);
  return payload;
}
__name(handleReadonlyResult, "handleReadonlyResult");
var $ZodLazy = /* @__PURE__ */ $constructor("$ZodLazy", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "innerType", () => {
    const d = def;
    if (!d._cachedInner)
      d._cachedInner = def.getter();
    return d._cachedInner;
  });
  defineLazyInternal(inst, "pattern", (zod) => zod.innerType?._zod?.pattern);
  defineLazyInternal(inst, "propValues", (zod) => zod.innerType?._zod?.propValues);
  defineLazyInternal(inst, "optin", (zod) => zod.innerType?._zod?.optin ?? void 0);
  defineLazyInternal(inst, "optout", (zod) => zod.innerType?._zod?.optout ?? void 0);
  inst._zod.parse = (payload, ctx) => {
    const inner = inst._zod.innerType;
    return inner._zod.run(payload, ctx);
  };
});
var $ZodCustom = /* @__PURE__ */ $constructor("$ZodCustom", (inst, def) => {
  $ZodCheck.init(inst, def);
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _) => {
    return payload;
  };
  inst._zod.check = (payload) => {
    const input = payload.value;
    const r = def.fn(input);
    if (r instanceof Promise) {
      return r.then((r2) => handleRefineResult(r2, payload, input, inst));
    }
    handleRefineResult(r, payload, input, inst);
    return;
  };
});
function handleRefineResult(result, payload, input, inst) {
  if (!result) {
    const _iss = {
      code: "custom",
      input,
      inst,
      // incorporates params.error into issue reporting
      path: [...inst._zod.def.path ?? []],
      // incorporates params.error into issue reporting
      continue: !inst._zod.def.abort
      // params: inst._zod.def.params,
    };
    if (inst._zod.def.params)
      _iss.params = inst._zod.def.params;
    payload.issues.push(issue(_iss));
  }
}
__name(handleRefineResult, "handleRefineResult");

// ../../node_modules/zod/v4/core/memoizer.js
var $ZodCyclicError = class extends Error {
  static {
    __name(this, "$ZodCyclicError");
  }
  constructor() {
    super(`Cannot parse a reference cycle that closes through a transform`);
    this.name = "ZodCyclicError";
  }
};
var STATE = "~memo";
var NO_ISSUES = [];
function isRef(value) {
  return value !== null && typeof value === "object";
}
__name(isRef, "isRef");
function cloneIssues(issues) {
  return issues.map((iss) => iss.path ? { ...iss, path: iss.path.slice() } : { ...iss });
}
__name(cloneIssues, "cloneIssues");
var recursive = /* @__PURE__ */ new WeakMap();
var NONE = 0;
var ASSUMED = 1;
var PROVEN = 2;
function isRecursive(inst, stack, resolve) {
  const cached2 = recursive.get(inst);
  if (cached2 !== void 0)
    return cached2 ? PROVEN : NONE;
  if (stack.has(inst))
    return PROVEN;
  stack.add(inst);
  let result = NONE;
  const check = /* @__PURE__ */ __name((child) => {
    if (result !== PROVEN && child?._zod) {
      const answer = isRecursive(child, stack, resolve);
      if (answer > result)
        result = answer;
    }
  }, "check");
  const shape = /* @__PURE__ */ __name((sh, spread) => {
    let answer = NONE;
    for (const key of Reflect.ownKeys(sh)) {
      const desc = Object.getOwnPropertyDescriptor(sh, key);
      if (spread && !desc.enumerable)
        continue;
      const child = desc.get ? ASSUMED : desc.value?._zod ? isRecursive(desc.value, stack, resolve) : NONE;
      if (child > answer)
        answer = child;
    }
    return answer;
  }, "shape");
  const merge2 = /* @__PURE__ */ __name((answer) => {
    if (answer > result)
      result = answer;
  }, "merge");
  const def = inst._zod.def;
  const kind = def.type;
  switch (kind) {
    case "object": {
      const raw = rawShape(def);
      merge2(raw ? shape(raw, true) : ASSUMED);
      check(def.catchall);
      break;
    }
    case "array":
      check(def.element);
      break;
    case "tuple":
      for (const el of def.items)
        check(el);
      check(def.rest);
      break;
    case "record":
    case "map":
      check(def.keyType);
      check(def.valueType);
      break;
    case "set":
      check(def.valueType);
      break;
    case "union":
      for (const el of def.options)
        check(el);
      break;
    case "intersection":
      check(def.left);
      check(def.right);
      break;
    case "optional":
    case "nullable":
    case "default":
    case "prefault":
    case "catch":
    case "readonly":
    case "nonoptional":
    case "promise":
    case "success":
      check(def.innerType);
      break;
    case "pipe":
      check(def.in);
      check(def.out);
      break;
    case "function":
      check(def.input);
      check(def.output);
      break;
    // `$ZodLazy` caches its inner on the def, so a resolved edge is followed exactly
    case "lazy": {
      const inner = def._cachedInner ?? (resolve ? inst._zod.innerType : void 0);
      merge2(inner ? isRecursive(inner, stack, false) : ASSUMED);
      break;
    }
    // a leaf by choice: `parts` are regex fragments, not data positions
    case "template_literal":
    // leaves
    case "string":
    case "number":
    case "int":
    case "boolean":
    case "bigint":
    case "symbol":
    case "undefined":
    case "null":
    case "void":
    case "never":
    case "any":
    case "unknown":
    case "date":
    case "nan":
    case "enum":
    case "literal":
    case "file":
    case "transform":
    case "custom":
      break;
    default: {
      kind;
      for (const key in def) {
        const desc = Object.getOwnPropertyDescriptor(def, key);
        if (!desc || desc.get)
          continue;
        const value = desc.value;
        if (!value || typeof value !== "object")
          continue;
        if (value._zod)
          check(value);
        else if (Array.isArray(value))
          for (const el of value)
            check(el);
      }
    }
  }
  stack.delete(inst);
  return settle(inst, result);
}
__name(isRecursive, "isRecursive");
function settle(inst, answer) {
  if (answer !== ASSUMED)
    recursive.set(inst, answer === PROVEN);
  return answer;
}
__name(settle, "settle");
function bucketFor(state, inst) {
  let bucket = state.buckets.get(inst);
  if (!bucket) {
    bucket = /* @__PURE__ */ new WeakMap();
    state.buckets.set(inst, bucket);
  }
  return bucket;
}
__name(bucketFor, "bucketFor");
var handoff;
var open = [];
var memo = {
  alloc(_inst, payload, empty) {
    const bucket = handoff;
    if (!bucket)
      return empty;
    handoff = void 0;
    const entry = { value: empty, issues: null };
    bucket.set(payload.value, entry);
    open.push(entry);
    return empty;
  },
  guard(inst) {
    var _a3;
    (_a3 = inst._zod).deferred ?? (_a3.deferred = []);
    inst._zod.deferred.push(() => {
      const base = inst._zod.parse;
      const wrapped = /* @__PURE__ */ __name((payload, ctx) => {
        if (ctx.direction !== "backward" && isBackEdge(ctx, payload.value))
          throw new $ZodCyclicError();
        return base(payload, ctx);
      }, "wrapped");
      inst._zod.parse = wrapped;
      if (inst._zod.run === base)
        inst._zod.run = wrapped;
    });
  },
  attach(inst) {
    var _a3;
    let isRecursiveInst;
    let rechecked = false;
    let lastCtx;
    let lastBucket;
    (_a3 = inst._zod).deferred ?? (_a3.deferred = []);
    inst._zod.deferred.push(() => {
      const base = inst._zod.parse;
      const wrapped = /* @__PURE__ */ __name((payload, ctx) => {
        if (isRecursiveInst === void 0) {
          const walked = isRecursive(inst, /* @__PURE__ */ new Set(), false);
          if (walked === NONE) {
            inst._zod.parse = base;
            if (inst._zod.run === wrapped)
              inst._zod.run = base;
            return base(payload, ctx);
          }
          if (walked === PROVEN || rechecked)
            isRecursiveInst = true;
          else
            rechecked = true;
        }
        const input = payload.value;
        if (!isRef(input))
          return base(payload, ctx);
        let state = ctx[STATE];
        if (!state) {
          state = { buckets: /* @__PURE__ */ new WeakMap(), backEdges: void 0 };
          ctx[STATE] = state;
        }
        let bucket;
        if (lastCtx === ctx) {
          bucket = lastBucket;
        } else {
          bucket = bucketFor(state, inst);
          lastCtx = ctx;
          lastBucket = bucket;
        }
        const hit = bucket.get(input);
        if (hit) {
          payload.value = hit.value;
          if (hit.issues) {
            if (hit.issues.length)
              payload.issues.push(...cloneIssues(hit.issues));
          } else {
            payload.memo = true;
            state.backEdges ?? (state.backEdges = /* @__PURE__ */ new WeakSet());
            state.backEdges.add(hit.value);
          }
          return payload;
        }
        handoff = bucket;
        const depth = open.length;
        const result = base(payload, ctx);
        handoff = void 0;
        const entry = open.length > depth ? open.pop() : void 0;
        if (result instanceof Promise) {
          return result.then((r) => {
            if (entry)
              entry.issues = r.issues.length ? cloneIssues(r.issues) : NO_ISSUES;
            return r;
          });
        }
        if (entry)
          entry.issues = result.issues.length ? cloneIssues(result.issues) : NO_ISSUES;
        return result;
      }, "wrapped");
      inst._zod.parse = wrapped;
      if (inst._zod.run === base)
        inst._zod.run = wrapped;
    });
  }
};
function memoizer() {
  return memo;
}
__name(memoizer, "memoizer");
function isBackEdge(ctx, value) {
  const backEdges = ctx[STATE]?.backEdges;
  return backEdges !== void 0 && isRef(value) && backEdges.has(value);
}
__name(isBackEdge, "isBackEdge");

// ../../node_modules/zod/v4/locales/en.js
var error = /* @__PURE__ */ __name(() => {
  const Sizable = {
    string: { unit: "characters", verb: "to have" },
    file: { unit: "bytes", verb: "to have" },
    array: { unit: "items", verb: "to have" },
    set: { unit: "items", verb: "to have" },
    map: { unit: "entries", verb: "to have" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  __name(getSizing, "getSizing");
  const FormatDictionary = {
    regex: "input",
    email: "email address",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO datetime",
    date: "ISO date",
    time: "ISO time",
    duration: "ISO duration",
    ipv4: "IPv4 address",
    ipv6: "IPv6 address",
    mac: "MAC address",
    cidrv4: "IPv4 range",
    cidrv6: "IPv6 range",
    base64: "base64-encoded string",
    base64url: "base64url-encoded string",
    json_string: "JSON string",
    e164: "E.164 number",
    currency_code: "currency code",
    credit_card: "credit card number",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "input"
  };
  const TypeDictionary = {
    // Compatibility: "nan" -> "NaN" for display
    nan: "NaN"
    // All other type names omitted - they fall back to raw values via ?? operator
  };
  function getTypeName(type, input) {
    if (type === "number" && typeof input === "number" && !Number.isFinite(input)) {
      return String(input);
    }
    return TypeDictionary[type] ?? type;
  }
  __name(getTypeName, "getTypeName");
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = getTypeName(issue2.expected);
        const receivedType = parsedType(issue2.input);
        const received = getTypeName(receivedType, issue2.input);
        return `Invalid input: expected ${expected}, received ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Invalid input: expected ${stringifyPrimitive(issue2.values[0])}`;
        return `Invalid option: expected one of ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.exact ? "exactly " : issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `Too big: expected ${issue2.origin ?? "value"} to have ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elements"}`;
        return `Too big: expected ${issue2.origin ?? "value"} to be ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.exact ? "exactly " : issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Too small: expected ${issue2.origin} to have ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `Too small: expected ${issue2.origin} to be ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `Invalid string: must start with "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with")
          return `Invalid string: must end with "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `Invalid string: must include "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `Invalid string: must match pattern ${_issue.pattern}`;
        return `Invalid ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `Invalid number: must be a multiple of ${issue2.divisor}`;
      case "unrecognized_keys":
        return `Unrecognized key${issue2.keys.length > 1 ? "s" : ""}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `Invalid key in ${issue2.origin}`;
      case "invalid_union":
        if (issue2.options && Array.isArray(issue2.options) && issue2.options.length > 0) {
          const opts = issue2.options.map((o) => `'${o}'`).join(" | ");
          return `Invalid discriminator value. Expected ${opts}`;
        }
        if (issue2.inclusive === false) {
          return "Invalid input: more than one option matched";
        }
        return "Invalid input";
      case "invalid_element":
        return `Invalid value in ${issue2.origin}`;
      default:
        return `Invalid input`;
    }
  };
}, "error");
function en_default() {
  return {
    localeError: error()
  };
}
__name(en_default, "default");

// ../../node_modules/zod/v4/core/registries.js
var _a2;
var $ZodRegistry = class {
  static {
    __name(this, "$ZodRegistry");
  }
  constructor() {
    this._map = /* @__PURE__ */ new WeakMap();
    this._idmap = /* @__PURE__ */ new Map();
  }
  add(schema, ..._meta) {
    const meta2 = _meta[0];
    this._map.set(schema, meta2);
    if (meta2 && typeof meta2 === "object" && "id" in meta2) {
      this._idmap.set(meta2.id, schema);
    }
    return this;
  }
  clear() {
    this._map = /* @__PURE__ */ new WeakMap();
    this._idmap = /* @__PURE__ */ new Map();
    return this;
  }
  remove(schema) {
    const meta2 = this._map.get(schema);
    if (meta2 && typeof meta2 === "object" && "id" in meta2) {
      this._idmap.delete(meta2.id);
    }
    this._map.delete(schema);
    return this;
  }
  get(schema) {
    const p = schema._zod.parent;
    if (p) {
      const pm = { ...this.get(p) ?? {} };
      delete pm.id;
      const f = { ...pm, ...this._map.get(schema) };
      return Object.keys(f).length ? f : void 0;
    }
    return this._map.get(schema);
  }
  has(schema) {
    return this._map.has(schema);
  }
};
function registry() {
  return new $ZodRegistry();
}
__name(registry, "registry");
(_a2 = globalThis).__zod_globalRegistry ?? (_a2.__zod_globalRegistry = registry());
var globalRegistry = globalThis.__zod_globalRegistry;

// ../../node_modules/zod/v4/core/api.js
function snapshotChecks(def) {
  if (def.checks)
    def.checks = [...def.checks];
  return def;
}
__name(snapshotChecks, "snapshotChecks");
// @__NO_SIDE_EFFECTS__
function _string(Class2, params) {
  return new Class2(snapshotChecks({ type: "string", ...normalizeParams(params) }));
}
__name(_string, "_string");
// @__NO_SIDE_EFFECTS__
function _coercedString(Class2, params) {
  return new Class2(snapshotChecks({ type: "string", coerce: true, ...normalizeParams(params) }));
}
__name(_coercedString, "_coercedString");
// @__NO_SIDE_EFFECTS__
function _email(Class2, params) {
  return new Class2({
    type: "string",
    format: "email",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
__name(_email, "_email");
// @__NO_SIDE_EFFECTS__
function _guid(Class2, params) {
  return new Class2({
    type: "string",
    format: "guid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
__name(_guid, "_guid");
// @__NO_SIDE_EFFECTS__
function _uuid(Class2, params) {
  return new Class2({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
__name(_uuid, "_uuid");
// @__NO_SIDE_EFFECTS__
function _uuidv4(Class2, params) {
  return new Class2({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v4",
    ...normalizeParams(params)
  });
}
__name(_uuidv4, "_uuidv4");
// @__NO_SIDE_EFFECTS__
function _uuidv6(Class2, params) {
  return new Class2({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v6",
    ...normalizeParams(params)
  });
}
__name(_uuidv6, "_uuidv6");
// @__NO_SIDE_EFFECTS__
function _uuidv7(Class2, params) {
  return new Class2({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v7",
    ...normalizeParams(params)
  });
}
__name(_uuidv7, "_uuidv7");
// @__NO_SIDE_EFFECTS__
function _url(Class2, params) {
  return new Class2({
    type: "string",
    format: "url",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
__name(_url, "_url");
// @__NO_SIDE_EFFECTS__
function _emoji2(Class2, params) {
  return new Class2({
    type: "string",
    format: "emoji",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
__name(_emoji2, "_emoji");
// @__NO_SIDE_EFFECTS__
function _nanoid(Class2, params) {
  return new Class2({
    type: "string",
    format: "nanoid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
__name(_nanoid, "_nanoid");
// @__NO_SIDE_EFFECTS__
function _cuid(Class2, params) {
  return new Class2({
    type: "string",
    format: "cuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
__name(_cuid, "_cuid");
// @__NO_SIDE_EFFECTS__
function _cuid2(Class2, params) {
  return new Class2({
    type: "string",
    format: "cuid2",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
__name(_cuid2, "_cuid2");
// @__NO_SIDE_EFFECTS__
function _ulid(Class2, params) {
  return new Class2({
    type: "string",
    format: "ulid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
__name(_ulid, "_ulid");
// @__NO_SIDE_EFFECTS__
function _xid(Class2, params) {
  return new Class2({
    type: "string",
    format: "xid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
__name(_xid, "_xid");
// @__NO_SIDE_EFFECTS__
function _ksuid(Class2, params) {
  return new Class2({
    type: "string",
    format: "ksuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
__name(_ksuid, "_ksuid");
// @__NO_SIDE_EFFECTS__
function _ipv4(Class2, params) {
  return new Class2({
    type: "string",
    format: "ipv4",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
__name(_ipv4, "_ipv4");
// @__NO_SIDE_EFFECTS__
function _ipv6(Class2, params) {
  return new Class2({
    type: "string",
    format: "ipv6",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
__name(_ipv6, "_ipv6");
// @__NO_SIDE_EFFECTS__
function _cidrv4(Class2, params) {
  return new Class2({
    type: "string",
    format: "cidrv4",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
__name(_cidrv4, "_cidrv4");
// @__NO_SIDE_EFFECTS__
function _cidrv6(Class2, params) {
  return new Class2({
    type: "string",
    format: "cidrv6",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
__name(_cidrv6, "_cidrv6");
// @__NO_SIDE_EFFECTS__
function _base64(Class2, params) {
  return new Class2({
    type: "string",
    format: "base64",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
__name(_base64, "_base64");
// @__NO_SIDE_EFFECTS__
function _base64url(Class2, params) {
  return new Class2({
    type: "string",
    format: "base64url",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
__name(_base64url, "_base64url");
// @__NO_SIDE_EFFECTS__
function _e164(Class2, params) {
  return new Class2({
    type: "string",
    format: "e164",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
__name(_e164, "_e164");
// @__NO_SIDE_EFFECTS__
function _jwt(Class2, params) {
  return new Class2({
    type: "string",
    format: "jwt",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
__name(_jwt, "_jwt");
// @__NO_SIDE_EFFECTS__
function _isoDateTime(Class2, params) {
  return new Class2({
    type: "string",
    format: "datetime",
    check: "string_format",
    offset: false,
    local: false,
    precision: null,
    ...normalizeParams(params)
  });
}
__name(_isoDateTime, "_isoDateTime");
// @__NO_SIDE_EFFECTS__
function _isoDate(Class2, params) {
  return new Class2({
    type: "string",
    format: "date",
    check: "string_format",
    ...normalizeParams(params)
  });
}
__name(_isoDate, "_isoDate");
// @__NO_SIDE_EFFECTS__
function _isoTime(Class2, params) {
  return new Class2({
    type: "string",
    format: "time",
    check: "string_format",
    precision: null,
    ...normalizeParams(params)
  });
}
__name(_isoTime, "_isoTime");
// @__NO_SIDE_EFFECTS__
function _isoDuration(Class2, params) {
  return new Class2({
    type: "string",
    format: "duration",
    check: "string_format",
    ...normalizeParams(params)
  });
}
__name(_isoDuration, "_isoDuration");
// @__NO_SIDE_EFFECTS__
function _number(Class2, params) {
  return new Class2(snapshotChecks({ type: "number", checks: [], ...normalizeParams(params) }));
}
__name(_number, "_number");
// @__NO_SIDE_EFFECTS__
function _coercedNumber(Class2, params) {
  return new Class2(snapshotChecks({ type: "number", coerce: true, checks: [], ...normalizeParams(params) }));
}
__name(_coercedNumber, "_coercedNumber");
// @__NO_SIDE_EFFECTS__
function _int(Class2, params) {
  return new Class2({
    type: "number",
    check: "number_format",
    abort: false,
    format: "safeint",
    ...normalizeParams(params)
  });
}
__name(_int, "_int");
// @__NO_SIDE_EFFECTS__
function _boolean(Class2, params) {
  return new Class2({
    type: "boolean",
    ...normalizeParams(params)
  });
}
__name(_boolean, "_boolean");
// @__NO_SIDE_EFFECTS__
function _coercedBoolean(Class2, params) {
  return new Class2({
    type: "boolean",
    coerce: true,
    ...normalizeParams(params)
  });
}
__name(_coercedBoolean, "_coercedBoolean");
// @__NO_SIDE_EFFECTS__
function _coercedBigint(Class2, params) {
  return new Class2({
    type: "bigint",
    coerce: true,
    ...normalizeParams(params)
  });
}
__name(_coercedBigint, "_coercedBigint");
// @__NO_SIDE_EFFECTS__
function _null2(Class2, params) {
  return new Class2({
    type: "null",
    ...normalizeParams(params)
  });
}
__name(_null2, "_null");
// @__NO_SIDE_EFFECTS__
function _any(Class2) {
  return new Class2({
    type: "any"
  });
}
__name(_any, "_any");
// @__NO_SIDE_EFFECTS__
function _unknown(Class2) {
  return new Class2({
    type: "unknown"
  });
}
__name(_unknown, "_unknown");
// @__NO_SIDE_EFFECTS__
function _never(Class2, params) {
  return new Class2({
    type: "never",
    ...normalizeParams(params)
  });
}
__name(_never, "_never");
// @__NO_SIDE_EFFECTS__
function _coercedDate(Class2, params) {
  return new Class2({
    type: "date",
    coerce: true,
    ...normalizeParams(params)
  });
}
__name(_coercedDate, "_coercedDate");
// @__NO_SIDE_EFFECTS__
function _lt(value, params) {
  return new $ZodCheckLessThan({
    check: "less_than",
    ...normalizeParams(params),
    value,
    inclusive: false
  });
}
__name(_lt, "_lt");
// @__NO_SIDE_EFFECTS__
function _lte(value, params) {
  return new $ZodCheckLessThan({
    check: "less_than",
    ...normalizeParams(params),
    value,
    inclusive: true
  });
}
__name(_lte, "_lte");
// @__NO_SIDE_EFFECTS__
function _gt(value, params) {
  return new $ZodCheckGreaterThan({
    check: "greater_than",
    ...normalizeParams(params),
    value,
    inclusive: false
  });
}
__name(_gt, "_gt");
// @__NO_SIDE_EFFECTS__
function _gte(value, params) {
  return new $ZodCheckGreaterThan({
    check: "greater_than",
    ...normalizeParams(params),
    value,
    inclusive: true
  });
}
__name(_gte, "_gte");
// @__NO_SIDE_EFFECTS__
function _multipleOf(value, params) {
  return new $ZodCheckMultipleOf({
    check: "multiple_of",
    ...normalizeParams(params),
    value
  });
}
__name(_multipleOf, "_multipleOf");
// @__NO_SIDE_EFFECTS__
function _maxLength(maximum, params) {
  const ch = new $ZodCheckMaxLength({
    check: "max_length",
    ...normalizeParams(params),
    maximum
  });
  return ch;
}
__name(_maxLength, "_maxLength");
// @__NO_SIDE_EFFECTS__
function _minLength(minimum, params) {
  return new $ZodCheckMinLength({
    check: "min_length",
    ...normalizeParams(params),
    minimum
  });
}
__name(_minLength, "_minLength");
// @__NO_SIDE_EFFECTS__
function _length(length, params) {
  return new $ZodCheckLengthEquals({
    check: "length_equals",
    ...normalizeParams(params),
    length
  });
}
__name(_length, "_length");
// @__NO_SIDE_EFFECTS__
function _regex(pattern, params) {
  return new $ZodCheckRegex({
    check: "string_format",
    format: "regex",
    ...normalizeParams(params),
    pattern
  });
}
__name(_regex, "_regex");
// @__NO_SIDE_EFFECTS__
function _lowercase(params) {
  return new $ZodCheckLowerCase({
    check: "string_format",
    format: "lowercase",
    ...normalizeParams(params)
  });
}
__name(_lowercase, "_lowercase");
// @__NO_SIDE_EFFECTS__
function _uppercase(params) {
  return new $ZodCheckUpperCase({
    check: "string_format",
    format: "uppercase",
    ...normalizeParams(params)
  });
}
__name(_uppercase, "_uppercase");
// @__NO_SIDE_EFFECTS__
function _includes(includes, params) {
  return new $ZodCheckIncludes({
    check: "string_format",
    format: "includes",
    ...normalizeParams(params),
    includes
  });
}
__name(_includes, "_includes");
// @__NO_SIDE_EFFECTS__
function _startsWith(prefix, params) {
  return new $ZodCheckStartsWith({
    check: "string_format",
    format: "starts_with",
    ...normalizeParams(params),
    prefix
  });
}
__name(_startsWith, "_startsWith");
// @__NO_SIDE_EFFECTS__
function _endsWith(suffix, params) {
  return new $ZodCheckEndsWith({
    check: "string_format",
    format: "ends_with",
    ...normalizeParams(params),
    suffix
  });
}
__name(_endsWith, "_endsWith");
// @__NO_SIDE_EFFECTS__
function _overwrite(tx) {
  return new $ZodCheckOverwrite({
    check: "overwrite",
    tx
  });
}
__name(_overwrite, "_overwrite");
// @__NO_SIDE_EFFECTS__
function _normalize(form) {
  return /* @__PURE__ */ _overwrite((input) => input.normalize(form));
}
__name(_normalize, "_normalize");
// @__NO_SIDE_EFFECTS__
function _trim() {
  return /* @__PURE__ */ _overwrite((input) => input.trim());
}
__name(_trim, "_trim");
// @__NO_SIDE_EFFECTS__
function _toLowerCase() {
  return /* @__PURE__ */ _overwrite((input) => input.toLowerCase());
}
__name(_toLowerCase, "_toLowerCase");
// @__NO_SIDE_EFFECTS__
function _toUpperCase() {
  return /* @__PURE__ */ _overwrite((input) => input.toUpperCase());
}
__name(_toUpperCase, "_toUpperCase");
// @__NO_SIDE_EFFECTS__
function _slugify() {
  return /* @__PURE__ */ _overwrite((input) => slugify(input));
}
__name(_slugify, "_slugify");
// @__NO_SIDE_EFFECTS__
function _array(Class2, element, params) {
  return new Class2({
    type: "array",
    element,
    // get element() {
    //   return element;
    // },
    ...normalizeParams(params)
  });
}
__name(_array, "_array");
// @__NO_SIDE_EFFECTS__
function _refine(Class2, fn, _params) {
  const schema = new Class2({
    type: "custom",
    check: "custom",
    fn,
    ...normalizeParams(_params)
  });
  return schema;
}
__name(_refine, "_refine");
// @__NO_SIDE_EFFECTS__
function _superRefine(fn, params) {
  const ch = /* @__PURE__ */ _check((payload) => {
    payload.addIssue = (issue2) => {
      if (typeof issue2 === "string") {
        payload.issues.push(issue(issue2, payload.value, ch._zod.def));
      } else {
        const _issue = issue2;
        if (_issue.fatal)
          _issue.continue = false;
        _issue.code ?? (_issue.code = "custom");
        if (!("input" in _issue))
          _issue.input = payload.value;
        _issue.inst ?? (_issue.inst = ch);
        _issue.continue ?? (_issue.continue = !ch._zod.def.abort);
        payload.issues.push(issue(_issue));
      }
    };
    return fn(payload.value, payload);
  }, params);
  return ch;
}
__name(_superRefine, "_superRefine");
// @__NO_SIDE_EFFECTS__
function _check(fn, params) {
  const ch = new $ZodCheck({
    check: "custom",
    ...normalizeParams(params)
  });
  ch._zod.check = fn;
  return ch;
}
__name(_check, "_check");

// ../../node_modules/zod/v4/core/to-json-schema.js
function assignProps(target, ...sources) {
  for (const source of sources) {
    for (const key of Reflect.ownKeys(source)) {
      if (Object.prototype.propertyIsEnumerable.call(source, key)) {
        assignProp(target, key, source[key]);
      }
    }
  }
  return target;
}
__name(assignProps, "assignProps");
function initializeContext(params) {
  let target = params?.target ?? "draft-2020-12";
  if (target === "draft-4")
    target = "draft-04";
  if (target === "draft-7")
    target = "draft-07";
  return {
    processors: params.processors ?? {},
    metadataRegistry: params?.metadata ?? globalRegistry,
    target,
    unrepresentable: params?.unrepresentable ?? "throw",
    override: params?.override ?? (() => {
    }),
    io: params?.io ?? "output",
    counter: 0,
    seen: /* @__PURE__ */ new Map(),
    sharedDefsExtractedFor: void 0,
    sharedEmitDoneFor: void 0,
    cycles: params?.cycles ?? "ref",
    reused: params?.reused ?? "inline",
    intersections: [],
    deferred: [],
    external: params?.external ?? void 0
  };
}
__name(initializeContext, "initializeContext");
function handleUnrepresentable(schema, ctx, json, params, message) {
  const result = typeof ctx.unrepresentable === "function" ? ctx.unrepresentable({ zodSchema: schema, path: params.path, message }) : ctx.unrepresentable;
  if (result === "any")
    return false;
  if (result === void 0 || result === "throw")
    throw new Error(message);
  Object.assign(json, result);
  return true;
}
__name(handleUnrepresentable, "handleUnrepresentable");
function processSchema(schema, ctx, _params = { path: [], schemaPath: [] }) {
  var _a3;
  const def = schema._zod.def;
  const seen = ctx.seen.get(schema);
  if (seen) {
    seen.count++;
    const isCycle = _params.schemaPath.includes(schema);
    if (isCycle) {
      seen.cycle = _params.path;
    }
    return seen.schema;
  }
  const result = { schema: {}, count: 1, cycle: void 0, path: _params.path };
  ctx.seen.set(schema, result);
  ctx.sharedDefsExtractedFor = void 0;
  ctx.sharedEmitDoneFor = void 0;
  const overrideSchema = schema._zod.toJSONSchema?.();
  if (overrideSchema) {
    result.schema = overrideSchema;
  } else {
    const params = {
      ..._params,
      schemaPath: [..._params.schemaPath, schema],
      path: _params.path
    };
    if (schema._zod.processJSONSchema) {
      schema._zod.processJSONSchema(ctx, result.schema, params);
    } else {
      const _json = result.schema;
      const processor = ctx.processors[def.type];
      if (!processor) {
        throw new Error(`[toJSONSchema]: Non-representable type encountered: ${def.type}`);
      }
      processor(schema, ctx, _json, params);
    }
    const parent = schema._zod.parent;
    if (parent) {
      if (!result.ref)
        result.ref = parent;
      processSchema(parent, ctx, params);
      ctx.seen.get(parent).isParent = true;
    }
  }
  const meta2 = ctx.metadataRegistry.get(schema);
  if (meta2)
    assignProps(result.schema, meta2);
  if (ctx.io === "input" && isTransforming(schema)) {
    delete result.schema.examples;
    delete result.schema.default;
  }
  if (ctx.io === "input" && "_prefault" in result.schema)
    (_a3 = result.schema).default ?? (_a3.default = result.schema._prefault);
  delete result.schema._prefault;
  const _result = ctx.seen.get(schema);
  return _result.schema;
}
__name(processSchema, "processSchema");
function encodeJSONPointerSegment(segment) {
  return segment.replace(/~/g, "~0").replace(/\//g, "~1");
}
__name(encodeJSONPointerSegment, "encodeJSONPointerSegment");
function extractDefs(ctx, schema) {
  const root = ctx.seen.get(schema);
  if (!root)
    throw new Error("Unprocessed schema. This is a bug in Zod.");
  if (ctx.external && ctx.sharedDefsExtractedFor === ctx.external)
    return;
  const idToSchema = /* @__PURE__ */ new Map();
  for (const entry of ctx.seen.entries()) {
    const id = ctx.metadataRegistry.get(entry[0])?.id;
    if (id) {
      const existing = idToSchema.get(id);
      if (existing && existing !== entry[0]) {
        throw new Error(`Duplicate schema id "${id}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`);
      }
      idToSchema.set(id, entry[0]);
    }
  }
  const makeURI = /* @__PURE__ */ __name((entry) => {
    const defsSegment = ctx.target === "draft-2020-12" ? "$defs" : "definitions";
    if (ctx.external) {
      const externalId = ctx.external.registry.get(entry[0])?.id;
      const uriGenerator = ctx.external.uri ?? ((id2) => id2);
      if (externalId) {
        return { ref: uriGenerator(externalId) };
      }
      const id = entry[1].defId ?? entry[1].schema.id ?? `schema${ctx.counter++}`;
      entry[1].defId = id;
      return { defId: id, ref: `${uriGenerator("__shared")}#/${defsSegment}/${encodeJSONPointerSegment(id)}` };
    }
    const uriPrefix = `#`;
    const defUriPrefix = `${uriPrefix}/${defsSegment}/`;
    if (entry[1] === root && !entry[1].schema.id) {
      return { ref: uriPrefix };
    }
    const defId = entry[1].schema.id ?? `__schema${ctx.counter++}`;
    return { defId, ref: defUriPrefix + encodeJSONPointerSegment(defId) };
  }, "makeURI");
  const extractToDef = /* @__PURE__ */ __name((entry) => {
    if (entry[1].schema.$ref) {
      return;
    }
    const seen = entry[1];
    const { ref, defId } = makeURI(entry);
    seen.def = { ...seen.schema };
    if (defId)
      seen.defId = defId;
    const schema2 = seen.schema;
    for (const key in schema2) {
      delete schema2[key];
    }
    schema2.$ref = ref;
  }, "extractToDef");
  if (ctx.cycles === "throw") {
    for (const entry of ctx.seen.entries()) {
      const seen = entry[1];
      if (seen.cycle) {
        throw new Error(`Cycle detected: #/${seen.cycle?.join("/")}/<root>

Set the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.`);
      }
    }
  }
  for (const entry of ctx.seen.entries()) {
    const seen = entry[1];
    if (schema === entry[0]) {
      extractToDef(entry);
      continue;
    }
    if (ctx.external) {
      const ext = ctx.external.registry.get(entry[0])?.id;
      if (schema !== entry[0] && ext) {
        extractToDef(entry);
        continue;
      }
    }
    const id = ctx.metadataRegistry.get(entry[0])?.id;
    if (id) {
      extractToDef(entry);
      continue;
    }
    if (seen.cycle) {
      extractToDef(entry);
      continue;
    }
    if (seen.count > 1) {
      if (ctx.reused === "ref") {
        extractToDef(entry);
      }
    }
  }
  if (ctx.external)
    ctx.sharedDefsExtractedFor = ctx.external;
}
__name(extractDefs, "extractDefs");
function compactTypeUnion(schema) {
  const options = schema.anyOf;
  if (!Array.isArray(options) || options.length === 0 || schema.type !== void 0)
    return;
  const types = [];
  for (const option of options) {
    if (!option || typeof option !== "object")
      return;
    compactTypeUnion(option);
    const keys = Object.keys(option);
    if (keys.length !== 1 || keys[0] !== "type")
      return;
    const type = option.type;
    for (const member of Array.isArray(type) ? type : [type]) {
      if (typeof member !== "string")
        return;
      if (!types.includes(member))
        types.push(member);
    }
  }
  delete schema.anyOf;
  schema.type = types.length === 1 ? types[0] : types;
}
__name(compactTypeUnion, "compactTypeUnion");
var FOLDABLE_KEYS = /* @__PURE__ */ new Set(["type", "properties", "required", "additionalProperties"]);
var UNION_KEYS = ["oneOf", "anyOf"];
function undeclaredConstraint(member) {
  const extra = member.additionalProperties;
  if (extra === void 0 || extra === false || typeof extra !== "object" || extra === null)
    return null;
  return Object.keys(extra).length ? extra : null;
}
__name(undeclaredConstraint, "undeclaredConstraint");
function foldObjects(members2) {
  const objects = [];
  for (const member of members2) {
    if (typeof member !== "object" || member.type !== "object")
      return null;
    for (const key in member) {
      if (!FOLDABLE_KEYS.has(key))
        return null;
    }
    objects.push(member);
  }
  const properties = {};
  const required2 = /* @__PURE__ */ new Set();
  for (const object3 of objects) {
    for (const key in object3.properties) {
      if (Object.prototype.hasOwnProperty.call(properties, key))
        continue;
      const parts = [];
      for (const other of objects) {
        const part = other.properties?.[key] ?? undeclaredConstraint(other);
        if (part === null || part === void 0)
          continue;
        if (!parts.some((seen) => JSON.stringify(seen) === JSON.stringify(part)))
          parts.push(part);
      }
      const merged = parts.length === 1 ? parts[0] : foldObjects(parts) ?? { allOf: parts };
      assignProp(properties, key, merged);
    }
    for (const key of object3.required ?? [])
      required2.add(key);
  }
  const folded = { type: "object", properties };
  if (required2.size)
    folded.required = [...required2];
  if (objects.every((object3) => object3.additionalProperties === false)) {
    folded.additionalProperties = false;
  } else {
    const constraints = [];
    for (const object3 of objects) {
      const constraint = undeclaredConstraint(object3);
      if (constraint && !constraints.some((seen) => JSON.stringify(seen) === JSON.stringify(constraint)))
        constraints.push(constraint);
    }
    if (constraints.length === 1)
      folded.additionalProperties = constraints[0];
    else if (constraints.length > 1)
      folded.additionalProperties = { allOf: constraints };
  }
  return folded;
}
__name(foldObjects, "foldObjects");
function foldIntersection(json) {
  const allOf = json.allOf;
  if (!Array.isArray(allOf) || allOf.length < 2)
    return;
  for (const key of FOLDABLE_KEYS)
    if (key in json)
      return;
  const unions = allOf.filter((m) => UNION_KEYS.some((k) => Array.isArray(m[k])));
  let folded = null;
  if (!unions.length) {
    folded = foldObjects(allOf);
  } else {
    const union2 = unions[0];
    const keyword = UNION_KEYS.find((k) => Array.isArray(union2[k]));
    if (Object.keys(union2).length !== 1)
      return;
    const rest = allOf.filter((m) => m !== union2);
    const branches = union2[keyword].map((branch) => foldObjects([...rest, branch]));
    if (branches.some((b) => !b))
      return;
    folded = { [keyword]: branches };
  }
  if (!folded)
    return;
  delete json.allOf;
  assignProps(json, folded);
}
__name(foldIntersection, "foldIntersection");
function finalize(ctx, schema) {
  const root = ctx.seen.get(schema);
  if (!root)
    throw new Error("Unprocessed schema. This is a bug in Zod.");
  const flattenRef = /* @__PURE__ */ __name((zodSchema) => {
    const seen = ctx.seen.get(zodSchema);
    if (seen.ref === null)
      return;
    const schema2 = seen.def ?? seen.schema;
    const _cached = { ...schema2 };
    const ref = seen.ref;
    seen.ref = null;
    if (ref) {
      flattenRef(ref);
      const refSeen = ctx.seen.get(ref);
      const refSchema = refSeen.schema;
      if (refSchema.$ref && (ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0")) {
        schema2.allOf = schema2.allOf ?? [];
        schema2.allOf.push(refSchema);
      } else {
        assignProps(schema2, refSchema);
      }
      assignProps(schema2, _cached);
      const isParentRef = zodSchema._zod.parent === ref;
      if (isParentRef) {
        for (const key in schema2) {
          if (key === "$ref" || key === "allOf")
            continue;
          if (!(key in _cached)) {
            delete schema2[key];
          }
        }
      }
      if (refSchema.$ref && refSeen.def) {
        for (const key in schema2) {
          if (key === "$ref" || key === "allOf")
            continue;
          if (key in refSeen.def && JSON.stringify(schema2[key]) === JSON.stringify(refSeen.def[key])) {
            delete schema2[key];
          }
        }
      }
    }
    const parent = zodSchema._zod.parent;
    if (parent && parent !== ref) {
      flattenRef(parent);
      const parentSeen = ctx.seen.get(parent);
      if (parentSeen?.schema.$ref) {
        schema2.$ref = parentSeen.schema.$ref;
        if (parentSeen.def) {
          for (const key in schema2) {
            if (key === "$ref" || key === "allOf")
              continue;
            if (key in parentSeen.def && JSON.stringify(schema2[key]) === JSON.stringify(parentSeen.def[key])) {
              delete schema2[key];
            }
          }
        }
      }
    }
    ctx.override({
      zodSchema,
      jsonSchema: schema2,
      path: seen.path ?? []
    });
  }, "flattenRef");
  if (!ctx.external || ctx.sharedEmitDoneFor !== ctx.external) {
    for (const entry of [...ctx.seen.entries()].reverse()) {
      flattenRef(entry[0]);
    }
    if (ctx.target !== "openapi-3.0") {
      for (const entry of ctx.seen.entries()) {
        compactTypeUnion(entry[1].def ?? entry[1].schema);
      }
    }
    for (const rewrite of ctx.deferred)
      rewrite();
    if (ctx.intersections.length) {
      const carriers = /* @__PURE__ */ new Map();
      for (const seen of ctx.seen.values()) {
        for (const json of [seen.schema, seen.def]) {
          const allOf = json?.allOf;
          if (!Array.isArray(allOf))
            continue;
          const existing = carriers.get(allOf);
          if (existing)
            existing.push(json);
          else
            carriers.set(allOf, [json]);
        }
      }
      for (const allOf of ctx.intersections) {
        for (const json of carriers.get(allOf) ?? [])
          foldIntersection(json);
      }
    }
  }
  const result = {};
  if (ctx.target === "draft-2020-12") {
    result.$schema = "https://json-schema.org/draft/2020-12/schema";
  } else if (ctx.target === "draft-07") {
    result.$schema = "http://json-schema.org/draft-07/schema#";
  } else if (ctx.target === "draft-04") {
    result.$schema = "http://json-schema.org/draft-04/schema#";
  } else if (ctx.target === "openapi-3.0") {
  } else {
  }
  if (ctx.external?.uri) {
    const id = ctx.external.registry.get(schema)?.id;
    if (!id)
      throw new Error("Schema is missing an `id` property");
    result.$id = ctx.external.uri(id);
  }
  assignProps(result, root.defId ? root.schema : root.def ?? root.schema);
  const rootMetaId = ctx.metadataRegistry.get(schema)?.id;
  if (rootMetaId !== void 0 && result.id === rootMetaId)
    delete result.id;
  const defs = ctx.external?.defs ?? {};
  if (!ctx.external || ctx.sharedEmitDoneFor !== ctx.external) {
    for (const entry of ctx.seen.entries()) {
      const seen = entry[1];
      if (seen.def && seen.defId) {
        if (seen.def.id === seen.defId)
          delete seen.def.id;
        assignProp(defs, seen.defId, seen.def);
      }
    }
  }
  if (ctx.external)
    ctx.sharedEmitDoneFor = ctx.external;
  if (ctx.external) {
  } else {
    if (Object.keys(defs).length > 0) {
      if (ctx.target === "draft-2020-12") {
        result.$defs = defs;
      } else {
        result.definitions = defs;
      }
    }
  }
  try {
    const finalized = JSON.parse(JSON.stringify(result));
    Object.defineProperty(finalized, "~standard", {
      value: {
        ...schema["~standard"],
        jsonSchema: {
          input: createStandardJSONSchemaMethod(schema, "input", ctx.processors),
          output: createStandardJSONSchemaMethod(schema, "output", ctx.processors)
        }
      },
      enumerable: false,
      writable: false
    });
    return finalized;
  } catch (_err) {
    throw new Error("Error converting schema to JSON.");
  }
}
__name(finalize, "finalize");
function isTransforming(_schema, _ctx) {
  const ctx = _ctx ?? { seen: /* @__PURE__ */ new Set() };
  if (ctx.seen.has(_schema))
    return false;
  ctx.seen.add(_schema);
  const def = _schema._zod.def;
  if (def.type === "transform")
    return true;
  if (def.type === "array")
    return isTransforming(def.element, ctx);
  if (def.type === "set")
    return isTransforming(def.valueType, ctx);
  if (def.type === "lazy")
    return isTransforming(def.getter(), ctx);
  if (def.type === "promise" || def.type === "optional" || def.type === "nonoptional" || def.type === "nullable" || def.type === "readonly" || def.type === "default" || def.type === "prefault" || def.type === "catch") {
    return isTransforming(def.innerType, ctx);
  }
  if (def.type === "intersection") {
    return isTransforming(def.left, ctx) || isTransforming(def.right, ctx);
  }
  if (def.type === "record" || def.type === "map") {
    return isTransforming(def.keyType, ctx) || isTransforming(def.valueType, ctx);
  }
  if (def.type === "pipe") {
    if (_schema._zod.traits.has("$ZodCodec"))
      return true;
    return isTransforming(def.in, ctx) || isTransforming(def.out, ctx);
  }
  if (def.type === "object") {
    for (const key in def.shape) {
      if (isTransforming(def.shape[key], ctx))
        return true;
    }
    return false;
  }
  if (def.type === "union") {
    for (const option of def.options) {
      if (isTransforming(option, ctx))
        return true;
    }
    return false;
  }
  if (def.type === "tuple") {
    for (const item of def.items) {
      if (isTransforming(item, ctx))
        return true;
    }
    if (def.rest && isTransforming(def.rest, ctx))
      return true;
    return false;
  }
  return false;
}
__name(isTransforming, "isTransforming");
var createToJSONSchemaMethod = /* @__PURE__ */ __name((schema, processors = {}) => (params) => {
  const ctx = initializeContext({ ...params, processors });
  processSchema(schema, ctx);
  extractDefs(ctx, schema);
  return finalize(ctx, schema);
}, "createToJSONSchemaMethod");
var createStandardJSONSchemaMethod = /* @__PURE__ */ __name((schema, io, processors = {}) => (params) => {
  const { libraryOptions, target } = params ?? {};
  const ctx = initializeContext({ ...libraryOptions ?? {}, target, io, processors });
  processSchema(schema, ctx);
  extractDefs(ctx, schema);
  return finalize(ctx, schema);
}, "createStandardJSONSchemaMethod");

// ../../node_modules/zod/v4/core/json-schema-processors.js
var narrowMin = /* @__PURE__ */ __name((agg, key, value) => {
  if (agg[key] === void 0 || value > agg[key])
    agg[key] = value;
}, "narrowMin");
var narrowMax = /* @__PURE__ */ __name((agg, key, value) => {
  if (agg[key] === void 0 || value < agg[key])
    agg[key] = value;
}, "narrowMax");
var narrowBoth = /* @__PURE__ */ __name((agg, value) => {
  narrowMin(agg, "minimum", value);
  narrowMax(agg, "maximum", value);
}, "narrowBoth");
var addDivisor = /* @__PURE__ */ __name((agg, value) => {
  agg.multipleOf ?? (agg.multipleOf = []);
  if (!agg.multipleOf.includes(value))
    agg.multipleOf.push(value);
}, "addDivisor");
var addPattern = /* @__PURE__ */ __name((agg, pattern) => {
  agg.patterns ?? (agg.patterns = /* @__PURE__ */ new Set());
  agg.patterns.add(pattern);
}, "addPattern");
var intersectMime = /* @__PURE__ */ __name((agg, mime) => {
  agg.mime = agg.mime ? agg.mime.filter((m) => mime.includes(m)) : [...mime];
}, "intersectMime");
var setFormat = /* @__PURE__ */ __name((agg, format2) => {
  agg.format = format2;
  if (format2.includes("int"))
    agg.isInt = true;
}, "setFormat");
var minContributor = /* @__PURE__ */ __name((agg, def) => narrowMin(agg, "minimum", def.minimum), "minContributor");
var maxContributor = /* @__PURE__ */ __name((agg, def) => narrowMax(agg, "maximum", def.maximum), "maxContributor");
var formatContributor = /* @__PURE__ */ __name((ranges) => (agg, def) => {
  setFormat(agg, def.format);
  const [minimum, maximum] = ranges[def.format];
  narrowMin(agg, "minimum", minimum);
  narrowMax(agg, "maximum", maximum);
}, "formatContributor");
var contributors = {
  greater_than: /* @__PURE__ */ __name((agg, def) => narrowMin(agg, def.inclusive ? "minimum" : "exclusiveMinimum", def.value), "greater_than"),
  less_than: /* @__PURE__ */ __name((agg, def) => narrowMax(agg, def.inclusive ? "maximum" : "exclusiveMaximum", def.value), "less_than"),
  multiple_of: /* @__PURE__ */ __name((agg, def) => addDivisor(agg, def.value), "multiple_of"),
  number_format: formatContributor(NUMBER_FORMAT_RANGES),
  bigint_format: formatContributor(BIGINT_FORMAT_RANGES),
  min_length: minContributor,
  max_length: maxContributor,
  length_equals: /* @__PURE__ */ __name((agg, def) => narrowBoth(agg, def.length), "length_equals"),
  min_size: minContributor,
  max_size: maxContributor,
  size_equals: /* @__PURE__ */ __name((agg, def) => narrowBoth(agg, def.size), "size_equals"),
  string_format: /* @__PURE__ */ __name((agg, def) => {
    setFormat(agg, def.format);
    if (def.pattern)
      addPattern(agg, def.pattern);
    if (def.format === "base64" || def.format === "base64url")
      agg.contentEncoding = def.format;
    if (def.local || def.precision === -1)
      agg.laxFormat = true;
  }, "string_format"),
  mime_type: /* @__PURE__ */ __name((agg, def) => intersectMime(agg, def.mime), "mime_type")
};
function aggregateChecks(schema) {
  const agg = {};
  const def = schema._zod.def;
  const list = schema._zod.traits.has("$ZodCheck") ? [schema, ...def.checks ?? []] : def.checks ?? [];
  for (const ch of list)
    contributors[ch._zod.def.check]?.(agg, ch._zod.def);
  const bag = schema._zod.bag;
  if (bag.minimum !== void 0)
    narrowMin(agg, "minimum", bag.minimum);
  if (bag.exclusiveMinimum !== void 0)
    narrowMin(agg, "exclusiveMinimum", bag.exclusiveMinimum);
  if (bag.maximum !== void 0)
    narrowMax(agg, "maximum", bag.maximum);
  if (bag.exclusiveMaximum !== void 0)
    narrowMax(agg, "exclusiveMaximum", bag.exclusiveMaximum);
  if (bag.multipleOf !== void 0)
    addDivisor(agg, bag.multipleOf);
  if (bag.format !== void 0) {
    agg.format ?? (agg.format = bag.format);
    if (bag.format.includes("int"))
      agg.isInt = true;
  }
  if (bag.mime)
    intersectMime(agg, bag.mime);
  for (const pattern of bag.patterns ?? [])
    addPattern(agg, pattern);
  return agg;
}
__name(aggregateChecks, "aggregateChecks");
var formatMap = {
  guid: "uuid",
  url: "uri",
  datetime: "date-time",
  json_string: "json-string",
  regex: ""
  // do not set
};
var exactPatterns = /* @__PURE__ */ new Map([
  [base64Charset, base64],
  [base64urlCharset, base64url]
]);
var exactPattern = /* @__PURE__ */ __name((p) => exactPatterns.get(p) ?? p, "exactPattern");
var stringProcessor = /* @__PURE__ */ __name((schema, ctx, _json, _params) => {
  const json = _json;
  json.type = "string";
  const { minimum, maximum, format: format2, patterns, contentEncoding, laxFormat } = aggregateChecks(schema);
  if (typeof minimum === "number")
    json.minLength = minimum;
  if (typeof maximum === "number")
    json.maxLength = maximum;
  if (format2) {
    json.format = formatMap[format2] ?? format2;
    if (json.format === "")
      delete json.format;
    if (format2 === "time" || laxFormat) {
      delete json.format;
    }
  }
  if (contentEncoding)
    json.contentEncoding = contentEncoding;
  if (patterns && patterns.size > 0) {
    const patternList = [...patterns].map(exactPattern);
    if (patternList.length === 1)
      json.pattern = patternList[0].source;
    else if (patternList.length > 1) {
      json.allOf = [
        ...patternList.map((regex2) => ({
          ...ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0" ? { type: "string" } : {},
          pattern: regex2.source
        }))
      ];
    }
  }
}, "stringProcessor");
var numberProcessor = /* @__PURE__ */ __name((schema, ctx, _json, params) => {
  const json = _json;
  const { minimum, maximum, multipleOf, exclusiveMaximum, exclusiveMinimum, isInt } = aggregateChecks(schema);
  json.type = isInt ? "integer" : "number";
  const exMin = typeof exclusiveMinimum === "number" && exclusiveMinimum >= (minimum ?? Number.NEGATIVE_INFINITY);
  const exMax = typeof exclusiveMaximum === "number" && exclusiveMaximum <= (maximum ?? Number.POSITIVE_INFINITY);
  const legacy = ctx.target === "draft-04" || ctx.target === "openapi-3.0";
  if (exMin) {
    if (legacy) {
      json.minimum = exclusiveMinimum;
      json.exclusiveMinimum = true;
    } else {
      json.exclusiveMinimum = exclusiveMinimum;
    }
  } else if (typeof minimum === "number") {
    json.minimum = minimum;
  }
  if (exMax) {
    if (legacy) {
      json.maximum = exclusiveMaximum;
      json.exclusiveMaximum = true;
    } else {
      json.exclusiveMaximum = exclusiveMaximum;
    }
  } else if (typeof maximum === "number") {
    json.maximum = maximum;
  }
  if (multipleOf) {
    const divisors = /* @__PURE__ */ new Set();
    for (const divisor of multipleOf) {
      if (Number.isFinite(divisor) && divisor !== 0)
        divisors.add(Math.abs(divisor));
      else
        handleUnrepresentable(schema, ctx, json, params, `A multipleOf divisor of ${divisor} cannot be represented in JSON Schema`);
    }
    const [first, ...rest] = divisors;
    if (first !== void 0)
      json.multipleOf = first;
    if (rest.length)
      json.allOf = [...json.allOf ?? [], ...rest.map((m) => ({ multipleOf: m }))];
  }
}, "numberProcessor");
var booleanProcessor = /* @__PURE__ */ __name((_schema, _ctx, json, _params) => {
  json.type = "boolean";
}, "booleanProcessor");
var bigintProcessor = /* @__PURE__ */ __name((schema, ctx, json, params) => {
  handleUnrepresentable(schema, ctx, json, params, "BigInt cannot be represented in JSON Schema");
}, "bigintProcessor");
var symbolProcessor = /* @__PURE__ */ __name((schema, ctx, json, params) => {
  handleUnrepresentable(schema, ctx, json, params, "Symbols cannot be represented in JSON Schema");
}, "symbolProcessor");
var nullProcessor = /* @__PURE__ */ __name((_schema, ctx, json, _params) => {
  if (ctx.target === "openapi-3.0") {
    json.type = "string";
    json.nullable = true;
    json.enum = [null];
  } else {
    json.type = "null";
  }
}, "nullProcessor");
var undefinedProcessor = /* @__PURE__ */ __name((schema, ctx, json, params) => {
  handleUnrepresentable(schema, ctx, json, params, "Undefined cannot be represented in JSON Schema");
}, "undefinedProcessor");
var voidProcessor = /* @__PURE__ */ __name((schema, ctx, json, params) => {
  handleUnrepresentable(schema, ctx, json, params, "Void cannot be represented in JSON Schema");
}, "voidProcessor");
var neverProcessor = /* @__PURE__ */ __name((_schema, _ctx, json, _params) => {
  json.not = {};
}, "neverProcessor");
var anyProcessor = /* @__PURE__ */ __name((_schema, _ctx, _json, _params) => {
}, "anyProcessor");
var unknownProcessor = /* @__PURE__ */ __name((_schema, _ctx, _json, _params) => {
}, "unknownProcessor");
var dateProcessor = /* @__PURE__ */ __name((schema, ctx, json, params) => {
  handleUnrepresentable(schema, ctx, json, params, "Date cannot be represented in JSON Schema");
}, "dateProcessor");
var enumProcessor = /* @__PURE__ */ __name((schema, _ctx, json, _params) => {
  const def = schema._zod.def;
  const values = getEnumValues(def.entries);
  if (values.length === 0) {
    json.not = {};
    return;
  }
  if (values.every((v) => typeof v === "number"))
    json.type = "number";
  if (values.every((v) => typeof v === "string"))
    json.type = "string";
  json.enum = values;
}, "enumProcessor");
var literalProcessor = /* @__PURE__ */ __name((schema, ctx, json, params) => {
  const def = schema._zod.def;
  if (def.values.length === 0) {
    json.not = {};
    return;
  }
  const vals = [];
  for (const val of def.values) {
    if (val === void 0) {
      if (handleUnrepresentable(schema, ctx, json, params, "Literal `undefined` cannot be represented in JSON Schema"))
        return;
    } else if (typeof val === "bigint") {
      if (handleUnrepresentable(schema, ctx, json, params, "BigInt literals cannot be represented in JSON Schema"))
        return;
      vals.push(Number(val));
    } else {
      vals.push(val);
    }
  }
  if (vals.length === 0) {
  } else if (vals.length === 1) {
    const val = vals[0];
    json.type = val === null ? "null" : typeof val;
    if (ctx.target === "draft-04" || ctx.target === "openapi-3.0") {
      json.enum = [val];
    } else {
      json.const = val;
    }
  } else {
    if (vals.every((v) => typeof v === "number"))
      json.type = "number";
    if (vals.every((v) => typeof v === "string"))
      json.type = "string";
    if (vals.every((v) => typeof v === "boolean"))
      json.type = "boolean";
    if (vals.every((v) => v === null))
      json.type = "null";
    json.enum = vals;
  }
}, "literalProcessor");
var nanProcessor = /* @__PURE__ */ __name((schema, ctx, json, params) => {
  handleUnrepresentable(schema, ctx, json, params, "NaN cannot be represented in JSON Schema");
}, "nanProcessor");
var templateLiteralProcessor = /* @__PURE__ */ __name((schema, _ctx, json, _params) => {
  const _json = json;
  const pattern = schema._zod.pattern;
  if (!pattern)
    throw new Error("Pattern not found in template literal");
  _json.type = "string";
  _json.pattern = pattern.source;
}, "templateLiteralProcessor");
var fileProcessor = /* @__PURE__ */ __name((schema, _ctx, json, _params) => {
  const _json = json;
  _json.type = "string";
  _json.format = "binary";
  _json.contentEncoding = "binary";
  const { minimum, maximum, mime } = aggregateChecks(schema);
  if (minimum !== void 0)
    _json.minLength = minimum;
  if (maximum !== void 0)
    _json.maxLength = maximum;
  if (!mime)
    return;
  if (mime.length === 0)
    _json.not = {};
  else if (mime.length === 1)
    _json.contentMediaType = mime[0];
  else
    _json.anyOf = mime.map((m) => ({ contentMediaType: m }));
}, "fileProcessor");
var successProcessor = /* @__PURE__ */ __name((_schema, _ctx, json, _params) => {
  json.type = "boolean";
}, "successProcessor");
var customProcessor = /* @__PURE__ */ __name((schema, ctx, json, params) => {
  handleUnrepresentable(schema, ctx, json, params, "Custom types cannot be represented in JSON Schema");
}, "customProcessor");
var functionProcessor = /* @__PURE__ */ __name((schema, ctx, json, params) => {
  handleUnrepresentable(schema, ctx, json, params, "Function types cannot be represented in JSON Schema");
}, "functionProcessor");
var transformProcessor = /* @__PURE__ */ __name((schema, ctx, json, params) => {
  handleUnrepresentable(schema, ctx, json, params, "Transforms cannot be represented in JSON Schema");
}, "transformProcessor");
var mapProcessor = /* @__PURE__ */ __name((schema, ctx, json, params) => {
  handleUnrepresentable(schema, ctx, json, params, "Map cannot be represented in JSON Schema");
}, "mapProcessor");
var setProcessor = /* @__PURE__ */ __name((schema, ctx, json, params) => {
  handleUnrepresentable(schema, ctx, json, params, "Set cannot be represented in JSON Schema");
}, "setProcessor");
var arrayProcessor = /* @__PURE__ */ __name((schema, ctx, _json, params) => {
  const json = _json;
  const def = schema._zod.def;
  const { minimum, maximum } = aggregateChecks(schema);
  if (typeof minimum === "number")
    json.minItems = minimum;
  if (typeof maximum === "number")
    json.maxItems = maximum;
  json.type = "array";
  json.items = processSchema(def.element, ctx, {
    ...params,
    path: [...params.path, "items"]
  });
}, "arrayProcessor");
function inputOptin(schema) {
  const def = schema._zod.def;
  if (def.type === "pipe" && def.in._zod.traits.has("$ZodTransform")) {
    return inputOptin(def.out);
  }
  if (def.type === "catch") {
    return inputOptin(def.innerType);
  }
  return schema._zod.optin;
}
__name(inputOptin, "inputOptin");
var objectProcessor = /* @__PURE__ */ __name((schema, ctx, _json, params) => {
  const json = _json;
  const def = schema._zod.def;
  const shape = def.shape;
  const symbolKeys = Object.getOwnPropertySymbols(shape);
  if (symbolKeys.length && handleUnrepresentable(schema, ctx, json, params, "Symbol keys cannot be represented in JSON Schema")) {
    return;
  }
  json.type = "object";
  json.properties = {};
  for (const key in shape) {
    assignProp(json.properties, key, processSchema(shape[key], ctx, {
      ...params,
      path: [...params.path, "properties", key]
    }));
  }
  const requiredKeys = [];
  for (const key of Object.keys(shape)) {
    const field = def.shape[key];
    if (ctx.io === "input" ? inputOptin(field) === void 0 : field._zod.optout === void 0) {
      requiredKeys.push(key);
    }
  }
  if (requiredKeys.length > 0) {
    json.required = requiredKeys;
  }
  if (def.catchall?._zod.def.type === "never") {
    json.additionalProperties = false;
  } else if (!def.catchall) {
    if (ctx.io === "output")
      json.additionalProperties = false;
  } else if (def.catchall) {
    json.additionalProperties = processSchema(def.catchall, ctx, {
      ...params,
      path: [...params.path, "additionalProperties"]
    });
  }
}, "objectProcessor");
var unionProcessor = /* @__PURE__ */ __name((schema, ctx, json, params) => {
  const def = schema._zod.def;
  const isExclusive = def.inclusive === false;
  const options = def.options.map((x, i) => processSchema(x, ctx, {
    ...params,
    path: [...params.path, isExclusive ? "oneOf" : "anyOf", i]
  }));
  if (isExclusive) {
    json.oneOf = options;
  } else {
    json.anyOf = options;
  }
}, "unionProcessor");
var intersectionProcessor = /* @__PURE__ */ __name((schema, ctx, json, params) => {
  const def = schema._zod.def;
  const a = processSchema(def.left, ctx, {
    ...params,
    path: [...params.path, "allOf", 0]
  });
  const b = processSchema(def.right, ctx, {
    ...params,
    path: [...params.path, "allOf", 1]
  });
  const isSimpleIntersection = /* @__PURE__ */ __name((val) => "allOf" in val && Object.keys(val).length === 1, "isSimpleIntersection");
  const allOf = [
    ...isSimpleIntersection(a) ? a.allOf : [a],
    ...isSimpleIntersection(b) ? b.allOf : [b]
  ];
  json.allOf = allOf;
  ctx.intersections.push(allOf);
}, "intersectionProcessor");
var tupleProcessor = /* @__PURE__ */ __name((schema, ctx, _json, params) => {
  const json = _json;
  const def = schema._zod.def;
  json.type = "array";
  const prefixPath = ctx.target === "draft-2020-12" ? "prefixItems" : "items";
  const restPath = ctx.target === "draft-2020-12" ? "items" : ctx.target === "openapi-3.0" ? "items" : "additionalItems";
  const prefixItems = def.items.map((x, i) => processSchema(x, ctx, {
    ...params,
    path: [...params.path, prefixPath, i]
  }));
  const rest = def.rest ? processSchema(def.rest, ctx, {
    ...params,
    path: [...params.path, restPath, ...ctx.target === "openapi-3.0" ? [def.items.length] : []]
  }) : null;
  let minItems = def.items.length;
  while (minItems > 0) {
    const item = def.items[minItems - 1];
    const optional2 = ctx.io === "input" ? inputOptin(item) !== void 0 : item._zod.optout === "optional";
    if (!optional2)
      break;
    minItems--;
  }
  const maxItems = def.items.length;
  const isClosed = !def.rest;
  if (ctx.target === "draft-2020-12") {
    json.prefixItems = prefixItems;
    if (isClosed) {
      json.items = false;
    } else if (rest) {
      json.items = rest;
    }
    if (minItems > 0)
      json.minItems = minItems;
    if (isClosed)
      json.maxItems = maxItems;
  } else if (ctx.target === "openapi-3.0") {
    json.items = {
      anyOf: prefixItems
    };
    if (rest) {
      json.items.anyOf.push(rest);
    }
    if (minItems > 0)
      json.minItems = minItems;
    if (isClosed)
      json.maxItems = maxItems;
  } else {
    json.items = prefixItems;
    if (isClosed) {
      json.additionalItems = false;
    } else if (rest) {
      json.additionalItems = rest;
    }
    if (minItems > 0)
      json.minItems = minItems;
    if (isClosed)
      json.maxItems = maxItems;
  }
  const { minimum, maximum } = aggregateChecks(schema);
  if (typeof minimum === "number")
    json.minItems = minimum;
  if (typeof maximum === "number")
    json.maxItems = maximum;
}, "tupleProcessor");
function stringifyKeyNames(bySchema, json, visited) {
  if (json.$ref) {
    if (visited.has(json))
      return json;
    visited.add(json);
    const def = bySchema.get(json)?.def;
    if (!def)
      return json;
    const inlined = stringifyKeyNames(bySchema, def, visited);
    return inlined === def ? json : inlined;
  }
  for (const keyword of ["anyOf", "oneOf"]) {
    const branches = json[keyword];
    if (!Array.isArray(branches))
      continue;
    const mapped = branches.map((branch) => stringifyKeyNames(bySchema, branch, visited));
    if (mapped.some((branch, i) => branch !== branches[i]))
      json = { ...json, [keyword]: mapped };
  }
  const types = Array.isArray(json.type) ? json.type : [json.type];
  const numericType = !types.includes("string") && types.some((t) => t === "number" || t === "integer");
  const values = json.enum ?? (json.const !== void 0 ? [json.const] : void 0);
  if (!numericType && !values?.some((v) => typeof v === "number"))
    return json;
  const { minimum, maximum, exclusiveMinimum, exclusiveMaximum, multipleOf, format: format2, id, ...rest } = json;
  if (rest.enum)
    rest.enum = rest.enum.map((v) => typeof v === "number" ? String(v) : v);
  else if (typeof rest.const === "number")
    rest.const = String(rest.const);
  if (!numericType)
    return rest;
  rest.type = "string";
  if (!values)
    rest.pattern = (types.includes("number") ? number : integer).source;
  return rest;
}
__name(stringifyKeyNames, "stringifyKeyNames");
var pendingRecords = /* @__PURE__ */ new WeakMap();
function rewriteKeyNames(ctx) {
  const bySchema = /* @__PURE__ */ new Map();
  for (const entry of ctx.seen.values()) {
    if (entry.def && !bySchema.has(entry.schema))
      bySchema.set(entry.schema, entry);
  }
  const rewrites = /* @__PURE__ */ new Map();
  for (const record2 of pendingRecords.get(ctx) ?? []) {
    const seen = ctx.seen.get(record2);
    const names = (seen?.def ?? seen?.schema)?.propertyNames;
    if (!names || names === true || rewrites.has(names))
      continue;
    const rewritten = stringifyKeyNames(bySchema, names, /* @__PURE__ */ new Set());
    if (rewritten !== names)
      rewrites.set(names, rewritten);
  }
  if (!rewrites.size)
    return;
  for (const entry of ctx.seen.values()) {
    for (const carrier of [entry.schema, entry.def]) {
      const rewritten = carrier && rewrites.get(carrier.propertyNames);
      if (rewritten)
        carrier.propertyNames = rewritten;
    }
  }
}
__name(rewriteKeyNames, "rewriteKeyNames");
var recordProcessor = /* @__PURE__ */ __name((schema, ctx, _json, params) => {
  const json = _json;
  const def = schema._zod.def;
  json.type = "object";
  const keyType = def.keyType;
  const patterns = aggregateChecks(keyType).patterns;
  if (def.mode === "loose" && patterns && patterns.size > 0) {
    const valueSchema = processSchema(def.valueType, ctx, {
      ...params,
      path: [...params.path, "patternProperties", "*"]
    });
    json.patternProperties = {};
    for (const pattern of patterns) {
      assignProp(json.patternProperties, exactPattern(pattern).source, valueSchema);
    }
  } else {
    if (ctx.target === "draft-07" || ctx.target === "draft-2020-12") {
      json.propertyNames = processSchema(def.keyType, ctx, {
        ...params,
        path: [...params.path, "propertyNames"]
      });
      let pending = pendingRecords.get(ctx);
      if (!pending) {
        pending = [];
        pendingRecords.set(ctx, pending);
        ctx.deferred.push(() => rewriteKeyNames(ctx));
      }
      pending.push(schema);
    }
    json.additionalProperties = processSchema(def.valueType, ctx, {
      ...params,
      path: [...params.path, "additionalProperties"]
    });
  }
  const keyValues = keyType._zod.values;
  const omittableOnInput = ctx.io === "input" && inputOptin(def.valueType) !== void 0;
  if (keyValues && !def.partial && !omittableOnInput) {
    const validKeyValues = [...keyValues].filter((v) => typeof v === "string" || typeof v === "number");
    if (validKeyValues.length > 0) {
      json.required = validKeyValues.map(String);
    }
  }
}, "recordProcessor");
var nullableProcessor = /* @__PURE__ */ __name((schema, ctx, json, params) => {
  const def = schema._zod.def;
  const inner = processSchema(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  if (ctx.target === "openapi-3.0") {
    seen.ref = def.innerType;
    json.nullable = true;
  } else {
    json.anyOf = [inner, { type: "null" }];
  }
}, "nullableProcessor");
var nonoptionalProcessor = /* @__PURE__ */ __name((schema, ctx, _json, params) => {
  const def = schema._zod.def;
  processSchema(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
}, "nonoptionalProcessor");
var UNREPRESENTABLE_DEFAULT = /* @__PURE__ */ Symbol();
function serializeDefaultValue(value, schema, ctx, json, params) {
  let unrepresentable = false;
  const serialized = JSON.stringify(value, (_, val) => {
    if (typeof val !== "bigint")
      return val;
    unrepresentable = true;
    return null;
  });
  if (!unrepresentable)
    return JSON.parse(serialized);
  handleUnrepresentable(schema, ctx, json, params, "BigInt defaults cannot be represented in JSON Schema");
  return UNREPRESENTABLE_DEFAULT;
}
__name(serializeDefaultValue, "serializeDefaultValue");
var defaultProcessor = /* @__PURE__ */ __name((schema, ctx, json, params) => {
  const def = schema._zod.def;
  processSchema(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
  const value = serializeDefaultValue(def.defaultValue, schema, ctx, json, params);
  if (value !== UNREPRESENTABLE_DEFAULT)
    json.default = value;
}, "defaultProcessor");
var prefaultProcessor = /* @__PURE__ */ __name((schema, ctx, json, params) => {
  const def = schema._zod.def;
  processSchema(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
  if (ctx.io !== "input")
    return;
  const value = serializeDefaultValue(def.defaultValue, schema, ctx, json, params);
  if (value !== UNREPRESENTABLE_DEFAULT)
    json._prefault = value;
}, "prefaultProcessor");
var catchProcessor = /* @__PURE__ */ __name((schema, ctx, json, params) => {
  const def = schema._zod.def;
  processSchema(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
  let catchValue;
  try {
    catchValue = def.catchValue(void 0);
  } catch {
    handleUnrepresentable(schema, ctx, json, params, "Dynamic catch values are not supported in JSON Schema");
    return;
  }
  json.default = catchValue;
}, "catchProcessor");
var pipeProcessor = /* @__PURE__ */ __name((schema, ctx, _json, params) => {
  const def = schema._zod.def;
  const inIsTransform = def.in._zod.traits.has("$ZodTransform");
  const innerType = ctx.io === "input" ? inIsTransform ? def.out : def.in : def.out;
  processSchema(innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = innerType;
}, "pipeProcessor");
var readonlyProcessor = /* @__PURE__ */ __name((schema, ctx, json, params) => {
  const def = schema._zod.def;
  processSchema(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
  json.readOnly = true;
}, "readonlyProcessor");
var promiseProcessor = /* @__PURE__ */ __name((schema, ctx, _json, params) => {
  const def = schema._zod.def;
  processSchema(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
}, "promiseProcessor");
var optionalProcessor = /* @__PURE__ */ __name((schema, ctx, _json, params) => {
  const def = schema._zod.def;
  processSchema(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
}, "optionalProcessor");
var lazyProcessor = /* @__PURE__ */ __name((schema, ctx, _json, params) => {
  const innerType = schema._zod.innerType;
  processSchema(innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = innerType;
}, "lazyProcessor");
var allProcessors = {
  string: stringProcessor,
  number: numberProcessor,
  boolean: booleanProcessor,
  bigint: bigintProcessor,
  symbol: symbolProcessor,
  null: nullProcessor,
  undefined: undefinedProcessor,
  void: voidProcessor,
  never: neverProcessor,
  any: anyProcessor,
  unknown: unknownProcessor,
  date: dateProcessor,
  enum: enumProcessor,
  literal: literalProcessor,
  nan: nanProcessor,
  template_literal: templateLiteralProcessor,
  file: fileProcessor,
  success: successProcessor,
  custom: customProcessor,
  function: functionProcessor,
  transform: transformProcessor,
  map: mapProcessor,
  set: setProcessor,
  array: arrayProcessor,
  object: objectProcessor,
  union: unionProcessor,
  intersection: intersectionProcessor,
  tuple: tupleProcessor,
  record: recordProcessor,
  nullable: nullableProcessor,
  nonoptional: nonoptionalProcessor,
  default: defaultProcessor,
  prefault: prefaultProcessor,
  catch: catchProcessor,
  pipe: pipeProcessor,
  readonly: readonlyProcessor,
  promise: promiseProcessor,
  optional: optionalProcessor,
  lazy: lazyProcessor
};
function toJSONSchema(input, params) {
  if ("_idmap" in input) {
    const registry2 = input;
    const ctx2 = initializeContext({ ...params, processors: allProcessors });
    const defs = {};
    for (const entry of registry2._idmap.entries()) {
      const [_, schema] = entry;
      processSchema(schema, ctx2);
    }
    const schemas = {};
    const external = {
      registry: registry2,
      uri: params?.uri,
      defs
    };
    ctx2.external = external;
    for (const entry of registry2._idmap.entries()) {
      const [key, schema] = entry;
      extractDefs(ctx2, schema);
      assignProp(schemas, key, finalize(ctx2, schema));
    }
    if (Object.keys(defs).length > 0) {
      const defsSegment = ctx2.target === "draft-2020-12" ? "$defs" : "definitions";
      schemas.__shared = {
        [defsSegment]: defs
      };
    }
    return { schemas };
  }
  const ctx = initializeContext({ ...params, processors: allProcessors });
  processSchema(input, ctx);
  extractDefs(ctx, input);
  return finalize(ctx, input);
}
__name(toJSONSchema, "toJSONSchema");

// ../../node_modules/zod/v4/classic/errors.js
var _installedErrorProtos = /* @__PURE__ */ new WeakSet([Object.prototype, Error.prototype]);
function _lazyMethod(proto, key, make) {
  Object.defineProperty(proto, key, {
    configurable: true,
    enumerable: false,
    get() {
      const value = make(this);
      Object.defineProperty(this, key, { value, configurable: true, writable: true });
      return value;
    },
    set(value) {
      Object.defineProperty(this, key, { value, configurable: true, writable: true });
    }
  });
}
__name(_lazyMethod, "_lazyMethod");
var initializer2 = /* @__PURE__ */ __name((inst, issues) => {
  $ZodError.init(inst, issues);
  inst.name = "ZodError";
  const proto = Object.getPrototypeOf(inst);
  if (_installedErrorProtos.has(proto))
    return;
  _installedErrorProtos.add(proto);
  _lazyMethod(proto, "format", (self2) => (mapper) => formatError(self2, mapper));
  _lazyMethod(proto, "flatten", (self2) => (mapper) => flattenError(self2, mapper));
  _lazyMethod(proto, "addIssue", (self2) => (issue2) => {
    self2.issues.push(issue2);
    self2.message = JSON.stringify(self2.issues, jsonStringifyReplacer, 2);
  });
  _lazyMethod(proto, "addIssues", (self2) => (issues2) => {
    self2.issues.push(...issues2);
    self2.message = JSON.stringify(self2.issues, jsonStringifyReplacer, 2);
  });
  Object.defineProperty(proto, "isEmpty", {
    configurable: true,
    enumerable: false,
    get() {
      return this.issues.length === 0;
    }
  });
}, "initializer");
var ZodRealError = /* @__PURE__ */ $constructor("ZodError", initializer2, void 0, {
  Parent: Error
});

// ../../node_modules/zod/v4/classic/parse.js
var parse = /* @__PURE__ */ _parse(ZodRealError);
var parseAsync = /* @__PURE__ */ _parseAsync(ZodRealError);
var safeParse = /* @__PURE__ */ _safeParse(ZodRealError);
var safeParseAsync = /* @__PURE__ */ _safeParseAsync(ZodRealError);
var encode = /* @__PURE__ */ _encode(ZodRealError);
var decode = /* @__PURE__ */ _decode(ZodRealError);
var encodeAsync = /* @__PURE__ */ _encodeAsync(ZodRealError);
var decodeAsync = /* @__PURE__ */ _decodeAsync(ZodRealError);
var safeEncode = /* @__PURE__ */ _safeEncode(ZodRealError);
var safeDecode = /* @__PURE__ */ _safeDecode(ZodRealError);
var safeEncodeAsync = /* @__PURE__ */ _safeEncodeAsync(ZodRealError);
var safeDecodeAsync = /* @__PURE__ */ _safeDecodeAsync(ZodRealError);

// ../../node_modules/zod/v4/classic/schemas.js
function _ensureDefaultLocale() {
  if (!globalConfig.localeError)
    config(en_default());
}
__name(_ensureDefaultLocale, "_ensureDefaultLocale");
function _ensureDefaultMemoizer() {
  if (!globalConfig.memoizer)
    config({ memoizer: memoizer() });
}
__name(_ensureDefaultMemoizer, "_ensureDefaultMemoizer");
var ZodType = /* @__PURE__ */ $constructor("ZodType", (inst, def) => {
  _ensureDefaultLocale();
  $ZodType.init(inst, def);
  inst.def = def;
  inst.type = def.type;
  return inst;
}, {
  check(...chks) {
    const def = this.def;
    return this.clone(util_exports.mergeDefs(def, {
      checks: [
        ...def.checks ?? [],
        ...chks.map((ch) => typeof ch === "function" ? { _zod: { check: ch, def: { check: "custom" }, onattach: [] } } : ch)
      ]
    }), { parent: true });
  },
  with(...chks) {
    return this.check(...chks);
  },
  clone(def, params) {
    return clone(this, def, params);
  },
  brand() {
    return this;
  },
  register(reg, meta2) {
    reg.add(this, meta2);
    return this;
  },
  refine(check, params) {
    return this.check(refine(check, params));
  },
  superRefine(refinement, params) {
    return this.check(superRefine(refinement, params));
  },
  overwrite(fn) {
    return this.check(_overwrite(fn));
  },
  optional() {
    return optional(this);
  },
  exactOptional() {
    return exactOptional(this);
  },
  nullable() {
    return nullable(this);
  },
  nullish() {
    return optional(nullable(this));
  },
  nonoptional(params) {
    return nonoptional(this, params);
  },
  array() {
    return array(this);
  },
  or(arg) {
    return union([this, arg]);
  },
  and(arg) {
    return intersection(this, arg);
  },
  transform(tx) {
    return pipe(this, transform(tx));
  },
  default(d) {
    return _default(this, d);
  },
  prefault(d) {
    return prefault(this, d);
  },
  catch(params) {
    return _catch(this, params);
  },
  pipe(target) {
    return pipe(this, target);
  },
  readonly() {
    return readonly(this);
  },
  describe(description) {
    const cl = this.clone();
    globalRegistry.add(cl, { description });
    return cl;
  },
  meta(...args) {
    if (args.length === 0)
      return globalRegistry.get(this);
    const cl = this.clone();
    globalRegistry.add(cl, args[0]);
    return cl;
  },
  isOptional() {
    return this.safeParse(void 0).success;
  },
  isNullable() {
    return this.safeParse(null).success;
  },
  apply(fn, ...args) {
    return args.length === 0 ? fn(this) : fn(this, ...args);
  },
  // Overrides core's `~standard` to add `jsonSchema`. Must stay a prototype entry: redefining it per instance demotes instances to dictionary mode.
  get "~standard"() {
    return util_exports.hide(this, "~standard", {
      ...standardProps(this),
      jsonSchema: {
        input: createStandardJSONSchemaMethod(this, "input"),
        output: createStandardJSONSchemaMethod(this, "output")
      }
    });
  },
  set "~standard"(value) {
    util_exports.own(this, "~standard", value);
  },
  parse: /* @__PURE__ */ __name(function _parse2(data, params) {
    return parse(this, data, params, { callee: _parse2 });
  }, "_parse"),
  parseAsync: /* @__PURE__ */ __name(async function _parseAsync2(data, params) {
    return await parseAsync(this, data, params, { callee: _parseAsync2 });
  }, "_parseAsync"),
  safeParse(data, params) {
    return safeParse(this, data, params);
  },
  async safeParseAsync(data, params) {
    return safeParseAsync(this, data, params);
  },
  // `spa` is an alias: same function object as `safeParseAsync`, as before.
  get spa() {
    return this?.safeParseAsync;
  },
  set spa(value) {
    util_exports.own(this, "spa", value);
  },
  validate(data, params) {
    return validate(this, data, params);
  },
  validateAsync(data, params) {
    return validateAsync(this, data, params);
  },
  encode: /* @__PURE__ */ __name(function _encode2(data, params) {
    return encode(this, data, params, { callee: _encode2 });
  }, "_encode"),
  decode: /* @__PURE__ */ __name(function _decode2(data, params) {
    return decode(this, data, params, { callee: _decode2 });
  }, "_decode"),
  encodeAsync: /* @__PURE__ */ __name(async function _encodeAsync2(data, params) {
    return await encodeAsync(this, data, params, { callee: _encodeAsync2 });
  }, "_encodeAsync"),
  decodeAsync: /* @__PURE__ */ __name(async function _decodeAsync2(data, params) {
    return await decodeAsync(this, data, params, { callee: _decodeAsync2 });
  }, "_decodeAsync"),
  safeEncode(data, params) {
    return safeEncode(this, data, params);
  },
  safeDecode(data, params) {
    return safeDecode(this, data, params);
  },
  async safeEncodeAsync(data, params) {
    return safeEncodeAsync(this, data, params);
  },
  async safeDecodeAsync(data, params) {
    return safeDecodeAsync(this, data, params);
  },
  toJSONSchema(params) {
    return createToJSONSchemaMethod(this, {})(params);
  },
  // Reads through to the registry on every access, so it must not cache.
  get description() {
    return globalRegistry.get(this)?.description;
  },
  // No setter: `schema._def = x` throws, as it did when `_def` was a non-writable own property.
  get _def() {
    return this._zod.def;
  }
});
var _ZodString = /* @__PURE__ */ $constructor(
  "_ZodString",
  (inst, def) => {
    $ZodString.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => stringProcessor(inst, ctx, json, params);
  },
  /* @__PURE__ */ util_exports.derived({
    format: /* @__PURE__ */ __name((inst) => aggregateChecks(inst).format ?? null, "format"),
    minLength: /* @__PURE__ */ __name((inst) => aggregateChecks(inst).minimum ?? null, "minLength"),
    maxLength: /* @__PURE__ */ __name((inst) => aggregateChecks(inst).maximum ?? null, "maxLength")
  }, {
    regex(...args) {
      return this.check(_regex(...args));
    },
    includes(...args) {
      return this.check(_includes(...args));
    },
    startsWith(...args) {
      return this.check(_startsWith(...args));
    },
    endsWith(...args) {
      return this.check(_endsWith(...args));
    },
    min(...args) {
      return this.check(_minLength(...args));
    },
    max(...args) {
      return this.check(_maxLength(...args));
    },
    length(...args) {
      return this.check(_length(...args));
    },
    nonempty(...args) {
      return this.check(_minLength(1, ...args));
    },
    lowercase(params) {
      return this.check(_lowercase(params));
    },
    uppercase(params) {
      return this.check(_uppercase(params));
    },
    trim() {
      return this.check(_trim());
    },
    normalize(...args) {
      return this.check(_normalize(...args));
    },
    toLowerCase() {
      return this.check(_toLowerCase());
    },
    toUpperCase() {
      return this.check(_toUpperCase());
    },
    slugify() {
      return this.check(_slugify());
    }
  })
);
var ZodString = /* @__PURE__ */ $constructor("ZodString", (inst, def) => {
  $ZodString.init(inst, def);
  _ZodString.init(inst, def);
}, {
  email(params) {
    return this.check(_email(ZodEmail, params));
  },
  url(params) {
    return this.check(_url(ZodURL, params));
  },
  jwt(params) {
    return this.check(_jwt(ZodJWT, params));
  },
  emoji(params) {
    return this.check(_emoji2(ZodEmoji, params));
  },
  guid(params) {
    return this.check(_guid(ZodGUID, params));
  },
  uuid(params) {
    return this.check(_uuid(ZodUUID, params));
  },
  uuidv4(params) {
    return this.check(_uuidv4(ZodUUID, params));
  },
  uuidv6(params) {
    return this.check(_uuidv6(ZodUUID, params));
  },
  uuidv7(params) {
    return this.check(_uuidv7(ZodUUID, params));
  },
  nanoid(params) {
    return this.check(_nanoid(ZodNanoID, params));
  },
  cuid(params) {
    return this.check(_cuid(ZodCUID, params));
  },
  cuid2(params) {
    return this.check(_cuid2(ZodCUID2, params));
  },
  ulid(params) {
    return this.check(_ulid(ZodULID, params));
  },
  base64(params) {
    return this.check(_base64(ZodBase64, params));
  },
  base64url(params) {
    return this.check(_base64url(ZodBase64URL, params));
  },
  xid(params) {
    return this.check(_xid(ZodXID, params));
  },
  ksuid(params) {
    return this.check(_ksuid(ZodKSUID, params));
  },
  ipv4(params) {
    return this.check(_ipv4(ZodIPv4, params));
  },
  ipv6(params) {
    return this.check(_ipv6(ZodIPv6, params));
  },
  cidrv4(params) {
    return this.check(_cidrv4(ZodCIDRv4, params));
  },
  cidrv6(params) {
    return this.check(_cidrv6(ZodCIDRv6, params));
  },
  e164(params) {
    return this.check(_e164(ZodE164, params));
  },
  datetime(params) {
    return this.check(_isoDateTime(ZodISODateTime, params));
  },
  date(params) {
    return this.check(_isoDate(ZodISODate, params));
  },
  time(params) {
    return this.check(_isoTime(ZodISOTime, params));
  },
  duration(params) {
    return this.check(_isoDuration(ZodISODuration, params));
  }
});
function string2(params) {
  return _string(ZodString, params);
}
__name(string2, "string");
var ZodStringFormat = /* @__PURE__ */ $constructor("ZodStringFormat", (inst, def) => {
  $ZodStringFormat.init(inst, def);
  _ZodString.init(inst, def);
});
var ZodISODateTime = /* @__PURE__ */ $constructor("ZodISODateTime", (inst, def) => {
  $ZodISODateTime.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodISODate = /* @__PURE__ */ $constructor("ZodISODate", (inst, def) => {
  $ZodISODate.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodISOTime = /* @__PURE__ */ $constructor("ZodISOTime", (inst, def) => {
  $ZodISOTime.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodISODuration = /* @__PURE__ */ $constructor("ZodISODuration", (inst, def) => {
  $ZodISODuration.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodEmail = /* @__PURE__ */ $constructor("ZodEmail", (inst, def) => {
  $ZodEmail.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function email2(params) {
  return _email(ZodEmail, params);
}
__name(email2, "email");
var ZodGUID = /* @__PURE__ */ $constructor("ZodGUID", (inst, def) => {
  $ZodGUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodUUID = /* @__PURE__ */ $constructor("ZodUUID", (inst, def) => {
  $ZodUUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodURL = /* @__PURE__ */ $constructor("ZodURL", (inst, def) => {
  $ZodURL.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function url(params) {
  return _url(ZodURL, params);
}
__name(url, "url");
var ZodEmoji = /* @__PURE__ */ $constructor("ZodEmoji", (inst, def) => {
  $ZodEmoji.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodNanoID = /* @__PURE__ */ $constructor("ZodNanoID", (inst, def) => {
  $ZodNanoID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodCUID = /* @__PURE__ */ $constructor("ZodCUID", (inst, def) => {
  $ZodCUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodCUID2 = /* @__PURE__ */ $constructor("ZodCUID2", (inst, def) => {
  $ZodCUID2.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodULID = /* @__PURE__ */ $constructor("ZodULID", (inst, def) => {
  $ZodULID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodXID = /* @__PURE__ */ $constructor("ZodXID", (inst, def) => {
  $ZodXID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodKSUID = /* @__PURE__ */ $constructor("ZodKSUID", (inst, def) => {
  $ZodKSUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodIPv4 = /* @__PURE__ */ $constructor("ZodIPv4", (inst, def) => {
  $ZodIPv4.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodIPv6 = /* @__PURE__ */ $constructor("ZodIPv6", (inst, def) => {
  $ZodIPv6.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodCIDRv4 = /* @__PURE__ */ $constructor("ZodCIDRv4", (inst, def) => {
  $ZodCIDRv4.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodCIDRv6 = /* @__PURE__ */ $constructor("ZodCIDRv6", (inst, def) => {
  $ZodCIDRv6.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodBase64 = /* @__PURE__ */ $constructor("ZodBase64", (inst, def) => {
  $ZodBase64.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodBase64URL = /* @__PURE__ */ $constructor("ZodBase64URL", (inst, def) => {
  $ZodBase64URL.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodE164 = /* @__PURE__ */ $constructor("ZodE164", (inst, def) => {
  $ZodE164.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodJWT = /* @__PURE__ */ $constructor("ZodJWT", (inst, def) => {
  $ZodJWT.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodNumber = /* @__PURE__ */ $constructor(
  "ZodNumber",
  (inst, def) => {
    $ZodNumber.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => numberProcessor(inst, ctx, json, params);
    inst.isFinite = true;
  },
  /* @__PURE__ */ util_exports.derived({
    minValue: /* @__PURE__ */ __name((inst) => {
      const { minimum, exclusiveMinimum } = aggregateChecks(inst);
      return Math.max(minimum ?? Number.NEGATIVE_INFINITY, exclusiveMinimum ?? Number.NEGATIVE_INFINITY);
    }, "minValue"),
    maxValue: /* @__PURE__ */ __name((inst) => {
      const { maximum, exclusiveMaximum } = aggregateChecks(inst);
      return Math.min(maximum ?? Number.POSITIVE_INFINITY, exclusiveMaximum ?? Number.POSITIVE_INFINITY);
    }, "maxValue"),
    isInt: /* @__PURE__ */ __name((inst) => {
      const { isInt, multipleOf } = aggregateChecks(inst);
      return !!isInt || !!multipleOf?.some(Number.isSafeInteger);
    }, "isInt"),
    format: /* @__PURE__ */ __name((inst) => aggregateChecks(inst).format ?? null, "format")
  }, {
    gt(value, params) {
      return this.check(_gt(value, params));
    },
    gte(value, params) {
      return this.check(_gte(value, params));
    },
    min(value, params) {
      return this.check(_gte(value, params));
    },
    lt(value, params) {
      return this.check(_lt(value, params));
    },
    lte(value, params) {
      return this.check(_lte(value, params));
    },
    max(value, params) {
      return this.check(_lte(value, params));
    },
    int(params) {
      return this.check(int(params));
    },
    safe(params) {
      return this.check(int(params));
    },
    positive(params) {
      return this.check(_gt(0, params));
    },
    nonnegative(params) {
      return this.check(_gte(0, params));
    },
    negative(params) {
      return this.check(_lt(0, params));
    },
    nonpositive(params) {
      return this.check(_lte(0, params));
    },
    multipleOf(value, params) {
      return this.check(_multipleOf(value, params));
    },
    step(value, params) {
      return this.check(_multipleOf(value, params));
    },
    finite() {
      return this;
    }
  })
);
function number2(params) {
  return _number(ZodNumber, params);
}
__name(number2, "number");
var ZodNumberFormat = /* @__PURE__ */ $constructor("ZodNumberFormat", (inst, def) => {
  $ZodNumberFormat.init(inst, def);
  ZodNumber.init(inst, def);
});
function int(params) {
  return _int(ZodNumberFormat, params);
}
__name(int, "int");
var ZodBoolean = /* @__PURE__ */ $constructor("ZodBoolean", (inst, def) => {
  $ZodBoolean.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => booleanProcessor(inst, ctx, json, params);
});
function boolean2(params) {
  return _boolean(ZodBoolean, params);
}
__name(boolean2, "boolean");
var ZodBigInt = /* @__PURE__ */ $constructor(
  "ZodBigInt",
  (inst, def) => {
    $ZodBigInt.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => bigintProcessor(inst, ctx, json, params);
  },
  /* @__PURE__ */ util_exports.derived({
    minValue: /* @__PURE__ */ __name((inst) => aggregateChecks(inst).minimum ?? null, "minValue"),
    maxValue: /* @__PURE__ */ __name((inst) => aggregateChecks(inst).maximum ?? null, "maxValue"),
    format: /* @__PURE__ */ __name((inst) => aggregateChecks(inst).format ?? null, "format")
  }, {
    gte(value, params) {
      return this.check(_gte(value, params));
    },
    min(value, params) {
      return this.check(_gte(value, params));
    },
    gt(value, params) {
      return this.check(_gt(value, params));
    },
    lt(value, params) {
      return this.check(_lt(value, params));
    },
    lte(value, params) {
      return this.check(_lte(value, params));
    },
    max(value, params) {
      return this.check(_lte(value, params));
    },
    positive(params) {
      return this.check(_gt(BigInt(0), params));
    },
    negative(params) {
      return this.check(_lt(BigInt(0), params));
    },
    nonpositive(params) {
      return this.check(_lte(BigInt(0), params));
    },
    nonnegative(params) {
      return this.check(_gte(BigInt(0), params));
    },
    multipleOf(value, params) {
      return this.check(_multipleOf(value, params));
    }
  })
);
var ZodNull = /* @__PURE__ */ $constructor("ZodNull", (inst, def) => {
  $ZodNull.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => nullProcessor(inst, ctx, json, params);
});
function _null3(params) {
  return _null2(ZodNull, params);
}
__name(_null3, "_null");
var ZodAny = /* @__PURE__ */ $constructor("ZodAny", (inst, def) => {
  $ZodAny.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => anyProcessor(inst, ctx, json, params);
});
function any() {
  return _any(ZodAny);
}
__name(any, "any");
var ZodUnknown = /* @__PURE__ */ $constructor("ZodUnknown", (inst, def) => {
  $ZodUnknown.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => unknownProcessor(inst, ctx, json, params);
});
function unknown() {
  return _unknown(ZodUnknown);
}
__name(unknown, "unknown");
var ZodNever = /* @__PURE__ */ $constructor("ZodNever", (inst, def) => {
  $ZodNever.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => neverProcessor(inst, ctx, json, params);
});
function never(params) {
  return _never(ZodNever, params);
}
__name(never, "never");
var ZodDate = /* @__PURE__ */ $constructor(
  "ZodDate",
  (inst, def) => {
    $ZodDate.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json, params) => dateProcessor(inst, ctx, json, params);
    inst.min = (value, params) => inst.check(_gte(value, params));
    inst.max = (value, params) => inst.check(_lte(value, params));
  },
  /* @__PURE__ */ util_exports.derived({
    minDate: /* @__PURE__ */ __name((inst) => {
      const { minimum } = aggregateChecks(inst);
      return minimum ? new Date(minimum) : null;
    }, "minDate"),
    maxDate: /* @__PURE__ */ __name((inst) => {
      const { maximum } = aggregateChecks(inst);
      return maximum ? new Date(maximum) : null;
    }, "maxDate")
  }, {})
);
var ZodArray = /* @__PURE__ */ $constructor("ZodArray", (inst, def) => {
  _ensureDefaultMemoizer();
  $ZodArray.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => arrayProcessor(inst, ctx, json, params);
  inst.element = def.element;
}, {
  min(n, params) {
    return this.check(_minLength(n, params));
  },
  nonempty(params) {
    return this.check(_minLength(1, params));
  },
  max(n, params) {
    return this.check(_maxLength(n, params));
  },
  length(n, params) {
    return this.check(_length(n, params));
  },
  unwrap() {
    return this.element;
  }
});
function array(element, params) {
  return _array(ZodArray, element, params);
}
__name(array, "array");
var ZodObject = /* @__PURE__ */ $constructor("ZodObject", (inst, def) => {
  _ensureDefaultMemoizer();
  $ZodObjectJIT.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => objectProcessor(inst, ctx, json, params);
  util_exports.installLazyProp(inst, "shape", (self2) => self2._zod.def.shape, false);
}, {
  keyof() {
    return _enum(Object.keys(this._zod.def.shape));
  },
  catchall(catchall) {
    return this.clone(util_exports.mergeDefs(this._zod.def, { catchall }));
  },
  passthrough() {
    return this.clone(util_exports.mergeDefs(this._zod.def, { catchall: unknown() }));
  },
  loose() {
    return this.clone(util_exports.mergeDefs(this._zod.def, { catchall: unknown() }));
  },
  strict() {
    return this.clone(util_exports.mergeDefs(this._zod.def, { catchall: never() }));
  },
  strip() {
    return this.clone(util_exports.mergeDefs(this._zod.def, { catchall: void 0 }));
  },
  extend(incoming) {
    return util_exports.extend(this, incoming);
  },
  safeExtend(incoming) {
    return util_exports.safeExtend(this, incoming);
  },
  merge(other) {
    return util_exports.merge(this, other);
  },
  pick(mask) {
    return util_exports.pick(this, mask);
  },
  omit(mask) {
    return util_exports.omit(this, mask);
  },
  partial(...args) {
    return util_exports.partial(ZodOptional, this, args[0]);
  },
  exactPartial(...args) {
    return util_exports.partial(ZodExactOptional, this, args[0], "exactPartial");
  },
  required(...args) {
    return util_exports.required(ZodNonOptional, this, args[0]);
  }
});
function object(shape, params) {
  const def = {
    type: "object",
    shape: shape ?? {},
    ...util_exports.normalizeParams(params)
  };
  return new ZodObject(def);
}
__name(object, "object");
function looseObject(shape, params) {
  return new ZodObject({
    type: "object",
    shape,
    catchall: unknown(),
    ...util_exports.normalizeParams(params)
  });
}
__name(looseObject, "looseObject");
var ZodUnion = /* @__PURE__ */ $constructor("ZodUnion", (inst, def) => {
  $ZodUnion.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => unionProcessor(inst, ctx, json, params);
  inst.options = def.options;
});
function union(options, params) {
  return new ZodUnion({
    type: "union",
    options,
    ...util_exports.normalizeParams(params)
  });
}
__name(union, "union");
var ZodDiscriminatedUnion = /* @__PURE__ */ $constructor("ZodDiscriminatedUnion", (inst, def) => {
  ZodUnion.init(inst, def);
  $ZodDiscriminatedUnion.init(inst, def);
});
function discriminatedUnion(discriminator, options, params) {
  return new ZodDiscriminatedUnion({
    type: "union",
    options,
    discriminator,
    ...util_exports.normalizeParams(params)
  });
}
__name(discriminatedUnion, "discriminatedUnion");
var ZodIntersection = /* @__PURE__ */ $constructor("ZodIntersection", (inst, def) => {
  $ZodIntersection.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => intersectionProcessor(inst, ctx, json, params);
});
function intersection(left, right) {
  return new ZodIntersection({
    type: "intersection",
    left,
    right
  });
}
__name(intersection, "intersection");
var ZodRecord = /* @__PURE__ */ $constructor("ZodRecord", (inst, def) => {
  _ensureDefaultMemoizer();
  $ZodRecord.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => recordProcessor(inst, ctx, json, params);
  inst.keyType = def.keyType;
  inst.valueType = def.valueType;
});
function record(keyType, valueType, params) {
  if (!valueType || !valueType._zod) {
    return new ZodRecord({
      type: "record",
      keyType: string2(),
      valueType: keyType,
      ...util_exports.normalizeParams(valueType)
    });
  }
  return new ZodRecord({
    type: "record",
    keyType,
    valueType,
    ...util_exports.normalizeParams(params)
  });
}
__name(record, "record");
var ZodEnum = /* @__PURE__ */ $constructor("ZodEnum", (inst, def) => {
  $ZodEnum.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => enumProcessor(inst, ctx, json, params);
  inst.enum = def.entries;
  inst.options = [...inst._zod.values];
  const keys = new Set(Object.keys(def.entries));
  inst.extract = (values, params) => {
    const newEntries = {};
    for (const value of values) {
      if (keys.has(value)) {
        newEntries[value] = def.entries[value];
      } else
        throw new Error(`Key ${value} not found in enum`);
    }
    return new ZodEnum({
      ...def,
      checks: [],
      ...util_exports.normalizeParams(params),
      entries: newEntries
    });
  };
  inst.exclude = (values, params) => {
    const newEntries = { ...def.entries };
    for (const value of values) {
      if (keys.has(value)) {
        delete newEntries[value];
      } else
        throw new Error(`Key ${value} not found in enum`);
    }
    return new ZodEnum({
      ...def,
      checks: [],
      ...util_exports.normalizeParams(params),
      entries: newEntries
    });
  };
});
function _enum(values, params) {
  const entries = Array.isArray(values) ? Object.fromEntries(values.map((v) => [v, v])) : values;
  return new ZodEnum({
    type: "enum",
    entries,
    ...util_exports.normalizeParams(params)
  });
}
__name(_enum, "_enum");
var ZodLiteral = /* @__PURE__ */ $constructor("ZodLiteral", (inst, def) => {
  $ZodLiteral.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => literalProcessor(inst, ctx, json, params);
  inst.values = new Set(def.values);
  Object.defineProperty(inst, "value", {
    get() {
      if (def.values.length > 1) {
        throw new Error("This schema contains multiple valid literal values. Use `.values` instead.");
      }
      return def.values[0];
    }
  });
});
function literal(value, params) {
  return new ZodLiteral({
    type: "literal",
    values: Array.isArray(value) ? value : [value],
    ...util_exports.normalizeParams(params)
  });
}
__name(literal, "literal");
var ZodTransform = /* @__PURE__ */ $constructor("ZodTransform", (inst, def) => {
  _ensureDefaultMemoizer();
  $ZodTransform.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => transformProcessor(inst, ctx, json, params);
  inst._zod.parse = (payload, _ctx) => {
    if (_ctx.direction === "backward") {
      throw new $ZodEncodeError(inst.constructor.name);
    }
    payload.addIssue = (issue2) => {
      if (typeof issue2 === "string") {
        payload.issues.push(util_exports.issue(issue2, payload.value, def));
      } else {
        const _issue = issue2;
        if (_issue.fatal)
          _issue.continue = false;
        _issue.code ?? (_issue.code = "custom");
        if (!("input" in _issue))
          _issue.input = payload.value;
        _issue.inst ?? (_issue.inst = inst);
        payload.issues.push(util_exports.issue(_issue));
      }
    };
    const output = def.transform(payload.value, payload);
    if (output instanceof Promise) {
      return output.then((output2) => {
        payload.value = output2;
        return payload;
      });
    }
    payload.value = output;
    return payload;
  };
});
function transform(fn) {
  return new ZodTransform({
    type: "transform",
    transform: fn
  });
}
__name(transform, "transform");
var ZodOptional = /* @__PURE__ */ $constructor("ZodOptional", (inst, def) => {
  $ZodOptional.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => optionalProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function optional(innerType) {
  return new ZodOptional({
    type: "optional",
    innerType
  });
}
__name(optional, "optional");
var ZodExactOptional = /* @__PURE__ */ $constructor("ZodExactOptional", (inst, def) => {
  $ZodExactOptional.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => optionalProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function exactOptional(innerType) {
  return new ZodExactOptional({
    type: "optional",
    innerType
  });
}
__name(exactOptional, "exactOptional");
var ZodNullable = /* @__PURE__ */ $constructor("ZodNullable", (inst, def) => {
  $ZodNullable.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => nullableProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function nullable(innerType) {
  return new ZodNullable({
    type: "nullable",
    innerType
  });
}
__name(nullable, "nullable");
var ZodDefault = /* @__PURE__ */ $constructor("ZodDefault", (inst, def) => {
  $ZodDefault.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => defaultProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
  inst.removeDefault = inst.unwrap;
});
function _default(innerType, defaultValue) {
  return new ZodDefault({
    type: "default",
    innerType,
    get defaultValue() {
      return typeof defaultValue === "function" ? defaultValue() : util_exports.shallowClone(defaultValue);
    }
  });
}
__name(_default, "_default");
var ZodPrefault = /* @__PURE__ */ $constructor("ZodPrefault", (inst, def) => {
  $ZodPrefault.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => prefaultProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function prefault(innerType, defaultValue) {
  return new ZodPrefault({
    type: "prefault",
    innerType,
    get defaultValue() {
      return typeof defaultValue === "function" ? defaultValue() : util_exports.shallowClone(defaultValue);
    }
  });
}
__name(prefault, "prefault");
var ZodNonOptional = /* @__PURE__ */ $constructor("ZodNonOptional", (inst, def) => {
  $ZodNonOptional.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => nonoptionalProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function nonoptional(innerType, params) {
  return new ZodNonOptional({
    type: "nonoptional",
    innerType,
    ...util_exports.normalizeParams(params)
  });
}
__name(nonoptional, "nonoptional");
var ZodCatch = /* @__PURE__ */ $constructor("ZodCatch", (inst, def) => {
  $ZodCatch.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => catchProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
  inst.removeCatch = inst.unwrap;
});
function _catch(innerType, catchValue) {
  return new ZodCatch({
    type: "catch",
    innerType,
    catchValue: typeof catchValue === "function" ? catchValue : util_exports.constantCatch(catchValue)
  });
}
__name(_catch, "_catch");
var ZodPipe = /* @__PURE__ */ $constructor("ZodPipe", (inst, def) => {
  $ZodPipe.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => pipeProcessor(inst, ctx, json, params);
  inst.in = def.in;
  inst.out = def.out;
});
function pipe(in_, out) {
  return new ZodPipe({
    type: "pipe",
    in: in_,
    out
    // ...util.normalizeParams(params),
  });
}
__name(pipe, "pipe");
var ZodPreprocess = /* @__PURE__ */ $constructor("ZodPreprocess", (inst, def) => {
  ZodPipe.init(inst, def);
  $ZodPreprocess.init(inst, def);
});
var ZodReadonly = /* @__PURE__ */ $constructor("ZodReadonly", (inst, def) => {
  $ZodReadonly.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => readonlyProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function readonly(innerType) {
  return new ZodReadonly({
    type: "readonly",
    innerType
  });
}
__name(readonly, "readonly");
var ZodLazy = /* @__PURE__ */ $constructor("ZodLazy", (inst, def) => {
  $ZodLazy.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => lazyProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.getter();
});
function lazy(getter) {
  return new ZodLazy({
    type: "lazy",
    getter
  });
}
__name(lazy, "lazy");
var ZodCustom = /* @__PURE__ */ $constructor("ZodCustom", (inst, def) => {
  $ZodCustom.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => customProcessor(inst, ctx, json, params);
});
function refine(fn, _params = {}) {
  return _refine(ZodCustom, fn, _params);
}
__name(refine, "refine");
function superRefine(fn, params) {
  return _superRefine(fn, params);
}
__name(superRefine, "superRefine");
function preprocess(fn, schema) {
  return new ZodPreprocess({
    type: "pipe",
    in: transform(fn),
    out: schema
  });
}
__name(preprocess, "preprocess");

// ../../node_modules/zod/v4/classic/compat.js
var ZodIssueCode = {
  invalid_type: "invalid_type",
  too_big: "too_big",
  too_small: "too_small",
  invalid_format: "invalid_format",
  not_multiple_of: "not_multiple_of",
  unrecognized_keys: "unrecognized_keys",
  invalid_union: "invalid_union",
  invalid_key: "invalid_key",
  invalid_element: "invalid_element",
  invalid_value: "invalid_value",
  custom: "custom"
};
var ZodFirstPartyTypeKind;
/* @__PURE__ */ (function(ZodFirstPartyTypeKind2) {
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));

// ../../node_modules/zod/v4/classic/iso.js
var iso_exports = {};
__export(iso_exports, {
  ZodISODate: () => ZodISODate,
  ZodISODateTime: () => ZodISODateTime,
  ZodISODuration: () => ZodISODuration,
  ZodISOTime: () => ZodISOTime,
  date: () => date2,
  datetime: () => datetime2,
  duration: () => duration2,
  time: () => time2
});
function datetime2(params) {
  return _isoDateTime(ZodISODateTime, params);
}
__name(datetime2, "datetime");
function date2(params) {
  return _isoDate(ZodISODate, params);
}
__name(date2, "date");
function time2(params) {
  return _isoTime(ZodISOTime, params);
}
__name(time2, "time");
function duration2(params) {
  return _isoDuration(ZodISODuration, params);
}
__name(duration2, "duration");

// ../../node_modules/zod/v4/classic/coerce.js
var coerce_exports = {};
__export(coerce_exports, {
  bigint: () => bigint2,
  boolean: () => boolean3,
  date: () => date3,
  number: () => number3,
  string: () => string3
});
function string3(params) {
  return _coercedString(ZodString, params);
}
__name(string3, "string");
function number3(params) {
  return _coercedNumber(ZodNumber, params);
}
__name(number3, "number");
function boolean3(params) {
  return _coercedBoolean(ZodBoolean, params);
}
__name(boolean3, "boolean");
function bigint2(params) {
  return _coercedBigint(ZodBigInt, params);
}
__name(bigint2, "bigint");
function date3(params) {
  return _coercedDate(ZodDate, params);
}
__name(date3, "date");

// ../../node_modules/@modelcontextprotocol/core/dist/schemas-DscsoNZN.mjs
var LATEST_PROTOCOL_VERSION = "2025-11-25";
var DEFAULT_NEGOTIATED_PROTOCOL_VERSION = "2025-03-26";
var SUPPORTED_PROTOCOL_VERSIONS = [
  LATEST_PROTOCOL_VERSION,
  "2025-06-18",
  "2025-03-26",
  "2024-11-05",
  "2024-10-07"
];
var RELATED_TASK_META_KEY = "io.modelcontextprotocol/related-task";
var PROTOCOL_VERSION_META_KEY = "io.modelcontextprotocol/protocolVersion";
var CLIENT_INFO_META_KEY = "io.modelcontextprotocol/clientInfo";
var SERVER_INFO_META_KEY = "io.modelcontextprotocol/serverInfo";
var CLIENT_CAPABILITIES_META_KEY = "io.modelcontextprotocol/clientCapabilities";
var SUBSCRIPTION_ID_META_KEY = "io.modelcontextprotocol/subscriptionId";
var LOG_LEVEL_META_KEY = "io.modelcontextprotocol/logLevel";
var JSONRPC_VERSION = "2.0";
var JSONValueSchema = lazy(() => union([
  string2(),
  number2(),
  boolean2(),
  _null3(),
  record(string2(), JSONValueSchema),
  array(JSONValueSchema)
]));
var JSONObjectSchema = record(string2(), JSONValueSchema);
var JSONArraySchema = array(JSONValueSchema);
var ProgressTokenSchema = union([string2(), number2().int()]);
var CursorSchema = string2();
var TaskMetadataSchema = object({ ttl: number2().optional() });
var RelatedTaskMetadataSchema = object({ taskId: string2() });
var RequestMetaSchema = looseObject({
  progressToken: ProgressTokenSchema.optional(),
  [RELATED_TASK_META_KEY]: RelatedTaskMetadataSchema.optional()
});
var BaseRequestParamsSchema = object({ _meta: RequestMetaSchema.optional() });
var TaskAugmentedRequestParamsSchema = BaseRequestParamsSchema.extend({ task: TaskMetadataSchema.optional() });
var RequestSchema = object({
  method: string2(),
  params: BaseRequestParamsSchema.loose().optional()
});
var NotificationsParamsSchema = object({ _meta: RequestMetaSchema.optional() });
var NotificationSchema = object({
  method: string2(),
  params: NotificationsParamsSchema.loose().optional()
});
var ResultMetaObjectSchema = looseObject({ get [SERVER_INFO_META_KEY]() {
  return ImplementationSchema.optional().catch(void 0);
} });
var ResultSchema = looseObject({ _meta: ResultMetaObjectSchema.optional() });
var RequestIdSchema = union([string2(), number2().int()]);
var JSONRPCRequestSchema = object({
  jsonrpc: literal(JSONRPC_VERSION),
  id: RequestIdSchema,
  ...RequestSchema.shape
}).strict();
var JSONRPCNotificationSchema = object({
  jsonrpc: literal(JSONRPC_VERSION),
  ...NotificationSchema.shape
}).strict();
var JSONRPCResultResponseSchema = object({
  jsonrpc: literal(JSONRPC_VERSION),
  id: RequestIdSchema,
  result: ResultSchema
}).strict();
var JSONRPCErrorResponseSchema = object({
  jsonrpc: literal(JSONRPC_VERSION),
  id: RequestIdSchema.optional(),
  error: object({
    code: number2().int(),
    message: string2(),
    data: unknown().optional()
  })
}).strict();
var JSONRPCMessageSchema = union([
  JSONRPCRequestSchema,
  JSONRPCNotificationSchema,
  JSONRPCResultResponseSchema,
  JSONRPCErrorResponseSchema
]);
var JSONRPCResponseSchema = union([JSONRPCResultResponseSchema, JSONRPCErrorResponseSchema]);
var EmptyResultSchema = ResultSchema.strict();
var CancelledNotificationParamsSchema = NotificationsParamsSchema.extend({
  requestId: RequestIdSchema.optional(),
  reason: string2().optional()
});
var CancelledNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/cancelled"),
  params: CancelledNotificationParamsSchema
});
var IconSchema = object({
  src: string2(),
  mimeType: string2().optional(),
  sizes: array(string2()).optional(),
  theme: _enum(["light", "dark"]).optional()
});
var IconsSchema = object({ icons: array(IconSchema).optional() });
var BaseMetadataSchema = object({
  name: string2(),
  title: string2().optional()
});
var ImplementationSchema = BaseMetadataSchema.extend({
  ...BaseMetadataSchema.shape,
  ...IconsSchema.shape,
  version: string2(),
  websiteUrl: string2().optional(),
  description: string2().optional()
});
var FormElicitationCapabilitySchema = intersection(object({ applyDefaults: boolean2().optional() }), JSONObjectSchema);
var ElicitationCapabilitySchema = preprocess((value) => {
  if (value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0) return { form: {} };
  return value;
}, intersection(object({
  form: FormElicitationCapabilitySchema.optional(),
  url: JSONObjectSchema.optional()
}), JSONObjectSchema.optional()));
var ClientTasksCapabilitySchema = looseObject({
  list: JSONObjectSchema.optional(),
  cancel: JSONObjectSchema.optional(),
  requests: looseObject({
    sampling: looseObject({ createMessage: JSONObjectSchema.optional() }).optional(),
    elicitation: looseObject({ create: JSONObjectSchema.optional() }).optional()
  }).optional()
});
var ServerTasksCapabilitySchema = looseObject({
  list: JSONObjectSchema.optional(),
  cancel: JSONObjectSchema.optional(),
  requests: looseObject({ tools: looseObject({ call: JSONObjectSchema.optional() }).optional() }).optional()
});
var ClientCapabilitiesSchema = object({
  experimental: record(string2(), JSONObjectSchema).optional(),
  sampling: object({
    context: JSONObjectSchema.optional(),
    tools: JSONObjectSchema.optional()
  }).optional(),
  elicitation: ElicitationCapabilitySchema.optional(),
  roots: object({ listChanged: boolean2().optional() }).optional(),
  tasks: ClientTasksCapabilitySchema.optional(),
  extensions: record(string2(), JSONObjectSchema).optional()
});
var InitializeRequestParamsSchema = BaseRequestParamsSchema.extend({
  protocolVersion: string2(),
  capabilities: ClientCapabilitiesSchema,
  clientInfo: ImplementationSchema
});
var InitializeRequestSchema = RequestSchema.extend({
  method: literal("initialize"),
  params: InitializeRequestParamsSchema
});
var ServerCapabilitiesSchema = object({
  experimental: record(string2(), JSONObjectSchema).optional(),
  logging: JSONObjectSchema.optional(),
  completions: JSONObjectSchema.optional(),
  prompts: object({ listChanged: boolean2().optional() }).optional(),
  resources: object({
    subscribe: boolean2().optional(),
    listChanged: boolean2().optional()
  }).optional(),
  tools: object({ listChanged: boolean2().optional() }).optional(),
  tasks: ServerTasksCapabilitySchema.optional(),
  extensions: record(string2(), JSONObjectSchema).optional()
});
var InitializeResultSchema = ResultSchema.extend({
  protocolVersion: string2(),
  capabilities: ServerCapabilitiesSchema,
  serverInfo: ImplementationSchema,
  instructions: string2().optional()
});
var InitializedNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/initialized"),
  params: NotificationsParamsSchema.optional()
});
var DiscoverRequestSchema = RequestSchema.extend({
  method: literal("server/discover"),
  params: BaseRequestParamsSchema.optional()
});
var DiscoverResultSchema = ResultSchema.extend({
  supportedVersions: array(string2()),
  capabilities: ServerCapabilitiesSchema,
  instructions: string2().optional()
});
var PingRequestSchema = RequestSchema.extend({
  method: literal("ping"),
  params: BaseRequestParamsSchema.optional()
});
var ProgressSchema = object({
  progress: number2(),
  total: optional(number2()),
  message: optional(string2())
});
var ProgressNotificationParamsSchema = object({
  ...NotificationsParamsSchema.shape,
  ...ProgressSchema.shape,
  progressToken: ProgressTokenSchema
});
var ProgressNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/progress"),
  params: ProgressNotificationParamsSchema
});
var PaginatedRequestParamsSchema = BaseRequestParamsSchema.extend({ cursor: CursorSchema.optional() });
var PaginatedRequestSchema = RequestSchema.extend({ params: PaginatedRequestParamsSchema.optional() });
var PaginatedResultSchema = ResultSchema.extend({ nextCursor: CursorSchema.optional() });
var ResourceContentsSchema = object({
  uri: string2(),
  mimeType: optional(string2()),
  _meta: record(string2(), unknown()).optional()
});
var TextResourceContentsSchema = ResourceContentsSchema.extend({ text: string2() });
var Base64Schema = string2().refine((val) => {
  try {
    atob(val);
    return true;
  } catch {
    return false;
  }
}, { message: "Invalid Base64 string" });
var BlobResourceContentsSchema = ResourceContentsSchema.extend({ blob: Base64Schema });
var RoleSchema = _enum(["user", "assistant"]);
var AnnotationsSchema = object({
  audience: array(RoleSchema).optional(),
  priority: number2().min(0).max(1).optional(),
  lastModified: iso_exports.datetime({ offset: true }).optional()
});
var ResourceSchema = object({
  ...BaseMetadataSchema.shape,
  ...IconsSchema.shape,
  uri: string2(),
  description: optional(string2()),
  mimeType: optional(string2()),
  size: optional(number2()),
  annotations: AnnotationsSchema.optional(),
  _meta: optional(looseObject({}))
});
var ResourceTemplateSchema = object({
  ...BaseMetadataSchema.shape,
  ...IconsSchema.shape,
  uriTemplate: string2(),
  description: optional(string2()),
  mimeType: optional(string2()),
  annotations: AnnotationsSchema.optional(),
  _meta: optional(looseObject({}))
});
var ListResourcesRequestSchema = PaginatedRequestSchema.extend({ method: literal("resources/list") });
var ListResourcesResultSchema = PaginatedResultSchema.extend({ resources: array(ResourceSchema) });
var ListResourceTemplatesRequestSchema = PaginatedRequestSchema.extend({ method: literal("resources/templates/list") });
var ListResourceTemplatesResultSchema = PaginatedResultSchema.extend({ resourceTemplates: array(ResourceTemplateSchema) });
var ResourceRequestParamsSchema = BaseRequestParamsSchema.extend({ uri: string2() });
var ReadResourceRequestParamsSchema = ResourceRequestParamsSchema;
var ReadResourceRequestSchema = RequestSchema.extend({
  method: literal("resources/read"),
  params: ReadResourceRequestParamsSchema
});
var ReadResourceResultSchema = ResultSchema.extend({ contents: array(union([TextResourceContentsSchema, BlobResourceContentsSchema])) });
var ResourceListChangedNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/resources/list_changed"),
  params: NotificationsParamsSchema.optional()
});
var SubscribeRequestParamsSchema = ResourceRequestParamsSchema;
var SubscribeRequestSchema = RequestSchema.extend({
  method: literal("resources/subscribe"),
  params: SubscribeRequestParamsSchema
});
var UnsubscribeRequestParamsSchema = ResourceRequestParamsSchema;
var UnsubscribeRequestSchema = RequestSchema.extend({
  method: literal("resources/unsubscribe"),
  params: UnsubscribeRequestParamsSchema
});
var SubscriptionFilterSchema = object({
  toolsListChanged: boolean2().optional(),
  promptsListChanged: boolean2().optional(),
  resourcesListChanged: boolean2().optional(),
  resourceSubscriptions: array(string2()).optional()
});
var SubscriptionsListenRequestParamsSchema = BaseRequestParamsSchema.extend({ notifications: SubscriptionFilterSchema });
var SubscriptionsListenRequestSchema = RequestSchema.extend({
  method: literal("subscriptions/listen"),
  params: SubscriptionsListenRequestParamsSchema
});
var SubscriptionsAcknowledgedNotificationParamsSchema = NotificationsParamsSchema.extend({ notifications: SubscriptionFilterSchema });
var SubscriptionsAcknowledgedNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/subscriptions/acknowledged"),
  params: SubscriptionsAcknowledgedNotificationParamsSchema
});
var SubscriptionsListenResultMetaSchema = ResultMetaObjectSchema.extend({ [SUBSCRIPTION_ID_META_KEY]: RequestIdSchema });
var SubscriptionsListenResultSchema = ResultSchema.extend({ _meta: SubscriptionsListenResultMetaSchema });
var ResourceUpdatedNotificationParamsSchema = NotificationsParamsSchema.extend({ uri: string2() });
var ResourceUpdatedNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/resources/updated"),
  params: ResourceUpdatedNotificationParamsSchema
});
var PromptArgumentSchema = object({
  name: string2(),
  description: optional(string2()),
  required: optional(boolean2())
});
var PromptSchema = object({
  ...BaseMetadataSchema.shape,
  ...IconsSchema.shape,
  description: optional(string2()),
  arguments: optional(array(PromptArgumentSchema)),
  _meta: optional(looseObject({}))
});
var ListPromptsRequestSchema = PaginatedRequestSchema.extend({ method: literal("prompts/list") });
var ListPromptsResultSchema = PaginatedResultSchema.extend({ prompts: array(PromptSchema) });
var GetPromptRequestParamsSchema = BaseRequestParamsSchema.extend({
  name: string2(),
  arguments: record(string2(), string2()).optional()
});
var GetPromptRequestSchema = RequestSchema.extend({
  method: literal("prompts/get"),
  params: GetPromptRequestParamsSchema
});
var TextContentSchema = object({
  type: literal("text"),
  text: string2(),
  annotations: AnnotationsSchema.optional(),
  _meta: record(string2(), unknown()).optional()
});
var ImageContentSchema = object({
  type: literal("image"),
  data: Base64Schema,
  mimeType: string2(),
  annotations: AnnotationsSchema.optional(),
  _meta: record(string2(), unknown()).optional()
});
var AudioContentSchema = object({
  type: literal("audio"),
  data: Base64Schema,
  mimeType: string2(),
  annotations: AnnotationsSchema.optional(),
  _meta: record(string2(), unknown()).optional()
});
var ToolUseContentSchema = object({
  type: literal("tool_use"),
  name: string2(),
  id: string2(),
  input: record(string2(), unknown()),
  _meta: record(string2(), unknown()).optional()
});
var EmbeddedResourceSchema = object({
  type: literal("resource"),
  resource: union([TextResourceContentsSchema, BlobResourceContentsSchema]),
  annotations: AnnotationsSchema.optional(),
  _meta: record(string2(), unknown()).optional()
});
var ResourceLinkSchema = ResourceSchema.extend({ type: literal("resource_link") });
var ContentBlockSchema = union([
  TextContentSchema,
  ImageContentSchema,
  AudioContentSchema,
  ResourceLinkSchema,
  EmbeddedResourceSchema
]);
var PromptMessageSchema = object({
  role: RoleSchema,
  content: ContentBlockSchema
});
var GetPromptResultSchema = ResultSchema.extend({
  description: string2().optional(),
  messages: array(PromptMessageSchema)
});
var PromptListChangedNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/prompts/list_changed"),
  params: NotificationsParamsSchema.optional()
});
var ToolAnnotationsSchema = object({
  title: string2().optional(),
  readOnlyHint: boolean2().optional(),
  destructiveHint: boolean2().optional(),
  idempotentHint: boolean2().optional(),
  openWorldHint: boolean2().optional()
});
var ToolExecutionSchema = object({ taskSupport: _enum([
  "required",
  "optional",
  "forbidden"
]).optional() });
var ToolSchema = object({
  ...BaseMetadataSchema.shape,
  ...IconsSchema.shape,
  description: string2().optional(),
  inputSchema: object({
    type: literal("object"),
    properties: record(string2(), JSONValueSchema).optional(),
    required: array(string2()).optional()
  }).catchall(unknown()),
  outputSchema: looseObject({ $schema: string2().optional() }).optional(),
  annotations: ToolAnnotationsSchema.optional(),
  execution: ToolExecutionSchema.optional(),
  _meta: record(string2(), unknown()).optional()
});
var ListToolsRequestSchema = PaginatedRequestSchema.extend({ method: literal("tools/list") });
var ListToolsResultSchema = PaginatedResultSchema.extend({ tools: array(ToolSchema) });
var CallToolResultSchema = ResultSchema.extend({
  content: array(ContentBlockSchema).default([]),
  structuredContent: unknown().optional(),
  isError: boolean2().optional()
});
var CompatibilityCallToolResultSchema = CallToolResultSchema.or(ResultSchema.extend({ toolResult: unknown() }));
var CallToolRequestParamsSchema = TaskAugmentedRequestParamsSchema.extend({
  name: string2(),
  arguments: record(string2(), unknown()).optional()
});
var CallToolRequestSchema = RequestSchema.extend({
  method: literal("tools/call"),
  params: CallToolRequestParamsSchema
});
var ToolListChangedNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/tools/list_changed"),
  params: NotificationsParamsSchema.optional()
});
var ListChangedOptionsBaseSchema = object({
  autoRefresh: boolean2().default(true),
  debounceMs: number2().int().nonnegative().default(300)
});
var LoggingLevelSchema = _enum([
  "debug",
  "info",
  "notice",
  "warning",
  "error",
  "critical",
  "alert",
  "emergency"
]);
var SetLevelRequestParamsSchema = BaseRequestParamsSchema.extend({ level: LoggingLevelSchema });
var SetLevelRequestSchema = RequestSchema.extend({
  method: literal("logging/setLevel"),
  params: SetLevelRequestParamsSchema
});
var LoggingMessageNotificationParamsSchema = NotificationsParamsSchema.extend({
  level: LoggingLevelSchema,
  logger: string2().optional(),
  data: unknown()
});
var LoggingMessageNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/message"),
  params: LoggingMessageNotificationParamsSchema
});
var ModelHintSchema = object({ name: string2().optional() });
var ModelPreferencesSchema = object({
  hints: array(ModelHintSchema).optional(),
  costPriority: number2().min(0).max(1).optional(),
  speedPriority: number2().min(0).max(1).optional(),
  intelligencePriority: number2().min(0).max(1).optional()
});
var ToolChoiceSchema = object({ mode: _enum([
  "auto",
  "required",
  "none"
]).optional() });
var ToolResultContentSchema = object({
  type: literal("tool_result"),
  toolUseId: string2().describe("The unique identifier for the corresponding tool call."),
  content: array(ContentBlockSchema),
  structuredContent: unknown().optional(),
  isError: boolean2().optional(),
  _meta: record(string2(), unknown()).optional()
});
var SamplingContentSchema = discriminatedUnion("type", [
  TextContentSchema,
  ImageContentSchema,
  AudioContentSchema
]);
var SamplingMessageContentBlockSchema = discriminatedUnion("type", [
  TextContentSchema,
  ImageContentSchema,
  AudioContentSchema,
  ToolUseContentSchema,
  ToolResultContentSchema
]);
var SamplingMessageSchema = object({
  role: RoleSchema,
  content: union([SamplingMessageContentBlockSchema, array(SamplingMessageContentBlockSchema)]),
  _meta: record(string2(), unknown()).optional()
});
var CreateMessageRequestParamsSchema = TaskAugmentedRequestParamsSchema.extend({
  messages: array(SamplingMessageSchema),
  modelPreferences: ModelPreferencesSchema.optional(),
  systemPrompt: string2().optional(),
  includeContext: _enum([
    "none",
    "thisServer",
    "allServers"
  ]).optional(),
  temperature: number2().optional(),
  maxTokens: number2().int(),
  stopSequences: array(string2()).optional(),
  metadata: JSONObjectSchema.optional(),
  tools: array(ToolSchema).optional(),
  toolChoice: ToolChoiceSchema.optional()
});
var CreateMessageRequestSchema = RequestSchema.extend({
  method: literal("sampling/createMessage"),
  params: CreateMessageRequestParamsSchema
});
var CreateMessageResultSchema = ResultSchema.extend({
  model: string2(),
  stopReason: optional(_enum([
    "endTurn",
    "stopSequence",
    "maxTokens"
  ]).or(string2())),
  role: RoleSchema,
  content: SamplingContentSchema
});
var CreateMessageResultWithToolsSchema = ResultSchema.extend({
  model: string2(),
  stopReason: optional(_enum([
    "endTurn",
    "stopSequence",
    "maxTokens",
    "toolUse"
  ]).or(string2())),
  role: RoleSchema,
  content: union([SamplingMessageContentBlockSchema, array(SamplingMessageContentBlockSchema)])
});
var BooleanSchemaSchema = object({
  type: literal("boolean"),
  title: string2().optional(),
  description: string2().optional(),
  default: boolean2().optional()
});
var StringSchemaSchema = object({
  type: literal("string"),
  title: string2().optional(),
  description: string2().optional(),
  minLength: number2().optional(),
  maxLength: number2().optional(),
  format: _enum([
    "email",
    "uri",
    "date",
    "date-time"
  ]).optional(),
  default: string2().optional()
});
var NumberSchemaSchema = object({
  type: _enum(["number", "integer"]),
  title: string2().optional(),
  description: string2().optional(),
  minimum: number2().optional(),
  maximum: number2().optional(),
  default: number2().optional()
});
var UntitledSingleSelectEnumSchemaSchema = object({
  type: literal("string"),
  title: string2().optional(),
  description: string2().optional(),
  enum: array(string2()),
  default: string2().optional()
});
var TitledSingleSelectEnumSchemaSchema = object({
  type: literal("string"),
  title: string2().optional(),
  description: string2().optional(),
  oneOf: array(object({
    const: string2(),
    title: string2()
  })),
  default: string2().optional()
});
var LegacyTitledEnumSchemaSchema = object({
  type: literal("string"),
  title: string2().optional(),
  description: string2().optional(),
  enum: array(string2()),
  enumNames: array(string2()).optional(),
  default: string2().optional()
});
var SingleSelectEnumSchemaSchema = union([UntitledSingleSelectEnumSchemaSchema, TitledSingleSelectEnumSchemaSchema]);
var UntitledMultiSelectEnumSchemaSchema = object({
  type: literal("array"),
  title: string2().optional(),
  description: string2().optional(),
  minItems: number2().optional(),
  maxItems: number2().optional(),
  items: object({
    type: literal("string"),
    enum: array(string2())
  }),
  default: array(string2()).optional()
});
var TitledMultiSelectEnumSchemaSchema = object({
  type: literal("array"),
  title: string2().optional(),
  description: string2().optional(),
  minItems: number2().optional(),
  maxItems: number2().optional(),
  items: object({ anyOf: array(object({
    const: string2(),
    title: string2()
  })) }),
  default: array(string2()).optional()
});
var MultiSelectEnumSchemaSchema = union([UntitledMultiSelectEnumSchemaSchema, TitledMultiSelectEnumSchemaSchema]);
var EnumSchemaSchema = union([
  LegacyTitledEnumSchemaSchema,
  SingleSelectEnumSchemaSchema,
  MultiSelectEnumSchemaSchema
]);
var PrimitiveSchemaDefinitionSchema = union([
  EnumSchemaSchema,
  BooleanSchemaSchema,
  StringSchemaSchema,
  NumberSchemaSchema
]);
var ElicitRequestFormParamsSchema = TaskAugmentedRequestParamsSchema.extend({
  mode: literal("form").optional(),
  message: string2(),
  requestedSchema: object({
    type: literal("object"),
    properties: record(string2(), PrimitiveSchemaDefinitionSchema),
    required: array(string2()).optional()
  }).catchall(unknown())
});
var ElicitRequestURLParamsSchema = TaskAugmentedRequestParamsSchema.extend({
  mode: literal("url"),
  message: string2(),
  elicitationId: string2(),
  url: string2().url()
});
var ElicitRequestParamsSchema = union([ElicitRequestFormParamsSchema, ElicitRequestURLParamsSchema]);
var ElicitRequestSchema = RequestSchema.extend({
  method: literal("elicitation/create"),
  params: ElicitRequestParamsSchema
});
var ElicitationCompleteNotificationParamsSchema = NotificationsParamsSchema.extend({ elicitationId: string2() });
var ElicitationCompleteNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/elicitation/complete"),
  params: ElicitationCompleteNotificationParamsSchema
});
var ElicitResultSchema = ResultSchema.extend({
  action: _enum([
    "accept",
    "decline",
    "cancel"
  ]),
  content: preprocess((val) => val === null ? void 0 : val, record(string2(), union([
    string2(),
    number2(),
    boolean2(),
    array(string2())
  ])).optional())
});
var ResourceTemplateReferenceSchema = object({
  type: literal("ref/resource"),
  uri: string2()
});
var PromptReferenceSchema = object({
  type: literal("ref/prompt"),
  name: string2()
});
var CompleteRequestParamsSchema = BaseRequestParamsSchema.extend({
  ref: union([PromptReferenceSchema, ResourceTemplateReferenceSchema]),
  argument: object({
    name: string2(),
    value: string2()
  }),
  context: object({ arguments: record(string2(), string2()).optional() }).optional()
});
var CompleteRequestSchema = RequestSchema.extend({
  method: literal("completion/complete"),
  params: CompleteRequestParamsSchema
});
var CompleteResultSchema = ResultSchema.extend({ completion: looseObject({
  values: array(string2()).max(100),
  total: optional(number2().int()),
  hasMore: optional(boolean2())
}) });
var RootSchema = object({
  uri: string2().startsWith("file://"),
  name: string2().optional(),
  _meta: record(string2(), unknown()).optional()
});
var ListRootsRequestSchema = RequestSchema.extend({
  method: literal("roots/list"),
  params: BaseRequestParamsSchema.optional()
});
var ListRootsResultSchema = ResultSchema.extend({ roots: array(RootSchema) });
var RootsListChangedNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/roots/list_changed"),
  params: NotificationsParamsSchema.optional()
});
var TaskCreationParamsSchema = looseObject({
  ttl: number2().optional(),
  pollInterval: number2().optional()
});
var TaskStatusSchema = _enum([
  "working",
  "input_required",
  "completed",
  "failed",
  "cancelled"
]);
var TaskSchema = object({
  taskId: string2(),
  status: TaskStatusSchema,
  ttl: union([number2(), _null3()]),
  createdAt: string2(),
  lastUpdatedAt: string2(),
  pollInterval: optional(number2()),
  statusMessage: optional(string2())
});
var CreateTaskResultSchema = ResultSchema.extend({ task: TaskSchema });
var TaskStatusNotificationParamsSchema = NotificationsParamsSchema.merge(TaskSchema);
var TaskStatusNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/tasks/status"),
  params: TaskStatusNotificationParamsSchema
});
var GetTaskRequestSchema = RequestSchema.extend({
  method: literal("tasks/get"),
  params: BaseRequestParamsSchema.extend({ taskId: string2() })
});
var GetTaskResultSchema = ResultSchema.merge(TaskSchema);
var GetTaskPayloadRequestSchema = RequestSchema.extend({
  method: literal("tasks/result"),
  params: BaseRequestParamsSchema.extend({ taskId: string2() })
});
var GetTaskPayloadResultSchema = ResultSchema.loose();
var ListTasksRequestSchema = PaginatedRequestSchema.extend({ method: literal("tasks/list") });
var ListTasksResultSchema = PaginatedResultSchema.extend({ tasks: array(TaskSchema) });
var CancelTaskRequestSchema = RequestSchema.extend({
  method: literal("tasks/cancel"),
  params: BaseRequestParamsSchema.extend({ taskId: string2() })
});
var CancelTaskResultSchema = ResultSchema.merge(TaskSchema);
var ClientRequestSchema = union([
  PingRequestSchema,
  InitializeRequestSchema,
  DiscoverRequestSchema,
  CompleteRequestSchema,
  SetLevelRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ReadResourceRequestSchema,
  SubscribeRequestSchema,
  UnsubscribeRequestSchema,
  SubscriptionsListenRequestSchema,
  CallToolRequestSchema,
  ListToolsRequestSchema
]);
var ClientNotificationSchema = union([
  CancelledNotificationSchema,
  ProgressNotificationSchema,
  InitializedNotificationSchema,
  RootsListChangedNotificationSchema
]);
var ClientResultSchema = union([
  EmptyResultSchema,
  CreateMessageResultSchema,
  CreateMessageResultWithToolsSchema,
  ElicitResultSchema,
  ListRootsResultSchema
]);
var ServerRequestSchema = union([
  PingRequestSchema,
  CreateMessageRequestSchema,
  ElicitRequestSchema,
  ListRootsRequestSchema
]);
var ServerNotificationSchema = union([
  CancelledNotificationSchema,
  ProgressNotificationSchema,
  LoggingMessageNotificationSchema,
  ResourceUpdatedNotificationSchema,
  ResourceListChangedNotificationSchema,
  ToolListChangedNotificationSchema,
  PromptListChangedNotificationSchema,
  SubscriptionsAcknowledgedNotificationSchema,
  ElicitationCompleteNotificationSchema
]);
var ServerResultSchema = union([
  EmptyResultSchema,
  InitializeResultSchema,
  DiscoverResultSchema,
  CompleteResultSchema,
  GetPromptResultSchema,
  ListPromptsResultSchema,
  ListResourcesResultSchema,
  ListResourceTemplatesResultSchema,
  ReadResourceResultSchema,
  CallToolResultSchema,
  ListToolsResultSchema,
  SubscriptionsListenResultSchema
]);

// ../../node_modules/@modelcontextprotocol/core/dist/auth-UMQCo-ad.mjs
var SafeUrlSchema = url().superRefine((val, ctx) => {
  if (!URL.canParse(val)) {
    ctx.addIssue({
      code: ZodIssueCode.custom,
      message: "URL must be parseable",
      fatal: true
    });
    return NEVER;
  }
}).refine((url2) => {
  const u = new URL(url2);
  return u.protocol !== "javascript:" && u.protocol !== "data:" && u.protocol !== "vbscript:";
}, { message: "URL cannot use javascript:, data:, or vbscript: scheme" });
var OAuthProtectedResourceMetadataSchema = looseObject({
  resource: string2().url(),
  authorization_servers: array(SafeUrlSchema).optional(),
  jwks_uri: string2().url().optional(),
  scopes_supported: array(string2()).optional(),
  bearer_methods_supported: array(string2()).optional(),
  resource_signing_alg_values_supported: array(string2()).optional(),
  resource_name: string2().optional(),
  resource_documentation: string2().optional(),
  resource_policy_uri: string2().url().optional(),
  resource_tos_uri: string2().url().optional(),
  tls_client_certificate_bound_access_tokens: boolean2().optional(),
  authorization_details_types_supported: array(string2()).optional(),
  dpop_signing_alg_values_supported: array(string2()).optional(),
  dpop_bound_access_tokens_required: boolean2().optional()
});
var OAuthMetadataSchema = looseObject({
  issuer: string2(),
  authorization_endpoint: SafeUrlSchema,
  token_endpoint: SafeUrlSchema,
  registration_endpoint: SafeUrlSchema.optional(),
  scopes_supported: array(string2()).optional(),
  response_types_supported: array(string2()),
  response_modes_supported: array(string2()).optional(),
  grant_types_supported: array(string2()).optional(),
  token_endpoint_auth_methods_supported: array(string2()).optional(),
  token_endpoint_auth_signing_alg_values_supported: array(string2()).optional(),
  service_documentation: SafeUrlSchema.optional(),
  revocation_endpoint: SafeUrlSchema.optional(),
  revocation_endpoint_auth_methods_supported: array(string2()).optional(),
  revocation_endpoint_auth_signing_alg_values_supported: array(string2()).optional(),
  introspection_endpoint: string2().optional(),
  introspection_endpoint_auth_methods_supported: array(string2()).optional(),
  introspection_endpoint_auth_signing_alg_values_supported: array(string2()).optional(),
  code_challenge_methods_supported: array(string2()).optional(),
  client_id_metadata_document_supported: boolean2().optional(),
  authorization_response_iss_parameter_supported: boolean2().optional().catch(void 0),
  dpop_signing_alg_values_supported: array(string2()).optional()
});
var OpenIdProviderMetadataSchema = looseObject({
  issuer: string2(),
  authorization_endpoint: SafeUrlSchema,
  token_endpoint: SafeUrlSchema,
  userinfo_endpoint: SafeUrlSchema.optional(),
  jwks_uri: SafeUrlSchema,
  registration_endpoint: SafeUrlSchema.optional(),
  scopes_supported: array(string2()).optional(),
  response_types_supported: array(string2()),
  response_modes_supported: array(string2()).optional(),
  grant_types_supported: array(string2()).optional(),
  acr_values_supported: array(string2()).optional(),
  subject_types_supported: array(string2()),
  id_token_signing_alg_values_supported: array(string2()),
  id_token_encryption_alg_values_supported: array(string2()).optional(),
  id_token_encryption_enc_values_supported: array(string2()).optional(),
  userinfo_signing_alg_values_supported: array(string2()).optional(),
  userinfo_encryption_alg_values_supported: array(string2()).optional(),
  userinfo_encryption_enc_values_supported: array(string2()).optional(),
  request_object_signing_alg_values_supported: array(string2()).optional(),
  request_object_encryption_alg_values_supported: array(string2()).optional(),
  request_object_encryption_enc_values_supported: array(string2()).optional(),
  token_endpoint_auth_methods_supported: array(string2()).optional(),
  token_endpoint_auth_signing_alg_values_supported: array(string2()).optional(),
  display_values_supported: array(string2()).optional(),
  claim_types_supported: array(string2()).optional(),
  claims_supported: array(string2()).optional(),
  service_documentation: string2().optional(),
  claims_locales_supported: array(string2()).optional(),
  ui_locales_supported: array(string2()).optional(),
  claims_parameter_supported: boolean2().optional(),
  request_parameter_supported: boolean2().optional(),
  request_uri_parameter_supported: boolean2().optional(),
  require_request_uri_registration: boolean2().optional(),
  op_policy_uri: SafeUrlSchema.optional(),
  op_tos_uri: SafeUrlSchema.optional(),
  client_id_metadata_document_supported: boolean2().optional(),
  authorization_response_iss_parameter_supported: boolean2().optional().catch(void 0)
});
var OpenIdProviderDiscoveryMetadataSchema = object({
  ...OpenIdProviderMetadataSchema.shape,
  ...OAuthMetadataSchema.pick({ code_challenge_methods_supported: true }).shape
});
var OAuthTokensSchema = object({
  access_token: string2(),
  id_token: string2().optional(),
  token_type: string2(),
  expires_in: coerce_exports.number().optional(),
  scope: string2().optional(),
  refresh_token: string2().optional(),
  issuer: string2().optional().catch(void 0)
}).strip();
var IdJagTokenExchangeResponseSchema = object({
  issued_token_type: literal("urn:ietf:params:oauth:token-type:id-jag"),
  access_token: string2(),
  token_type: string2().optional(),
  expires_in: number2().optional(),
  scope: string2().optional()
}).strip();
var OAuthErrorResponseSchema = object({
  error: string2(),
  error_description: string2().optional(),
  error_uri: string2().optional()
});
var OptionalSafeUrlSchema = SafeUrlSchema.optional().or(literal("").transform(() => void 0));
var OAuthClientMetadataSchema = object({
  redirect_uris: array(SafeUrlSchema),
  token_endpoint_auth_method: string2().optional(),
  grant_types: array(string2()).optional(),
  response_types: array(string2()).optional(),
  application_type: string2().optional(),
  client_name: string2().optional(),
  client_uri: SafeUrlSchema.optional(),
  logo_uri: OptionalSafeUrlSchema,
  scope: string2().optional(),
  contacts: array(string2()).optional(),
  tos_uri: OptionalSafeUrlSchema,
  policy_uri: string2().optional(),
  jwks_uri: SafeUrlSchema.optional(),
  jwks: any().optional(),
  software_id: string2().optional(),
  software_version: string2().optional(),
  software_statement: string2().optional()
}).strip();
var OAuthClientInformationSchema = object({
  client_id: string2(),
  client_secret: string2().optional(),
  client_id_issued_at: number2().optional(),
  client_secret_expires_at: number2().optional(),
  issuer: string2().optional().catch(void 0)
}).strip();
var OAuthClientInformationFullSchema = OAuthClientMetadataSchema.merge(OAuthClientInformationSchema);
var OAuthClientRegistrationErrorSchema = object({
  error: string2(),
  error_description: string2().optional()
}).strip();
var OAuthTokenRevocationRequestSchema = object({
  token: string2(),
  token_type_hint: string2().optional()
}).strip();

// ../../node_modules/@modelcontextprotocol/server/dist/src-DdvbAHrR.mjs
var BRANDS = /* @__PURE__ */ Symbol.for("mcp.sdk.errorBrands");
function stampErrorBrands(instance, ctor) {
  const brands = /* @__PURE__ */ new Set();
  let current = ctor;
  while (typeof current === "function") {
    const brand = current.mcpBrand;
    if (Object.prototype.hasOwnProperty.call(current, "mcpBrand") && typeof brand === "string") brands.add(brand);
    current = Object.getPrototypeOf(current);
  }
  if (brands.size === 0) return;
  Object.defineProperty(instance, BRANDS, {
    value: brands,
    enumerable: false,
    configurable: true
  });
}
__name(stampErrorBrands, "stampErrorBrands");
function brandedHasInstance(cls, value) {
  try {
    if (typeof value === "object" && value !== null && Object.prototype.hasOwnProperty.call(cls, "mcpBrand") && typeof cls.mcpBrand === "string" && Object.prototype.hasOwnProperty.call(value, BRANDS)) {
      const carried = value[BRANDS];
      if (carried && typeof carried.has === "function" && carried.has(cls.mcpBrand)) return true;
    }
  } catch {
  }
  return Function.prototype[Symbol.hasInstance].call(cls, value);
}
__name(brandedHasInstance, "brandedHasInstance");
var OAuthErrorCode = /* @__PURE__ */ (function(OAuthErrorCode$1) {
  OAuthErrorCode$1["InvalidRequest"] = "invalid_request";
  OAuthErrorCode$1["InvalidClient"] = "invalid_client";
  OAuthErrorCode$1["InvalidGrant"] = "invalid_grant";
  OAuthErrorCode$1["UnauthorizedClient"] = "unauthorized_client";
  OAuthErrorCode$1["UnsupportedGrantType"] = "unsupported_grant_type";
  OAuthErrorCode$1["InvalidScope"] = "invalid_scope";
  OAuthErrorCode$1["AccessDenied"] = "access_denied";
  OAuthErrorCode$1["ServerError"] = "server_error";
  OAuthErrorCode$1["TemporarilyUnavailable"] = "temporarily_unavailable";
  OAuthErrorCode$1["UnsupportedResponseType"] = "unsupported_response_type";
  OAuthErrorCode$1["UnsupportedTokenType"] = "unsupported_token_type";
  OAuthErrorCode$1["InvalidToken"] = "invalid_token";
  OAuthErrorCode$1["MethodNotAllowed"] = "method_not_allowed";
  OAuthErrorCode$1["TooManyRequests"] = "too_many_requests";
  OAuthErrorCode$1["InvalidClientMetadata"] = "invalid_client_metadata";
  OAuthErrorCode$1["InvalidRedirectUri"] = "invalid_redirect_uri";
  OAuthErrorCode$1["InsufficientScope"] = "insufficient_scope";
  OAuthErrorCode$1["InvalidTarget"] = "invalid_target";
  OAuthErrorCode$1["InvalidDpopProof"] = "invalid_dpop_proof";
  OAuthErrorCode$1["UseDpopNonce"] = "use_dpop_nonce";
  return OAuthErrorCode$1;
})({});
var OAuthError = class OAuthError2 extends Error {
  static {
    __name(this, "OAuthError");
  }
  static {
    Object.defineProperty(this, "mcpBrand", { value: "mcp.OAuthError" });
  }
  static [Symbol.hasInstance](value) {
    return brandedHasInstance(this, value);
  }
  /**
  * Brand-based type guard: equivalent to `value instanceof this`, as an
  * explicit static predicate (the axios/AWS-SDK `isInstance` style). Reads
  * the caller's own brand via `this`, so every branded subclass gets a
  * correctly-scoped guard by inheritance. Must be invoked on the class —
  * in callback position write `v => SdkError.isInstance(v)`, not
  * `.filter(SdkError.isInstance)` (detached calls throw rather than
  * silently matching nothing).
  */
  static isInstance(value) {
    if (typeof this !== "function") throw new TypeError("isInstance must be called on the class (e.g. `SdkError.isInstance(value)`); for callbacks use `v => SdkError.isInstance(v)`");
    return brandedHasInstance(this, value);
  }
  constructor(code, message, errorUri) {
    super(message);
    this.code = code;
    this.errorUri = errorUri;
    this.name = "OAuthError";
    stampErrorBrands(this, new.target);
  }
  /**
  * Converts the error to a standard OAuth error response object.
  */
  toResponseObject() {
    const response = {
      error: this.code,
      error_description: this.message
    };
    if (this.errorUri) response.error_uri = this.errorUri;
    return response;
  }
  /**
  * Creates an {@linkcode OAuthError} from an OAuth error response.
  */
  static fromResponse(response) {
    return new OAuthError2(response.error, response.error_description ?? response.error, response.error_uri);
  }
};
var SdkErrorCode = /* @__PURE__ */ (function(SdkErrorCode$1) {
  SdkErrorCode$1["NotConnected"] = "NOT_CONNECTED";
  SdkErrorCode$1["AlreadyConnected"] = "ALREADY_CONNECTED";
  SdkErrorCode$1["NotInitialized"] = "NOT_INITIALIZED";
  SdkErrorCode$1["CapabilityNotSupported"] = "CAPABILITY_NOT_SUPPORTED";
  SdkErrorCode$1["RequestTimeout"] = "REQUEST_TIMEOUT";
  SdkErrorCode$1["ConnectionClosed"] = "CONNECTION_CLOSED";
  SdkErrorCode$1["SendFailed"] = "SEND_FAILED";
  SdkErrorCode$1["InvalidResult"] = "INVALID_RESULT";
  SdkErrorCode$1["UnsupportedResultType"] = "UNSUPPORTED_RESULT_TYPE";
  SdkErrorCode$1["InputRequiredRoundsExceeded"] = "INPUT_REQUIRED_ROUNDS_EXCEEDED";
  SdkErrorCode$1["ListPaginationExceeded"] = "LIST_PAGINATION_EXCEEDED";
  SdkErrorCode$1["MethodNotSupportedByProtocolVersion"] = "METHOD_NOT_SUPPORTED_BY_PROTOCOL_VERSION";
  SdkErrorCode$1["EraNegotiationFailed"] = "ERA_NEGOTIATION_FAILED";
  SdkErrorCode$1["ClientHttpNotImplemented"] = "CLIENT_HTTP_NOT_IMPLEMENTED";
  SdkErrorCode$1["ClientHttpAuthentication"] = "CLIENT_HTTP_AUTHENTICATION";
  SdkErrorCode$1["ClientHttpForbidden"] = "CLIENT_HTTP_FORBIDDEN";
  SdkErrorCode$1["ClientHttpUnexpectedContent"] = "CLIENT_HTTP_UNEXPECTED_CONTENT";
  SdkErrorCode$1["ClientHttpFailedToOpenStream"] = "CLIENT_HTTP_FAILED_TO_OPEN_STREAM";
  SdkErrorCode$1["ClientHttpFailedToTerminateSession"] = "CLIENT_HTTP_FAILED_TO_TERMINATE_SESSION";
  return SdkErrorCode$1;
})({});
var SdkError = class extends Error {
  static {
    __name(this, "SdkError");
  }
  static {
    Object.defineProperty(this, "mcpBrand", { value: "mcp.SdkError" });
  }
  static [Symbol.hasInstance](value) {
    return brandedHasInstance(this, value);
  }
  /**
  * Brand-based type guard: equivalent to `value instanceof this`, as an
  * explicit static predicate (the axios/AWS-SDK `isInstance` style). Reads
  * the caller's own brand via `this`, so every branded subclass gets a
  * correctly-scoped guard by inheritance. Must be invoked on the class —
  * in callback position write `v => SdkError.isInstance(v)`, not
  * `.filter(SdkError.isInstance)` (detached calls throw rather than
  * silently matching nothing).
  */
  static isInstance(value) {
    if (typeof this !== "function") throw new TypeError("isInstance must be called on the class (e.g. `SdkError.isInstance(value)`); for callbacks use `v => SdkError.isInstance(v)`");
    return brandedHasInstance(this, value);
  }
  /**
  * @param code - Stable string code identifying the failure ({@linkcode SdkErrorCode}).
  * @param message - Human-readable description.
  * @param data - Optional structured payload (for example the HTTP status carried by
  * {@linkcode SdkHttpError}). Opaque to the SDK: a `cause` key inside `data` is not
  * promoted to `Error.cause`.
  * @param options - Standard `ErrorOptions`, forwarded to `Error`. Pass the underlying
  * failure as `{ cause }` so it is reachable through the `Error.cause` chain that
  * loggers and error trackers walk.
  */
  constructor(code, message, data, options) {
    super(message, options);
    this.code = code;
    this.data = data;
    this.name = "SdkError";
    stampErrorBrands(this, new.target);
  }
};
var SdkHttpError = class extends SdkError {
  static {
    __name(this, "SdkHttpError");
  }
  static {
    Object.defineProperty(this, "mcpBrand", { value: "mcp.SdkHttpError" });
  }
  /**
  * @param options - Standard `ErrorOptions`, forwarded to `Error` (see {@linkcode SdkError}).
  */
  constructor(code, message, data, options) {
    super(code, message, data, options);
    this.name = "SdkHttpError";
  }
  get status() {
    return this.data.status;
  }
  get statusText() {
    return this.data.statusText;
  }
};
var REQUIRED_CLIENT_CAPABILITIES_BY_METHOD = {};
function requiredClientCapabilitiesForRequest(method) {
  return Object.hasOwn(REQUIRED_CLIENT_CAPABILITIES_BY_METHOD, method) ? REQUIRED_CLIENT_CAPABILITIES_BY_METHOD[method] : void 0;
}
__name(requiredClientCapabilitiesForRequest, "requiredClientCapabilitiesForRequest");
function isPlainObject$7(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
__name(isPlainObject$7, "isPlainObject$7");
function isImpliedCapabilityMember(capability, member, declaredValue) {
  return capability === "elicitation" && member === "form" && declaredValue["form"] === void 0 && declaredValue["url"] === void 0;
}
__name(isImpliedCapabilityMember, "isImpliedCapabilityMember");
function requiredClientCapabilitiesForInputRequest(entry) {
  switch (entry.method) {
    case "elicitation/create":
      if (entry.params?.["mode"] === "url") return { elicitation: { url: {} } };
      return { elicitation: { form: {} } };
    case "sampling/createMessage": {
      const params = entry.params;
      if (params !== void 0 && (params["tools"] !== void 0 || params["toolChoice"] !== void 0)) return { sampling: { tools: {} } };
      return { sampling: {} };
    }
    case "roots/list":
      return { roots: {} };
    default:
      return;
  }
}
__name(requiredClientCapabilitiesForInputRequest, "requiredClientCapabilitiesForInputRequest");
function missingClientCapabilities(required2, declared) {
  const missing = {};
  for (const [capability, requirement] of Object.entries(required2)) {
    if (requirement === void 0) continue;
    const declaredValue = declared === void 0 ? void 0 : declared[capability];
    if (declaredValue === void 0) {
      missing[capability] = requirement;
      continue;
    }
    if (isPlainObject$7(requirement) && isPlainObject$7(declaredValue)) {
      const missingMembers = {};
      for (const [member, memberRequirement] of Object.entries(requirement)) if (memberRequirement !== void 0 && declaredValue[member] === void 0 && !isImpliedCapabilityMember(capability, member, declaredValue)) missingMembers[member] = memberRequirement;
      if (Object.keys(missingMembers).length > 0) missing[capability] = missingMembers;
    }
  }
  return Object.keys(missing).length > 0 ? missing : void 0;
}
__name(missingClientCapabilities, "missingClientCapabilities");
var FIRST_MODERN_PROTOCOL_VERSION = "2026-07-28";
var SUPPORTED_MODERN_PROTOCOL_VERSIONS = [FIRST_MODERN_PROTOCOL_VERSION];
function isModernProtocolVersion(version3) {
  return version3 >= FIRST_MODERN_PROTOCOL_VERSION;
}
__name(isModernProtocolVersion, "isModernProtocolVersion");
function legacyProtocolVersions(versions) {
  return versions.filter((version3) => !isModernProtocolVersion(version3));
}
__name(legacyProtocolVersions, "legacyProtocolVersions");
function modernProtocolVersions(versions) {
  return versions.filter((version3) => isModernProtocolVersion(version3));
}
__name(modernProtocolVersions, "modernProtocolVersions");
function appendTextFallbackForNonObject(result) {
  const sc = result.structuredContent;
  if (sc === void 0) return result;
  if (!(typeof sc !== "object" || sc === null || Array.isArray(sc))) return result;
  if (result.content?.some((c) => c.type === "text") ?? false) return result;
  return {
    ...result,
    content: [...result.content ?? [], {
      type: "text",
      text: JSON.stringify(sc)
    }]
  };
}
__name(appendTextFallbackForNonObject, "appendTextFallbackForNonObject");
var TOOL_RESULT_FOREIGN_FAMILY_KEYS = [
  "task",
  "inputRequests",
  "requestState"
];
function normalizeContentlessToolResult(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value) || value.content !== void 0 || TOOL_RESULT_FOREIGN_FAMILY_KEYS.some((key) => key in value)) return value;
  return {
    ...value,
    content: []
  };
}
__name(normalizeContentlessToolResult, "normalizeContentlessToolResult");
function build$1() {
  const JSONValueSchema$1 = lazy(() => union([
    string2(),
    number2(),
    boolean2(),
    _null3(),
    record(string2(), JSONValueSchema$1),
    array(JSONValueSchema$1)
  ]));
  const JSONObjectSchema$1 = record(string2(), JSONValueSchema$1);
  const ProgressTokenSchema$1 = union([string2(), number2().int()]);
  const CursorSchema$1 = string2();
  const TaskMetadataSchema$1 = object({ ttl: number2().optional() });
  const RelatedTaskMetadataSchema$1 = object({ taskId: string2() });
  const RequestMetaSchema$1 = looseObject({
    progressToken: ProgressTokenSchema$1.optional(),
    "io.modelcontextprotocol/related-task": RelatedTaskMetadataSchema$1.optional()
  });
  const BaseRequestParamsSchema$1 = object({ _meta: RequestMetaSchema$1.optional() });
  const TaskAugmentedRequestParamsSchema$1 = BaseRequestParamsSchema$1.extend({ task: TaskMetadataSchema$1.optional() });
  const RequestSchema$1 = object({
    method: string2(),
    params: BaseRequestParamsSchema$1.loose().optional()
  });
  const NotificationsParamsSchema$1 = object({ _meta: RequestMetaSchema$1.optional() });
  const NotificationSchema$1 = object({
    method: string2(),
    params: NotificationsParamsSchema$1.loose().optional()
  });
  const ResultSchema$1 = looseObject({ _meta: RequestMetaSchema$1.optional() });
  const RequestIdSchema$1 = union([string2(), number2().int()]);
  const EmptyResultSchema$1 = ResultSchema$1.strict();
  const CancelledNotificationParamsSchema$1 = NotificationsParamsSchema$1.extend({
    requestId: RequestIdSchema$1.optional(),
    reason: string2().optional()
  });
  const CancelledNotificationSchema$1 = NotificationSchema$1.extend({
    method: literal("notifications/cancelled"),
    params: CancelledNotificationParamsSchema$1
  });
  const IconSchema$1 = object({
    src: string2(),
    mimeType: string2().optional(),
    sizes: array(string2()).optional(),
    theme: _enum(["light", "dark"]).optional()
  });
  const IconsSchema$1 = object({ icons: array(IconSchema$1).optional() });
  const BaseMetadataSchema$1 = object({
    name: string2(),
    title: string2().optional()
  });
  const ImplementationSchema$1 = BaseMetadataSchema$1.extend({
    ...BaseMetadataSchema$1.shape,
    ...IconsSchema$1.shape,
    version: string2(),
    websiteUrl: string2().optional(),
    description: string2().optional()
  });
  const FormElicitationCapabilitySchema2 = intersection(object({ applyDefaults: boolean2().optional() }), JSONObjectSchema$1);
  const ElicitationCapabilitySchema2 = preprocess((value) => {
    if (value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0) return { form: {} };
    return value;
  }, intersection(object({
    form: FormElicitationCapabilitySchema2.optional(),
    url: JSONObjectSchema$1.optional()
  }), JSONObjectSchema$1.optional()));
  const ClientTasksCapabilitySchema$1 = looseObject({
    list: JSONObjectSchema$1.optional(),
    cancel: JSONObjectSchema$1.optional(),
    requests: looseObject({
      sampling: looseObject({ createMessage: JSONObjectSchema$1.optional() }).optional(),
      elicitation: looseObject({ create: JSONObjectSchema$1.optional() }).optional()
    }).optional()
  });
  const ServerTasksCapabilitySchema$1 = looseObject({
    list: JSONObjectSchema$1.optional(),
    cancel: JSONObjectSchema$1.optional(),
    requests: looseObject({ tools: looseObject({ call: JSONObjectSchema$1.optional() }).optional() }).optional()
  });
  const ClientCapabilitiesSchema$1 = object({
    experimental: record(string2(), JSONObjectSchema$1).optional(),
    sampling: object({
      context: JSONObjectSchema$1.optional(),
      tools: JSONObjectSchema$1.optional()
    }).optional(),
    elicitation: ElicitationCapabilitySchema2.optional(),
    roots: object({ listChanged: boolean2().optional() }).optional(),
    tasks: ClientTasksCapabilitySchema$1.optional(),
    extensions: record(string2(), JSONObjectSchema$1).optional()
  });
  const InitializeRequestParamsSchema$1 = BaseRequestParamsSchema$1.extend({
    protocolVersion: string2(),
    capabilities: ClientCapabilitiesSchema$1,
    clientInfo: ImplementationSchema$1
  });
  const InitializeRequestSchema$1 = RequestSchema$1.extend({
    method: literal("initialize"),
    params: InitializeRequestParamsSchema$1
  });
  const ServerCapabilitiesSchema$1 = object({
    experimental: record(string2(), JSONObjectSchema$1).optional(),
    logging: JSONObjectSchema$1.optional(),
    completions: JSONObjectSchema$1.optional(),
    prompts: object({ listChanged: boolean2().optional() }).optional(),
    resources: object({
      subscribe: boolean2().optional(),
      listChanged: boolean2().optional()
    }).optional(),
    tools: object({ listChanged: boolean2().optional() }).optional(),
    tasks: ServerTasksCapabilitySchema$1.optional(),
    extensions: record(string2(), JSONObjectSchema$1).optional()
  });
  const InitializeResultSchema$1 = ResultSchema$1.extend({
    protocolVersion: string2(),
    capabilities: ServerCapabilitiesSchema$1,
    serverInfo: ImplementationSchema$1,
    instructions: string2().optional()
  });
  const InitializedNotificationSchema$1 = NotificationSchema$1.extend({
    method: literal("notifications/initialized"),
    params: NotificationsParamsSchema$1.optional()
  });
  const PingRequestSchema$1 = RequestSchema$1.extend({
    method: literal("ping"),
    params: BaseRequestParamsSchema$1.optional()
  });
  const ProgressSchema$1 = object({
    progress: number2(),
    total: optional(number2()),
    message: optional(string2())
  });
  const ProgressNotificationParamsSchema$1 = object({
    ...NotificationsParamsSchema$1.shape,
    ...ProgressSchema$1.shape,
    progressToken: ProgressTokenSchema$1
  });
  const ProgressNotificationSchema$1 = NotificationSchema$1.extend({
    method: literal("notifications/progress"),
    params: ProgressNotificationParamsSchema$1
  });
  const PaginatedRequestParamsSchema$1 = BaseRequestParamsSchema$1.extend({ cursor: CursorSchema$1.optional() });
  const PaginatedRequestSchema$1 = RequestSchema$1.extend({ params: PaginatedRequestParamsSchema$1.optional() });
  const PaginatedResultSchema$1 = ResultSchema$1.extend({ nextCursor: CursorSchema$1.optional() });
  const ResourceContentsSchema$1 = object({
    uri: string2(),
    mimeType: optional(string2()),
    _meta: record(string2(), unknown()).optional()
  });
  const TextResourceContentsSchema$1 = ResourceContentsSchema$1.extend({ text: string2() });
  const Base64Schema2 = string2().refine((val) => {
    try {
      atob(val);
      return true;
    } catch {
      return false;
    }
  }, { message: "Invalid Base64 string" });
  const BlobResourceContentsSchema$1 = ResourceContentsSchema$1.extend({ blob: Base64Schema2 });
  const RoleSchema$1 = _enum(["user", "assistant"]);
  const AnnotationsSchema$1 = object({
    audience: array(RoleSchema$1).optional(),
    priority: number2().min(0).max(1).optional(),
    lastModified: iso_exports.datetime({ offset: true }).optional()
  });
  const ResourceSchema$1 = object({
    ...BaseMetadataSchema$1.shape,
    ...IconsSchema$1.shape,
    uri: string2(),
    description: optional(string2()),
    mimeType: optional(string2()),
    size: optional(number2()),
    annotations: AnnotationsSchema$1.optional(),
    _meta: optional(looseObject({}))
  });
  const ResourceTemplateSchema$1 = object({
    ...BaseMetadataSchema$1.shape,
    ...IconsSchema$1.shape,
    uriTemplate: string2(),
    description: optional(string2()),
    mimeType: optional(string2()),
    annotations: AnnotationsSchema$1.optional(),
    _meta: optional(looseObject({}))
  });
  const ListResourcesRequestSchema$1 = PaginatedRequestSchema$1.extend({ method: literal("resources/list") });
  const ListResourcesResultSchema$1 = PaginatedResultSchema$1.extend({ resources: array(ResourceSchema$1) });
  const ListResourceTemplatesRequestSchema$1 = PaginatedRequestSchema$1.extend({ method: literal("resources/templates/list") });
  const ListResourceTemplatesResultSchema$1 = PaginatedResultSchema$1.extend({ resourceTemplates: array(ResourceTemplateSchema$1) });
  const ResourceRequestParamsSchema$1 = BaseRequestParamsSchema$1.extend({ uri: string2() });
  const ReadResourceRequestParamsSchema$1 = ResourceRequestParamsSchema$1;
  const ReadResourceRequestSchema$1 = RequestSchema$1.extend({
    method: literal("resources/read"),
    params: ReadResourceRequestParamsSchema$1
  });
  const ReadResourceResultSchema$1 = ResultSchema$1.extend({ contents: array(union([TextResourceContentsSchema$1, BlobResourceContentsSchema$1])) });
  const ResourceListChangedNotificationSchema$1 = NotificationSchema$1.extend({
    method: literal("notifications/resources/list_changed"),
    params: NotificationsParamsSchema$1.optional()
  });
  const SubscribeRequestParamsSchema$1 = ResourceRequestParamsSchema$1;
  const SubscribeRequestSchema$1 = RequestSchema$1.extend({
    method: literal("resources/subscribe"),
    params: SubscribeRequestParamsSchema$1
  });
  const UnsubscribeRequestParamsSchema$1 = ResourceRequestParamsSchema$1;
  const UnsubscribeRequestSchema$1 = RequestSchema$1.extend({
    method: literal("resources/unsubscribe"),
    params: UnsubscribeRequestParamsSchema$1
  });
  const ResourceUpdatedNotificationParamsSchema$1 = NotificationsParamsSchema$1.extend({ uri: string2() });
  const ResourceUpdatedNotificationSchema$1 = NotificationSchema$1.extend({
    method: literal("notifications/resources/updated"),
    params: ResourceUpdatedNotificationParamsSchema$1
  });
  const PromptArgumentSchema$1 = object({
    name: string2(),
    description: optional(string2()),
    required: optional(boolean2())
  });
  const PromptSchema$1 = object({
    ...BaseMetadataSchema$1.shape,
    ...IconsSchema$1.shape,
    description: optional(string2()),
    arguments: optional(array(PromptArgumentSchema$1)),
    _meta: optional(looseObject({}))
  });
  const ListPromptsRequestSchema$1 = PaginatedRequestSchema$1.extend({ method: literal("prompts/list") });
  const ListPromptsResultSchema$1 = PaginatedResultSchema$1.extend({ prompts: array(PromptSchema$1) });
  const GetPromptRequestParamsSchema$1 = BaseRequestParamsSchema$1.extend({
    name: string2(),
    arguments: record(string2(), string2()).optional()
  });
  const GetPromptRequestSchema$1 = RequestSchema$1.extend({
    method: literal("prompts/get"),
    params: GetPromptRequestParamsSchema$1
  });
  const TextContentSchema$1 = object({
    type: literal("text"),
    text: string2(),
    annotations: AnnotationsSchema$1.optional(),
    _meta: record(string2(), unknown()).optional()
  });
  const ImageContentSchema$1 = object({
    type: literal("image"),
    data: Base64Schema2,
    mimeType: string2(),
    annotations: AnnotationsSchema$1.optional(),
    _meta: record(string2(), unknown()).optional()
  });
  const AudioContentSchema$1 = object({
    type: literal("audio"),
    data: Base64Schema2,
    mimeType: string2(),
    annotations: AnnotationsSchema$1.optional(),
    _meta: record(string2(), unknown()).optional()
  });
  const ToolUseContentSchema$1 = object({
    type: literal("tool_use"),
    name: string2(),
    id: string2(),
    input: record(string2(), unknown()),
    _meta: record(string2(), unknown()).optional()
  });
  const EmbeddedResourceSchema$1 = object({
    type: literal("resource"),
    resource: union([TextResourceContentsSchema$1, BlobResourceContentsSchema$1]),
    annotations: AnnotationsSchema$1.optional(),
    _meta: record(string2(), unknown()).optional()
  });
  const ResourceLinkSchema$1 = ResourceSchema$1.extend({ type: literal("resource_link") });
  const ContentBlockSchema$1 = union([
    TextContentSchema$1,
    ImageContentSchema$1,
    AudioContentSchema$1,
    ResourceLinkSchema$1,
    EmbeddedResourceSchema$1
  ]);
  const PromptMessageSchema$1 = object({
    role: RoleSchema$1,
    content: ContentBlockSchema$1
  });
  const GetPromptResultSchema$1 = ResultSchema$1.extend({
    description: string2().optional(),
    messages: array(PromptMessageSchema$1)
  });
  const PromptListChangedNotificationSchema$1 = NotificationSchema$1.extend({
    method: literal("notifications/prompts/list_changed"),
    params: NotificationsParamsSchema$1.optional()
  });
  const ToolAnnotationsSchema$1 = object({
    title: string2().optional(),
    readOnlyHint: boolean2().optional(),
    destructiveHint: boolean2().optional(),
    idempotentHint: boolean2().optional(),
    openWorldHint: boolean2().optional()
  });
  const ToolExecutionSchema$1 = object({ taskSupport: _enum([
    "required",
    "optional",
    "forbidden"
  ]).optional() });
  const ToolSchema$1 = object({
    ...BaseMetadataSchema$1.shape,
    ...IconsSchema$1.shape,
    description: string2().optional(),
    inputSchema: object({
      type: literal("object"),
      properties: record(string2(), JSONValueSchema$1).optional(),
      required: array(string2()).optional()
    }).catchall(unknown()),
    outputSchema: object({
      type: literal("object"),
      properties: record(string2(), JSONValueSchema$1).optional(),
      required: array(string2()).optional()
    }).catchall(unknown()).optional(),
    annotations: ToolAnnotationsSchema$1.optional(),
    execution: ToolExecutionSchema$1.optional(),
    _meta: record(string2(), unknown()).optional()
  });
  const ListToolsRequestSchema$1 = PaginatedRequestSchema$1.extend({ method: literal("tools/list") });
  const ListToolsResultSchema$1 = PaginatedResultSchema$1.extend({ tools: array(ToolSchema$1) });
  const CallToolResultSchema$1 = ResultSchema$1.extend({
    content: array(ContentBlockSchema$1),
    structuredContent: record(string2(), unknown()).optional(),
    isError: boolean2().optional()
  });
  const CallToolRequestParamsSchema$1 = TaskAugmentedRequestParamsSchema$1.extend({
    name: string2(),
    arguments: record(string2(), unknown()).optional()
  });
  const CallToolRequestSchema$1 = RequestSchema$1.extend({
    method: literal("tools/call"),
    params: CallToolRequestParamsSchema$1
  });
  const ToolListChangedNotificationSchema$1 = NotificationSchema$1.extend({
    method: literal("notifications/tools/list_changed"),
    params: NotificationsParamsSchema$1.optional()
  });
  const LoggingLevelSchema$1 = _enum([
    "debug",
    "info",
    "notice",
    "warning",
    "error",
    "critical",
    "alert",
    "emergency"
  ]);
  const SetLevelRequestParamsSchema$1 = BaseRequestParamsSchema$1.extend({ level: LoggingLevelSchema$1 });
  const SetLevelRequestSchema$1 = RequestSchema$1.extend({
    method: literal("logging/setLevel"),
    params: SetLevelRequestParamsSchema$1
  });
  const LoggingMessageNotificationParamsSchema$1 = NotificationsParamsSchema$1.extend({
    level: LoggingLevelSchema$1,
    logger: string2().optional(),
    data: unknown()
  });
  const LoggingMessageNotificationSchema$1 = NotificationSchema$1.extend({
    method: literal("notifications/message"),
    params: LoggingMessageNotificationParamsSchema$1
  });
  const ModelHintSchema$1 = object({ name: string2().optional() });
  const ModelPreferencesSchema$1 = object({
    hints: array(ModelHintSchema$1).optional(),
    costPriority: number2().min(0).max(1).optional(),
    speedPriority: number2().min(0).max(1).optional(),
    intelligencePriority: number2().min(0).max(1).optional()
  });
  const ToolChoiceSchema$1 = object({ mode: _enum([
    "auto",
    "required",
    "none"
  ]).optional() });
  const ToolResultContentSchema$1 = object({
    type: literal("tool_result"),
    toolUseId: string2().describe("The unique identifier for the corresponding tool call."),
    content: array(ContentBlockSchema$1),
    structuredContent: object({}).loose().optional(),
    isError: boolean2().optional(),
    _meta: record(string2(), unknown()).optional()
  });
  const SamplingContentSchema$1 = discriminatedUnion("type", [
    TextContentSchema$1,
    ImageContentSchema$1,
    AudioContentSchema$1
  ]);
  const SamplingMessageContentBlockSchema$1 = discriminatedUnion("type", [
    TextContentSchema$1,
    ImageContentSchema$1,
    AudioContentSchema$1,
    ToolUseContentSchema$1,
    ToolResultContentSchema$1
  ]);
  const SamplingMessageSchema$1 = object({
    role: RoleSchema$1,
    content: union([SamplingMessageContentBlockSchema$1, array(SamplingMessageContentBlockSchema$1)]),
    _meta: record(string2(), unknown()).optional()
  });
  const CreateMessageRequestParamsSchema$1 = TaskAugmentedRequestParamsSchema$1.extend({
    messages: array(SamplingMessageSchema$1),
    modelPreferences: ModelPreferencesSchema$1.optional(),
    systemPrompt: string2().optional(),
    includeContext: _enum([
      "none",
      "thisServer",
      "allServers"
    ]).optional(),
    temperature: number2().optional(),
    maxTokens: number2().int(),
    stopSequences: array(string2()).optional(),
    metadata: JSONObjectSchema$1.optional(),
    tools: array(ToolSchema$1).optional(),
    toolChoice: ToolChoiceSchema$1.optional()
  });
  const CreateMessageRequestSchema$1 = RequestSchema$1.extend({
    method: literal("sampling/createMessage"),
    params: CreateMessageRequestParamsSchema$1
  });
  const CreateMessageResultSchema$1 = ResultSchema$1.extend({
    model: string2(),
    stopReason: optional(_enum([
      "endTurn",
      "stopSequence",
      "maxTokens"
    ]).or(string2())),
    role: RoleSchema$1,
    content: SamplingContentSchema$1
  });
  const CreateMessageResultWithToolsSchema$1 = ResultSchema$1.extend({
    model: string2(),
    stopReason: optional(_enum([
      "endTurn",
      "stopSequence",
      "maxTokens",
      "toolUse"
    ]).or(string2())),
    role: RoleSchema$1,
    content: union([SamplingMessageContentBlockSchema$1, array(SamplingMessageContentBlockSchema$1)])
  });
  const BooleanSchemaSchema$1 = object({
    type: literal("boolean"),
    title: string2().optional(),
    description: string2().optional(),
    default: boolean2().optional()
  });
  const StringSchemaSchema$1 = object({
    type: literal("string"),
    title: string2().optional(),
    description: string2().optional(),
    minLength: number2().optional(),
    maxLength: number2().optional(),
    format: _enum([
      "email",
      "uri",
      "date",
      "date-time"
    ]).optional(),
    default: string2().optional()
  });
  const NumberSchemaSchema$1 = object({
    type: _enum(["number", "integer"]),
    title: string2().optional(),
    description: string2().optional(),
    minimum: number2().optional(),
    maximum: number2().optional(),
    default: number2().optional()
  });
  const UntitledSingleSelectEnumSchemaSchema$1 = object({
    type: literal("string"),
    title: string2().optional(),
    description: string2().optional(),
    enum: array(string2()),
    default: string2().optional()
  });
  const TitledSingleSelectEnumSchemaSchema$1 = object({
    type: literal("string"),
    title: string2().optional(),
    description: string2().optional(),
    oneOf: array(object({
      const: string2(),
      title: string2()
    })),
    default: string2().optional()
  });
  const LegacyTitledEnumSchemaSchema$1 = object({
    type: literal("string"),
    title: string2().optional(),
    description: string2().optional(),
    enum: array(string2()),
    enumNames: array(string2()).optional(),
    default: string2().optional()
  });
  const SingleSelectEnumSchemaSchema$1 = union([UntitledSingleSelectEnumSchemaSchema$1, TitledSingleSelectEnumSchemaSchema$1]);
  const UntitledMultiSelectEnumSchemaSchema$1 = object({
    type: literal("array"),
    title: string2().optional(),
    description: string2().optional(),
    minItems: number2().optional(),
    maxItems: number2().optional(),
    items: object({
      type: literal("string"),
      enum: array(string2())
    }),
    default: array(string2()).optional()
  });
  const TitledMultiSelectEnumSchemaSchema$1 = object({
    type: literal("array"),
    title: string2().optional(),
    description: string2().optional(),
    minItems: number2().optional(),
    maxItems: number2().optional(),
    items: object({ anyOf: array(object({
      const: string2(),
      title: string2()
    })) }),
    default: array(string2()).optional()
  });
  const MultiSelectEnumSchemaSchema$1 = union([UntitledMultiSelectEnumSchemaSchema$1, TitledMultiSelectEnumSchemaSchema$1]);
  const EnumSchemaSchema$1 = union([
    LegacyTitledEnumSchemaSchema$1,
    SingleSelectEnumSchemaSchema$1,
    MultiSelectEnumSchemaSchema$1
  ]);
  const PrimitiveSchemaDefinitionSchema$1 = union([
    EnumSchemaSchema$1,
    BooleanSchemaSchema$1,
    StringSchemaSchema$1,
    NumberSchemaSchema$1
  ]);
  const ElicitRequestFormParamsSchema$1 = TaskAugmentedRequestParamsSchema$1.extend({
    mode: literal("form").optional(),
    message: string2(),
    requestedSchema: object({
      type: literal("object"),
      properties: record(string2(), PrimitiveSchemaDefinitionSchema$1),
      required: array(string2()).optional()
    }).catchall(unknown())
  });
  const ElicitRequestURLParamsSchema$1 = TaskAugmentedRequestParamsSchema$1.extend({
    mode: literal("url"),
    message: string2(),
    elicitationId: string2(),
    url: string2().url()
  });
  const ElicitRequestParamsSchema$1 = union([ElicitRequestFormParamsSchema$1, ElicitRequestURLParamsSchema$1]);
  const ElicitRequestSchema$1 = RequestSchema$1.extend({
    method: literal("elicitation/create"),
    params: ElicitRequestParamsSchema$1
  });
  const ElicitationCompleteNotificationParamsSchema$1 = NotificationsParamsSchema$1.extend({ elicitationId: string2() });
  const ElicitationCompleteNotificationSchema$1 = NotificationSchema$1.extend({
    method: literal("notifications/elicitation/complete"),
    params: ElicitationCompleteNotificationParamsSchema$1
  });
  const ElicitResultSchema$1 = ResultSchema$1.extend({
    action: _enum([
      "accept",
      "decline",
      "cancel"
    ]),
    content: preprocess((val) => val === null ? void 0 : val, record(string2(), union([
      string2(),
      number2(),
      boolean2(),
      array(string2())
    ])).optional())
  });
  const ResourceTemplateReferenceSchema$1 = object({
    type: literal("ref/resource"),
    uri: string2()
  });
  const PromptReferenceSchema$1 = object({
    type: literal("ref/prompt"),
    name: string2()
  });
  const CompleteRequestParamsSchema$1 = BaseRequestParamsSchema$1.extend({
    ref: union([PromptReferenceSchema$1, ResourceTemplateReferenceSchema$1]),
    argument: object({
      name: string2(),
      value: string2()
    }),
    context: object({ arguments: record(string2(), string2()).optional() }).optional()
  });
  const CompleteRequestSchema$1 = RequestSchema$1.extend({
    method: literal("completion/complete"),
    params: CompleteRequestParamsSchema$1
  });
  const CompleteResultSchema$1 = ResultSchema$1.extend({ completion: looseObject({
    values: array(string2()).max(100),
    total: optional(number2().int()),
    hasMore: optional(boolean2())
  }) });
  const RootSchema$1 = object({
    uri: string2().startsWith("file://"),
    name: string2().optional(),
    _meta: record(string2(), unknown()).optional()
  });
  const ListRootsRequestSchema$1 = RequestSchema$1.extend({
    method: literal("roots/list"),
    params: BaseRequestParamsSchema$1.optional()
  });
  const ListRootsResultSchema$1 = ResultSchema$1.extend({ roots: array(RootSchema$1) });
  const RootsListChangedNotificationSchema$1 = NotificationSchema$1.extend({
    method: literal("notifications/roots/list_changed"),
    params: NotificationsParamsSchema$1.optional()
  });
  const TaskCreationParamsSchema$1 = looseObject({
    ttl: number2().optional(),
    pollInterval: number2().optional()
  });
  const TaskStatusSchema$1 = _enum([
    "working",
    "input_required",
    "completed",
    "failed",
    "cancelled"
  ]);
  const TaskSchema$1 = object({
    taskId: string2(),
    status: TaskStatusSchema$1,
    ttl: union([number2(), _null3()]),
    createdAt: string2(),
    lastUpdatedAt: string2(),
    pollInterval: optional(number2()),
    statusMessage: optional(string2())
  });
  const CreateTaskResultSchema$1 = ResultSchema$1.extend({ task: TaskSchema$1 });
  const TaskStatusNotificationParamsSchema$1 = NotificationsParamsSchema$1.merge(TaskSchema$1);
  const TaskStatusNotificationSchema$1 = NotificationSchema$1.extend({
    method: literal("notifications/tasks/status"),
    params: TaskStatusNotificationParamsSchema$1
  });
  const GetTaskRequestSchema$1 = RequestSchema$1.extend({
    method: literal("tasks/get"),
    params: BaseRequestParamsSchema$1.extend({ taskId: string2() })
  });
  const GetTaskResultSchema$1 = ResultSchema$1.merge(TaskSchema$1);
  const GetTaskPayloadRequestSchema$1 = RequestSchema$1.extend({
    method: literal("tasks/result"),
    params: BaseRequestParamsSchema$1.extend({ taskId: string2() })
  });
  const GetTaskPayloadResultSchema$1 = ResultSchema$1.loose();
  const ListTasksRequestSchema$1 = PaginatedRequestSchema$1.extend({ method: literal("tasks/list") });
  const ListTasksResultSchema$1 = PaginatedResultSchema$1.extend({ tasks: array(TaskSchema$1) });
  const CancelTaskRequestSchema$1 = RequestSchema$1.extend({
    method: literal("tasks/cancel"),
    params: BaseRequestParamsSchema$1.extend({ taskId: string2() })
  });
  return {
    JSONValueSchema: JSONValueSchema$1,
    JSONObjectSchema: JSONObjectSchema$1,
    ProgressTokenSchema: ProgressTokenSchema$1,
    CursorSchema: CursorSchema$1,
    TaskMetadataSchema: TaskMetadataSchema$1,
    RelatedTaskMetadataSchema: RelatedTaskMetadataSchema$1,
    RequestMetaSchema: RequestMetaSchema$1,
    BaseRequestParamsSchema: BaseRequestParamsSchema$1,
    TaskAugmentedRequestParamsSchema: TaskAugmentedRequestParamsSchema$1,
    RequestSchema: RequestSchema$1,
    NotificationsParamsSchema: NotificationsParamsSchema$1,
    NotificationSchema: NotificationSchema$1,
    ResultSchema: ResultSchema$1,
    RequestIdSchema: RequestIdSchema$1,
    EmptyResultSchema: EmptyResultSchema$1,
    CancelledNotificationParamsSchema: CancelledNotificationParamsSchema$1,
    CancelledNotificationSchema: CancelledNotificationSchema$1,
    IconSchema: IconSchema$1,
    IconsSchema: IconsSchema$1,
    BaseMetadataSchema: BaseMetadataSchema$1,
    ImplementationSchema: ImplementationSchema$1,
    ClientTasksCapabilitySchema: ClientTasksCapabilitySchema$1,
    ServerTasksCapabilitySchema: ServerTasksCapabilitySchema$1,
    ClientCapabilitiesSchema: ClientCapabilitiesSchema$1,
    InitializeRequestParamsSchema: InitializeRequestParamsSchema$1,
    InitializeRequestSchema: InitializeRequestSchema$1,
    ServerCapabilitiesSchema: ServerCapabilitiesSchema$1,
    InitializeResultSchema: InitializeResultSchema$1,
    InitializedNotificationSchema: InitializedNotificationSchema$1,
    PingRequestSchema: PingRequestSchema$1,
    ProgressSchema: ProgressSchema$1,
    ProgressNotificationParamsSchema: ProgressNotificationParamsSchema$1,
    ProgressNotificationSchema: ProgressNotificationSchema$1,
    PaginatedRequestParamsSchema: PaginatedRequestParamsSchema$1,
    PaginatedRequestSchema: PaginatedRequestSchema$1,
    PaginatedResultSchema: PaginatedResultSchema$1,
    ResourceContentsSchema: ResourceContentsSchema$1,
    TextResourceContentsSchema: TextResourceContentsSchema$1,
    BlobResourceContentsSchema: BlobResourceContentsSchema$1,
    RoleSchema: RoleSchema$1,
    AnnotationsSchema: AnnotationsSchema$1,
    ResourceSchema: ResourceSchema$1,
    ResourceTemplateSchema: ResourceTemplateSchema$1,
    ListResourcesRequestSchema: ListResourcesRequestSchema$1,
    ListResourcesResultSchema: ListResourcesResultSchema$1,
    ListResourceTemplatesRequestSchema: ListResourceTemplatesRequestSchema$1,
    ListResourceTemplatesResultSchema: ListResourceTemplatesResultSchema$1,
    ResourceRequestParamsSchema: ResourceRequestParamsSchema$1,
    ReadResourceRequestParamsSchema: ReadResourceRequestParamsSchema$1,
    ReadResourceRequestSchema: ReadResourceRequestSchema$1,
    ReadResourceResultSchema: ReadResourceResultSchema$1,
    ResourceListChangedNotificationSchema: ResourceListChangedNotificationSchema$1,
    SubscribeRequestParamsSchema: SubscribeRequestParamsSchema$1,
    SubscribeRequestSchema: SubscribeRequestSchema$1,
    UnsubscribeRequestParamsSchema: UnsubscribeRequestParamsSchema$1,
    UnsubscribeRequestSchema: UnsubscribeRequestSchema$1,
    ResourceUpdatedNotificationParamsSchema: ResourceUpdatedNotificationParamsSchema$1,
    ResourceUpdatedNotificationSchema: ResourceUpdatedNotificationSchema$1,
    PromptArgumentSchema: PromptArgumentSchema$1,
    PromptSchema: PromptSchema$1,
    ListPromptsRequestSchema: ListPromptsRequestSchema$1,
    ListPromptsResultSchema: ListPromptsResultSchema$1,
    GetPromptRequestParamsSchema: GetPromptRequestParamsSchema$1,
    GetPromptRequestSchema: GetPromptRequestSchema$1,
    TextContentSchema: TextContentSchema$1,
    ImageContentSchema: ImageContentSchema$1,
    AudioContentSchema: AudioContentSchema$1,
    ToolUseContentSchema: ToolUseContentSchema$1,
    EmbeddedResourceSchema: EmbeddedResourceSchema$1,
    ResourceLinkSchema: ResourceLinkSchema$1,
    ContentBlockSchema: ContentBlockSchema$1,
    PromptMessageSchema: PromptMessageSchema$1,
    GetPromptResultSchema: GetPromptResultSchema$1,
    PromptListChangedNotificationSchema: PromptListChangedNotificationSchema$1,
    ToolAnnotationsSchema: ToolAnnotationsSchema$1,
    ToolExecutionSchema: ToolExecutionSchema$1,
    ToolSchema: ToolSchema$1,
    ListToolsRequestSchema: ListToolsRequestSchema$1,
    ListToolsResultSchema: ListToolsResultSchema$1,
    CallToolResultSchema: CallToolResultSchema$1,
    CallToolRequestParamsSchema: CallToolRequestParamsSchema$1,
    CallToolRequestSchema: CallToolRequestSchema$1,
    ToolListChangedNotificationSchema: ToolListChangedNotificationSchema$1,
    LoggingLevelSchema: LoggingLevelSchema$1,
    SetLevelRequestParamsSchema: SetLevelRequestParamsSchema$1,
    SetLevelRequestSchema: SetLevelRequestSchema$1,
    LoggingMessageNotificationParamsSchema: LoggingMessageNotificationParamsSchema$1,
    LoggingMessageNotificationSchema: LoggingMessageNotificationSchema$1,
    ModelHintSchema: ModelHintSchema$1,
    ModelPreferencesSchema: ModelPreferencesSchema$1,
    ToolChoiceSchema: ToolChoiceSchema$1,
    ToolResultContentSchema: ToolResultContentSchema$1,
    SamplingContentSchema: SamplingContentSchema$1,
    SamplingMessageContentBlockSchema: SamplingMessageContentBlockSchema$1,
    SamplingMessageSchema: SamplingMessageSchema$1,
    CreateMessageRequestParamsSchema: CreateMessageRequestParamsSchema$1,
    CreateMessageRequestSchema: CreateMessageRequestSchema$1,
    CreateMessageResultSchema: CreateMessageResultSchema$1,
    CreateMessageResultWithToolsSchema: CreateMessageResultWithToolsSchema$1,
    BooleanSchemaSchema: BooleanSchemaSchema$1,
    StringSchemaSchema: StringSchemaSchema$1,
    NumberSchemaSchema: NumberSchemaSchema$1,
    UntitledSingleSelectEnumSchemaSchema: UntitledSingleSelectEnumSchemaSchema$1,
    TitledSingleSelectEnumSchemaSchema: TitledSingleSelectEnumSchemaSchema$1,
    LegacyTitledEnumSchemaSchema: LegacyTitledEnumSchemaSchema$1,
    SingleSelectEnumSchemaSchema: SingleSelectEnumSchemaSchema$1,
    UntitledMultiSelectEnumSchemaSchema: UntitledMultiSelectEnumSchemaSchema$1,
    TitledMultiSelectEnumSchemaSchema: TitledMultiSelectEnumSchemaSchema$1,
    MultiSelectEnumSchemaSchema: MultiSelectEnumSchemaSchema$1,
    EnumSchemaSchema: EnumSchemaSchema$1,
    PrimitiveSchemaDefinitionSchema: PrimitiveSchemaDefinitionSchema$1,
    ElicitRequestFormParamsSchema: ElicitRequestFormParamsSchema$1,
    ElicitRequestURLParamsSchema: ElicitRequestURLParamsSchema$1,
    ElicitRequestParamsSchema: ElicitRequestParamsSchema$1,
    ElicitRequestSchema: ElicitRequestSchema$1,
    ElicitationCompleteNotificationParamsSchema: ElicitationCompleteNotificationParamsSchema$1,
    ElicitationCompleteNotificationSchema: ElicitationCompleteNotificationSchema$1,
    ElicitResultSchema: ElicitResultSchema$1,
    ResourceTemplateReferenceSchema: ResourceTemplateReferenceSchema$1,
    PromptReferenceSchema: PromptReferenceSchema$1,
    CompleteRequestParamsSchema: CompleteRequestParamsSchema$1,
    CompleteRequestSchema: CompleteRequestSchema$1,
    CompleteResultSchema: CompleteResultSchema$1,
    RootSchema: RootSchema$1,
    ListRootsRequestSchema: ListRootsRequestSchema$1,
    ListRootsResultSchema: ListRootsResultSchema$1,
    RootsListChangedNotificationSchema: RootsListChangedNotificationSchema$1,
    TaskCreationParamsSchema: TaskCreationParamsSchema$1,
    TaskStatusSchema: TaskStatusSchema$1,
    TaskSchema: TaskSchema$1,
    CreateTaskResultSchema: CreateTaskResultSchema$1,
    TaskStatusNotificationParamsSchema: TaskStatusNotificationParamsSchema$1,
    TaskStatusNotificationSchema: TaskStatusNotificationSchema$1,
    GetTaskRequestSchema: GetTaskRequestSchema$1,
    GetTaskResultSchema: GetTaskResultSchema$1,
    GetTaskPayloadRequestSchema: GetTaskPayloadRequestSchema$1,
    GetTaskPayloadResultSchema: GetTaskPayloadResultSchema$1,
    ListTasksRequestSchema: ListTasksRequestSchema$1,
    ListTasksResultSchema: ListTasksResultSchema$1,
    CancelTaskRequestSchema: CancelTaskRequestSchema$1,
    CancelTaskResultSchema: ResultSchema$1.merge(TaskSchema$1),
    ClientRequestSchema: union([
      PingRequestSchema$1,
      InitializeRequestSchema$1,
      CompleteRequestSchema$1,
      SetLevelRequestSchema$1,
      GetPromptRequestSchema$1,
      ListPromptsRequestSchema$1,
      ListResourcesRequestSchema$1,
      ListResourceTemplatesRequestSchema$1,
      ReadResourceRequestSchema$1,
      SubscribeRequestSchema$1,
      UnsubscribeRequestSchema$1,
      CallToolRequestSchema$1,
      ListToolsRequestSchema$1,
      GetTaskRequestSchema$1,
      GetTaskPayloadRequestSchema$1,
      ListTasksRequestSchema$1,
      CancelTaskRequestSchema$1
    ]),
    ClientNotificationSchema: union([
      CancelledNotificationSchema$1,
      ProgressNotificationSchema$1,
      InitializedNotificationSchema$1,
      RootsListChangedNotificationSchema$1,
      TaskStatusNotificationSchema$1
    ]),
    ClientResultSchema: union([
      EmptyResultSchema$1,
      CreateMessageResultSchema$1,
      CreateMessageResultWithToolsSchema$1,
      ElicitResultSchema$1,
      ListRootsResultSchema$1,
      GetTaskResultSchema$1,
      ListTasksResultSchema$1,
      CreateTaskResultSchema$1
    ]),
    ServerRequestSchema: union([
      PingRequestSchema$1,
      CreateMessageRequestSchema$1,
      ElicitRequestSchema$1,
      ListRootsRequestSchema$1,
      GetTaskRequestSchema$1,
      GetTaskPayloadRequestSchema$1,
      ListTasksRequestSchema$1,
      CancelTaskRequestSchema$1
    ]),
    ServerNotificationSchema: union([
      CancelledNotificationSchema$1,
      ProgressNotificationSchema$1,
      LoggingMessageNotificationSchema$1,
      ResourceUpdatedNotificationSchema$1,
      ResourceListChangedNotificationSchema$1,
      ToolListChangedNotificationSchema$1,
      PromptListChangedNotificationSchema$1,
      TaskStatusNotificationSchema$1,
      ElicitationCompleteNotificationSchema$1
    ]),
    ServerResultSchema: union([
      EmptyResultSchema$1,
      InitializeResultSchema$1,
      CompleteResultSchema$1,
      GetPromptResultSchema$1,
      ListPromptsResultSchema$1,
      ListResourcesResultSchema$1,
      ListResourceTemplatesResultSchema$1,
      ReadResourceResultSchema$1,
      CallToolResultSchema$1,
      ListToolsResultSchema$1,
      GetTaskResultSchema$1,
      ListTasksResultSchema$1,
      CreateTaskResultSchema$1
    ]),
    CallToolResultWireSchema: unknown().superRefine((value, ctx) => {
      if (typeof value !== "object" || value === null || Array.isArray(value) || value.content !== void 0) return;
      for (const key of TOOL_RESULT_FOREIGN_FAMILY_KEYS) if (key in value) {
        ctx.addIssue({
          code: "custom",
          message: `content is required when the body carries '${key}' \u2014 another result family cannot default into an empty tools/call success`
        });
        return;
      }
    }).transform(normalizeContentlessToolResult).pipe(CallToolResultSchema$1)
  };
}
__name(build$1, "build$1");
var memo$1;
function buildSchemas2025() {
  return memo$1 ??= build$1();
}
__name(buildSchemas2025, "buildSchemas2025");
function isNonObjectJsonSchemaRoot(json) {
  return json["type"] !== "object";
}
__name(isNonObjectJsonSchemaRoot, "isNonObjectJsonSchemaRoot");
var REF_REWRITE_DATA_POSITION_KEYS = /* @__PURE__ */ new Set([
  "const",
  "enum",
  "default",
  "examples"
]);
var REF_REWRITE_NAME_MAP_KEYS = /* @__PURE__ */ new Set([
  "properties",
  "patternProperties",
  "$defs",
  "definitions",
  "dependentSchemas",
  "dependencies"
]);
function establishesNewBase(id) {
  return id !== void 0 && !(typeof id === "string" && id.startsWith("#"));
}
__name(establishesNewBase, "establishesNewBase");
function wrapOutputSchemaForLegacy(natural) {
  const $schema = typeof natural["$schema"] === "string" ? natural["$schema"] : void 0;
  if (establishesNewBase(natural["$id"])) return {
    ...$schema !== void 0 && { $schema },
    type: "object",
    properties: { result: natural },
    required: ["result"]
  };
  const convertRecursiveRefs = declares2019Dialect(natural["$schema"]) && natural["$recursiveAnchor"] !== true;
  const rewriteRefs = /* @__PURE__ */ __name((node2, parentIsNameMap) => {
    if (Array.isArray(node2)) return node2.map((item) => rewriteRefs(item, false));
    if (node2 === null || typeof node2 !== "object") return node2;
    if (!parentIsNameMap && establishesNewBase(node2["$id"])) return node2;
    const out = {};
    let convertedRecursion = false;
    for (const [k, v] of Object.entries(node2)) if (parentIsNameMap) out[k] = rewriteRefs(v, false);
    else if ((k === "$ref" || k === "$dynamicRef") && typeof v === "string") out[k] = v === "#" ? "#/properties/result" : v.startsWith("#/") ? `#/properties/result${v.slice(1)}` : v;
    else if (k === "$recursiveRef" && v === "#" && convertRecursiveRefs) convertedRecursion = true;
    else if (REF_REWRITE_DATA_POSITION_KEYS.has(k)) out[k] = v;
    else if (REF_REWRITE_NAME_MAP_KEYS.has(k)) out[k] = rewriteRefs(v, true);
    else out[k] = rewriteRefs(v, false);
    if (convertedRecursion) if ("$ref" in out) out["allOf"] = [...Array.isArray(out["allOf"]) ? out["allOf"] : [], { $ref: "#/properties/result" }];
    else out["$ref"] = "#/properties/result";
    return out;
  }, "rewriteRefs");
  return {
    ...$schema !== void 0 && { $schema },
    type: "object",
    properties: { result: rewriteRefs(natural, false) },
    required: ["result"]
  };
}
__name(wrapOutputSchemaForLegacy, "wrapOutputSchemaForLegacy");
var requestMethodKeys$1 = {
  ping: null,
  initialize: null,
  "completion/complete": null,
  "logging/setLevel": null,
  "prompts/get": null,
  "prompts/list": null,
  "resources/list": null,
  "resources/templates/list": null,
  "resources/read": null,
  "resources/subscribe": null,
  "resources/unsubscribe": null,
  "tools/call": null,
  "tools/list": null,
  "tasks/get": null,
  "tasks/result": null,
  "tasks/list": null,
  "tasks/cancel": null,
  "sampling/createMessage": null,
  "elicitation/create": null,
  "roots/list": null
};
var notificationMethodKeys$1 = {
  "notifications/cancelled": null,
  "notifications/progress": null,
  "notifications/initialized": null,
  "notifications/roots/list_changed": null,
  "notifications/tasks/status": null,
  "notifications/message": null,
  "notifications/resources/updated": null,
  "notifications/resources/list_changed": null,
  "notifications/tools/list_changed": null,
  "notifications/prompts/list_changed": null,
  "notifications/elicitation/complete": null
};
var resultMethodKeys = {
  ping: null,
  initialize: null,
  "completion/complete": null,
  "logging/setLevel": null,
  "prompts/get": null,
  "prompts/list": null,
  "resources/list": null,
  "resources/templates/list": null,
  "resources/read": null,
  "resources/subscribe": null,
  "resources/unsubscribe": null,
  "tools/call": null,
  "tools/list": null,
  "sampling/createMessage": null,
  "elicitation/create": null,
  "roots/list": null
};
var maps$1;
function registryMaps() {
  if (maps$1) return maps$1;
  const s = buildSchemas2025();
  maps$1 = {
    requestSchemas: {
      ping: s.PingRequestSchema,
      initialize: s.InitializeRequestSchema,
      "completion/complete": s.CompleteRequestSchema,
      "logging/setLevel": s.SetLevelRequestSchema,
      "prompts/get": s.GetPromptRequestSchema,
      "prompts/list": s.ListPromptsRequestSchema,
      "resources/list": s.ListResourcesRequestSchema,
      "resources/templates/list": s.ListResourceTemplatesRequestSchema,
      "resources/read": s.ReadResourceRequestSchema,
      "resources/subscribe": s.SubscribeRequestSchema,
      "resources/unsubscribe": s.UnsubscribeRequestSchema,
      "tools/call": s.CallToolRequestSchema,
      "tools/list": s.ListToolsRequestSchema,
      "tasks/get": s.GetTaskRequestSchema,
      "tasks/result": s.GetTaskPayloadRequestSchema,
      "tasks/list": s.ListTasksRequestSchema,
      "tasks/cancel": s.CancelTaskRequestSchema,
      "sampling/createMessage": s.CreateMessageRequestSchema,
      "elicitation/create": s.ElicitRequestSchema,
      "roots/list": s.ListRootsRequestSchema
    },
    notificationSchemas: {
      "notifications/cancelled": s.CancelledNotificationSchema,
      "notifications/progress": s.ProgressNotificationSchema,
      "notifications/initialized": s.InitializedNotificationSchema,
      "notifications/roots/list_changed": s.RootsListChangedNotificationSchema,
      "notifications/tasks/status": s.TaskStatusNotificationSchema,
      "notifications/message": s.LoggingMessageNotificationSchema,
      "notifications/resources/updated": s.ResourceUpdatedNotificationSchema,
      "notifications/resources/list_changed": s.ResourceListChangedNotificationSchema,
      "notifications/tools/list_changed": s.ToolListChangedNotificationSchema,
      "notifications/prompts/list_changed": s.PromptListChangedNotificationSchema,
      "notifications/elicitation/complete": s.ElicitationCompleteNotificationSchema
    },
    resultSchemas: {
      ping: s.EmptyResultSchema,
      initialize: s.InitializeResultSchema,
      "completion/complete": s.CompleteResultSchema,
      "logging/setLevel": s.EmptyResultSchema,
      "prompts/get": s.GetPromptResultSchema,
      "prompts/list": s.ListPromptsResultSchema,
      "resources/list": s.ListResourcesResultSchema,
      "resources/templates/list": s.ListResourceTemplatesResultSchema,
      "resources/read": s.ReadResourceResultSchema,
      "resources/subscribe": s.EmptyResultSchema,
      "resources/unsubscribe": s.EmptyResultSchema,
      "tools/call": s.CallToolResultWireSchema,
      "tools/list": s.ListToolsResultSchema,
      "sampling/createMessage": s.CreateMessageResultWithToolsSchema,
      "elicitation/create": s.ElicitResultSchema,
      "roots/list": s.ListRootsResultSchema
    }
  };
  return maps$1;
}
__name(registryMaps, "registryMaps");
function warmRegistryMaps2025() {
  registryMaps();
}
__name(warmRegistryMaps2025, "warmRegistryMaps2025");
function hasRequestMethod2025(method) {
  return Object.prototype.hasOwnProperty.call(requestMethodKeys$1, method);
}
__name(hasRequestMethod2025, "hasRequestMethod2025");
function hasNotificationMethod2025(method) {
  return Object.prototype.hasOwnProperty.call(notificationMethodKeys$1, method);
}
__name(hasNotificationMethod2025, "hasNotificationMethod2025");
function hasResultMethod(method) {
  return Object.prototype.hasOwnProperty.call(resultMethodKeys, method);
}
__name(hasResultMethod, "hasResultMethod");
function getResultSchema(method) {
  return hasResultMethod(method) ? registryMaps().resultSchemas[method] : void 0;
}
__name(getResultSchema, "getResultSchema");
function getRequestSchema(method) {
  return hasRequestMethod2025(method) ? registryMaps().requestSchemas[method] : void 0;
}
__name(getRequestSchema, "getRequestSchema");
function getNotificationSchema(method) {
  return hasNotificationMethod2025(method) ? registryMaps().notificationSchemas[method] : void 0;
}
__name(getNotificationSchema, "getNotificationSchema");
var rev2025RequestMethods = Object.keys(requestMethodKeys$1);
var rev2025NotificationMethods = Object.keys(notificationMethodKeys$1);
function isPlainObject$6(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
__name(isPlainObject$6, "isPlainObject$6");
function triState$1(schema, raw) {
  if (schema === void 0) return {
    ok: false,
    reason: "not-in-era"
  };
  const parsed = schema.safeParse(raw);
  return parsed.success ? {
    ok: true,
    value: parsed.data
  } : {
    ok: false,
    reason: "invalid",
    message: String(parsed.error)
  };
}
__name(triState$1, "triState$1");
var NOT_IN_ERA$1 = {
  ok: false,
  reason: "not-in-era"
};
function toolNeedsLegacyWrap(t) {
  return isPlainObject$6(t) && isPlainObject$6(t["outputSchema"]) && isNonObjectJsonSchemaRoot(t["outputSchema"]);
}
__name(toolNeedsLegacyWrap, "toolNeedsLegacyWrap");
function toNeutralResult(value) {
  return value;
}
__name(toNeutralResult, "toNeutralResult");
var rev2025Codec = {
  era: "2025-11-25",
  hasRequestMethod: hasRequestMethod2025,
  hasNotificationMethod: hasNotificationMethod2025,
  validateRequest: /* @__PURE__ */ __name((method, raw) => triState$1(getRequestSchema(method), raw), "validateRequest"),
  validateResult: /* @__PURE__ */ __name((method, raw) => triState$1(getResultSchema(method), raw), "validateResult"),
  validateNotification: /* @__PURE__ */ __name((method, raw) => triState$1(getNotificationSchema(method), raw), "validateNotification"),
  hasInputRequestMethod: /* @__PURE__ */ __name(() => false, "hasInputRequestMethod"),
  validateInputRequest: /* @__PURE__ */ __name(() => NOT_IN_ERA$1, "validateInputRequest"),
  validateInputResponse: /* @__PURE__ */ __name(() => NOT_IN_ERA$1, "validateInputResponse"),
  samplingResultVariant: /* @__PURE__ */ __name(((hasTools, raw) => {
    const s = buildSchemas2025();
    return triState$1(hasTools ? s.CreateMessageResultWithToolsSchema : s.CreateMessageResultSchema, raw);
  }), "samplingResultVariant"),
  outboundEnvelope: /* @__PURE__ */ __name((_material) => void 0, "outboundEnvelope"),
  validateEnvelopeMeta: /* @__PURE__ */ __name((_meta) => [], "validateEnvelopeMeta"),
  projectCallToolResult(result, advertisedOutputSchema) {
    const withText = appendTextFallbackForNonObject(result);
    const sc = withText.structuredContent;
    if (sc === void 0) return withText;
    const valueIsNonObject = typeof sc !== "object" || sc === null || Array.isArray(sc);
    const schemaWrapped = advertisedOutputSchema !== void 0 && isNonObjectJsonSchemaRoot(advertisedOutputSchema);
    if (!valueIsNonObject && !schemaWrapped) return withText;
    return {
      ...withText,
      structuredContent: { result: sc }
    };
  },
  decodeResult(_method, raw) {
    if (isPlainObject$6(raw) && "resultType" in raw) {
      const stripped = { ...raw };
      delete stripped["resultType"];
      return {
        kind: "complete",
        result: toNeutralResult(stripped)
      };
    }
    return {
      kind: "complete",
      result: toNeutralResult(raw)
    };
  },
  encodeResult(method, result) {
    if (method !== "tools/list") return result;
    const tools = result.tools;
    if (!Array.isArray(tools) || !tools.some((t) => toolNeedsLegacyWrap(t))) return result;
    return {
      ...result,
      tools: tools.map((t) => toolNeedsLegacyWrap(t) ? {
        ...t,
        outputSchema: wrapOutputSchemaForLegacy(t.outputSchema)
      } : t)
    };
  },
  encodeErrorCode: /* @__PURE__ */ __name((code) => code === -32002 ? -32602 : code, "encodeErrorCode"),
  checkInboundEnvelope: /* @__PURE__ */ __name((_material) => void 0, "checkInboundEnvelope")
};
function build() {
  const JSONValueSchema$1 = lazy(() => union([
    string2(),
    number2(),
    boolean2(),
    _null3(),
    record(string2(), JSONValueSchema$1),
    array(JSONValueSchema$1)
  ]));
  const JSONObjectSchema$1 = record(string2(), JSONValueSchema$1);
  const ProgressTokenSchema$1 = union([string2(), number2().int()]);
  const CursorSchema$1 = string2();
  const RequestIdSchema$1 = union([string2(), number2().int()]);
  const RoleSchema$1 = _enum(["user", "assistant"]);
  const LoggingLevelSchema$1 = _enum([
    "debug",
    "info",
    "notice",
    "warning",
    "error",
    "critical",
    "alert",
    "emergency"
  ]);
  const Base64Schema2 = string2().refine((val) => {
    try {
      atob(val);
      return true;
    } catch {
      return false;
    }
  }, { message: "Invalid Base64 string" });
  const TaskMetadataSchema$1 = object({ ttl: number2().optional() });
  const RelatedTaskMetadataSchema$1 = object({ taskId: string2() });
  const RequestMetaSchema$1 = looseObject({
    progressToken: ProgressTokenSchema$1.optional(),
    "io.modelcontextprotocol/related-task": RelatedTaskMetadataSchema$1.optional()
  });
  const BaseRequestParamsSchema$1 = object({ _meta: RequestMetaSchema$1.optional() });
  const TaskAugmentedRequestParamsSchema$1 = BaseRequestParamsSchema$1.extend({ task: TaskMetadataSchema$1.optional() });
  const NotificationsParamsSchema$1 = object({ _meta: RequestMetaSchema$1.optional() });
  const NotificationSchema$1 = object({
    method: string2(),
    params: NotificationsParamsSchema$1.loose().optional()
  });
  const IconSchema$1 = object({
    src: string2(),
    mimeType: string2().optional(),
    sizes: array(string2()).optional(),
    theme: _enum(["light", "dark"]).optional()
  });
  const IconsSchema$1 = object({ icons: array(IconSchema$1).optional() });
  const BaseMetadataSchema$1 = object({
    name: string2(),
    title: string2().optional()
  });
  const ImplementationSchema$1 = BaseMetadataSchema$1.extend({
    ...BaseMetadataSchema$1.shape,
    ...IconsSchema$1.shape,
    version: string2(),
    websiteUrl: string2().optional(),
    description: string2().optional()
  });
  const FormElicitationCapabilitySchema2 = intersection(object({ applyDefaults: boolean2().optional() }), JSONObjectSchema$1);
  const ElicitationCapabilitySchema2 = preprocess((value) => {
    if (value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0) return { form: {} };
    return value;
  }, intersection(object({
    form: FormElicitationCapabilitySchema2.optional(),
    url: JSONObjectSchema$1.optional()
  }), JSONObjectSchema$1.optional()));
  const ClientTasksCapabilitySchema$1 = looseObject({
    list: JSONObjectSchema$1.optional(),
    cancel: JSONObjectSchema$1.optional(),
    requests: looseObject({
      sampling: looseObject({ createMessage: JSONObjectSchema$1.optional() }).optional(),
      elicitation: looseObject({ create: JSONObjectSchema$1.optional() }).optional()
    }).optional()
  });
  const ServerTasksCapabilitySchema$1 = looseObject({
    list: JSONObjectSchema$1.optional(),
    cancel: JSONObjectSchema$1.optional(),
    requests: looseObject({ tools: looseObject({ call: JSONObjectSchema$1.optional() }).optional() }).optional()
  });
  const ClientCapabilitiesSchema$1 = object({
    experimental: record(string2(), JSONObjectSchema$1).optional(),
    sampling: object({
      context: JSONObjectSchema$1.optional(),
      tools: JSONObjectSchema$1.optional()
    }).optional(),
    elicitation: ElicitationCapabilitySchema2.optional(),
    roots: object({ listChanged: boolean2().optional() }).optional(),
    tasks: ClientTasksCapabilitySchema$1.optional(),
    extensions: record(string2(), JSONObjectSchema$1).optional()
  });
  const ServerCapabilitiesSchema$1 = object({
    experimental: record(string2(), JSONObjectSchema$1).optional(),
    logging: JSONObjectSchema$1.optional(),
    completions: JSONObjectSchema$1.optional(),
    prompts: object({ listChanged: boolean2().optional() }).optional(),
    resources: object({
      subscribe: boolean2().optional(),
      listChanged: boolean2().optional()
    }).optional(),
    tools: object({ listChanged: boolean2().optional() }).optional(),
    tasks: ServerTasksCapabilitySchema$1.optional(),
    extensions: record(string2(), JSONObjectSchema$1).optional()
  });
  const ProgressSchema$1 = object({
    progress: number2(),
    total: optional(number2()),
    message: optional(string2())
  });
  const ProgressNotificationParamsSchema$1 = object({
    ...NotificationsParamsSchema$1.shape,
    ...ProgressSchema$1.shape,
    progressToken: ProgressTokenSchema$1
  });
  const ProgressNotificationSchema$1 = NotificationSchema$1.extend({
    method: literal("notifications/progress"),
    params: ProgressNotificationParamsSchema$1
  });
  const LoggingMessageNotificationParamsSchema$1 = NotificationsParamsSchema$1.extend({
    level: LoggingLevelSchema$1,
    logger: string2().optional(),
    data: unknown()
  });
  const LoggingMessageNotificationSchema$1 = NotificationSchema$1.extend({
    method: literal("notifications/message"),
    params: LoggingMessageNotificationParamsSchema$1
  });
  const ResourceContentsSchema$1 = object({
    uri: string2(),
    mimeType: optional(string2()),
    _meta: record(string2(), unknown()).optional()
  });
  const TextResourceContentsSchema$1 = ResourceContentsSchema$1.extend({ text: string2() });
  const BlobResourceContentsSchema$1 = ResourceContentsSchema$1.extend({ blob: Base64Schema2 });
  const AnnotationsSchema$1 = object({
    audience: array(RoleSchema$1).optional(),
    priority: number2().min(0).max(1).optional(),
    lastModified: iso_exports.datetime({ offset: true }).optional()
  });
  const ResourceSchema$1 = object({
    ...BaseMetadataSchema$1.shape,
    ...IconsSchema$1.shape,
    uri: string2(),
    description: optional(string2()),
    mimeType: optional(string2()),
    size: optional(number2()),
    annotations: AnnotationsSchema$1.optional(),
    _meta: optional(looseObject({}))
  });
  const ResourceTemplateSchema$1 = object({
    ...BaseMetadataSchema$1.shape,
    ...IconsSchema$1.shape,
    uriTemplate: string2(),
    description: optional(string2()),
    mimeType: optional(string2()),
    annotations: AnnotationsSchema$1.optional(),
    _meta: optional(looseObject({}))
  });
  const ResourceListChangedNotificationSchema$1 = NotificationSchema$1.extend({
    method: literal("notifications/resources/list_changed"),
    params: NotificationsParamsSchema$1.optional()
  });
  const ResourceUpdatedNotificationParamsSchema$1 = NotificationsParamsSchema$1.extend({ uri: string2() });
  const ResourceUpdatedNotificationSchema$1 = NotificationSchema$1.extend({
    method: literal("notifications/resources/updated"),
    params: ResourceUpdatedNotificationParamsSchema$1
  });
  const PromptArgumentSchema$1 = object({
    name: string2(),
    description: optional(string2()),
    required: optional(boolean2())
  });
  const PromptSchema$1 = object({
    ...BaseMetadataSchema$1.shape,
    ...IconsSchema$1.shape,
    description: optional(string2()),
    arguments: optional(array(PromptArgumentSchema$1)),
    _meta: optional(looseObject({}))
  });
  const PromptListChangedNotificationSchema$1 = NotificationSchema$1.extend({
    method: literal("notifications/prompts/list_changed"),
    params: NotificationsParamsSchema$1.optional()
  });
  const TextContentSchema$1 = object({
    type: literal("text"),
    text: string2(),
    annotations: AnnotationsSchema$1.optional(),
    _meta: record(string2(), unknown()).optional()
  });
  const ImageContentSchema$1 = object({
    type: literal("image"),
    data: Base64Schema2,
    mimeType: string2(),
    annotations: AnnotationsSchema$1.optional(),
    _meta: record(string2(), unknown()).optional()
  });
  const AudioContentSchema$1 = object({
    type: literal("audio"),
    data: Base64Schema2,
    mimeType: string2(),
    annotations: AnnotationsSchema$1.optional(),
    _meta: record(string2(), unknown()).optional()
  });
  const ToolUseContentSchema$1 = object({
    type: literal("tool_use"),
    name: string2(),
    id: string2(),
    input: record(string2(), unknown()),
    _meta: record(string2(), unknown()).optional()
  });
  const EmbeddedResourceSchema$1 = object({
    type: literal("resource"),
    resource: union([TextResourceContentsSchema$1, BlobResourceContentsSchema$1]),
    annotations: AnnotationsSchema$1.optional(),
    _meta: record(string2(), unknown()).optional()
  });
  const ResourceLinkSchema$1 = ResourceSchema$1.extend({ type: literal("resource_link") });
  const ContentBlockSchema$1 = union([
    TextContentSchema$1,
    ImageContentSchema$1,
    AudioContentSchema$1,
    ResourceLinkSchema$1,
    EmbeddedResourceSchema$1
  ]);
  const PromptMessageSchema$1 = object({
    role: RoleSchema$1,
    content: ContentBlockSchema$1
  });
  const ToolAnnotationsSchema$1 = object({
    title: string2().optional(),
    readOnlyHint: boolean2().optional(),
    destructiveHint: boolean2().optional(),
    idempotentHint: boolean2().optional(),
    openWorldHint: boolean2().optional()
  });
  const ToolListChangedNotificationSchema$1 = NotificationSchema$1.extend({
    method: literal("notifications/tools/list_changed"),
    params: NotificationsParamsSchema$1.optional()
  });
  const ModelHintSchema$1 = object({ name: string2().optional() });
  const ModelPreferencesSchema$1 = object({
    hints: array(ModelHintSchema$1).optional(),
    costPriority: number2().min(0).max(1).optional(),
    speedPriority: number2().min(0).max(1).optional(),
    intelligencePriority: number2().min(0).max(1).optional()
  });
  const ToolChoiceSchema$1 = object({ mode: _enum([
    "auto",
    "required",
    "none"
  ]).optional() });
  const BooleanSchemaSchema$1 = object({
    type: literal("boolean"),
    title: string2().optional(),
    description: string2().optional(),
    default: boolean2().optional()
  });
  const StringSchemaSchema$1 = object({
    type: literal("string"),
    title: string2().optional(),
    description: string2().optional(),
    minLength: number2().optional(),
    maxLength: number2().optional(),
    format: _enum([
      "email",
      "uri",
      "date",
      "date-time"
    ]).optional(),
    default: string2().optional()
  });
  const NumberSchemaSchema$1 = object({
    type: _enum(["number", "integer"]),
    title: string2().optional(),
    description: string2().optional(),
    minimum: number2().optional(),
    maximum: number2().optional(),
    default: number2().optional()
  });
  const UntitledSingleSelectEnumSchemaSchema$1 = object({
    type: literal("string"),
    title: string2().optional(),
    description: string2().optional(),
    enum: array(string2()),
    default: string2().optional()
  });
  const TitledSingleSelectEnumSchemaSchema$1 = object({
    type: literal("string"),
    title: string2().optional(),
    description: string2().optional(),
    oneOf: array(object({
      const: string2(),
      title: string2()
    })),
    default: string2().optional()
  });
  const LegacyTitledEnumSchemaSchema$1 = object({
    type: literal("string"),
    title: string2().optional(),
    description: string2().optional(),
    enum: array(string2()),
    enumNames: array(string2()).optional(),
    default: string2().optional()
  });
  const SingleSelectEnumSchemaSchema$1 = union([UntitledSingleSelectEnumSchemaSchema$1, TitledSingleSelectEnumSchemaSchema$1]);
  const UntitledMultiSelectEnumSchemaSchema$1 = object({
    type: literal("array"),
    title: string2().optional(),
    description: string2().optional(),
    minItems: number2().optional(),
    maxItems: number2().optional(),
    items: object({
      type: literal("string"),
      enum: array(string2())
    }),
    default: array(string2()).optional()
  });
  const TitledMultiSelectEnumSchemaSchema$1 = object({
    type: literal("array"),
    title: string2().optional(),
    description: string2().optional(),
    minItems: number2().optional(),
    maxItems: number2().optional(),
    items: object({ anyOf: array(object({
      const: string2(),
      title: string2()
    })) }),
    default: array(string2()).optional()
  });
  const MultiSelectEnumSchemaSchema$1 = union([UntitledMultiSelectEnumSchemaSchema$1, TitledMultiSelectEnumSchemaSchema$1]);
  const EnumSchemaSchema$1 = union([
    LegacyTitledEnumSchemaSchema$1,
    SingleSelectEnumSchemaSchema$1,
    MultiSelectEnumSchemaSchema$1
  ]);
  const PrimitiveSchemaDefinitionSchema$1 = union([
    EnumSchemaSchema$1,
    BooleanSchemaSchema$1,
    StringSchemaSchema$1,
    NumberSchemaSchema$1
  ]);
  const ElicitRequestFormParamsSchema$1 = TaskAugmentedRequestParamsSchema$1.extend({
    mode: literal("form").optional(),
    message: string2(),
    requestedSchema: object({
      type: literal("object"),
      properties: record(string2(), PrimitiveSchemaDefinitionSchema$1),
      required: array(string2()).optional()
    }).catchall(unknown())
  });
  const ResourceTemplateReferenceSchema$1 = object({
    type: literal("ref/resource"),
    uri: string2()
  });
  const PromptReferenceSchema$1 = object({
    type: literal("ref/prompt"),
    name: string2()
  });
  const RootSchema$1 = object({
    uri: string2().startsWith("file://"),
    name: string2().optional(),
    _meta: record(string2(), unknown()).optional()
  });
  const sharedClientCapabilityShape = ClientCapabilitiesSchema$1.shape;
  const ClientCapabilities2026Schema = object({
    experimental: sharedClientCapabilityShape.experimental,
    sampling: sharedClientCapabilityShape.sampling,
    elicitation: sharedClientCapabilityShape.elicitation,
    roots: sharedClientCapabilityShape.roots,
    extensions: sharedClientCapabilityShape.extensions
  });
  const sharedServerCapabilityShape = ServerCapabilitiesSchema$1.shape;
  const ServerCapabilities2026Schema = object({
    experimental: sharedServerCapabilityShape.experimental,
    logging: sharedServerCapabilityShape.logging,
    completions: sharedServerCapabilityShape.completions,
    prompts: sharedServerCapabilityShape.prompts,
    resources: sharedServerCapabilityShape.resources,
    tools: sharedServerCapabilityShape.tools,
    extensions: sharedServerCapabilityShape.extensions
  });
  const RequestMetaEnvelopeSchema = looseObject({
    progressToken: ProgressTokenSchema$1.optional(),
    [PROTOCOL_VERSION_META_KEY]: string2(),
    [CLIENT_INFO_META_KEY]: ImplementationSchema$1.optional(),
    [CLIENT_CAPABILITIES_META_KEY]: ClientCapabilities2026Schema,
    [LOG_LEVEL_META_KEY]: LoggingLevelSchema$1.optional()
  });
  const ToolSchema$1 = object({
    ...BaseMetadataSchema$1.shape,
    ...IconsSchema$1.shape,
    description: string2().optional(),
    inputSchema: looseObject({
      $schema: string2().optional(),
      type: literal("object")
    }),
    outputSchema: looseObject({ $schema: string2().optional() }).optional(),
    annotations: ToolAnnotationsSchema$1.optional(),
    _meta: record(string2(), unknown()).optional()
  });
  const ToolResultContentSchema$1 = object({
    type: literal("tool_result"),
    toolUseId: string2(),
    content: array(ContentBlockSchema$1),
    structuredContent: unknown().optional(),
    isError: boolean2().optional(),
    _meta: record(string2(), unknown()).optional()
  });
  const SamplingMessageContentBlockSchema$1 = union([
    TextContentSchema$1,
    ImageContentSchema$1,
    AudioContentSchema$1,
    ToolUseContentSchema$1,
    ToolResultContentSchema$1
  ]);
  const SamplingMessageSchema$1 = object({
    role: RoleSchema$1,
    content: union([SamplingMessageContentBlockSchema$1, array(SamplingMessageContentBlockSchema$1)]),
    _meta: record(string2(), unknown()).optional()
  });
  const ResultTypeSchema = string2();
  const ResultMetaSchema = looseObject({ [SERVER_INFO_META_KEY]: ImplementationSchema$1.optional().catch(void 0) });
  const wireMeta = ResultMetaSchema.optional();
  function wireResult(shape) {
    return looseObject({
      _meta: wireMeta,
      resultType: ResultTypeSchema.default("complete"),
      ...shape
    });
  }
  __name(wireResult, "wireResult");
  const ResultSchema$1 = wireResult({});
  const PaginatedResultSchema$1 = wireResult({ nextCursor: CursorSchema$1.optional() });
  const CallToolResultSchema$1 = wireResult({
    content: array(ContentBlockSchema$1),
    structuredContent: unknown().optional(),
    isError: boolean2().optional()
  });
  const ListToolsResultSchema$1 = wireResult({
    ttlMs: number2().int().min(0),
    cacheScope: _enum(["public", "private"]),
    tools: array(ToolSchema$1),
    nextCursor: CursorSchema$1.optional()
  });
  const ListPromptsResultSchema$1 = wireResult({
    ttlMs: number2().int().min(0),
    cacheScope: _enum(["public", "private"]),
    prompts: array(PromptSchema$1),
    nextCursor: CursorSchema$1.optional()
  });
  const GetPromptResultSchema$1 = wireResult({
    description: string2().optional(),
    messages: array(PromptMessageSchema$1)
  });
  const ListResourcesResultSchema$1 = wireResult({
    ttlMs: number2().int().min(0),
    cacheScope: _enum(["public", "private"]),
    resources: array(ResourceSchema$1),
    nextCursor: CursorSchema$1.optional()
  });
  const ListResourceTemplatesResultSchema$1 = wireResult({
    ttlMs: number2().int().min(0),
    cacheScope: _enum(["public", "private"]),
    resourceTemplates: array(ResourceTemplateSchema$1),
    nextCursor: CursorSchema$1.optional()
  });
  const ReadResourceResultSchema$1 = wireResult({
    ttlMs: number2().int().min(0),
    cacheScope: _enum(["public", "private"]),
    contents: array(union([TextResourceContentsSchema$1, BlobResourceContentsSchema$1]))
  });
  const CompleteResultSchema$1 = wireResult({ completion: object({
    values: array(string2()).max(100),
    total: number2().int().optional(),
    hasMore: boolean2().optional()
  }).loose() });
  const CacheableResultSchema = wireResult({
    ttlMs: number2().int().min(0),
    cacheScope: _enum(["public", "private"])
  });
  const DiscoverResultSchema$1 = wireResult({
    ttlMs: number2().int().min(0).catch(0),
    cacheScope: _enum(["public", "private"]).catch("private"),
    supportedVersions: array(string2()),
    capabilities: ServerCapabilities2026Schema,
    instructions: string2().optional()
  });
  const CreateMessageRequestParamsSchema$1 = object({
    messages: array(SamplingMessageSchema$1),
    modelPreferences: ModelPreferencesSchema$1.optional(),
    systemPrompt: string2().optional(),
    includeContext: _enum([
      "none",
      "thisServer",
      "allServers"
    ]).optional(),
    temperature: number2().optional(),
    maxTokens: number2().int(),
    stopSequences: array(string2()).optional(),
    metadata: JSONObjectSchema$1.optional(),
    tools: array(ToolSchema$1).optional(),
    toolChoice: ToolChoiceSchema$1.optional()
  });
  const CreateMessageRequestSchema$1 = object({
    method: literal("sampling/createMessage"),
    params: CreateMessageRequestParamsSchema$1
  });
  const ListRootsRequestSchema$1 = object({
    method: literal("roots/list"),
    params: object({ _meta: record(string2(), unknown()).optional() }).optional()
  });
  const CreateMessageResultSchema$1 = object({
    ...SamplingMessageSchema$1.shape,
    model: string2(),
    stopReason: string2().optional()
  });
  const ListRootsResultSchema$1 = object({ roots: array(RootSchema$1) });
  const ElicitResultSchema$1 = object({
    action: _enum([
      "accept",
      "decline",
      "cancel"
    ]),
    content: record(string2(), union([
      string2(),
      number2(),
      boolean2(),
      array(string2())
    ])).optional()
  });
  const ElicitRequestURLParamsSchema$1 = object({
    mode: literal("url"),
    message: string2(),
    url: string2().url()
  });
  const ElicitRequestParamsSchema$1 = union([ElicitRequestFormParamsSchema$1, ElicitRequestURLParamsSchema$1]);
  const ElicitRequestSchema$1 = object({
    method: literal("elicitation/create"),
    params: ElicitRequestParamsSchema$1
  });
  const InputRequestSchema = union([
    CreateMessageRequestSchema$1,
    ListRootsRequestSchema$1,
    ElicitRequestSchema$1
  ]);
  const InputResponseSchema = union([
    CreateMessageResultSchema$1,
    ListRootsResultSchema$1,
    ElicitResultSchema$1
  ]);
  const InputRequestsSchema = record(string2(), InputRequestSchema);
  const InputResponsesSchema = record(string2(), InputResponseSchema);
  const InputRequiredResultSchema = wireResult({
    inputRequests: InputRequestsSchema.optional(),
    requestState: string2().optional()
  });
  const retryParamsShape = {
    inputResponses: InputResponsesSchema.optional(),
    requestState: string2().optional()
  };
  const InputResponseRequestParamsSchema = object({
    _meta: RequestMetaEnvelopeSchema,
    ...retryParamsShape
  });
  const DispatchRequestMetaSchema = looseObject({ progressToken: ProgressTokenSchema$1.optional() });
  function wireRequest(method, paramsShape) {
    return object({
      method: literal(method),
      params: object({
        _meta: RequestMetaEnvelopeSchema,
        ...paramsShape
      })
    });
  }
  __name(wireRequest, "wireRequest");
  function dispatchRequest(method, paramsShape) {
    return object({
      method: literal(method),
      params: object({
        _meta: DispatchRequestMetaSchema.optional(),
        ...paramsShape
      }).optional()
    });
  }
  __name(dispatchRequest, "dispatchRequest");
  const callToolParamsShape = {
    name: string2(),
    arguments: record(string2(), unknown()).optional(),
    ...retryParamsShape
  };
  const paginatedParamsShape = { cursor: CursorSchema$1.optional() };
  const CallToolRequestSchema$1 = wireRequest("tools/call", callToolParamsShape);
  const ListToolsRequestSchema$1 = wireRequest("tools/list", paginatedParamsShape);
  const ListPromptsRequestSchema$1 = wireRequest("prompts/list", paginatedParamsShape);
  const GetPromptRequestSchema$1 = wireRequest("prompts/get", {
    name: string2(),
    arguments: record(string2(), string2()).optional(),
    ...retryParamsShape
  });
  const ListResourcesRequestSchema$1 = wireRequest("resources/list", paginatedParamsShape);
  const ListResourceTemplatesRequestSchema$1 = wireRequest("resources/templates/list", paginatedParamsShape);
  const ReadResourceRequestSchema$1 = wireRequest("resources/read", {
    uri: string2(),
    ...retryParamsShape
  });
  const completeParamsShape = {
    ref: union([PromptReferenceSchema$1, ResourceTemplateReferenceSchema$1]),
    argument: object({
      name: string2(),
      value: string2()
    }),
    context: object({ arguments: record(string2(), string2()).optional() }).optional()
  };
  const CompleteRequestSchema$1 = wireRequest("completion/complete", completeParamsShape);
  const DiscoverRequestSchema$1 = wireRequest("server/discover", {});
  const SubscriptionFilterSchema$1 = object({
    toolsListChanged: boolean2().optional(),
    promptsListChanged: boolean2().optional(),
    resourcesListChanged: boolean2().optional(),
    resourceSubscriptions: array(string2()).optional()
  });
  const subscriptionsListenParamsShape = { notifications: SubscriptionFilterSchema$1 };
  const SubscriptionsListenRequestSchema$1 = wireRequest("subscriptions/listen", subscriptionsListenParamsShape);
  const SubscriptionsListenResultMetaSchema$1 = ResultMetaSchema.extend({ "io.modelcontextprotocol/subscriptionId": RequestIdSchema$1 });
  const SubscriptionsListenResultSchema$1 = looseObject({
    _meta: SubscriptionsListenResultMetaSchema$1,
    resultType: ResultTypeSchema.default("complete")
  });
  const dispatchRequestSchemas = {
    "tools/call": dispatchRequest("tools/call", callToolParamsShape),
    "tools/list": dispatchRequest("tools/list", paginatedParamsShape),
    "prompts/get": dispatchRequest("prompts/get", {
      name: string2(),
      arguments: record(string2(), string2()).optional()
    }),
    "prompts/list": dispatchRequest("prompts/list", paginatedParamsShape),
    "resources/list": dispatchRequest("resources/list", paginatedParamsShape),
    "resources/templates/list": dispatchRequest("resources/templates/list", paginatedParamsShape),
    "resources/read": dispatchRequest("resources/read", { uri: string2() }),
    "completion/complete": dispatchRequest("completion/complete", completeParamsShape),
    "server/discover": dispatchRequest("server/discover", {}),
    "subscriptions/listen": dispatchRequest("subscriptions/listen", subscriptionsListenParamsShape)
  };
  function liftedResult(shape) {
    return looseObject({
      _meta: wireMeta,
      ...shape
    });
  }
  __name(liftedResult, "liftedResult");
  const dispatchResultSchemas = {
    "tools/call": liftedResult({
      content: array(ContentBlockSchema$1),
      structuredContent: unknown().optional(),
      isError: boolean2().optional()
    }),
    "tools/list": liftedResult({
      ttlMs: number2().int().min(0),
      cacheScope: _enum(["public", "private"]),
      tools: array(ToolSchema$1),
      nextCursor: CursorSchema$1.optional()
    }),
    "prompts/get": liftedResult({
      description: string2().optional(),
      messages: array(PromptMessageSchema$1)
    }),
    "prompts/list": liftedResult({
      ttlMs: number2().int().min(0),
      cacheScope: _enum(["public", "private"]),
      prompts: array(PromptSchema$1),
      nextCursor: CursorSchema$1.optional()
    }),
    "resources/list": liftedResult({
      ttlMs: number2().int().min(0),
      cacheScope: _enum(["public", "private"]),
      resources: array(ResourceSchema$1),
      nextCursor: CursorSchema$1.optional()
    }),
    "resources/templates/list": liftedResult({
      ttlMs: number2().int().min(0),
      cacheScope: _enum(["public", "private"]),
      resourceTemplates: array(ResourceTemplateSchema$1),
      nextCursor: CursorSchema$1.optional()
    }),
    "resources/read": liftedResult({
      ttlMs: number2().int().min(0),
      cacheScope: _enum(["public", "private"]),
      contents: array(union([TextResourceContentsSchema$1, BlobResourceContentsSchema$1]))
    }),
    "completion/complete": liftedResult({ completion: object({
      values: array(string2()).max(100),
      total: number2().int().optional(),
      hasMore: boolean2().optional()
    }).loose() }),
    "server/discover": liftedResult({
      ttlMs: number2().int().min(0).catch(0),
      cacheScope: _enum(["public", "private"]).catch("private"),
      supportedVersions: array(string2()),
      capabilities: ServerCapabilities2026Schema,
      instructions: string2().optional()
    }),
    "subscriptions/listen": liftedResult({})
  };
  const NotificationMetaSchema = looseObject({ "io.modelcontextprotocol/subscriptionId": RequestIdSchema$1.optional() });
  const SubscriptionsAcknowledgedNotificationSchema$1 = object({
    method: literal("notifications/subscriptions/acknowledged"),
    params: object({
      _meta: NotificationMetaSchema.optional(),
      notifications: SubscriptionFilterSchema$1
    })
  });
  const CancelledNotificationParamsSchema$1 = object({
    _meta: NotificationMetaSchema.optional(),
    requestId: RequestIdSchema$1,
    reason: string2().optional()
  });
  const CancelledNotificationSchema$1 = object({
    method: literal("notifications/cancelled"),
    params: CancelledNotificationParamsSchema$1
  });
  const notificationSchemas2026 = {
    "notifications/cancelled": CancelledNotificationSchema$1,
    "notifications/progress": ProgressNotificationSchema$1,
    "notifications/message": LoggingMessageNotificationSchema$1,
    "notifications/resources/updated": ResourceUpdatedNotificationSchema$1,
    "notifications/resources/list_changed": ResourceListChangedNotificationSchema$1,
    "notifications/tools/list_changed": ToolListChangedNotificationSchema$1,
    "notifications/prompts/list_changed": PromptListChangedNotificationSchema$1,
    "notifications/subscriptions/acknowledged": SubscriptionsAcknowledgedNotificationSchema$1
  };
  const wireResultResponse = /* @__PURE__ */ __name((result) => object({
    jsonrpc: literal("2.0"),
    id: union([string2(), number2().int()]),
    result
  }).strict(), "wireResultResponse");
  return {
    JSONValueSchema: JSONValueSchema$1,
    JSONObjectSchema: JSONObjectSchema$1,
    ProgressTokenSchema: ProgressTokenSchema$1,
    CursorSchema: CursorSchema$1,
    RequestIdSchema: RequestIdSchema$1,
    RoleSchema: RoleSchema$1,
    LoggingLevelSchema: LoggingLevelSchema$1,
    TaskMetadataSchema: TaskMetadataSchema$1,
    RelatedTaskMetadataSchema: RelatedTaskMetadataSchema$1,
    RequestMetaSchema: RequestMetaSchema$1,
    BaseRequestParamsSchema: BaseRequestParamsSchema$1,
    TaskAugmentedRequestParamsSchema: TaskAugmentedRequestParamsSchema$1,
    NotificationsParamsSchema: NotificationsParamsSchema$1,
    NotificationSchema: NotificationSchema$1,
    IconSchema: IconSchema$1,
    IconsSchema: IconsSchema$1,
    BaseMetadataSchema: BaseMetadataSchema$1,
    ImplementationSchema: ImplementationSchema$1,
    ClientTasksCapabilitySchema: ClientTasksCapabilitySchema$1,
    ServerTasksCapabilitySchema: ServerTasksCapabilitySchema$1,
    ClientCapabilitiesSchema: ClientCapabilitiesSchema$1,
    ServerCapabilitiesSchema: ServerCapabilitiesSchema$1,
    ProgressSchema: ProgressSchema$1,
    ProgressNotificationParamsSchema: ProgressNotificationParamsSchema$1,
    ProgressNotificationSchema: ProgressNotificationSchema$1,
    LoggingMessageNotificationParamsSchema: LoggingMessageNotificationParamsSchema$1,
    LoggingMessageNotificationSchema: LoggingMessageNotificationSchema$1,
    ResourceContentsSchema: ResourceContentsSchema$1,
    TextResourceContentsSchema: TextResourceContentsSchema$1,
    BlobResourceContentsSchema: BlobResourceContentsSchema$1,
    AnnotationsSchema: AnnotationsSchema$1,
    ResourceSchema: ResourceSchema$1,
    ResourceTemplateSchema: ResourceTemplateSchema$1,
    ResourceListChangedNotificationSchema: ResourceListChangedNotificationSchema$1,
    ResourceUpdatedNotificationParamsSchema: ResourceUpdatedNotificationParamsSchema$1,
    ResourceUpdatedNotificationSchema: ResourceUpdatedNotificationSchema$1,
    PromptArgumentSchema: PromptArgumentSchema$1,
    PromptSchema: PromptSchema$1,
    PromptListChangedNotificationSchema: PromptListChangedNotificationSchema$1,
    TextContentSchema: TextContentSchema$1,
    ImageContentSchema: ImageContentSchema$1,
    AudioContentSchema: AudioContentSchema$1,
    ToolUseContentSchema: ToolUseContentSchema$1,
    EmbeddedResourceSchema: EmbeddedResourceSchema$1,
    ResourceLinkSchema: ResourceLinkSchema$1,
    ContentBlockSchema: ContentBlockSchema$1,
    PromptMessageSchema: PromptMessageSchema$1,
    ToolAnnotationsSchema: ToolAnnotationsSchema$1,
    ToolListChangedNotificationSchema: ToolListChangedNotificationSchema$1,
    ModelHintSchema: ModelHintSchema$1,
    ModelPreferencesSchema: ModelPreferencesSchema$1,
    ToolChoiceSchema: ToolChoiceSchema$1,
    BooleanSchemaSchema: BooleanSchemaSchema$1,
    StringSchemaSchema: StringSchemaSchema$1,
    NumberSchemaSchema: NumberSchemaSchema$1,
    UntitledSingleSelectEnumSchemaSchema: UntitledSingleSelectEnumSchemaSchema$1,
    TitledSingleSelectEnumSchemaSchema: TitledSingleSelectEnumSchemaSchema$1,
    LegacyTitledEnumSchemaSchema: LegacyTitledEnumSchemaSchema$1,
    SingleSelectEnumSchemaSchema: SingleSelectEnumSchemaSchema$1,
    UntitledMultiSelectEnumSchemaSchema: UntitledMultiSelectEnumSchemaSchema$1,
    TitledMultiSelectEnumSchemaSchema: TitledMultiSelectEnumSchemaSchema$1,
    MultiSelectEnumSchemaSchema: MultiSelectEnumSchemaSchema$1,
    EnumSchemaSchema: EnumSchemaSchema$1,
    PrimitiveSchemaDefinitionSchema: PrimitiveSchemaDefinitionSchema$1,
    ElicitRequestFormParamsSchema: ElicitRequestFormParamsSchema$1,
    ResourceTemplateReferenceSchema: ResourceTemplateReferenceSchema$1,
    PromptReferenceSchema: PromptReferenceSchema$1,
    RootSchema: RootSchema$1,
    ClientCapabilities2026Schema,
    ServerCapabilities2026Schema,
    RequestMetaEnvelopeSchema,
    ToolSchema: ToolSchema$1,
    ToolResultContentSchema: ToolResultContentSchema$1,
    SamplingMessageContentBlockSchema: SamplingMessageContentBlockSchema$1,
    SamplingMessageSchema: SamplingMessageSchema$1,
    ResultTypeSchema,
    ResultMetaSchema,
    ResultSchema: ResultSchema$1,
    PaginatedResultSchema: PaginatedResultSchema$1,
    CallToolResultSchema: CallToolResultSchema$1,
    ListToolsResultSchema: ListToolsResultSchema$1,
    ListPromptsResultSchema: ListPromptsResultSchema$1,
    GetPromptResultSchema: GetPromptResultSchema$1,
    ListResourcesResultSchema: ListResourcesResultSchema$1,
    ListResourceTemplatesResultSchema: ListResourceTemplatesResultSchema$1,
    ReadResourceResultSchema: ReadResourceResultSchema$1,
    CompleteResultSchema: CompleteResultSchema$1,
    CacheableResultSchema,
    DiscoverResultSchema: DiscoverResultSchema$1,
    CreateMessageRequestParamsSchema: CreateMessageRequestParamsSchema$1,
    CreateMessageRequestSchema: CreateMessageRequestSchema$1,
    ListRootsRequestSchema: ListRootsRequestSchema$1,
    CreateMessageResultSchema: CreateMessageResultSchema$1,
    ListRootsResultSchema: ListRootsResultSchema$1,
    ElicitResultSchema: ElicitResultSchema$1,
    ElicitRequestURLParamsSchema: ElicitRequestURLParamsSchema$1,
    ElicitRequestParamsSchema: ElicitRequestParamsSchema$1,
    ElicitRequestSchema: ElicitRequestSchema$1,
    InputRequestSchema,
    InputResponseSchema,
    InputRequestsSchema,
    InputResponsesSchema,
    InputRequiredResultSchema,
    InputResponseRequestParamsSchema,
    CallToolRequestSchema: CallToolRequestSchema$1,
    ListToolsRequestSchema: ListToolsRequestSchema$1,
    ListPromptsRequestSchema: ListPromptsRequestSchema$1,
    GetPromptRequestSchema: GetPromptRequestSchema$1,
    ListResourcesRequestSchema: ListResourcesRequestSchema$1,
    ListResourceTemplatesRequestSchema: ListResourceTemplatesRequestSchema$1,
    ReadResourceRequestSchema: ReadResourceRequestSchema$1,
    CompleteRequestSchema: CompleteRequestSchema$1,
    DiscoverRequestSchema: DiscoverRequestSchema$1,
    SubscriptionFilterSchema: SubscriptionFilterSchema$1,
    SubscriptionsListenRequestSchema: SubscriptionsListenRequestSchema$1,
    SubscriptionsListenResultMetaSchema: SubscriptionsListenResultMetaSchema$1,
    SubscriptionsListenResultSchema: SubscriptionsListenResultSchema$1,
    dispatchRequestSchemas,
    dispatchResultSchemas,
    NotificationMetaSchema,
    SubscriptionsAcknowledgedNotificationSchema: SubscriptionsAcknowledgedNotificationSchema$1,
    CancelledNotificationParamsSchema: CancelledNotificationParamsSchema$1,
    CancelledNotificationSchema: CancelledNotificationSchema$1,
    notificationSchemas2026,
    JSONRPCResultResponseSchema: wireResultResponse(ResultSchema$1),
    CallToolResultResponseSchema: wireResultResponse(union([CallToolResultSchema$1, InputRequiredResultSchema])),
    ListToolsResultResponseSchema: wireResultResponse(ListToolsResultSchema$1),
    ListPromptsResultResponseSchema: wireResultResponse(ListPromptsResultSchema$1),
    GetPromptResultResponseSchema: wireResultResponse(union([GetPromptResultSchema$1, InputRequiredResultSchema])),
    ListResourcesResultResponseSchema: wireResultResponse(ListResourcesResultSchema$1),
    ListResourceTemplatesResultResponseSchema: wireResultResponse(ListResourceTemplatesResultSchema$1),
    ReadResourceResultResponseSchema: wireResultResponse(union([ReadResourceResultSchema$1, InputRequiredResultSchema])),
    CompleteResultResponseSchema: wireResultResponse(CompleteResultSchema$1),
    DiscoverResultResponseSchema: wireResultResponse(DiscoverResultSchema$1),
    SubscriptionsListenResultResponseSchema: wireResultResponse(SubscriptionsListenResultSchema$1)
  };
}
__name(build, "build");
var memo2;
function buildSchemas2026() {
  return memo2 ??= build();
}
__name(buildSchemas2026, "buildSchemas2026");
var CACHEABLE_RESULT_METHODS = [
  "tools/list",
  "prompts/list",
  "resources/list",
  "resources/templates/list",
  "resources/read",
  "server/discover"
];
function isCacheableResultMethod(method) {
  return CACHEABLE_RESULT_METHODS.includes(method);
}
__name(isCacheableResultMethod, "isCacheableResultMethod");
var RESULT_CACHE_HINT_FALLBACK = /* @__PURE__ */ Symbol("modelcontextprotocol.resultCacheHintFallback");
function attachCacheHintFallback(result, hint) {
  if (hint === void 0) return result;
  const attached = result[RESULT_CACHE_HINT_FALLBACK];
  if (attached === void 0) return {
    ...result,
    [RESULT_CACHE_HINT_FALLBACK]: hint
  };
  const merged = {};
  const ttlMs = attached.ttlMs ?? hint.ttlMs;
  if (ttlMs !== void 0) merged.ttlMs = ttlMs;
  const cacheScope = attached.cacheScope ?? hint.cacheScope;
  if (cacheScope !== void 0) merged.cacheScope = cacheScope;
  return {
    ...result,
    [RESULT_CACHE_HINT_FALLBACK]: merged
  };
}
__name(attachCacheHintFallback, "attachCacheHintFallback");
function cacheHintFallbackOf(result) {
  return result[RESULT_CACHE_HINT_FALLBACK];
}
__name(cacheHintFallbackOf, "cacheHintFallbackOf");
function isValidCacheTtlMs(value) {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}
__name(isValidCacheTtlMs, "isValidCacheTtlMs");
function isValidCacheScope(value) {
  return value === "public" || value === "private";
}
__name(isValidCacheScope, "isValidCacheScope");
function assertValidCacheHint(hint, context) {
  if (hint.ttlMs !== void 0 && !isValidCacheTtlMs(hint.ttlMs)) throw new RangeError(`Invalid cache hint for ${context}: ttlMs must be a non-negative safe integer (got ${String(hint.ttlMs)})`);
  if (hint.cacheScope !== void 0 && !isValidCacheScope(hint.cacheScope)) throw new RangeError(`Invalid cache hint for ${context}: cacheScope must be 'public' or 'private' (got ${String(hint.cacheScope)})`);
}
__name(assertValidCacheHint, "assertValidCacheHint");
var ProtocolErrorCode = /* @__PURE__ */ (function(ProtocolErrorCode$1) {
  ProtocolErrorCode$1[ProtocolErrorCode$1["ParseError"] = -32700] = "ParseError";
  ProtocolErrorCode$1[ProtocolErrorCode$1["InvalidRequest"] = -32600] = "InvalidRequest";
  ProtocolErrorCode$1[ProtocolErrorCode$1["MethodNotFound"] = -32601] = "MethodNotFound";
  ProtocolErrorCode$1[ProtocolErrorCode$1["InvalidParams"] = -32602] = "InvalidParams";
  ProtocolErrorCode$1[ProtocolErrorCode$1["InternalError"] = -32603] = "InternalError";
  ProtocolErrorCode$1[ProtocolErrorCode$1["ResourceNotFound"] = -32002] = "ResourceNotFound";
  ProtocolErrorCode$1[ProtocolErrorCode$1["MissingRequiredClientCapability"] = -32021] = "MissingRequiredClientCapability";
  ProtocolErrorCode$1[ProtocolErrorCode$1["UnsupportedProtocolVersion"] = -32022] = "UnsupportedProtocolVersion";
  ProtocolErrorCode$1[ProtocolErrorCode$1["UrlElicitationRequired"] = -32042] = "UrlElicitationRequired";
  return ProtocolErrorCode$1;
})({});
var ProtocolError = class ProtocolError2 extends Error {
  static {
    __name(this, "ProtocolError");
  }
  static {
    Object.defineProperty(this, "mcpBrand", { value: "mcp.ProtocolError" });
  }
  static [Symbol.hasInstance](value) {
    return brandedHasInstance(this, value);
  }
  /**
  * Brand-based type guard: equivalent to `value instanceof this`, as an
  * explicit static predicate (the axios/AWS-SDK `isInstance` style). Reads
  * the caller's own brand via `this`, so every branded subclass gets a
  * correctly-scoped guard by inheritance. Must be invoked on the class —
  * in callback position write `v => SdkError.isInstance(v)`, not
  * `.filter(SdkError.isInstance)` (detached calls throw rather than
  * silently matching nothing).
  */
  static isInstance(value) {
    if (typeof this !== "function") throw new TypeError("isInstance must be called on the class (e.g. `SdkError.isInstance(value)`); for callbacks use `v => SdkError.isInstance(v)`");
    return brandedHasInstance(this, value);
  }
  constructor(code, message, data) {
    super(message);
    this.code = code;
    this.data = data;
    this.name = "ProtocolError";
    stampErrorBrands(this, new.target);
  }
  /**
  * Factory method to create the appropriate error type based on the error code and data
  */
  static fromError(code, message, data) {
    if (code === ProtocolErrorCode.UrlElicitationRequired && data) {
      const errorData = data;
      if (errorData.elicitations) return new UrlElicitationRequiredError(errorData.elicitations, message);
    }
    if (code === ProtocolErrorCode.UnsupportedProtocolVersion && data) {
      const errorData = data;
      if (Array.isArray(errorData.supported) && typeof errorData.requested === "string") return new UnsupportedProtocolVersionError({
        supported: errorData.supported,
        requested: errorData.requested
      }, message);
    }
    if (code === ProtocolErrorCode.InvalidParams || code === ProtocolErrorCode.ResourceNotFound) {
      const errorData = data;
      if (typeof errorData?.uri === "string" && (code === ProtocolErrorCode.ResourceNotFound || Object.keys(errorData).length === 1)) return new ResourceNotFoundError(errorData.uri, message);
    }
    if (code === ProtocolErrorCode.MissingRequiredClientCapability && data) {
      const errorData = data;
      if (errorData.requiredCapabilities !== null && typeof errorData.requiredCapabilities === "object" && !Array.isArray(errorData.requiredCapabilities)) return new MissingRequiredClientCapabilityError({ requiredCapabilities: errorData.requiredCapabilities }, message);
    }
    return new ProtocolError2(code, message, data);
  }
};
var ResourceNotFoundError = class extends ProtocolError {
  static {
    __name(this, "ResourceNotFoundError");
  }
  static {
    Object.defineProperty(this, "mcpBrand", { value: "mcp.ResourceNotFoundError" });
  }
  constructor(uri2, message = `Resource not found: ${uri2}`) {
    super(ProtocolErrorCode.InvalidParams, message, { uri: uri2 });
  }
  /** The URI that was requested and not found. */
  get uri() {
    return this.data.uri;
  }
};
var UrlElicitationRequiredError = class extends ProtocolError {
  static {
    __name(this, "UrlElicitationRequiredError");
  }
  static {
    Object.defineProperty(this, "mcpBrand", { value: "mcp.UrlElicitationRequiredError" });
  }
  constructor(elicitations, message = `URL elicitation${elicitations.length > 1 ? "s" : ""} required`) {
    super(ProtocolErrorCode.UrlElicitationRequired, message, { elicitations });
  }
  get elicitations() {
    return this.data?.elicitations ?? [];
  }
};
var UnsupportedProtocolVersionError = class extends ProtocolError {
  static {
    __name(this, "UnsupportedProtocolVersionError");
  }
  static {
    Object.defineProperty(this, "mcpBrand", { value: "mcp.UnsupportedProtocolVersionError" });
  }
  constructor(data, message = `Unsupported protocol version: ${data.requested}`) {
    super(ProtocolErrorCode.UnsupportedProtocolVersion, message, data);
  }
  /**
  * Protocol versions the receiver supports.
  */
  get supported() {
    return this.data.supported;
  }
  /**
  * The protocol version that was requested.
  */
  get requested() {
    return this.data.requested;
  }
};
var MissingRequiredClientCapabilityError = class extends ProtocolError {
  static {
    __name(this, "MissingRequiredClientCapabilityError");
  }
  static {
    Object.defineProperty(this, "mcpBrand", { value: "mcp.MissingRequiredClientCapabilityError" });
  }
  constructor(data, message = `Missing required client capabilities: ${Object.keys(data.requiredCapabilities).join(", ")}`) {
    super(ProtocolErrorCode.MissingRequiredClientCapability, message, data);
  }
  /**
  * The capabilities the server requires from the client to process the
  * request (only the missing capabilities are listed).
  */
  get requiredCapabilities() {
    return this.data.requiredCapabilities;
  }
};
var DEFAULT_CACHE_TTL_MS = 0;
var DEFAULT_CACHE_SCOPE = "private";
var EXTENDED_RESULT_TYPE_METHODS = [
  "tools/call",
  "prompts/get",
  "resources/read"
];
function stampResultType(method, result) {
  const provided = result["resultType"];
  if (provided === void 0) return {
    ...result,
    resultType: "complete"
  };
  if (provided === "complete") return result;
  if (EXTENDED_RESULT_TYPE_METHODS.includes(method)) return result;
  throw new ProtocolError(ProtocolErrorCode.InternalError, `Handler for ${method} returned resultType '${String(provided)}', but results of ${method} only support 'complete' on protocol revision 2026-07-28`);
}
__name(stampResultType, "stampResultType");
function fillCacheFields(method, result) {
  const fallback = cacheHintFallbackOf(result);
  if (result["resultType"] !== "complete" || !isCacheableResultMethod(method)) return fallback === void 0 ? result : stripCacheHintFallback(result);
  const provided = result;
  const ttlMs = isValidCacheTtlMs(provided["ttlMs"]) ? provided["ttlMs"] : resolveTtlMs(fallback);
  const cacheScope = isValidCacheScope(provided["cacheScope"]) ? provided["cacheScope"] : resolveCacheScope(fallback);
  const filled = {
    ...provided,
    ttlMs,
    cacheScope
  };
  delete filled[RESULT_CACHE_HINT_FALLBACK];
  return filled;
}
__name(fillCacheFields, "fillCacheFields");
function isPlainObject$5(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
__name(isPlainObject$5, "isPlainObject$5");
function stampServerInfoMeta(result, serverInfo) {
  if (serverInfo === void 0) return result;
  const meta2 = result["_meta"];
  if (meta2 === void 0) return {
    ...result,
    _meta: { [SERVER_INFO_META_KEY]: serverInfo }
  };
  if (!isPlainObject$5(meta2)) return result;
  if (meta2[SERVER_INFO_META_KEY] !== void 0) return result;
  return {
    ...result,
    _meta: {
      ...meta2,
      [SERVER_INFO_META_KEY]: serverInfo
    }
  };
}
__name(stampServerInfoMeta, "stampServerInfoMeta");
function resolveTtlMs(fallback) {
  return fallback !== void 0 && isValidCacheTtlMs(fallback.ttlMs) ? fallback.ttlMs : DEFAULT_CACHE_TTL_MS;
}
__name(resolveTtlMs, "resolveTtlMs");
function resolveCacheScope(fallback) {
  return fallback !== void 0 && isValidCacheScope(fallback.cacheScope) ? fallback.cacheScope : DEFAULT_CACHE_SCOPE;
}
__name(resolveCacheScope, "resolveCacheScope");
function stripCacheHintFallback(result) {
  const copy = { ...result };
  delete copy[RESULT_CACHE_HINT_FALLBACK];
  return copy;
}
__name(stripCacheHintFallback, "stripCacheHintFallback");
var INPUT_REQUEST_METHODS_2026 = [
  "elicitation/create",
  "sampling/createMessage",
  "roots/list"
];
var maps;
function inputSchemaMaps() {
  if (maps) return maps;
  const s = buildSchemas2026();
  maps = {
    request: {
      "elicitation/create": object({
        method: literal("elicitation/create"),
        params: s.ElicitRequestParamsSchema
      }),
      "sampling/createMessage": object({
        method: literal("sampling/createMessage"),
        params: s.CreateMessageRequestParamsSchema
      }),
      "roots/list": object({
        method: literal("roots/list"),
        params: looseObject({}).optional()
      })
    },
    response: {
      "elicitation/create": s.ElicitResultSchema,
      "sampling/createMessage": s.CreateMessageResultSchema,
      "roots/list": s.ListRootsResultSchema
    }
  };
  return maps;
}
__name(inputSchemaMaps, "inputSchemaMaps");
function warmInputSchemaMaps2026() {
  inputSchemaMaps();
}
__name(warmInputSchemaMaps2026, "warmInputSchemaMaps2026");
function isInputRequestMethod2026(method) {
  return INPUT_REQUEST_METHODS_2026.includes(method);
}
__name(isInputRequestMethod2026, "isInputRequestMethod2026");
function getInputRequestSchema2026(method) {
  return isInputRequestMethod2026(method) ? inputSchemaMaps().request[method] : void 0;
}
__name(getInputRequestSchema2026, "getInputRequestSchema2026");
function getInputResponseSchema2026(method) {
  return isInputRequestMethod2026(method) ? inputSchemaMaps().response[method] : void 0;
}
__name(getInputResponseSchema2026, "getInputResponseSchema2026");
var requestMethodKeys = {
  "tools/call": null,
  "tools/list": null,
  "prompts/get": null,
  "prompts/list": null,
  "resources/list": null,
  "resources/templates/list": null,
  "resources/read": null,
  "completion/complete": null,
  "server/discover": null,
  "subscriptions/listen": null
};
var notificationMethodKeys = {
  "notifications/cancelled": null,
  "notifications/progress": null,
  "notifications/message": null,
  "notifications/resources/updated": null,
  "notifications/resources/list_changed": null,
  "notifications/tools/list_changed": null,
  "notifications/prompts/list_changed": null,
  "notifications/subscriptions/acknowledged": null
};
function hasRequestMethod2026(method) {
  return Object.prototype.hasOwnProperty.call(requestMethodKeys, method);
}
__name(hasRequestMethod2026, "hasRequestMethod2026");
function hasNotificationMethod2026(method) {
  return Object.prototype.hasOwnProperty.call(notificationMethodKeys, method);
}
__name(hasNotificationMethod2026, "hasNotificationMethod2026");
function hasResultMethod2026(method) {
  return Object.prototype.hasOwnProperty.call(requestMethodKeys, method);
}
__name(hasResultMethod2026, "hasResultMethod2026");
function getRequestSchema2026(method) {
  return hasRequestMethod2026(method) ? buildSchemas2026().dispatchRequestSchemas[method] : void 0;
}
__name(getRequestSchema2026, "getRequestSchema2026");
function getResultSchema2026(method) {
  return hasResultMethod2026(method) ? buildSchemas2026().dispatchResultSchemas[method] : void 0;
}
__name(getResultSchema2026, "getResultSchema2026");
function getNotificationSchema2026(method) {
  return hasNotificationMethod2026(method) ? buildSchemas2026().notificationSchemas2026[method] : void 0;
}
__name(getNotificationSchema2026, "getNotificationSchema2026");
var rev2026RequestMethods = Object.keys(requestMethodKeys);
var rev2026NotificationMethods = Object.keys(notificationMethodKeys);
function isPlainObject$4(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
__name(isPlainObject$4, "isPlainObject$4");
function triState(schema, raw) {
  if (schema === void 0) return {
    ok: false,
    reason: "not-in-era"
  };
  const parsed = schema.safeParse(raw);
  return parsed.success ? {
    ok: true,
    value: parsed.data
  } : {
    ok: false,
    reason: "invalid",
    message: String(parsed.error)
  };
}
__name(triState, "triState");
var NOT_IN_ERA = {
  ok: false,
  reason: "not-in-era"
};
var REQUIRED_ENVELOPE_KEYS = [PROTOCOL_VERSION_META_KEY, CLIENT_CAPABILITIES_META_KEY];
function enforceDeletedFields(method, result) {
  let next = result;
  let copied = false;
  const copy = /* @__PURE__ */ __name(() => {
    if (!copied) {
      next = { ...next };
      copied = true;
    }
    return next;
  }, "copy");
  const tools = result.tools;
  if (method === "tools/list" && Array.isArray(tools) && tools.some((tool) => isPlainObject$4(tool) && "execution" in tool)) copy().tools = tools.map((tool) => {
    if (!isPlainObject$4(tool) || !("execution" in tool)) return tool;
    const rest = { ...tool };
    delete rest["execution"];
    return rest;
  });
  const capabilities = result.capabilities;
  if (isPlainObject$4(capabilities) && "tasks" in capabilities) {
    const rest = { ...capabilities };
    delete rest["tasks"];
    copy().capabilities = rest;
  }
  return next;
}
__name(enforceDeletedFields, "enforceDeletedFields");
var rev2026Codec = {
  era: "2026-07-28",
  hasRequestMethod: hasRequestMethod2026,
  hasNotificationMethod: hasNotificationMethod2026,
  hasInputRequestMethod: /* @__PURE__ */ __name((method) => getInputRequestSchema2026(method) !== void 0, "hasInputRequestMethod"),
  validateRequest: /* @__PURE__ */ __name((method, raw) => triState(getRequestSchema2026(method), raw), "validateRequest"),
  validateResult: /* @__PURE__ */ __name((method, raw) => triState(getResultSchema2026(method), raw), "validateResult"),
  validateNotification: /* @__PURE__ */ __name((method, raw) => triState(getNotificationSchema2026(method), raw), "validateNotification"),
  validateInputRequest: /* @__PURE__ */ __name((method, raw) => triState(getInputRequestSchema2026(method), raw), "validateInputRequest"),
  validateInputResponse: /* @__PURE__ */ __name((method, raw) => triState(getInputResponseSchema2026(method), raw), "validateInputResponse"),
  samplingResultVariant: /* @__PURE__ */ __name(() => NOT_IN_ERA, "samplingResultVariant"),
  outboundEnvelope(material) {
    return {
      [PROTOCOL_VERSION_META_KEY]: material.protocolVersion,
      [CLIENT_INFO_META_KEY]: material.clientInfo,
      [CLIENT_CAPABILITIES_META_KEY]: material.clientCapabilities,
      ...material.logLevel !== void 0 && { [LOG_LEVEL_META_KEY]: material.logLevel }
    };
  },
  validateEnvelopeMeta(meta2) {
    const issues = [];
    for (const key of REQUIRED_ENVELOPE_KEYS) if (!(key in meta2)) issues.push({
      key,
      problem: "missing"
    });
    const parsed = buildSchemas2026().RequestMetaEnvelopeSchema.safeParse(meta2);
    if (!parsed.success) for (const issue2 of parsed.error.issues) {
      const path = issue2.path.map(String);
      const key = path.length > 0 ? path.join(".") : "_meta";
      if (path.length === 1 && issues.some((existing) => existing.key === key && existing.problem === "missing")) continue;
      issues.push({
        key,
        problem: issue2.message
      });
    }
    return issues;
  },
  projectCallToolResult: /* @__PURE__ */ __name((result) => appendTextFallbackForNonObject(result), "projectCallToolResult"),
  inputRequestSchema: getInputRequestSchema2026,
  decodeResult(method, raw) {
    if (!isPlainObject$4(raw)) return {
      kind: "invalid",
      error: new SdkError(SdkErrorCode.InvalidResult, `Invalid result for ${method}: not an object`, { method })
    };
    const rawResultType = raw["resultType"];
    if (rawResultType === void 0) return {
      kind: "invalid",
      error: new SdkError(SdkErrorCode.InvalidResult, `Invalid result for ${method}: missing required resultType \u2014 servers implementing protocol revision 2026-07-28 MUST include it (the absent-means-complete bridge applies only to earlier-revision servers)`, {
        method,
        violation: "missing-resultType"
      })
    };
    if (typeof rawResultType !== "string") return {
      kind: "invalid",
      error: new SdkError(SdkErrorCode.InvalidResult, `Invalid result for ${method}: non-string resultType`, {
        method,
        resultType: rawResultType
      })
    };
    if (rawResultType === "input_required") {
      const rawInputRequests = raw["inputRequests"];
      const inputRequests = isPlainObject$4(rawInputRequests) ? rawInputRequests : {};
      const requestState = raw["requestState"];
      const metaParse = raw["_meta"] === void 0 ? void 0 : buildSchemas2026().ResultMetaSchema.safeParse(raw["_meta"]);
      const meta2 = metaParse?.success ? metaParse.data : void 0;
      if (Object.keys(inputRequests).length === 0 && typeof requestState !== "string") return {
        kind: "invalid",
        error: new SdkError(SdkErrorCode.InvalidResult, `Invalid result for ${method}: input_required carries neither inputRequests nor requestState (every input_required result must include at least one of the two)`, {
          method,
          violation: "input-required-missing-both"
        })
      };
      return {
        kind: "input_required",
        inputRequests,
        ...typeof requestState === "string" && { requestState },
        ...meta2 !== void 0 && { _meta: meta2 }
      };
    }
    if (rawResultType !== "complete") return {
      kind: "invalid",
      error: new SdkError(SdkErrorCode.UnsupportedResultType, `Unsupported result type '${rawResultType}' for ${method}`, {
        resultType: rawResultType,
        method
      })
    };
    const wireResultSchemas = getWireResultSchemas();
    const wireSchema = Object.hasOwn(wireResultSchemas, method) ? wireResultSchemas[method] : void 0;
    if (wireSchema !== void 0) {
      const parsed = wireSchema.safeParse(raw);
      if (!parsed.success) return {
        kind: "invalid",
        error: new SdkError(SdkErrorCode.InvalidResult, `Invalid result for ${method}: ${parsed.error}`, { method })
      };
    }
    const lifted = { ...raw };
    delete lifted["resultType"];
    return {
      kind: "complete",
      result: lifted
    };
  },
  encodeResult(method, result, serverInfo) {
    return stampServerInfoMeta(fillCacheFields(method, stampResultType(method, enforceDeletedFields(method, result))), serverInfo);
  },
  encodeErrorCode: /* @__PURE__ */ __name((code) => code === -32002 ? -32602 : code, "encodeErrorCode"),
  checkInboundEnvelope(material) {
    if (material.envelope === void 0) return "Request is missing the required _meta envelope for protocol revision 2026-07-28 (io.modelcontextprotocol/protocolVersion, io.modelcontextprotocol/clientCapabilities)";
    const parsed = buildSchemas2026().RequestMetaEnvelopeSchema.safeParse(material.envelope);
    if (!parsed.success) return `Invalid _meta envelope for protocol revision 2026-07-28: ${parsed.error.issues.map((issue2) => issue2.message).join("; ")}`;
  }
};
var wireResultSchemasMemo;
function getWireResultSchemas() {
  if (wireResultSchemasMemo) return wireResultSchemasMemo;
  const s = buildSchemas2026();
  wireResultSchemasMemo = {
    "tools/call": s.CallToolResultSchema,
    "tools/list": s.ListToolsResultSchema,
    "prompts/get": s.GetPromptResultSchema,
    "prompts/list": s.ListPromptsResultSchema,
    "resources/list": s.ListResourcesResultSchema,
    "resources/templates/list": s.ListResourceTemplatesResultSchema,
    "resources/read": s.ReadResourceResultSchema,
    "completion/complete": s.CompleteResultSchema,
    "server/discover": s.DiscoverResultSchema
  };
  return wireResultSchemasMemo;
}
__name(getWireResultSchemas, "getWireResultSchemas");
function warmWireResultSchemas2026() {
  getWireResultSchemas();
}
__name(warmWireResultSchemas2026, "warmWireResultSchemas2026");
var MODERN_WIRE_REVISION = "2026-07-28";
function codecForVersion(version3) {
  return version3 !== void 0 && isModernProtocolVersion(version3) ? rev2026Codec : rev2025Codec;
}
__name(codecForVersion, "codecForVersion");
function classifiedWireEra(classification) {
  if (classification.revision !== void 0) return codecForVersion(classification.revision).era;
  return classification.era === "modern" ? rev2026Codec.era : rev2025Codec.era;
}
__name(classifiedWireEra, "classifiedWireEra");
function isSpecRequestMethod(method) {
  return ALL_CODECS.some((codec) => codec.hasRequestMethod(method));
}
__name(isSpecRequestMethod, "isSpecRequestMethod");
function isSpecNotificationMethod(method) {
  return ALL_CODECS.some((codec) => codec.hasNotificationMethod(method));
}
__name(isSpecNotificationMethod, "isSpecNotificationMethod");
function isExtensionReusedRequestMethod(method) {
  return method === "tasks/get" || method === "tasks/cancel";
}
__name(isExtensionReusedRequestMethod, "isExtensionReusedRequestMethod");
var ALL_CODECS = [rev2025Codec, rev2026Codec];
function isPlainObject$3(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
__name(isPlainObject$3, "isPlainObject$3");
function requestMetaOf(params) {
  if (!isPlainObject$3(params)) return void 0;
  const meta2 = params["_meta"];
  return isPlainObject$3(meta2) ? meta2 : void 0;
}
__name(requestMetaOf, "requestMetaOf");
function hasEnvelopeClaim(params) {
  const meta2 = requestMetaOf(params);
  return meta2 !== void 0 && PROTOCOL_VERSION_META_KEY in meta2;
}
__name(hasEnvelopeClaim, "hasEnvelopeClaim");
function envelopeClaimVersion(params) {
  const value = requestMetaOf(params)?.[PROTOCOL_VERSION_META_KEY];
  return typeof value === "string" ? value : void 0;
}
__name(envelopeClaimVersion, "envelopeClaimVersion");
function validateEnvelopeMeta(meta2) {
  return codecForVersion(MODERN_WIRE_REVISION).validateEnvelopeMeta(meta2);
}
__name(validateEnvelopeMeta, "validateEnvelopeMeta");
var schemas_exports2 = /* @__PURE__ */ __exportAll({
  AnnotationsSchema: /* @__PURE__ */ __name(() => AnnotationsSchema, "AnnotationsSchema"),
  AudioContentSchema: /* @__PURE__ */ __name(() => AudioContentSchema, "AudioContentSchema"),
  BaseMetadataSchema: /* @__PURE__ */ __name(() => BaseMetadataSchema, "BaseMetadataSchema"),
  BaseRequestParamsSchema: /* @__PURE__ */ __name(() => BaseRequestParamsSchema, "BaseRequestParamsSchema"),
  BlobResourceContentsSchema: /* @__PURE__ */ __name(() => BlobResourceContentsSchema, "BlobResourceContentsSchema"),
  BooleanSchemaSchema: /* @__PURE__ */ __name(() => BooleanSchemaSchema, "BooleanSchemaSchema"),
  CallToolRequestParamsSchema: /* @__PURE__ */ __name(() => CallToolRequestParamsSchema, "CallToolRequestParamsSchema"),
  CallToolRequestSchema: /* @__PURE__ */ __name(() => CallToolRequestSchema, "CallToolRequestSchema"),
  CallToolResultSchema: /* @__PURE__ */ __name(() => CallToolResultSchema, "CallToolResultSchema"),
  CancelTaskRequestSchema: /* @__PURE__ */ __name(() => CancelTaskRequestSchema, "CancelTaskRequestSchema"),
  CancelTaskResultSchema: /* @__PURE__ */ __name(() => CancelTaskResultSchema, "CancelTaskResultSchema"),
  CancelledNotificationParamsSchema: /* @__PURE__ */ __name(() => CancelledNotificationParamsSchema, "CancelledNotificationParamsSchema"),
  CancelledNotificationSchema: /* @__PURE__ */ __name(() => CancelledNotificationSchema, "CancelledNotificationSchema"),
  ClientCapabilitiesSchema: /* @__PURE__ */ __name(() => ClientCapabilitiesSchema, "ClientCapabilitiesSchema"),
  ClientNotificationSchema: /* @__PURE__ */ __name(() => ClientNotificationSchema, "ClientNotificationSchema"),
  ClientRequestSchema: /* @__PURE__ */ __name(() => ClientRequestSchema, "ClientRequestSchema"),
  ClientResultSchema: /* @__PURE__ */ __name(() => ClientResultSchema, "ClientResultSchema"),
  ClientTasksCapabilitySchema: /* @__PURE__ */ __name(() => ClientTasksCapabilitySchema, "ClientTasksCapabilitySchema"),
  CompatibilityCallToolResultSchema: /* @__PURE__ */ __name(() => CompatibilityCallToolResultSchema, "CompatibilityCallToolResultSchema"),
  CompleteRequestParamsSchema: /* @__PURE__ */ __name(() => CompleteRequestParamsSchema, "CompleteRequestParamsSchema"),
  CompleteRequestSchema: /* @__PURE__ */ __name(() => CompleteRequestSchema, "CompleteRequestSchema"),
  CompleteResultSchema: /* @__PURE__ */ __name(() => CompleteResultSchema, "CompleteResultSchema"),
  ContentBlockSchema: /* @__PURE__ */ __name(() => ContentBlockSchema, "ContentBlockSchema"),
  CreateMessageRequestParamsSchema: /* @__PURE__ */ __name(() => CreateMessageRequestParamsSchema, "CreateMessageRequestParamsSchema"),
  CreateMessageRequestSchema: /* @__PURE__ */ __name(() => CreateMessageRequestSchema, "CreateMessageRequestSchema"),
  CreateMessageResultSchema: /* @__PURE__ */ __name(() => CreateMessageResultSchema, "CreateMessageResultSchema"),
  CreateMessageResultWithToolsSchema: /* @__PURE__ */ __name(() => CreateMessageResultWithToolsSchema, "CreateMessageResultWithToolsSchema"),
  CreateTaskResultSchema: /* @__PURE__ */ __name(() => CreateTaskResultSchema, "CreateTaskResultSchema"),
  CursorSchema: /* @__PURE__ */ __name(() => CursorSchema, "CursorSchema"),
  DiscoverRequestSchema: /* @__PURE__ */ __name(() => DiscoverRequestSchema, "DiscoverRequestSchema"),
  DiscoverResultSchema: /* @__PURE__ */ __name(() => DiscoverResultSchema, "DiscoverResultSchema"),
  ElicitRequestFormParamsSchema: /* @__PURE__ */ __name(() => ElicitRequestFormParamsSchema, "ElicitRequestFormParamsSchema"),
  ElicitRequestParamsSchema: /* @__PURE__ */ __name(() => ElicitRequestParamsSchema, "ElicitRequestParamsSchema"),
  ElicitRequestSchema: /* @__PURE__ */ __name(() => ElicitRequestSchema, "ElicitRequestSchema"),
  ElicitRequestURLParamsSchema: /* @__PURE__ */ __name(() => ElicitRequestURLParamsSchema, "ElicitRequestURLParamsSchema"),
  ElicitResultSchema: /* @__PURE__ */ __name(() => ElicitResultSchema, "ElicitResultSchema"),
  ElicitationCompleteNotificationParamsSchema: /* @__PURE__ */ __name(() => ElicitationCompleteNotificationParamsSchema, "ElicitationCompleteNotificationParamsSchema"),
  ElicitationCompleteNotificationSchema: /* @__PURE__ */ __name(() => ElicitationCompleteNotificationSchema, "ElicitationCompleteNotificationSchema"),
  EmbeddedResourceSchema: /* @__PURE__ */ __name(() => EmbeddedResourceSchema, "EmbeddedResourceSchema"),
  EmptyResultSchema: /* @__PURE__ */ __name(() => EmptyResultSchema, "EmptyResultSchema"),
  EnumSchemaSchema: /* @__PURE__ */ __name(() => EnumSchemaSchema, "EnumSchemaSchema"),
  GetPromptRequestParamsSchema: /* @__PURE__ */ __name(() => GetPromptRequestParamsSchema, "GetPromptRequestParamsSchema"),
  GetPromptRequestSchema: /* @__PURE__ */ __name(() => GetPromptRequestSchema, "GetPromptRequestSchema"),
  GetPromptResultSchema: /* @__PURE__ */ __name(() => GetPromptResultSchema, "GetPromptResultSchema"),
  GetTaskPayloadRequestSchema: /* @__PURE__ */ __name(() => GetTaskPayloadRequestSchema, "GetTaskPayloadRequestSchema"),
  GetTaskPayloadResultSchema: /* @__PURE__ */ __name(() => GetTaskPayloadResultSchema, "GetTaskPayloadResultSchema"),
  GetTaskRequestSchema: /* @__PURE__ */ __name(() => GetTaskRequestSchema, "GetTaskRequestSchema"),
  GetTaskResultSchema: /* @__PURE__ */ __name(() => GetTaskResultSchema, "GetTaskResultSchema"),
  IconSchema: /* @__PURE__ */ __name(() => IconSchema, "IconSchema"),
  IconsSchema: /* @__PURE__ */ __name(() => IconsSchema, "IconsSchema"),
  ImageContentSchema: /* @__PURE__ */ __name(() => ImageContentSchema, "ImageContentSchema"),
  ImplementationSchema: /* @__PURE__ */ __name(() => ImplementationSchema, "ImplementationSchema"),
  InitializeRequestParamsSchema: /* @__PURE__ */ __name(() => InitializeRequestParamsSchema, "InitializeRequestParamsSchema"),
  InitializeRequestSchema: /* @__PURE__ */ __name(() => InitializeRequestSchema, "InitializeRequestSchema"),
  InitializeResultSchema: /* @__PURE__ */ __name(() => InitializeResultSchema, "InitializeResultSchema"),
  InitializedNotificationSchema: /* @__PURE__ */ __name(() => InitializedNotificationSchema, "InitializedNotificationSchema"),
  JSONArraySchema: /* @__PURE__ */ __name(() => JSONArraySchema, "JSONArraySchema"),
  JSONObjectSchema: /* @__PURE__ */ __name(() => JSONObjectSchema, "JSONObjectSchema"),
  JSONRPCErrorResponseSchema: /* @__PURE__ */ __name(() => JSONRPCErrorResponseSchema, "JSONRPCErrorResponseSchema"),
  JSONRPCMessageSchema: /* @__PURE__ */ __name(() => JSONRPCMessageSchema, "JSONRPCMessageSchema"),
  JSONRPCNotificationSchema: /* @__PURE__ */ __name(() => JSONRPCNotificationSchema, "JSONRPCNotificationSchema"),
  JSONRPCRequestSchema: /* @__PURE__ */ __name(() => JSONRPCRequestSchema, "JSONRPCRequestSchema"),
  JSONRPCResponseSchema: /* @__PURE__ */ __name(() => JSONRPCResponseSchema, "JSONRPCResponseSchema"),
  JSONRPCResultResponseSchema: /* @__PURE__ */ __name(() => JSONRPCResultResponseSchema, "JSONRPCResultResponseSchema"),
  JSONValueSchema: /* @__PURE__ */ __name(() => JSONValueSchema, "JSONValueSchema"),
  LegacyTitledEnumSchemaSchema: /* @__PURE__ */ __name(() => LegacyTitledEnumSchemaSchema, "LegacyTitledEnumSchemaSchema"),
  ListChangedOptionsBaseSchema: /* @__PURE__ */ __name(() => ListChangedOptionsBaseSchema, "ListChangedOptionsBaseSchema"),
  ListPromptsRequestSchema: /* @__PURE__ */ __name(() => ListPromptsRequestSchema, "ListPromptsRequestSchema"),
  ListPromptsResultSchema: /* @__PURE__ */ __name(() => ListPromptsResultSchema, "ListPromptsResultSchema"),
  ListResourceTemplatesRequestSchema: /* @__PURE__ */ __name(() => ListResourceTemplatesRequestSchema, "ListResourceTemplatesRequestSchema"),
  ListResourceTemplatesResultSchema: /* @__PURE__ */ __name(() => ListResourceTemplatesResultSchema, "ListResourceTemplatesResultSchema"),
  ListResourcesRequestSchema: /* @__PURE__ */ __name(() => ListResourcesRequestSchema, "ListResourcesRequestSchema"),
  ListResourcesResultSchema: /* @__PURE__ */ __name(() => ListResourcesResultSchema, "ListResourcesResultSchema"),
  ListRootsRequestSchema: /* @__PURE__ */ __name(() => ListRootsRequestSchema, "ListRootsRequestSchema"),
  ListRootsResultSchema: /* @__PURE__ */ __name(() => ListRootsResultSchema, "ListRootsResultSchema"),
  ListTasksRequestSchema: /* @__PURE__ */ __name(() => ListTasksRequestSchema, "ListTasksRequestSchema"),
  ListTasksResultSchema: /* @__PURE__ */ __name(() => ListTasksResultSchema, "ListTasksResultSchema"),
  ListToolsRequestSchema: /* @__PURE__ */ __name(() => ListToolsRequestSchema, "ListToolsRequestSchema"),
  ListToolsResultSchema: /* @__PURE__ */ __name(() => ListToolsResultSchema, "ListToolsResultSchema"),
  LoggingLevelSchema: /* @__PURE__ */ __name(() => LoggingLevelSchema, "LoggingLevelSchema"),
  LoggingMessageNotificationParamsSchema: /* @__PURE__ */ __name(() => LoggingMessageNotificationParamsSchema, "LoggingMessageNotificationParamsSchema"),
  LoggingMessageNotificationSchema: /* @__PURE__ */ __name(() => LoggingMessageNotificationSchema, "LoggingMessageNotificationSchema"),
  ModelHintSchema: /* @__PURE__ */ __name(() => ModelHintSchema, "ModelHintSchema"),
  ModelPreferencesSchema: /* @__PURE__ */ __name(() => ModelPreferencesSchema, "ModelPreferencesSchema"),
  MultiSelectEnumSchemaSchema: /* @__PURE__ */ __name(() => MultiSelectEnumSchemaSchema, "MultiSelectEnumSchemaSchema"),
  NotificationSchema: /* @__PURE__ */ __name(() => NotificationSchema, "NotificationSchema"),
  NotificationsParamsSchema: /* @__PURE__ */ __name(() => NotificationsParamsSchema, "NotificationsParamsSchema"),
  NumberSchemaSchema: /* @__PURE__ */ __name(() => NumberSchemaSchema, "NumberSchemaSchema"),
  PaginatedRequestParamsSchema: /* @__PURE__ */ __name(() => PaginatedRequestParamsSchema, "PaginatedRequestParamsSchema"),
  PaginatedRequestSchema: /* @__PURE__ */ __name(() => PaginatedRequestSchema, "PaginatedRequestSchema"),
  PaginatedResultSchema: /* @__PURE__ */ __name(() => PaginatedResultSchema, "PaginatedResultSchema"),
  PingRequestSchema: /* @__PURE__ */ __name(() => PingRequestSchema, "PingRequestSchema"),
  PrimitiveSchemaDefinitionSchema: /* @__PURE__ */ __name(() => PrimitiveSchemaDefinitionSchema, "PrimitiveSchemaDefinitionSchema"),
  ProgressNotificationParamsSchema: /* @__PURE__ */ __name(() => ProgressNotificationParamsSchema, "ProgressNotificationParamsSchema"),
  ProgressNotificationSchema: /* @__PURE__ */ __name(() => ProgressNotificationSchema, "ProgressNotificationSchema"),
  ProgressSchema: /* @__PURE__ */ __name(() => ProgressSchema, "ProgressSchema"),
  ProgressTokenSchema: /* @__PURE__ */ __name(() => ProgressTokenSchema, "ProgressTokenSchema"),
  PromptArgumentSchema: /* @__PURE__ */ __name(() => PromptArgumentSchema, "PromptArgumentSchema"),
  PromptListChangedNotificationSchema: /* @__PURE__ */ __name(() => PromptListChangedNotificationSchema, "PromptListChangedNotificationSchema"),
  PromptMessageSchema: /* @__PURE__ */ __name(() => PromptMessageSchema, "PromptMessageSchema"),
  PromptReferenceSchema: /* @__PURE__ */ __name(() => PromptReferenceSchema, "PromptReferenceSchema"),
  PromptSchema: /* @__PURE__ */ __name(() => PromptSchema, "PromptSchema"),
  ReadResourceRequestParamsSchema: /* @__PURE__ */ __name(() => ReadResourceRequestParamsSchema, "ReadResourceRequestParamsSchema"),
  ReadResourceRequestSchema: /* @__PURE__ */ __name(() => ReadResourceRequestSchema, "ReadResourceRequestSchema"),
  ReadResourceResultSchema: /* @__PURE__ */ __name(() => ReadResourceResultSchema, "ReadResourceResultSchema"),
  RelatedTaskMetadataSchema: /* @__PURE__ */ __name(() => RelatedTaskMetadataSchema, "RelatedTaskMetadataSchema"),
  RequestIdSchema: /* @__PURE__ */ __name(() => RequestIdSchema, "RequestIdSchema"),
  RequestMetaSchema: /* @__PURE__ */ __name(() => RequestMetaSchema, "RequestMetaSchema"),
  RequestSchema: /* @__PURE__ */ __name(() => RequestSchema, "RequestSchema"),
  ResourceContentsSchema: /* @__PURE__ */ __name(() => ResourceContentsSchema, "ResourceContentsSchema"),
  ResourceLinkSchema: /* @__PURE__ */ __name(() => ResourceLinkSchema, "ResourceLinkSchema"),
  ResourceListChangedNotificationSchema: /* @__PURE__ */ __name(() => ResourceListChangedNotificationSchema, "ResourceListChangedNotificationSchema"),
  ResourceRequestParamsSchema: /* @__PURE__ */ __name(() => ResourceRequestParamsSchema, "ResourceRequestParamsSchema"),
  ResourceSchema: /* @__PURE__ */ __name(() => ResourceSchema, "ResourceSchema"),
  ResourceTemplateReferenceSchema: /* @__PURE__ */ __name(() => ResourceTemplateReferenceSchema, "ResourceTemplateReferenceSchema"),
  ResourceTemplateSchema: /* @__PURE__ */ __name(() => ResourceTemplateSchema, "ResourceTemplateSchema"),
  ResourceUpdatedNotificationParamsSchema: /* @__PURE__ */ __name(() => ResourceUpdatedNotificationParamsSchema, "ResourceUpdatedNotificationParamsSchema"),
  ResourceUpdatedNotificationSchema: /* @__PURE__ */ __name(() => ResourceUpdatedNotificationSchema, "ResourceUpdatedNotificationSchema"),
  ResultMetaObjectSchema: /* @__PURE__ */ __name(() => ResultMetaObjectSchema, "ResultMetaObjectSchema"),
  ResultSchema: /* @__PURE__ */ __name(() => ResultSchema, "ResultSchema"),
  RoleSchema: /* @__PURE__ */ __name(() => RoleSchema, "RoleSchema"),
  RootSchema: /* @__PURE__ */ __name(() => RootSchema, "RootSchema"),
  RootsListChangedNotificationSchema: /* @__PURE__ */ __name(() => RootsListChangedNotificationSchema, "RootsListChangedNotificationSchema"),
  SamplingContentSchema: /* @__PURE__ */ __name(() => SamplingContentSchema, "SamplingContentSchema"),
  SamplingMessageContentBlockSchema: /* @__PURE__ */ __name(() => SamplingMessageContentBlockSchema, "SamplingMessageContentBlockSchema"),
  SamplingMessageSchema: /* @__PURE__ */ __name(() => SamplingMessageSchema, "SamplingMessageSchema"),
  ServerCapabilitiesSchema: /* @__PURE__ */ __name(() => ServerCapabilitiesSchema, "ServerCapabilitiesSchema"),
  ServerNotificationSchema: /* @__PURE__ */ __name(() => ServerNotificationSchema, "ServerNotificationSchema"),
  ServerRequestSchema: /* @__PURE__ */ __name(() => ServerRequestSchema, "ServerRequestSchema"),
  ServerResultSchema: /* @__PURE__ */ __name(() => ServerResultSchema, "ServerResultSchema"),
  ServerTasksCapabilitySchema: /* @__PURE__ */ __name(() => ServerTasksCapabilitySchema, "ServerTasksCapabilitySchema"),
  SetLevelRequestParamsSchema: /* @__PURE__ */ __name(() => SetLevelRequestParamsSchema, "SetLevelRequestParamsSchema"),
  SetLevelRequestSchema: /* @__PURE__ */ __name(() => SetLevelRequestSchema, "SetLevelRequestSchema"),
  SingleSelectEnumSchemaSchema: /* @__PURE__ */ __name(() => SingleSelectEnumSchemaSchema, "SingleSelectEnumSchemaSchema"),
  StringSchemaSchema: /* @__PURE__ */ __name(() => StringSchemaSchema, "StringSchemaSchema"),
  SubscribeRequestParamsSchema: /* @__PURE__ */ __name(() => SubscribeRequestParamsSchema, "SubscribeRequestParamsSchema"),
  SubscribeRequestSchema: /* @__PURE__ */ __name(() => SubscribeRequestSchema, "SubscribeRequestSchema"),
  SubscriptionFilterSchema: /* @__PURE__ */ __name(() => SubscriptionFilterSchema, "SubscriptionFilterSchema"),
  SubscriptionsAcknowledgedNotificationParamsSchema: /* @__PURE__ */ __name(() => SubscriptionsAcknowledgedNotificationParamsSchema, "SubscriptionsAcknowledgedNotificationParamsSchema"),
  SubscriptionsAcknowledgedNotificationSchema: /* @__PURE__ */ __name(() => SubscriptionsAcknowledgedNotificationSchema, "SubscriptionsAcknowledgedNotificationSchema"),
  SubscriptionsListenRequestParamsSchema: /* @__PURE__ */ __name(() => SubscriptionsListenRequestParamsSchema, "SubscriptionsListenRequestParamsSchema"),
  SubscriptionsListenRequestSchema: /* @__PURE__ */ __name(() => SubscriptionsListenRequestSchema, "SubscriptionsListenRequestSchema"),
  SubscriptionsListenResultMetaSchema: /* @__PURE__ */ __name(() => SubscriptionsListenResultMetaSchema, "SubscriptionsListenResultMetaSchema"),
  SubscriptionsListenResultSchema: /* @__PURE__ */ __name(() => SubscriptionsListenResultSchema, "SubscriptionsListenResultSchema"),
  TaskAugmentedRequestParamsSchema: /* @__PURE__ */ __name(() => TaskAugmentedRequestParamsSchema, "TaskAugmentedRequestParamsSchema"),
  TaskCreationParamsSchema: /* @__PURE__ */ __name(() => TaskCreationParamsSchema, "TaskCreationParamsSchema"),
  TaskMetadataSchema: /* @__PURE__ */ __name(() => TaskMetadataSchema, "TaskMetadataSchema"),
  TaskSchema: /* @__PURE__ */ __name(() => TaskSchema, "TaskSchema"),
  TaskStatusNotificationParamsSchema: /* @__PURE__ */ __name(() => TaskStatusNotificationParamsSchema, "TaskStatusNotificationParamsSchema"),
  TaskStatusNotificationSchema: /* @__PURE__ */ __name(() => TaskStatusNotificationSchema, "TaskStatusNotificationSchema"),
  TaskStatusSchema: /* @__PURE__ */ __name(() => TaskStatusSchema, "TaskStatusSchema"),
  TextContentSchema: /* @__PURE__ */ __name(() => TextContentSchema, "TextContentSchema"),
  TextResourceContentsSchema: /* @__PURE__ */ __name(() => TextResourceContentsSchema, "TextResourceContentsSchema"),
  TitledMultiSelectEnumSchemaSchema: /* @__PURE__ */ __name(() => TitledMultiSelectEnumSchemaSchema, "TitledMultiSelectEnumSchemaSchema"),
  TitledSingleSelectEnumSchemaSchema: /* @__PURE__ */ __name(() => TitledSingleSelectEnumSchemaSchema, "TitledSingleSelectEnumSchemaSchema"),
  ToolAnnotationsSchema: /* @__PURE__ */ __name(() => ToolAnnotationsSchema, "ToolAnnotationsSchema"),
  ToolChoiceSchema: /* @__PURE__ */ __name(() => ToolChoiceSchema, "ToolChoiceSchema"),
  ToolExecutionSchema: /* @__PURE__ */ __name(() => ToolExecutionSchema, "ToolExecutionSchema"),
  ToolListChangedNotificationSchema: /* @__PURE__ */ __name(() => ToolListChangedNotificationSchema, "ToolListChangedNotificationSchema"),
  ToolResultContentSchema: /* @__PURE__ */ __name(() => ToolResultContentSchema, "ToolResultContentSchema"),
  ToolSchema: /* @__PURE__ */ __name(() => ToolSchema, "ToolSchema"),
  ToolUseContentSchema: /* @__PURE__ */ __name(() => ToolUseContentSchema, "ToolUseContentSchema"),
  UnsubscribeRequestParamsSchema: /* @__PURE__ */ __name(() => UnsubscribeRequestParamsSchema, "UnsubscribeRequestParamsSchema"),
  UnsubscribeRequestSchema: /* @__PURE__ */ __name(() => UnsubscribeRequestSchema, "UnsubscribeRequestSchema"),
  UntitledMultiSelectEnumSchemaSchema: /* @__PURE__ */ __name(() => UntitledMultiSelectEnumSchemaSchema, "UntitledMultiSelectEnumSchemaSchema"),
  UntitledSingleSelectEnumSchemaSchema: /* @__PURE__ */ __name(() => UntitledSingleSelectEnumSchemaSchema, "UntitledSingleSelectEnumSchemaSchema")
});
var isJSONRPCRequest = /* @__PURE__ */ __name((value) => JSONRPCRequestSchema.safeParse(value).success, "isJSONRPCRequest");
var isJSONRPCNotification = /* @__PURE__ */ __name((value) => JSONRPCNotificationSchema.safeParse(value).success, "isJSONRPCNotification");
var isJSONRPCResultResponse = /* @__PURE__ */ __name((value) => JSONRPCResultResponseSchema.safeParse(value).success, "isJSONRPCResultResponse");
var isJSONRPCErrorResponse = /* @__PURE__ */ __name((value) => JSONRPCErrorResponseSchema.safeParse(value).success, "isJSONRPCErrorResponse");
var isInputRequiredResult = /* @__PURE__ */ __name((value) => typeof value === "object" && value !== null && !Array.isArray(value) && value.resultType === "input_required", "isInputRequiredResult");
var isInitializeRequest = /* @__PURE__ */ __name((value) => InitializeRequestSchema.safeParse(value).success, "isInitializeRequest");
function assertCompleteRequestPrompt(request) {
  if (request.params.ref.type !== "ref/prompt") throw new TypeError(`Expected CompleteRequestPrompt, but got ${request.params.ref.type}`);
}
__name(assertCompleteRequestPrompt, "assertCompleteRequestPrompt");
function assertCompleteRequestResourceTemplate(request) {
  if (request.params.ref.type !== "ref/resource") throw new TypeError(`Expected CompleteRequestResourceTemplate, but got ${request.params.ref.type}`);
}
__name(assertCompleteRequestResourceTemplate, "assertCompleteRequestResourceTemplate");
var MCP_PARAM_HEADER_PREFIX = "Mcp-Param-";
var X_MCP_HEADER_KEY = "x-mcp-header";
var RFC9110_TOKEN = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
var PERMITTED_X_MCP_HEADER_TYPES = /* @__PURE__ */ new Set([
  "string",
  "integer",
  "boolean"
]);
function scanXMcpHeaderDeclarations(inputSchema) {
  const declarations = [];
  const seenLower = /* @__PURE__ */ new Map();
  let numberFault;
  const visit = /* @__PURE__ */ __name((node2, path, reachable) => {
    if (node2 === null || typeof node2 !== "object") return void 0;
    const schema = node2;
    if (X_MCP_HEADER_KEY in schema) {
      if (!reachable || path.length === 0) return `${pathName(path)}: x-mcp-header is only permitted on properties statically reachable via a chain of 'properties' keys (not under items, additionalProperties, oneOf/anyOf/allOf/not, if/then/else, or $ref)`;
      const raw = schema[X_MCP_HEADER_KEY];
      if (typeof raw !== "string" || raw.length === 0) return `${pathName(path)}: x-mcp-header MUST be a non-empty string`;
      if (!RFC9110_TOKEN.test(raw)) return `${pathName(path)}: x-mcp-header '${raw}' is not a valid RFC 9110 token (no spaces, control characters or HTTP delimiters)`;
      const type = typeof schema.type === "string" ? schema.type : void 0;
      if (type === void 0 || !PERMITTED_X_MCP_HEADER_TYPES.has(type)) {
        const fault$1 = `${pathName(path)}: x-mcp-header is only permitted on primitive-typed properties (string, integer, boolean); got ${type ?? "<none>"}`;
        if (type !== "number") return fault$1;
        numberFault ??= fault$1;
      }
      const lower = raw.toLowerCase();
      const prior = seenLower.get(lower);
      if (prior !== void 0) return `x-mcp-header '${raw}' is not case-insensitively unique (also declared as '${prior}')`;
      seenLower.set(lower, raw);
      declarations.push({
        path,
        headerName: raw,
        type
      });
    }
    const properties = schema.properties;
    if (properties !== null && typeof properties === "object") for (const [key, child] of Object.entries(properties)) {
      const fault$1 = visit(child, [...path, key], reachable);
      if (fault$1 !== void 0) return fault$1;
    }
    for (const k of NON_REACHABLE_SUBSCHEMA_KEYWORDS) {
      const sub = schema[k];
      if (sub === void 0) continue;
      const branches = Array.isArray(sub) ? sub : sub !== null && typeof sub === "object" && OBJECT_VALUED_SUBSCHEMA_KEYWORDS.has(k) ? Object.values(sub) : [sub];
      for (const branch of branches) {
        const fault$1 = visit(branch, [...path, `<${k}>`], false);
        if (fault$1 !== void 0) return fault$1;
      }
    }
  }, "visit");
  const fault = visit(inputSchema, [], true);
  if (fault !== void 0) return {
    valid: false,
    reason: numberFault ?? fault
  };
  return numberFault === void 0 ? {
    valid: true,
    declarations
  } : {
    valid: false,
    reason: numberFault,
    declarations
  };
}
__name(scanXMcpHeaderDeclarations, "scanXMcpHeaderDeclarations");
var NON_REACHABLE_SUBSCHEMA_KEYWORDS = [
  "items",
  "prefixItems",
  "contains",
  "additionalProperties",
  "unevaluatedProperties",
  "unevaluatedItems",
  "propertyNames",
  "patternProperties",
  "dependentSchemas",
  "oneOf",
  "anyOf",
  "allOf",
  "not",
  "if",
  "then",
  "else",
  "$defs",
  "definitions"
];
var OBJECT_VALUED_SUBSCHEMA_KEYWORDS = /* @__PURE__ */ new Set([
  "patternProperties",
  "dependentSchemas",
  "$defs",
  "definitions"
]);
function pathName(path) {
  return path.length === 0 ? "<root>" : path.join(".");
}
__name(pathName, "pathName");
var BASE64_SENTINEL_PREFIX = "=?base64?";
var BASE64_SENTINEL_SUFFIX = "?=";
var BASE64_CANONICAL = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
var CANONICAL_DECIMAL = /^-?\d+(\.\d+)?$/;
function mcpParamPrimitiveToString(value) {
  if (typeof value === "string") return value;
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return void 0;
    if (Number.isInteger(value) && !Number.isSafeInteger(value)) return void 0;
    return String(value);
  }
}
__name(mcpParamPrimitiveToString, "mcpParamPrimitiveToString");
function base64ToUtf8(b64) {
  const bin = atob(b64);
  const bytes2 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes2[i] = bin.codePointAt(i);
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes2);
}
__name(base64ToUtf8, "base64ToUtf8");
function decodeMcpParamValue(value) {
  if (!(value.startsWith(BASE64_SENTINEL_PREFIX) && value.endsWith(BASE64_SENTINEL_SUFFIX))) return value;
  const b64 = value.slice(9, value.length - 2);
  if (!BASE64_CANONICAL.test(b64)) return void 0;
  try {
    return base64ToUtf8(b64);
  } catch {
    return;
  }
}
__name(decodeMcpParamValue, "decodeMcpParamValue");
function valueAtPath(root, path) {
  let node2 = root;
  for (const key of path) {
    if (node2 === null || typeof node2 !== "object") return void 0;
    node2 = node2[key];
  }
  return node2;
}
__name(valueAtPath, "valueAtPath");
function validateMcpParamHeaders(declarations, args, headers) {
  for (const decl of declarations) {
    const headerKey = `${MCP_PARAM_HEADER_PREFIX}${decl.headerName}`;
    const headerValue = headers.get(headerKey);
    const bodyRaw = valueAtPath(args, decl.path);
    if (bodyRaw === void 0 || bodyRaw === null) continue;
    const bodyString = mcpParamPrimitiveToString(bodyRaw);
    if (bodyString === void 0) continue;
    if (headerValue === null) return paramHeaderMismatchRejection("param-header-missing", headerKey, `the body carries ${pathName(decl.path)}=${JSON.stringify(bodyRaw)} but the ${headerKey} header is absent`);
    const decoded = decodeMcpParamValue(headerValue);
    if (decoded === void 0) return paramHeaderMismatchRejection("param-header-invalid-encoding", headerKey, `the ${headerKey} header carries an invalid Base64 sentinel value`);
    if (!((decl.type === "integer" || decl.type === "number") && CANONICAL_DECIMAL.test(decoded) && typeof bodyRaw === "number" ? Number(decoded) === bodyRaw : decoded === bodyString)) return paramHeaderMismatchRejection("param-header-mismatch", headerKey, `the ${headerKey} header decodes to ${JSON.stringify(decoded)} but the body carries ${pathName(decl.path)}=${JSON.stringify(bodyRaw)}`);
  }
}
__name(validateMcpParamHeaders, "validateMcpParamHeaders");
function paramHeaderMismatchRejection(cell, header, body) {
  return {
    kind: "reject",
    rung: "param-header-validation",
    cell,
    httpStatus: 400,
    code: HEADER_MISMATCH_ERROR_CODE,
    message: `Bad Request: the request headers and body disagree: ${body}`,
    data: { mismatch: {
      header,
      body
    } },
    settled: true
  };
}
__name(paramHeaderMismatchRejection, "paramHeaderMismatchRejection");
var HEADER_MISMATCH_ERROR_CODE = -32020;
var INBOUND_VALIDATION_LADDER = [
  {
    rung: "http-method",
    order: 1,
    evaluatedAt: "edge",
    codes: [-32e3],
    conformance: [],
    rationale: "The modern era is POST-only; GET/DELETE are body-less 2025-era session operations and are method-routed to legacy serving (405 when legacy serving is not configured), before any body is read."
  },
  {
    rung: "jsonrpc-shape",
    order: 2,
    evaluatedAt: "edge",
    codes: [ProtocolErrorCode.InvalidRequest],
    conformance: ["server-stateless"],
    rationale: "The body must be a JSON-RPC request or notification: posted responses and batch arrays containing a modern or invalid element are rejected before classification (element-wise batch rule); all-legacy arrays stay legacy traffic."
  },
  {
    rung: "era-classification",
    order: 3,
    evaluatedAt: "edge",
    codes: [HEADER_MISMATCH_ERROR_CODE, ProtocolErrorCode.UnsupportedProtocolVersion],
    conformance: [
      "server-stateless",
      "http-header-validation",
      "http-custom-header-server-validation"
    ],
    rationale: "Body-primary era classification with the protocol-version header as a cross-check; a header/body disagreement is rejected with -32020 (HeaderMismatch), and an envelope-less request on a modern-only endpoint is answered with the unsupported-protocol-version error naming the supported revisions."
  },
  {
    rung: "envelope",
    order: 4,
    evaluatedAt: "edge",
    codes: [ProtocolErrorCode.InvalidParams],
    conformance: ["server-stateless"],
    rationale: "A present envelope claim with a malformed envelope \u2014 and a missing envelope on a request whose protocol-version header names a modern revision \u2014 is an invalid-params rejection naming the offending or missing key(s); never a silent fall back to legacy handling. This is the only place an invalid-params rejection maps to HTTP 400."
  },
  {
    rung: "method-registry",
    order: 5,
    evaluatedAt: "dispatch",
    codes: [ProtocolErrorCode.MethodNotFound],
    conformance: ["server-stateless"],
    rationale: "Method existence outranks parameter validity: a method absent from the negotiated revision\u2019s registry (or with no handler installed) answers method-not-found before params or capabilities are looked at."
  },
  {
    rung: "request-params",
    order: 6,
    evaluatedAt: "dispatch",
    codes: [ProtocolErrorCode.InvalidParams],
    conformance: [],
    rationale: "Per-method params validation; emitted in-band by the dispatch layer (HTTP 200), never via the ladder status table."
  },
  {
    rung: "standard-header-validation",
    order: 7,
    evaluatedAt: "pre-dispatch",
    codes: [HEADER_MISMATCH_ERROR_CODE],
    conformance: ["http-header-validation"],
    rationale: "SEP-2243 standard `MCP-Protocol-Version` / `Mcp-Method` / `Mcp-Name` headers \u2014 presence, sentinel decoding, and `Mcp-Name` \u2194 body cross-check \u2014 are validated by the HTTP entry on a modern-classified request after the supported-revision gate and before dispatch. The spec requires `MCP-Protocol-Version` and `Mcp-Method` on every modern *request* POST (`Mcp-Name` only for the methods that mirror `params.name` / `params.uri` / `params.taskId`, see `MCP_NAME_HEADER_SOURCE`) and names them in that order, so a request missing several is answered by the earliest. Notification POSTs are exempt: the presence half runs on requests only, so a modern-enveloped notification is dispatched even with no standard headers at all. The classifier\u2019s own header-mismatch cells (protocol-version, `Mcp-Method` mismatch) stay on the edge `era-classification` rung; this rung carries the entry-layer presence/`Mcp-Name` half \u2014 including the missing `MCP-Protocol-Version` cell, which cannot live on the edge rung without breaking body-primary classification. Evaluated before the capability gate, the factory call, and the `Mcp-Param-*` rung so a request that fails several rungs is answered by the standard-header rung first. The documented order (after method-registry 5 and request-params 6) is NOT the observed precedence: serveModern evaluates this rung immediately after the supported-revision gate, so a request that also fails a dispatch rung is answered here before the dispatch rungs (5\u20136) are consulted."
  },
  {
    rung: "client-capabilities",
    order: 8,
    evaluatedAt: "pre-dispatch",
    codes: [ProtocolErrorCode.MissingRequiredClientCapability],
    conformance: ["server-stateless"],
    rationale: "The capability requirement is checked by the HTTP entry, pre-dispatch, against the validated envelope the classifier produced \u2014 pinning the spec-mandated HTTP 400 independently of how dispatch- and handler-produced errors are mapped. The documented order (after method resolution and params validation) is preserved observably only while the requirement table is empty: once a served method gains a requirement entry, a request that is missing the capability and would also fail a dispatch rung is answered by this gate first, so the entry must consult the method registry before the gate if the documented precedence is to stay observable."
  },
  {
    rung: "param-header-validation",
    order: 9,
    evaluatedAt: "pre-dispatch",
    codes: [HEADER_MISMATCH_ERROR_CODE],
    conformance: ["http-custom-header-server-validation"],
    rationale: "SEP-2243 `Mcp-Param-*` headers are validated against the named tool\u2019s `x-mcp-header` declarations and the body `arguments` after the tool registry is known and before dispatch reaches the handler; a missing/disagreeing/malformed header is rejected 400 / -32020 with the same shape as the standard-header cross-checks. The documented order (after method resolution and params validation) is preserved observably only when the body `arguments` would otherwise validate: the check runs pre-dispatch, so a `tools/call` that fails BOTH this rung and a dispatch-time rung (e.g. order-6 `request-params`, -32602) is answered by this gate first with 400 / -32020, not by the earlier-ordered rung."
  }
];
var LADDER_ERROR_HTTP_STATUS = {
  [ProtocolErrorCode.ParseError]: 400,
  [ProtocolErrorCode.InvalidRequest]: 400,
  [ProtocolErrorCode.MethodNotFound]: 404,
  [ProtocolErrorCode.UnsupportedProtocolVersion]: 400,
  [ProtocolErrorCode.MissingRequiredClientCapability]: 400,
  [HEADER_MISMATCH_ERROR_CODE]: 400
};
function httpStatusForErrorCode(code, origin) {
  if (origin === "in-band") return code === ProtocolErrorCode.MissingRequiredClientCapability ? 400 : 200;
  return LADDER_ERROR_HTTP_STATUS[code] ?? 400;
}
__name(httpStatusForErrorCode, "httpStatusForErrorCode");
function rejection(rung, cell, httpStatus, error2, settled) {
  return {
    kind: "reject",
    rung,
    cell,
    httpStatus,
    code: error2.code,
    message: error2.message,
    ...error2.data !== void 0 && { data: error2.data },
    settled
  };
}
__name(rejection, "rejection");
function crossCheckMismatch(cell, header, body, rung = "era-classification") {
  return rejection(rung, cell, 400, new ProtocolError(HEADER_MISMATCH_ERROR_CODE, `Bad Request: the request headers and body disagree: ${body}`, { mismatch: {
    header,
    body
  } }), true);
}
__name(crossCheckMismatch, "crossCheckMismatch");
var MCP_NAME_HEADER_SOURCE = {
  "tools/call": "name",
  "prompts/get": "name",
  "resources/read": "uri",
  "tasks/get": "taskId",
  "tasks/update": "taskId",
  "tasks/cancel": "taskId"
};
function mcpNameSource(method, params) {
  const field = Object.hasOwn(MCP_NAME_HEADER_SOURCE, method) ? MCP_NAME_HEADER_SOURCE[method] : void 0;
  if (field === void 0) return;
  const raw = isPlainObject$2(params) ? params[field] : void 0;
  return {
    field,
    value: typeof raw === "string" ? raw : void 0
  };
}
__name(mcpNameSource, "mcpNameSource");
function stripHttpOws(value) {
  let start = 0;
  while (start < value.length) {
    const code = value.codePointAt(start);
    if (code !== 9 && code !== 32) break;
    start += 1;
  }
  let end = value.length;
  while (end > start) {
    const code = value.codePointAt(end - 1);
    if (code !== 9 && code !== 32) break;
    end -= 1;
  }
  return start === 0 && end === value.length ? value : value.slice(start, end);
}
__name(stripHttpOws, "stripHttpOws");
function validateStandardRequestHeaders(request, route) {
  if (route.messageKind !== "request") return;
  const method = route.message.method;
  if (request.protocolVersionHeader === void 0) {
    const claimed = route.classification.revision;
    return crossCheckMismatch("version-header-missing", "(missing)", claimed === void 0 ? "the body carries a modern per-request envelope but the required MCP-Protocol-Version header is absent" : `the body envelope names protocol version ${claimed} but the required MCP-Protocol-Version header is absent`, "standard-header-validation");
  }
  if (request.mcpMethodHeader === void 0) return crossCheckMismatch("method-header-missing", "(missing)", `the body names method ${method} but the required Mcp-Method header is absent`, "standard-header-validation");
  const source = mcpNameSource(method, route.message.params);
  if (source === void 0) return;
  const { field: sourceField, value: bodyValue } = source;
  if (request.mcpNameHeader === void 0) {
    if (bodyValue === void 0) return;
    return crossCheckMismatch("name-header-missing", "(missing)", `the body carries params.${sourceField}="${bodyValue}" but the required Mcp-Name header is absent`, "standard-header-validation");
  }
  const normalizedNameHeader = stripHttpOws(request.mcpNameHeader);
  const decoded = decodeMcpParamValue(normalizedNameHeader);
  if (decoded === void 0) return crossCheckMismatch("name-header-invalid-encoding", normalizedNameHeader, "the Mcp-Name header carries an invalid Base64 sentinel value", "standard-header-validation");
  if (bodyValue !== void 0 && decoded !== bodyValue) return crossCheckMismatch("name-header-mismatch", normalizedNameHeader, `the body carries params.${sourceField}="${bodyValue}" but the Mcp-Name header names "${decoded}"`, "standard-header-validation");
}
__name(validateStandardRequestHeaders, "validateStandardRequestHeaders");
function isPlainObject$2(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
__name(isPlainObject$2, "isPlainObject$2");
function classificationForClaim(claimedVersion) {
  if (claimedVersion === void 0) return { era: "modern" };
  return {
    era: isModernProtocolVersion(claimedVersion) ? "modern" : "legacy",
    revision: claimedVersion
  };
}
__name(classificationForClaim, "classificationForClaim");
function carriesValidModernEnvelopeClaim(params) {
  if (!hasEnvelopeClaim(params)) return false;
  const claimedVersion = envelopeClaimVersion(params);
  if (claimedVersion === void 0 || !isModernProtocolVersion(claimedVersion)) return false;
  const meta2 = requestMetaOf(params);
  return meta2 !== void 0 && validateEnvelopeMeta(meta2).length === 0;
}
__name(carriesValidModernEnvelopeClaim, "carriesValidModernEnvelopeClaim");
function classifyBatch(body) {
  if (body.length === 0) return rejection("jsonrpc-shape", "empty-batch", 400, new ProtocolError(ProtocolErrorCode.InvalidRequest, "Bad Request: empty JSON-RPC batch"), true);
  for (const element of body) {
    if (hasEnvelopeClaim(isPlainObject$2(element) ? element["params"] : void 0)) return rejection("jsonrpc-shape", "batch-with-modern-element", 400, new ProtocolError(ProtocolErrorCode.InvalidRequest, "Bad Request: JSON-RPC batches may not contain requests for protocol revision 2026-07-28 or later"), true);
    if (!(isJSONRPCRequest(element) || isJSONRPCNotification(element) || isJSONRPCResultResponse(element) || isJSONRPCErrorResponse(element))) return rejection("jsonrpc-shape", "batch-with-invalid-element", 400, new ProtocolError(ProtocolErrorCode.InvalidRequest, "Bad Request: JSON-RPC batch contains an invalid message"), true);
  }
  return {
    kind: "legacy",
    reason: "batch"
  };
}
__name(classifyBatch, "classifyBatch");
function classifyRequestBody(request, body) {
  const params = body.params;
  const method = body.method;
  const headerVersion = request.protocolVersionHeader;
  const headerNamesModern = headerVersion !== void 0 && isModernProtocolVersion(headerVersion);
  if (method === "initialize" && !carriesValidModernEnvelopeClaim(params)) {
    if (headerNamesModern) return crossCheckMismatch("initialize-with-modern-header", headerVersion, "an initialize request (legacy handshake) was sent with a modern MCP-Protocol-Version header");
    const requestedVersion = isPlainObject$2(params) && typeof params["protocolVersion"] === "string" ? params["protocolVersion"] : void 0;
    return {
      kind: "legacy",
      reason: "initialize",
      ...requestedVersion !== void 0 && { requestedVersion }
    };
  }
  if (hasEnvelopeClaim(params)) {
    const meta2 = requestMetaOf(params);
    const firstIssue = (meta2 === void 0 ? [] : validateEnvelopeMeta(meta2))[0];
    if (firstIssue !== void 0) return rejection("envelope", "envelope-invalid", 400, new ProtocolError(ProtocolErrorCode.InvalidParams, `Invalid _meta envelope for protocol revision 2026-07-28: ${firstIssue.key}: ${firstIssue.problem}`, { envelope: firstIssue }), true);
    const claimedVersion = envelopeClaimVersion(params);
    if (headerVersion !== void 0 && claimedVersion !== void 0 && headerVersion !== claimedVersion) return crossCheckMismatch("header-body-version-mismatch", headerVersion, `the body envelope names protocol version ${claimedVersion} but the MCP-Protocol-Version header names ${headerVersion}`);
    if (request.mcpMethodHeader !== void 0 && request.mcpMethodHeader !== method) return crossCheckMismatch("method-header-mismatch", request.mcpMethodHeader, `the body names method ${method} but the Mcp-Method header names ${request.mcpMethodHeader}`);
    return {
      kind: "modern",
      messageKind: "request",
      message: body,
      classification: classificationForClaim(claimedVersion)
    };
  }
  if (headerNamesModern) {
    const meta2 = requestMetaOf(params);
    const missingFromEnvelope = validateEnvelopeMeta(meta2 ?? {}).filter((issue2) => issue2.problem === "missing").map((issue2) => issue2.key);
    const missing = meta2 === void 0 ? ["_meta"] : missingFromEnvelope.length > 0 ? missingFromEnvelope : [PROTOCOL_VERSION_META_KEY];
    return rejection("envelope", "modern-header-without-claim", 400, new ProtocolError(ProtocolErrorCode.InvalidParams, `Invalid params: the MCP-Protocol-Version header names protocol revision ${headerVersion}, but the request is missing the required per-request envelope key(s): ${missing.join(", ")}`, { envelope: { missing } }), true);
  }
  return {
    kind: "legacy",
    reason: "no-claim",
    ...headerVersion !== void 0 && { requestedVersion: headerVersion }
  };
}
__name(classifyRequestBody, "classifyRequestBody");
function classifyNotificationBody(request, body) {
  const params = body.params;
  const method = body.method;
  const headerVersion = request.protocolVersionHeader;
  const headerNamesModern = headerVersion !== void 0 && isModernProtocolVersion(headerVersion);
  if (hasEnvelopeClaim(params)) {
    const claimedVersion = envelopeClaimVersion(params);
    if (claimedVersion === void 0) {
      const meta2 = requestMetaOf(params);
      const claimIssue = (meta2 === void 0 ? [] : validateEnvelopeMeta(meta2)).find((issue2) => issue2.key === PROTOCOL_VERSION_META_KEY) ?? {
        key: PROTOCOL_VERSION_META_KEY,
        problem: "expected a protocol version string"
      };
      return rejection("envelope", "notification-envelope-invalid", 400, new ProtocolError(ProtocolErrorCode.InvalidParams, `Invalid _meta envelope for protocol revision 2026-07-28: ${claimIssue.key}: ${claimIssue.problem}`, { envelope: claimIssue }), true);
    }
    if (headerVersion !== void 0 && headerVersion !== claimedVersion) return crossCheckMismatch("notification-header-body-version-mismatch", headerVersion, `the notification envelope names protocol version ${claimedVersion} but the MCP-Protocol-Version header names ${headerVersion}`);
    const classification = classificationForClaim(claimedVersion);
    if (classification.era === "modern" && request.mcpMethodHeader !== void 0 && request.mcpMethodHeader !== method) return crossCheckMismatch("notification-method-header-mismatch", request.mcpMethodHeader, `the notification body names method ${method} but the Mcp-Method header names ${request.mcpMethodHeader}`);
    return {
      kind: "modern",
      messageKind: "notification",
      message: body,
      classification
    };
  }
  if (headerNamesModern) {
    if (request.mcpMethodHeader !== void 0 && request.mcpMethodHeader !== method) return crossCheckMismatch("notification-method-header-mismatch", request.mcpMethodHeader, `the notification body names method ${method} but the Mcp-Method header names ${request.mcpMethodHeader}`);
    return {
      kind: "modern",
      messageKind: "notification",
      message: body,
      classification: {
        era: "modern",
        revision: headerVersion
      }
    };
  }
  return {
    kind: "legacy",
    reason: "notification",
    ...headerVersion !== void 0 && { requestedVersion: headerVersion }
  };
}
__name(classifyNotificationBody, "classifyNotificationBody");
function classifyInboundRequest(request) {
  request = {
    ...request,
    ...request.protocolVersionHeader !== void 0 && { protocolVersionHeader: stripHttpOws(request.protocolVersionHeader) },
    ...request.mcpMethodHeader !== void 0 && { mcpMethodHeader: stripHttpOws(request.mcpMethodHeader) },
    ...request.mcpNameHeader !== void 0 && { mcpNameHeader: stripHttpOws(request.mcpNameHeader) }
  };
  if (request.httpMethod.toUpperCase() !== "POST") return {
    kind: "legacy",
    reason: "http-method"
  };
  const body = request.body;
  if (Array.isArray(body)) return classifyBatch(body);
  if (isJSONRPCResultResponse(body) || isJSONRPCErrorResponse(body)) return {
    kind: "legacy",
    reason: "response"
  };
  if (isPlainObject$2(body) && isJSONRPCRequest(body)) return classifyRequestBody(request, body);
  if (isPlainObject$2(body) && isJSONRPCNotification(body)) return classifyNotificationBody(request, body);
  return rejection("jsonrpc-shape", "invalid-json-rpc-body", 400, new ProtocolError(ProtocolErrorCode.InvalidRequest, "Bad Request: the request body is not a valid JSON-RPC message"), true);
}
__name(classifyInboundRequest, "classifyInboundRequest");
function modernOnlyStrictRejection(route, supportedVersions) {
  switch (route.reason) {
    case "http-method":
      return rejection("http-method", "modern-only-method-not-allowed", 405, new ProtocolError(-32e3, "Method not allowed."), true);
    case "batch":
      return rejection("jsonrpc-shape", "modern-only-batch-not-supported", 400, new ProtocolError(ProtocolErrorCode.InvalidRequest, "Bad Request: JSON-RPC batches are not supported by this endpoint"), true);
    case "response":
      return rejection("jsonrpc-shape", "modern-only-response-post", 400, new ProtocolError(ProtocolErrorCode.InvalidRequest, "Bad Request: JSON-RPC responses cannot be posted to this endpoint"), true);
    case "notification":
      return;
    case "initialize":
    case "no-claim": {
      const requested = route.requestedVersion;
      return rejection("era-classification", "modern-only-missing-envelope", 400, requested === void 0 ? new ProtocolError(ProtocolErrorCode.UnsupportedProtocolVersion, "Unsupported protocol version: the request did not name a protocol version", { supported: [...supportedVersions] }) : new UnsupportedProtocolVersionError({
        supported: [...supportedVersions],
        requested
      }), true);
    }
  }
}
__name(modernOnlyStrictRejection, "modernOnlyStrictRejection");
function parseSchema(schema, data) {
  return safeParse(schema, data);
}
__name(parseSchema, "parseSchema");
function shapeKeys(schemas) {
  return new Set(schemas.flatMap((schema) => Object.keys(schema.shape)));
}
__name(shapeKeys, "shapeKeys");
function isStandardSchema(schema) {
  if (schema == null) return false;
  const schemaType = typeof schema;
  if (schemaType !== "object" && schemaType !== "function") return false;
  if (!("~standard" in schema)) return false;
  return typeof schema["~standard"]?.validate === "function";
}
__name(isStandardSchema, "isStandardSchema");
var warnedZodFallback = false;
var JSON_SCHEMA_CONVERSION_TARGET = "draft-2020-12";
function standardSchemaToJsonSchema(schema, io = "input") {
  const std = schema["~standard"];
  let result;
  if (std.jsonSchema) result = std.jsonSchema[io]({ target: JSON_SCHEMA_CONVERSION_TARGET });
  else if (std.vendor === "zod") {
    if (!("_zod" in schema)) throw new Error("Schema appears to be from zod 3, which the SDK cannot convert to JSON Schema. Upgrade to zod >=4.2.0, or wrap your JSON Schema with fromJsonSchema().");
    if (!warnedZodFallback) {
      warnedZodFallback = true;
      console.warn("[mcp-sdk] Your zod version does not implement `~standard.jsonSchema` (added in zod 4.2.0). Falling back to z.toJSONSchema(). Upgrade to zod >=4.2.0 to silence this warning.");
    }
    result = toJSONSchema(schema, {
      target: JSON_SCHEMA_CONVERSION_TARGET,
      io
    });
  } else throw new Error(`Schema library "${std.vendor}" does not implement StandardJSONSchemaV1 (\`~standard.jsonSchema\`). Upgrade to a version that does, or wrap your JSON Schema with fromJsonSchema().`);
  if (io === "output") {
    if (result.type !== void 0) return result;
    return isProvablyObjectShapedRoot(result) ? {
      type: "object",
      ...result
    } : result;
  }
  if (result.type !== void 0 && result.type !== "object") throw new Error(`MCP tool and prompt schemas must describe objects (got type: ${JSON.stringify(result.type)}). Wrap your schema in z.object({...}) or equivalent.`);
  return {
    type: "object",
    ...result
  };
}
__name(standardSchemaToJsonSchema, "standardSchemaToJsonSchema");
var LOCAL_DEFINITION_REF = /^#\/(\$defs|definitions)\/([^/~%]+)$/;
function isProvablyObjectShapedRoot(schema, root = schema) {
  if ("properties" in schema || "patternProperties" in schema || "additionalProperties" in schema || "required" in schema) return true;
  const ref = typeof schema.$ref === "string" && LOCAL_DEFINITION_REF.exec(schema.$ref);
  if (ref && root[ref[1]]?.[ref[2]]?.type === "object") return true;
  for (const key of [
    "oneOf",
    "anyOf",
    "allOf"
  ]) {
    const members2 = schema[key];
    if (Array.isArray(members2) && members2.length > 0) return members2.every((m) => m !== null && typeof m === "object" && (m.type === "object" || isProvablyObjectShapedRoot(m, "$id" in m ? {} : root)));
  }
  return false;
}
__name(isProvablyObjectShapedRoot, "isProvablyObjectShapedRoot");
function formatIssue(issue2) {
  if (!issue2.path?.length) return issue2.message;
  return `${issue2.path.map((p) => String(typeof p === "object" ? p.key : p)).join(".")}: ${issue2.message}`;
}
__name(formatIssue, "formatIssue");
async function validateStandardSchema(schema, data) {
  const result = await schema["~standard"].validate(data);
  if (result.issues && result.issues.length > 0) return {
    success: false,
    error: result.issues.map((i) => formatIssue(i)).join(", ")
  };
  return {
    success: true,
    data: result.value
  };
}
__name(validateStandardSchema, "validateStandardSchema");
function zodEmittedPattern(schema) {
  const jsonSchema = toJSONSchema(schema, {
    target: JSON_SCHEMA_CONVERSION_TARGET,
    io: "input"
  });
  return typeof jsonSchema.pattern === "string" ? jsonSchema.pattern : void 0;
}
__name(zodEmittedPattern, "zodEmittedPattern");
var DATETIME_FRACTION_DIGITS = /\\\.\\d\{(\d+)\}/;
function datetimeReferenceSchemas(pattern) {
  const fractionDigits = DATETIME_FRACTION_DIGITS.exec(pattern);
  const precisions = [
    void 0,
    -1,
    0
  ];
  if (fractionDigits) precisions.push(Number(fractionDigits[1]));
  return [false, true].flatMap((local) => [false, true].flatMap((offset) => precisions.map((precision) => iso_exports.datetime({
    local,
    offset,
    precision
  }))));
}
__name(datetimeReferenceSchemas, "datetimeReferenceSchemas");
function referencePatternsForFormat(format2, pattern) {
  let referenceSchemas;
  switch (format2) {
    case "email":
      referenceSchemas = [email2()];
      break;
    case "uri":
      referenceSchemas = [url()];
      break;
    case "date":
      referenceSchemas = [iso_exports.date()];
      break;
    case "date-time":
      referenceSchemas = datetimeReferenceSchemas(pattern);
      break;
  }
  return new Set(referenceSchemas.map((schema) => zodEmittedPattern(schema)).filter((emitted) => emitted !== void 0));
}
__name(referencePatternsForFormat, "referencePatternsForFormat");
function isLibraryFormatPattern(format2, pattern, vendor) {
  if (vendor !== "zod") return true;
  return referencePatternsForFormat(format2, pattern).has(pattern);
}
__name(isLibraryFormatPattern, "isLibraryFormatPattern");
function promptArgumentsFromStandardSchema(schema) {
  const jsonSchema = standardSchemaToJsonSchema(schema, "input");
  const properties = jsonSchema.properties || {};
  const required2 = jsonSchema.required || [];
  return Object.entries(properties).map(([name, prop]) => ({
    name,
    description: prop?.description,
    required: required2.includes(name)
  }));
}
__name(promptArgumentsFromStandardSchema, "promptArgumentsFromStandardSchema");
function isJsonObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
__name(isJsonObject, "isJsonObject");
function convertStandardElicitationSchema(schema) {
  try {
    return standardSchemaToJsonSchema(schema, "input");
  } catch (error2) {
    const detail = error2 instanceof Error ? error2.message : String(error2);
    throw new ProtocolError(ProtocolErrorCode.InvalidParams, `Elicitation requestedSchema must describe an object with flat primitive properties: ${detail}`);
  }
}
__name(convertStandardElicitationSchema, "convertStandardElicitationSchema");
var ANNOTATION_ONLY_JSON_SCHEMA_KEYWORDS = /* @__PURE__ */ new Set([
  "$comment",
  "deprecated",
  "description",
  "examples",
  "readOnly",
  "title",
  "writeOnly"
]);
function isAnnotationOnlyJsonSchemaKeyword(key) {
  return ANNOTATION_ONLY_JSON_SCHEMA_KEYWORDS.has(key) || key.startsWith("x-");
}
__name(isAnnotationOnlyJsonSchemaKeyword, "isAnnotationOnlyJsonSchemaKeyword");
var ROOT_KEYS = /* @__PURE__ */ new Set(["$schema", ...Object.keys(ElicitRequestFormParamsSchema.shape.requestedSchema.shape)]);
var PROPERTY_KEYS_BY_TYPE = {
  string: shapeKeys([
    StringSchemaSchema,
    UntitledSingleSelectEnumSchemaSchema,
    TitledSingleSelectEnumSchemaSchema,
    LegacyTitledEnumSchemaSchema
  ]),
  number: shapeKeys([NumberSchemaSchema]),
  integer: shapeKeys([NumberSchemaSchema]),
  boolean: shapeKeys([BooleanSchemaSchema]),
  array: shapeKeys([UntitledMultiSelectEnumSchemaSchema, TitledMultiSelectEnumSchemaSchema])
};
var SUPPORTED_STRING_FORMATS = new Set(StringSchemaSchema.shape.format.unwrap().options);
function walkProperty(node2, path, vendor, unsupported) {
  if (!isJsonObject(node2)) return node2;
  const allowedKeys = typeof node2.type === "string" && Object.hasOwn(PROPERTY_KEYS_BY_TYPE, node2.type) ? PROPERTY_KEYS_BY_TYPE[node2.type] : void 0;
  if (allowedKeys === void 0) return node2;
  const pruned = {};
  for (const [key, value] of Object.entries(node2)) if (allowedKeys.has(key) || isAnnotationOnlyJsonSchemaKeyword(key)) pruned[key] = value;
  else if (key === "pattern" && node2.type === "string" && typeof node2.format === "string") {
    if (!SUPPORTED_STRING_FORMATS.has(node2.format)) pruned[key] = value;
    else if (typeof value !== "string" || !isLibraryFormatPattern(node2.format, value, vendor)) unsupported.push(`${path}.${key}`);
  } else unsupported.push(`${path}.${key}`);
  return pruned;
}
__name(walkProperty, "walkProperty");
function walkRequestedSchema(converted, vendor) {
  const pruned = {};
  const unsupported = [];
  for (const [key, value] of Object.entries(converted)) if (key === "properties" && isJsonObject(value)) pruned[key] = Object.fromEntries(Object.entries(value).map(([name, node2]) => [name, walkProperty(node2, `properties.${name}`, vendor, unsupported)]));
  else if (ROOT_KEYS.has(key)) pruned[key] = value;
  else if (!isAnnotationOnlyJsonSchemaKeyword(key)) unsupported.push(key);
  if (unsupported.length > 0) throw new ProtocolError(ProtocolErrorCode.InvalidParams, `Elicitation requestedSchema contains unsupported JSON Schema constraint(s) after Standard Schema conversion: ${unsupported.join(", ")}`);
  return pruned;
}
__name(walkRequestedSchema, "walkRequestedSchema");
function describeUnsupportedProperties(pruned, fallback) {
  if (!isJsonObject(pruned.properties)) return fallback;
  const offenders = Object.entries(pruned.properties).filter(([, node2]) => !parseSchema(PrimitiveSchemaDefinitionSchema, node2).success).map(([name]) => `properties.${name}`);
  return offenders.length > 0 ? offenders.join(", ") : fallback;
}
__name(describeUnsupportedProperties, "describeUnsupportedProperties");
function findDroppedConstraintPaths(original, parsed, path = "") {
  if (Array.isArray(original) && Array.isArray(parsed)) return original.flatMap((item, index) => findDroppedConstraintPaths(item, parsed[index], `${path}[${index}]`));
  if (!isJsonObject(original) || !isJsonObject(parsed)) return [];
  return Object.entries(original).flatMap(([key, value]) => {
    const childPath = path ? `${path}.${key}` : key;
    if (!Object.prototype.hasOwnProperty.call(parsed, key)) return isAnnotationOnlyJsonSchemaKeyword(key) ? [] : [childPath];
    return findDroppedConstraintPaths(value, parsed[key], childPath);
  });
}
__name(findDroppedConstraintPaths, "findDroppedConstraintPaths");
function normalizeElicitInputParams(input) {
  if (!isStandardSchema(input.requestedSchema)) return {
    ...input,
    mode: "form",
    requestedSchema: input.requestedSchema
  };
  const vendor = input.requestedSchema["~standard"].vendor;
  const pruned = walkRequestedSchema(convertStandardElicitationSchema(input.requestedSchema), vendor);
  const parsed = parseSchema(ElicitRequestFormParamsSchema.shape.requestedSchema, pruned);
  if (!parsed.success) throw new ProtocolError(ProtocolErrorCode.InvalidParams, `Elicitation requestedSchema only supports flat primitive properties (string, number, integer, boolean, and string enums): ${describeUnsupportedProperties(pruned, parsed.error.message)}`);
  const droppedConstraints = findDroppedConstraintPaths(pruned, parsed.data);
  if (droppedConstraints.length > 0) throw new ProtocolError(ProtocolErrorCode.InvalidParams, `Elicitation requestedSchema contains unsupported JSON Schema constraint(s) after Standard Schema conversion: ${droppedConstraints.join(", ")}`);
  const danglingRequired = (parsed.data.required ?? []).filter((key) => !Object.prototype.hasOwnProperty.call(parsed.data.properties, key));
  if (danglingRequired.length > 0) throw new ProtocolError(ProtocolErrorCode.InvalidParams, `Elicitation requestedSchema lists required properties that are not defined in properties: ${danglingRequired.join(", ")}`);
  return {
    ...input,
    mode: "form",
    requestedSchema: parsed.data
  };
}
__name(normalizeElicitInputParams, "normalizeElicitInputParams");
function buildInputRequired(spec) {
  const hasInputRequests = spec.inputRequests !== void 0 && Object.keys(spec.inputRequests).length > 0;
  const hasRequestState = typeof spec.requestState === "string";
  if (!hasInputRequests && !hasRequestState) throw new TypeError("inputRequired() requires at least one of inputRequests (with at least one entry) or requestState (spec: every InputRequiredResult MUST include at least one of the two)");
  return {
    resultType: "input_required",
    ...spec.inputRequests !== void 0 && { inputRequests: spec.inputRequests },
    ...spec.requestState !== void 0 && { requestState: spec.requestState }
  };
}
__name(buildInputRequired, "buildInputRequired");
var inputRequired = Object.assign(buildInputRequired, {
  elicit(params) {
    try {
      return {
        method: "elicitation/create",
        params: normalizeElicitInputParams(params)
      };
    } catch (error2) {
      throw error2 instanceof ProtocolError ? new TypeError(error2.message, { cause: error2 }) : error2;
    }
  },
  elicitUrl(params) {
    return {
      method: "elicitation/create",
      params: {
        ...params,
        mode: "url"
      }
    };
  },
  createMessage(params) {
    return {
      method: "sampling/createMessage",
      params
    };
  },
  listRoots() {
    return { method: "roots/list" };
  }
});
var REQUEST_STATE_ONLY_LEG_PACING_MS = 250;
function inputRequiredRoundsExceededMessage(method, maxRounds) {
  return `Multi-round-trip request '${method}' still required input after ${maxRounds} rounds (inputRequired.maxRounds)`;
}
__name(inputRequiredRoundsExceededMessage, "inputRequiredRoundsExceededMessage");
function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason instanceof SdkError ? signal.reason : new SdkError(SdkErrorCode.RequestTimeout, String(signal.reason)));
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = /* @__PURE__ */ __name(() => {
      clearTimeout(timer);
      reject(signal?.reason instanceof SdkError ? signal.reason : new SdkError(SdkErrorCode.RequestTimeout, String(signal?.reason)));
    }, "onAbort");
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}
__name(sleep, "sleep");
function linkedRoundAbort(outer) {
  const controller = new AbortController();
  const onOuterAbort = /* @__PURE__ */ __name(() => controller.abort(outer?.reason), "onOuterAbort");
  outer?.addEventListener("abort", onOuterAbort, { once: true });
  if (outer?.aborted) controller.abort(outer.reason);
  return {
    signal: controller.signal,
    abort: /* @__PURE__ */ __name((reason) => controller.abort(reason), "abort"),
    dispose: /* @__PURE__ */ __name(() => outer?.removeEventListener("abort", onOuterAbort), "dispose")
  };
}
__name(linkedRoundAbort, "linkedRoundAbort");
var SPEC_SCHEMA_KEYS = [
  "AnnotationsSchema",
  "AudioContentSchema",
  "BaseMetadataSchema",
  "BlobResourceContentsSchema",
  "BooleanSchemaSchema",
  "CallToolRequestSchema",
  "CallToolRequestParamsSchema",
  "CallToolResultSchema",
  "CancelledNotificationSchema",
  "CancelledNotificationParamsSchema",
  "CancelTaskRequestSchema",
  "CancelTaskResultSchema",
  "ClientCapabilitiesSchema",
  "ClientNotificationSchema",
  "ClientRequestSchema",
  "ClientResultSchema",
  "CompatibilityCallToolResultSchema",
  "CompleteRequestSchema",
  "CompleteRequestParamsSchema",
  "CompleteResultSchema",
  "ContentBlockSchema",
  "CreateMessageRequestSchema",
  "CreateMessageRequestParamsSchema",
  "CreateMessageResultSchema",
  "CreateMessageResultWithToolsSchema",
  "CreateTaskResultSchema",
  "CursorSchema",
  "DiscoverRequestSchema",
  "DiscoverResultSchema",
  "ElicitationCompleteNotificationSchema",
  "ElicitationCompleteNotificationParamsSchema",
  "ElicitRequestSchema",
  "ElicitRequestFormParamsSchema",
  "ElicitRequestParamsSchema",
  "ElicitRequestURLParamsSchema",
  "ElicitResultSchema",
  "EmbeddedResourceSchema",
  "EmptyResultSchema",
  "EnumSchemaSchema",
  "GetPromptRequestSchema",
  "GetPromptRequestParamsSchema",
  "GetPromptResultSchema",
  "GetTaskPayloadRequestSchema",
  "GetTaskPayloadResultSchema",
  "GetTaskRequestSchema",
  "GetTaskResultSchema",
  "IconSchema",
  "IconsSchema",
  "ImageContentSchema",
  "ImplementationSchema",
  "InitializedNotificationSchema",
  "InitializeRequestSchema",
  "InitializeRequestParamsSchema",
  "InitializeResultSchema",
  "JSONArraySchema",
  "JSONObjectSchema",
  "JSONRPCErrorResponseSchema",
  "JSONRPCMessageSchema",
  "JSONRPCNotificationSchema",
  "JSONRPCRequestSchema",
  "JSONRPCResponseSchema",
  "JSONRPCResultResponseSchema",
  "JSONValueSchema",
  "LegacyTitledEnumSchemaSchema",
  "ListPromptsRequestSchema",
  "ListPromptsResultSchema",
  "ListResourcesRequestSchema",
  "ListResourcesResultSchema",
  "ListResourceTemplatesRequestSchema",
  "ListResourceTemplatesResultSchema",
  "ListRootsRequestSchema",
  "ListRootsResultSchema",
  "ListTasksRequestSchema",
  "ListTasksResultSchema",
  "ListToolsRequestSchema",
  "ListToolsResultSchema",
  "LoggingLevelSchema",
  "LoggingMessageNotificationSchema",
  "LoggingMessageNotificationParamsSchema",
  "ModelHintSchema",
  "ModelPreferencesSchema",
  "MultiSelectEnumSchemaSchema",
  "NotificationSchema",
  "NumberSchemaSchema",
  "PaginatedRequestSchema",
  "PaginatedRequestParamsSchema",
  "PaginatedResultSchema",
  "PingRequestSchema",
  "PrimitiveSchemaDefinitionSchema",
  "ProgressSchema",
  "ProgressNotificationSchema",
  "ProgressNotificationParamsSchema",
  "ProgressTokenSchema",
  "PromptSchema",
  "PromptArgumentSchema",
  "PromptListChangedNotificationSchema",
  "PromptMessageSchema",
  "PromptReferenceSchema",
  "ReadResourceRequestSchema",
  "ReadResourceRequestParamsSchema",
  "ReadResourceResultSchema",
  "RelatedTaskMetadataSchema",
  "RequestSchema",
  "RequestIdSchema",
  "RequestMetaSchema",
  "ResourceSchema",
  "ResourceContentsSchema",
  "ResourceLinkSchema",
  "ResourceListChangedNotificationSchema",
  "ResourceRequestParamsSchema",
  "ResourceTemplateSchema",
  "ResourceTemplateReferenceSchema",
  "ResourceUpdatedNotificationSchema",
  "ResourceUpdatedNotificationParamsSchema",
  "ResultMetaObjectSchema",
  "ResultSchema",
  "RoleSchema",
  "RootSchema",
  "RootsListChangedNotificationSchema",
  "SamplingContentSchema",
  "SamplingMessageSchema",
  "SamplingMessageContentBlockSchema",
  "ServerCapabilitiesSchema",
  "ServerNotificationSchema",
  "ServerRequestSchema",
  "ServerResultSchema",
  "SetLevelRequestSchema",
  "SetLevelRequestParamsSchema",
  "SingleSelectEnumSchemaSchema",
  "StringSchemaSchema",
  "SubscribeRequestSchema",
  "SubscribeRequestParamsSchema",
  "SubscriptionFilterSchema",
  "SubscriptionsAcknowledgedNotificationSchema",
  "SubscriptionsAcknowledgedNotificationParamsSchema",
  "SubscriptionsListenRequestSchema",
  "SubscriptionsListenRequestParamsSchema",
  "SubscriptionsListenResultSchema",
  "SubscriptionsListenResultMetaSchema",
  "TaskAugmentedRequestParamsSchema",
  "TaskCreationParamsSchema",
  "TaskMetadataSchema",
  "TaskSchema",
  "TaskStatusSchema",
  "TaskStatusNotificationSchema",
  "TaskStatusNotificationParamsSchema",
  "TextContentSchema",
  "TextResourceContentsSchema",
  "TitledMultiSelectEnumSchemaSchema",
  "TitledSingleSelectEnumSchemaSchema",
  "ToolSchema",
  "ToolAnnotationsSchema",
  "ToolChoiceSchema",
  "ToolExecutionSchema",
  "ToolListChangedNotificationSchema",
  "ToolResultContentSchema",
  "ToolUseContentSchema",
  "UnsubscribeRequestSchema",
  "UnsubscribeRequestParamsSchema",
  "UntitledMultiSelectEnumSchemaSchema",
  "UntitledSingleSelectEnumSchemaSchema"
];
var authSchemas = {
  IdJagTokenExchangeResponseSchema,
  OAuthClientInformationFullSchema,
  OAuthClientInformationSchema,
  OAuthClientMetadataSchema,
  OAuthClientRegistrationErrorSchema,
  OAuthErrorResponseSchema,
  OAuthMetadataSchema,
  OAuthProtectedResourceMetadataSchema,
  OAuthTokenRevocationRequestSchema,
  OAuthTokensSchema,
  OpenIdProviderDiscoveryMetadataSchema,
  OpenIdProviderMetadataSchema
};
var _specTypeSchemas = {};
var _isSpecType = {};
function register(key, schema) {
  const name = key.slice(0, -6);
  _specTypeSchemas[name] = schema;
  _isSpecType[name] = (v) => schema.safeParse(v).success;
}
__name(register, "register");
for (const key of SPEC_SCHEMA_KEYS) register(key, schemas_exports2[key]);
for (const [key, schema] of Object.entries(authSchemas)) register(key, schema);
var specTypeSchemas = Object.freeze(_specTypeSchemas);
var isSpecType = Object.freeze(_isSpecType);
function bootstrapOutboundCodec(method) {
  switch (method) {
    case "initialize":
    case "notifications/initialized":
      return codecForVersion(void 0);
    case "server/discover":
      return codecForVersion(MODERN_WIRE_REVISION);
    default:
      return;
  }
}
__name(bootstrapOutboundCodec, "bootstrapOutboundCodec");
var DEFAULT_REQUEST_TIMEOUT_MSEC = 6e4;
var RESERVED_ENVELOPE_META_KEYS = [
  PROTOCOL_VERSION_META_KEY,
  CLIENT_INFO_META_KEY,
  CLIENT_CAPABILITIES_META_KEY,
  LOG_LEVEL_META_KEY
];
var RETRY_PARAMS_KEYS = ["inputResponses", "requestState"];
function liftWireOnlyMaterial(message, kind) {
  const params = message.params;
  if (!isPlainObject$1(params)) return {
    message,
    lifted: {}
  };
  const meta2 = params._meta;
  const envelopeKeys = isPlainObject$1(meta2) ? RESERVED_ENVELOPE_META_KEYS.filter((key) => key in meta2) : [];
  const retryKeys = kind === "request" ? RETRY_PARAMS_KEYS.filter((key) => key in params) : [];
  if (envelopeKeys.length === 0 && retryKeys.length === 0) return {
    message,
    lifted: {}
  };
  const lifted = {};
  const nextParams = { ...params };
  if (envelopeKeys.length > 0 && isPlainObject$1(meta2)) {
    const envelope = {};
    const nextMeta = { ...meta2 };
    for (const key of envelopeKeys) {
      envelope[key] = meta2[key];
      delete nextMeta[key];
    }
    lifted.envelope = envelope;
    if (Object.keys(nextMeta).length > 0) nextParams._meta = nextMeta;
    else delete nextParams._meta;
  }
  for (const key of retryKeys) {
    if (key === "inputResponses") lifted.inputResponses = nextParams[key];
    if (key === "requestState") lifted.requestState = nextParams[key];
    delete nextParams[key];
  }
  return {
    message: {
      ...message,
      params: nextParams
    },
    lifted
  };
}
__name(liftWireOnlyMaterial, "liftWireOnlyMaterial");
function codecResultValidator(codec, method) {
  const probe = codec.validateResult(method, void 0);
  if (!probe.ok && probe.reason === "not-in-era") return void 0;
  return { "~standard": {
    version: 1,
    vendor: "mcp-wire-codec",
    validate(value) {
      const outcome = codec.validateResult(method, value);
      if (outcome.ok) return { value: outcome.value };
      return { issues: [{ message: outcome.reason === "invalid" ? outcome.message : `not-in-era: ${method}` }] };
    }
  } };
}
__name(codecResultValidator, "codecResultValidator");
function requestStateAccessor(value) {
  return () => value;
}
__name(requestStateAccessor, "requestStateAccessor");
var NO_REQUEST_STATE = requestStateAccessor(void 0);
function withRequestStateValue(ctx, value) {
  return {
    ...ctx,
    mcpReq: {
      ...ctx.mcpReq,
      requestState: requestStateAccessor(value)
    }
  };
}
__name(withRequestStateValue, "withRequestStateValue");
var writeNegotiatedProtocolVersion;
function setNegotiatedProtocolVersion(instance, version3) {
  writeNegotiatedProtocolVersion(instance, version3);
}
__name(setNegotiatedProtocolVersion, "setNegotiatedProtocolVersion");
var Protocol = class {
  static {
    __name(this, "Protocol");
  }
  _transport;
  _requestMessageId = 0;
  _requestHandlers = /* @__PURE__ */ new Map();
  /** Methods registered with an explicit schema; the era gate in `_onrequest` reads it for the Tasks extension names. */
  _customSchemaRequestMethods = /* @__PURE__ */ new Set();
  _requestHandlerAbortControllers = /* @__PURE__ */ new Map();
  _notificationHandlers = /* @__PURE__ */ new Map();
  _responseHandlers = /* @__PURE__ */ new Map();
  _progressHandlers = /* @__PURE__ */ new Map();
  _timeoutInfo = /* @__PURE__ */ new Map();
  _pendingDebouncedNotifications = /* @__PURE__ */ new Set();
  /**
  * The protocol version negotiated for the current connection (`undefined`
  * before negotiation completes), which determines the wire era this
  * instance speaks. Set by the SDK's negotiation and initialize paths
  * (`Client.connect`, `Server._oninitialize`).
  */
  _negotiatedProtocolVersion;
  static {
    writeNegotiatedProtocolVersion = /* @__PURE__ */ __name((instance, version3) => {
      instance._negotiatedProtocolVersion = version3;
    }, "writeNegotiatedProtocolVersion");
  }
  _supportedProtocolVersions;
  /**
  * Callback for when the connection is closed for any reason.
  *
  * This is invoked when {@linkcode Protocol.close | close()} is called as well.
  */
  onclose;
  /**
  * Callback for when an error occurs.
  *
  * Note that errors are not necessarily fatal; they are used for reporting any kind of exceptional condition out of band.
  */
  onerror;
  /**
  * A handler to invoke for any request types that do not have their own handler installed.
  */
  fallbackRequestHandler;
  /**
  * A handler to invoke for any notification types that do not have their own handler installed.
  */
  fallbackNotificationHandler;
  constructor(_options) {
    this._options = _options;
    this._supportedProtocolVersions = _options?.supportedProtocolVersions ?? SUPPORTED_PROTOCOL_VERSIONS;
    this.setNotificationHandler("notifications/cancelled", (notification) => {
      this._oncancel(notification);
    });
    this.setNotificationHandler("notifications/progress", (notification) => {
      this._onprogress(notification);
    });
    this.setRequestHandler("ping", (_request) => ({}));
  }
  /**
  * Drop consult for inbound messages whose transport did not classify them
  * at the edge — long-lived channels such as stdio, where a role class may
  * need to decline traffic the negotiated era has no answer for (the
  * client-side inbound-request drop on modern-era connections: the
  * 2026-07-28 era has no server→client request channel, and on stdio the
  * client must never write JSON-RPC responses).
  *
  * Consulted ONLY when the transport supplied no
  * {@linkcode MessageExtraInfo.classification}: edge-classified traffic
  * never reaches the hook. Returning `'drop'` discards the message without
  * writing any response (requests are surfaced via `onerror`). The base
  * implementation returns `undefined`: unclassified traffic keeps today's
  * dispatch path unchanged. Era selection never happens here — era is
  * instance state, owned by the serving entry that constructed and
  * connected the instance.
  */
  _shouldDropInbound(_message) {
  }
  /**
  * The per-request `_meta` envelope this instance attaches to every outgoing
  * request and notification, when one applies. The base implementation
  * returns `undefined` (no envelope — the 2025-era posture, so legacy-era
  * outbound traffic is byte-identical to a build without this seam).
  * `Client` overrides it on a connection that negotiated a modern (2026-07-28+)
  * era to return the reserved protocol-version / client-info /
  * client-capabilities keys. User-supplied `_meta` keys take precedence over
  * the auto-attached ones.
  */
  _outboundMetaEnvelope() {
  }
  /**
  * Attach this instance's outbound `_meta` envelope (when one is configured)
  * to a request or notification. A no-op when the seam returns `undefined`
  * — the message returns by reference, so the legacy-era wire stays
  * byte-identical. User-supplied `_meta` keys are spread last so they win
  * over the auto-attached envelope keys.
  */
  _envelopeOutbound(message) {
    const envelope = this._outboundMetaEnvelope();
    if (envelope === void 0) return message;
    const params = message.params ?? {};
    return {
      ...message,
      params: {
        ...params,
        _meta: {
          ...envelope,
          ...params._meta
        }
      }
    };
  }
  /**
  * Extension point for non-`complete` decoded results in the response
  * funnel: a result the wire codec discriminated into a kind other than
  * `'complete'` or `'invalid'` is handed here for the role class to
  * resolve. The base default surfaces it as a typed
  * {@linkcode SdkErrorCode.UnsupportedResultType} error (no retry).
  *
  * Intended consumers (named so the seam stays accountable):
  * - the `Client`'s multi-round-trip auto-fulfilment engine, which fulfils
  *   `'input_required'` results through the registered
  *   elicitation/sampling/roots handlers and retries via `flow.retry`;
  * - a future client-side terminal-result handler for
  *   `subscriptions/listen`, when the spec defines one.
  *
  * `Server` instances never receive `input_required` responses on their
  * outbound legs and leave the base behavior in place.
  */
  _resolveNonCompleteResult(decoded, flow) {
    return Promise.reject(new SdkError(SdkErrorCode.UnsupportedResultType, `Unsupported result type '${decoded.kind}' for ${flow.request.method}`, {
      resultType: decoded.kind,
      method: flow.request.method
    }));
  }
  /**
  * Protected accessor for a registered request handler. Used by role
  * classes that dispatch synthesized requests through the same stored
  * handler chain (e.g. the `Client` fulfilling an embedded multi-round-trip
  * input request).
  */
  _getRequestHandler(method) {
    return this._requestHandlers.get(method);
  }
  async _oncancel(notification) {
    if (notification.params.requestId === void 0) return;
    this._requestHandlerAbortControllers.get(notification.params.requestId)?.abort(notification.params.reason);
  }
  _setupTimeout(messageId, timeout, maxTotalTimeout, onTimeout, resetTimeoutOnProgress = false) {
    this._timeoutInfo.set(messageId, {
      timeoutId: setTimeout(onTimeout, timeout),
      startTime: Date.now(),
      timeout,
      maxTotalTimeout,
      resetTimeoutOnProgress,
      onTimeout
    });
  }
  _resetTimeout(messageId) {
    const info = this._timeoutInfo.get(messageId);
    if (!info) return false;
    const totalElapsed = Date.now() - info.startTime;
    if (info.maxTotalTimeout && totalElapsed >= info.maxTotalTimeout) {
      this._timeoutInfo.delete(messageId);
      throw new SdkError(SdkErrorCode.RequestTimeout, "Maximum total timeout exceeded", {
        maxTotalTimeout: info.maxTotalTimeout,
        totalElapsed
      });
    }
    clearTimeout(info.timeoutId);
    info.timeoutId = setTimeout(info.onTimeout, info.timeout);
    return true;
  }
  _cleanupTimeout(messageId) {
    const info = this._timeoutInfo.get(messageId);
    if (info) {
      clearTimeout(info.timeoutId);
      this._timeoutInfo.delete(messageId);
    }
  }
  /**
  * Attaches to the given transport, starts it, and starts listening for messages.
  *
  * The caller assumes ownership of the {@linkcode Transport}, replacing any callbacks that have already been set, and expects that it is the only user of the {@linkcode Transport} instance going forward.
  */
  async connect(transport) {
    this._transport = transport;
    const _onclose = this.transport?.onclose;
    this._transport.onclose = () => {
      try {
        _onclose?.();
      } finally {
        this._onclose();
      }
    };
    const _onerror = this.transport?.onerror;
    this._transport.onerror = (error2) => {
      _onerror?.(error2);
      this._onerror(error2);
    };
    const _onmessage = this._transport?.onmessage;
    this._transport.onmessage = (message, extra) => {
      _onmessage?.(message, extra);
      if (isJSONRPCResultResponse(message) || isJSONRPCErrorResponse(message)) this._onresponse(message);
      else if (isJSONRPCRequest(message)) this._onrequest(message, extra);
      else if (isJSONRPCNotification(message)) this._onnotification(message, extra);
      else this._onerror(/* @__PURE__ */ new Error(`Unknown message type: ${JSON.stringify(message)}`));
    };
    transport.setSupportedProtocolVersions?.(this._supportedProtocolVersions);
    await this._transport.start();
  }
  /**
  * Transport-close hook. Subclass overrides MUST call `super._onclose()`
  * after their own cleanup — base teardown (response-handler settlement,
  * timeout clearing, in-flight request abort) does not run otherwise.
  */
  _onclose() {
    const responseHandlers = this._responseHandlers;
    this._responseHandlers = /* @__PURE__ */ new Map();
    this._progressHandlers.clear();
    this._pendingDebouncedNotifications.clear();
    for (const info of this._timeoutInfo.values()) clearTimeout(info.timeoutId);
    this._timeoutInfo.clear();
    const requestHandlerAbortControllers = this._requestHandlerAbortControllers;
    this._requestHandlerAbortControllers = /* @__PURE__ */ new Map();
    const error2 = new SdkError(SdkErrorCode.ConnectionClosed, "Connection closed");
    this._transport = void 0;
    try {
      this.onclose?.();
    } finally {
      for (const handler of responseHandlers.values()) handler(error2);
      for (const controller of requestHandlerAbortControllers.values()) controller.abort(error2);
    }
  }
  _onerror(error2) {
    this.onerror?.(error2);
  }
  /**
  * Inbound-notification dispatch. Subclass overrides MUST delegate
  * unmatched traffic to `super._onnotification(rawNotification, extra)` —
  * an override that consumes only what it owns and falls through to base
  * dispatch for everything else.
  */
  _onnotification(rawNotification, extra) {
    const { message: notification } = liftWireOnlyMaterial(rawNotification, "notification");
    const codec = this._negotiatedWireCodec();
    if (extra?.classification === void 0 && this._shouldDropInbound(rawNotification) === "drop") return;
    if (extra?.classification !== void 0) {
      const classified = classifiedWireEra(extra.classification);
      if (classified !== codec.era) {
        this._onerror(/* @__PURE__ */ new Error(`Era mismatch on inbound notification '${notification.method}': classified as ${classified} but this instance serves ${codec.era}`));
        return;
      }
    }
    if (isSpecNotificationMethod(notification.method) && !codec.hasNotificationMethod(notification.method)) return;
    const handler = this._notificationHandlers.get(notification.method);
    const fallback = this.fallbackNotificationHandler;
    if (handler === void 0 && fallback === void 0) return;
    Promise.resolve().then(() => handler === void 0 ? fallback(notification) : handler(notification, codec)).catch((error2) => this._onerror(/* @__PURE__ */ new Error(`Uncaught error in notification handler: ${error2}`)));
  }
  _onrequest(rawRequest, extra) {
    const { message: request, lifted } = liftWireOnlyMaterial(rawRequest, "request");
    const codec = this._negotiatedWireCodec();
    if (extra?.classification === void 0 && this._shouldDropInbound(rawRequest) === "drop") {
      this._onerror(/* @__PURE__ */ new Error(`Dropped inbound request '${rawRequest.method}': not servable on this connection's protocol era`));
      return;
    }
    const capturedTransport = this._transport;
    const sendErrorResponse = /* @__PURE__ */ __name((code, message, data) => {
      const errorResponse = {
        jsonrpc: "2.0",
        id: request.id,
        error: {
          code,
          message,
          ...data !== void 0 && { data }
        }
      };
      capturedTransport?.send(errorResponse).catch((error2) => this._onerror(/* @__PURE__ */ new Error(`Failed to send an error response: ${error2}`)));
    }, "sendErrorResponse");
    if (extra?.classification !== void 0) {
      const classified = classifiedWireEra(extra.classification);
      if (classified !== codec.era) {
        this._onerror(/* @__PURE__ */ new Error(`Era mismatch on inbound request '${request.method}': classified as ${classified} but this instance serves ${codec.era}`));
        const requested = extra.classification.revision ?? classified;
        sendErrorResponse(ProtocolErrorCode.UnsupportedProtocolVersion, `Unsupported protocol version: ${requested}`, {
          supported: this._supportedProtocolVersions,
          requested
        });
        return;
      }
    }
    if (isSpecRequestMethod(request.method) && !codec.hasRequestMethod(request.method) && !(isExtensionReusedRequestMethod(request.method) && this._customSchemaRequestMethods.has(request.method))) {
      sendErrorResponse(ProtocolErrorCode.MethodNotFound, "Method not found");
      return;
    }
    const handler = this._requestHandlers.get(request.method) ?? this.fallbackRequestHandler;
    if (handler === void 0) {
      sendErrorResponse(ProtocolErrorCode.MethodNotFound, "Method not found");
      return;
    }
    const envelopeError = codec.checkInboundEnvelope(lifted);
    if (envelopeError !== void 0) {
      sendErrorResponse(ProtocolErrorCode.InvalidParams, envelopeError);
      return;
    }
    const sendNotification = /* @__PURE__ */ __name((notification, options) => this._notificationViaCodec(this._resolveOutboundCodec(notification.method), notification, {
      ...options,
      relatedRequestId: request.id
    }), "sendNotification");
    const sendRequest = /* @__PURE__ */ __name((r, resultSchema, options) => this._requestWithSchemaViaCodec(this._resolveOutboundCodec(r.method), r, resultSchema, {
      ...options,
      relatedRequestId: request.id
    }), "sendRequest");
    const abortController = new AbortController();
    this._requestHandlerAbortControllers.set(request.id, abortController);
    const partitionedInputResponses = lifted.inputResponses === void 0 ? void 0 : partitionInputResponses(lifted.inputResponses);
    const baseCtx = {
      sessionId: capturedTransport?.sessionId,
      mcpReq: {
        id: request.id,
        method: request.method,
        _meta: request.params?._meta,
        ...lifted.envelope !== void 0 && { envelope: lifted.envelope },
        ...partitionedInputResponses !== void 0 && { inputResponses: partitionedInputResponses.accepted },
        ...partitionedInputResponses !== void 0 && partitionedInputResponses.droppedKeys.length > 0 && { droppedInputResponseKeys: partitionedInputResponses.droppedKeys },
        requestState: lifted.requestState === void 0 ? NO_REQUEST_STATE : requestStateAccessor(lifted.requestState),
        signal: abortController.signal,
        send: /* @__PURE__ */ __name(((r, schemaOrOptions, maybeOptions) => {
          const sendCodec = this._resolveOutboundCodec(r.method);
          this._assertOutboundRequestInEra(sendCodec, r.method);
          if (isStandardSchema(schemaOrOptions)) return sendRequest(r, schemaOrOptions, maybeOptions);
          const validate3 = codecResultValidator(sendCodec, r.method);
          if (validate3 === void 0) throw new TypeError(`'${r.method}' is not a spec method; pass a result schema as the second argument to ctx.mcpReq.send().`);
          return sendRequest(r, validate3, schemaOrOptions);
        }), "send"),
        notify: sendNotification
      },
      http: extra?.authInfo ? { authInfo: extra.authInfo } : void 0
    };
    const ctx = this.buildContext(baseCtx, extra);
    Promise.resolve().then(() => handler(request, ctx)).then(async (result) => {
      if (abortController.signal.aborted) return;
      let encoded;
      try {
        encoded = codec.encodeResult(request.method, result, this._outboundServerInfo());
      } catch (error2) {
        this._onerror(/* @__PURE__ */ new Error(`Failed to encode result for ${request.method}: ${error2}`));
        sendErrorResponse(ProtocolErrorCode.InternalError, "Internal error");
        return;
      }
      const response = {
        result: encoded,
        jsonrpc: "2.0",
        id: request.id
      };
      await capturedTransport?.send(response);
    }, async (error2) => {
      if (abortController.signal.aborted) return;
      const thrownCode = Number.isSafeInteger(error2["code"]) ? error2["code"] : ProtocolErrorCode.InternalError;
      const errorResponse = {
        jsonrpc: "2.0",
        id: request.id,
        error: {
          code: codec.encodeErrorCode(thrownCode),
          message: error2.message ?? "Internal error",
          ...error2["data"] !== void 0 && { data: error2["data"] }
        }
      };
      await capturedTransport?.send(errorResponse);
    }).catch((error2) => this._onerror(/* @__PURE__ */ new Error(`Failed to send response: ${error2}`))).finally(() => {
      if (this._requestHandlerAbortControllers.get(request.id) === abortController) this._requestHandlerAbortControllers.delete(request.id);
    });
  }
  _onprogress(notification) {
    const { progressToken, ...params } = notification.params;
    const messageId = Number(progressToken);
    const handler = this._progressHandlers.get(messageId);
    if (!handler) {
      this._onerror(/* @__PURE__ */ new Error(`Received a progress notification for an unknown token: ${JSON.stringify(notification)}`));
      return;
    }
    const responseHandler = this._responseHandlers.get(messageId);
    const timeoutInfo = this._timeoutInfo.get(messageId);
    if (timeoutInfo && responseHandler && timeoutInfo.resetTimeoutOnProgress) try {
      this._resetTimeout(messageId);
    } catch (error2) {
      this._responseHandlers.delete(messageId);
      this._progressHandlers.delete(messageId);
      this._cleanupTimeout(messageId);
      responseHandler(error2);
      return;
    }
    handler(params);
  }
  /**
  * Inbound-response dispatch. Subclass overrides MUST delegate unmatched
  * traffic to `super._onresponse(response)` — an override that consumes
  * only what it owns and falls through to base dispatch for everything
  * else.
  */
  _onresponse(response) {
    const messageId = Number(response.id);
    const handler = this._responseHandlers.get(messageId);
    if (handler === void 0) {
      this._onerror(/* @__PURE__ */ new Error(`Received a response for an unknown message ID: ${JSON.stringify(response)}`));
      return;
    }
    this._responseHandlers.delete(messageId);
    this._cleanupTimeout(messageId);
    this._progressHandlers.delete(messageId);
    if (isJSONRPCResultResponse(response)) handler(response);
    else handler(ProtocolError.fromError(response.error.code, response.error.message, response.error.data));
  }
  get transport() {
    return this._transport;
  }
  /**
  * Closes the connection.
  */
  async close() {
    await this._transport?.close();
  }
  request(request, schemaOrOptions, maybeOptions) {
    const codec = this._resolveOutboundCodec(request.method);
    if (isStandardSchema(schemaOrOptions)) {
      if (!isExtensionReusedRequestMethod(request.method)) this._assertOutboundRequestInEra(codec, request.method);
      return this._requestWithSchemaViaCodec(codec, request, schemaOrOptions, maybeOptions);
    }
    this._assertOutboundRequestInEra(codec, request.method);
    const validate3 = codecResultValidator(codec, request.method);
    if (validate3 === void 0) throw new TypeError(`'${request.method}' is not a spec method; pass a result schema as the second argument to request().`);
    return this._requestWithSchemaViaCodec(codec, request, validate3, schemaOrOptions);
  }
  /**
  * The wire codec for this instance's negotiated era — the phase-2 truth:
  * everything an established connection sends and receives resolves
  * through it. Legacy until a version has been negotiated.
  */
  _negotiatedWireCodec() {
    return codecForVersion(this._negotiatedProtocolVersion);
  }
  /**
  * Protected accessor for the instance's negotiated wire codec, for role
  * classes (Client/Server/McpServer) routing era-dependent behavior
  * through the codec's function-only surface — `samplingResultVariant`,
  * `outboundEnvelope`, `projectCallToolResult` — instead of branching on
  * the protocol version themselves.
  */
  _wireCodec() {
    return this._negotiatedWireCodec();
  }
  /**
  * Outbound codec resolution: while the negotiated version is still unset
  * (the negotiation window), lifecycle messages are bootstrap-pinned BY
  * METHOD — they self-identify their era (`initialize` IS the legacy
  * handshake, `server/discover` IS the modern probe). Once a version has
  * been negotiated, the instance era is authoritative for everything — a
  * negotiated session never re-routes a method onto the other era.
  */
  _resolveOutboundCodec(method) {
    if (this._negotiatedProtocolVersion === void 0) {
      const pinned = bootstrapOutboundCodec(method);
      if (pinned) return pinned;
    }
    return this._negotiatedWireCodec();
  }
  /**
  * Era gate for outbound requests — deletions are physical in BOTH
  * directions: sending a spec method that the resolved era does not define
  * dies locally with a typed error before anything reaches the transport.
  * Methods outside the spec universe are consumer-owned extension methods
  * and stay era-blind.
  */
  _assertOutboundRequestInEra(codec, method) {
    if (isSpecRequestMethod(method) && !codec.hasRequestMethod(method)) throw new SdkError(SdkErrorCode.MethodNotSupportedByProtocolVersion, `Method '${method}' is not supported by the negotiated protocol version (wire era ${codec.era})`, {
      method,
      era: codec.era
    });
  }
  /**
  * Sends a request and waits for a response, using the provided schema for
  * validation instead of the era registry's method-keyed entry.
  *
  * This is the internal implementation used by SDK methods whose result
  * schema cannot be expressed as a method-keyed registry entry — the one
  * surviving case is `server.createMessage`, whose result schema depends
  * on the REQUEST params (tools vs no tools) — and by callers passing
  * explicit compatibility schemas. Spec methods are still era-gated here:
  * an explicit schema never smuggles a deleted method onto the wire.
  */
  _requestWithSchema(request, resultSchema, options) {
    const codec = this._resolveOutboundCodec(request.method);
    this._assertOutboundRequestInEra(codec, request.method);
    return this._requestWithSchemaViaCodec(codec, request, resultSchema, options);
  }
  /**
  * The request funnel proper, keyed by the resolved era codec: the codec
  * owns result decoding (raw-first `resultType` discrimination — V-1 —
  * and the era's lift posture) before the schema validation step.
  */
  _requestWithSchemaViaCodec(codec, request, resultSchema, options) {
    const { relatedRequestId, resumptionToken, onresumptiontoken, headers } = options ?? {};
    const flowStartedAt = Date.now();
    let onAbort;
    let cleanupMessageId;
    return new Promise((resolve, reject) => {
      const earlyReject = /* @__PURE__ */ __name((error2) => {
        reject(error2);
      }, "earlyReject");
      if (!this._transport) {
        earlyReject(/* @__PURE__ */ new Error("Not connected"));
        return;
      }
      if (this._options?.enforceStrictCapabilities === true) try {
        this.assertCapabilityForMethod(request.method);
      } catch (error2) {
        earlyReject(error2);
        return;
      }
      if (options?.signal?.aborted) {
        const reason = options.signal.reason;
        throw reason instanceof SdkError ? reason : new SdkError(SdkErrorCode.RequestTimeout, String(reason));
      }
      const requestAbort = codec.era === MODERN_WIRE_REVISION && this._transport.hasPerRequestStream === true ? new AbortController() : void 0;
      const messageId = this._requestMessageId++;
      cleanupMessageId = messageId;
      const jsonrpcRequest = {
        ...request,
        jsonrpc: "2.0",
        id: messageId
      };
      if (options?.onprogress) {
        this._progressHandlers.set(messageId, options.onprogress);
        jsonrpcRequest.params = {
          ...request.params,
          _meta: {
            ...request.params?._meta,
            progressToken: messageId
          }
        };
      }
      const outbound = this._envelopeOutbound(jsonrpcRequest);
      let responseReceived = false;
      const cancel = /* @__PURE__ */ __name((reason) => {
        if (responseReceived) return;
        this._progressHandlers.delete(messageId);
        if (requestAbort === void 0) {
          if (request.method !== "initialize") this._transport?.send(this._envelopeOutbound({
            jsonrpc: "2.0",
            method: "notifications/cancelled",
            params: {
              requestId: messageId,
              reason: String(reason)
            }
          }), {
            relatedRequestId,
            resumptionToken,
            onresumptiontoken
          }).catch((error2) => this._onerror(/* @__PURE__ */ new Error(`Failed to send cancellation: ${error2}`)));
        } else requestAbort.abort();
        reject(reason instanceof SdkError ? reason : new SdkError(SdkErrorCode.RequestTimeout, String(reason)));
      }, "cancel");
      this._responseHandlers.set(messageId, (response) => {
        if (options?.signal?.aborted) return;
        responseReceived = true;
        if (response instanceof Error) return reject(response);
        let decoded;
        try {
          decoded = codec.decodeResult(request.method, response.result);
        } catch (error2) {
          return reject(error2 instanceof Error ? error2 : new Error(String(error2)));
        }
        if (decoded.kind === "invalid") return reject(decoded.error);
        if (decoded.kind === "input_required") {
          if (options?.allowInputRequired === true) return resolve(manualInputRequiredValue(decoded));
          const flow = {
            codec,
            request,
            resultSchema,
            options,
            flowStartedAt,
            retry: /* @__PURE__ */ __name((params, legOptions) => this._requestWithSchemaViaCodec(codec, params === void 0 ? { method: request.method } : {
              method: request.method,
              params
            }, resultSchema, legOptions), "retry")
          };
          return resolve(this._resolveNonCompleteResult(decoded, flow));
        }
        const result = decoded.result;
        validateStandardSchema(resultSchema, result).then((parseResult) => {
          if (parseResult.success) resolve(parseResult.data);
          else reject(new SdkError(SdkErrorCode.InvalidResult, `Invalid result for ${request.method}: ${parseResult.error}`));
        }, reject);
      });
      onAbort = /* @__PURE__ */ __name(() => cancel(options?.signal?.reason), "onAbort");
      options?.signal?.addEventListener("abort", onAbort, { once: true });
      const timeout = options?.timeout ?? DEFAULT_REQUEST_TIMEOUT_MSEC;
      const timeoutHandler = /* @__PURE__ */ __name(() => cancel(new SdkError(SdkErrorCode.RequestTimeout, "Request timed out", { timeout })), "timeoutHandler");
      this._setupTimeout(messageId, timeout, options?.maxTotalTimeout, timeoutHandler, options?.resetTimeoutOnProgress ?? false);
      this._transport.send(outbound, {
        relatedRequestId,
        resumptionToken,
        onresumptiontoken,
        headers,
        requestSignal: requestAbort?.signal
      }).catch((error2) => {
        this._progressHandlers.delete(messageId);
        reject(error2);
      });
    }).finally(() => {
      if (onAbort) options?.signal?.removeEventListener("abort", onAbort);
      if (cleanupMessageId !== void 0) {
        this._responseHandlers.delete(cleanupMessageId);
        this._cleanupTimeout(cleanupMessageId);
      }
    });
  }
  /**
  * Emits a notification, which is a one-way message that does not expect a response.
  */
  async notification(notification, options) {
    return await this._notificationViaCodec(this._resolveOutboundCodec(notification.method), notification, options);
  }
  /**
  * The notification funnel proper, keyed by the resolved era codec —
  * direct sends and related notifications (`ctx.mcpReq.notify`) alike
  * resolve through the instance's negotiated era at send time.
  */
  async _notificationViaCodec(codec, notification, options) {
    if (!this._transport) throw new SdkError(SdkErrorCode.NotConnected, "Not connected");
    if (isSpecNotificationMethod(notification.method) && !codec.hasNotificationMethod(notification.method)) throw new SdkError(SdkErrorCode.MethodNotSupportedByProtocolVersion, `Notification '${notification.method}' is not supported by the negotiated protocol version (wire era ${codec.era})`, {
      method: notification.method,
      era: codec.era
    });
    this.assertNotificationCapability(notification.method);
    const jsonrpcNotification = this._envelopeOutbound({
      jsonrpc: "2.0",
      ...notification
    });
    if ((this._options?.debouncedNotificationMethods ?? []).includes(notification.method) && !notification.params && options?.relatedRequestId === void 0) {
      if (this._pendingDebouncedNotifications.has(notification.method)) return;
      this._pendingDebouncedNotifications.add(notification.method);
      Promise.resolve().then(() => {
        this._pendingDebouncedNotifications.delete(notification.method);
        if (!this._transport) return;
        this._transport?.send(jsonrpcNotification, options).catch((error2) => this._onerror(error2));
      });
      return;
    }
    await this._transport.send(jsonrpcNotification, options);
  }
  setRequestHandler(method, schemasOrHandler, maybeHandler) {
    this.assertRequestHandlerCapability(method);
    let stored;
    if (typeof schemasOrHandler === "function") {
      if (!isSpecRequestMethod(method)) throw new TypeError(`'${method}' is not a spec request method; pass schemas as the second argument to setRequestHandler().`);
      stored = /* @__PURE__ */ __name((request, ctx) => {
        const dispatchCodec = this._negotiatedWireCodec();
        let outcome = dispatchCodec.validateRequest(method, request);
        if (!outcome.ok && outcome.reason === "not-in-era") outcome = dispatchCodec.validateInputRequest(method, request);
        if (!outcome.ok) {
          if (outcome.reason === "not-in-era") throw new ProtocolError(ProtocolErrorCode.InternalError, `No wire schema for ${method} in the resolved era`);
          throw new Error(outcome.message);
        }
        return Promise.resolve(schemasOrHandler(outcome.value, ctx));
      }, "stored");
    } else if (maybeHandler) stored = /* @__PURE__ */ __name(async (request, ctx) => {
      const parsed = await validateStandardSchema(schemasOrHandler.params, { ...request.params });
      if (!parsed.success) throw new ProtocolError(ProtocolErrorCode.InvalidParams, `Invalid params for ${method}: ${parsed.error}`);
      return maybeHandler(parsed.data, ctx);
    }, "stored");
    else throw new TypeError("setRequestHandler: handler is required");
    if (typeof schemasOrHandler === "function") this._customSchemaRequestMethods.delete(method);
    else this._customSchemaRequestMethods.add(method);
    this._requestHandlers.set(method, this._wrapHandler(method, stored));
  }
  /**
  * Hook for subclasses to wrap a registered request handler with role-specific
  * validation or behavior (e.g. `Server` validates `tools/call` results, `Client`
  * validates `elicitation/create` mode and result). Runs for both the 2-arg and
  * 3-arg registration paths. The default implementation is identity.
  *
  * Subclasses overriding this hook avoid redeclaring `setRequestHandler`'s overload set.
  */
  _wrapHandler(_method, handler) {
    return handler;
  }
  /**
  * Hook for subclasses to supply the implementation identity the 2026-era
  * encode seam stamps into outbound result `_meta` under
  * `io.modelcontextprotocol/serverInfo` (spec PR #3002: servers SHOULD
  * identify themselves on every response). The default is `undefined` — no
  * stamp. Only `Server` overrides this: the key identifies the software
  * producing a response, and the 2025-era codec never stamps anything
  * regardless (the never-stamp guarantee).
  */
  _outboundServerInfo() {
  }
  /**
  * Removes the request handler for the given method.
  */
  removeRequestHandler(method) {
    this._requestHandlers.delete(method);
    this._customSchemaRequestMethods.delete(method);
  }
  /**
  * Asserts that a request handler has not already been set for the given method, in preparation for a new one being automatically installed.
  */
  assertCanSetRequestHandler(method) {
    if (this._requestHandlers.has(method)) throw new Error(`A request handler for ${method} already exists, which would be overridden`);
  }
  setNotificationHandler(method, schemasOrHandler, maybeHandler) {
    if (typeof schemasOrHandler === "function") {
      if (!isSpecNotificationMethod(method)) throw new TypeError(`'${method}' is not a spec notification method; pass schemas as the second argument to setNotificationHandler().`);
      this._notificationHandlers.set(method, (notification, codec) => {
        const outcome = codec.validateNotification(method, notification);
        if (!outcome.ok) {
          if (outcome.reason === "not-in-era") throw new ProtocolError(ProtocolErrorCode.InternalError, `No wire schema for ${method} in the resolved era`);
          throw new Error(outcome.message);
        }
        return Promise.resolve(schemasOrHandler(outcome.value));
      });
      return;
    }
    if (!maybeHandler) throw new TypeError("setNotificationHandler: handler is required");
    this._notificationHandlers.set(method, async (notification) => {
      const parsed = await validateStandardSchema(schemasOrHandler.params, { ...notification.params });
      if (!parsed.success) throw new ProtocolError(ProtocolErrorCode.InvalidParams, `Invalid params for notification ${method}: ${parsed.error}`);
      await maybeHandler(parsed.data, notification);
    });
  }
  /**
  * Removes the notification handler for the given method.
  */
  removeNotificationHandler(method) {
    this._notificationHandlers.delete(method);
  }
};
function isPlainObject$1(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
__name(isPlainObject$1, "isPlainObject$1");
function mergeCapabilities(base, additional) {
  const result = { ...base };
  for (const key in additional) {
    const k = key;
    const addValue = additional[k];
    if (addValue === void 0) continue;
    const baseValue = result[k];
    result[k] = isPlainObject$1(baseValue) && isPlainObject$1(addValue) ? {
      ...baseValue,
      ...addValue
    } : addValue;
  }
  return result;
}
__name(mergeCapabilities, "mergeCapabilities");
function isPlainObject2(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
__name(isPlainObject2, "isPlainObject");
function partitionInputResponses(inputResponses) {
  const accepted = {};
  const droppedKeys = [];
  if (!isPlainObject2(inputResponses)) return {
    accepted,
    droppedKeys
  };
  for (const [key, entry] of Object.entries(inputResponses)) {
    if (!isPlainObject2(entry) || "method" in entry || "result" in entry) {
      droppedKeys.push(key);
      continue;
    }
    accepted[key] = entry;
  }
  return {
    accepted,
    droppedKeys
  };
}
__name(partitionInputResponses, "partitionInputResponses");
function manualInputRequiredValue(decoded) {
  return {
    resultType: "input_required",
    inputRequests: decoded.inputRequests,
    ...decoded.requestState !== void 0 && { requestState: decoded.requestState },
    ...decoded._meta !== void 0 && { _meta: decoded._meta }
  };
}
__name(manualInputRequiredValue, "manualInputRequiredValue");
var require_content_type = /* @__PURE__ */ __commonJSMin(((exports) => {
  var PARAM_REGEXP = /; *([!#$%&'*+.^_`|~0-9A-Za-z-]+) *= *("(?:[\u000b\u0020\u0021\u0023-\u005b\u005d-\u007e\u0080-\u00ff]|\\[\u000b\u0020-\u00ff])*"|[!#$%&'*+.^_`|~0-9A-Za-z-]+) */g;
  var QESC_REGEXP = /\\([\u000b\u0020-\u00ff])/g;
  var TYPE_REGEXP = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+\/[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;
  exports.parse = parse2;
  function parse2(string4) {
    if (!string4) throw new TypeError("argument string is required");
    var header = typeof string4 === "object" ? getcontenttype(string4) : string4;
    if (typeof header !== "string") throw new TypeError("argument string is required to be a string");
    var index = header.indexOf(";");
    var type = index !== -1 ? header.slice(0, index).trim() : header.trim();
    if (!TYPE_REGEXP.test(type)) throw new TypeError("invalid media type");
    var obj = new ContentType(type.toLowerCase());
    if (index !== -1) {
      var key;
      var match;
      var value;
      PARAM_REGEXP.lastIndex = index;
      while (match = PARAM_REGEXP.exec(header)) {
        if (match.index !== index) throw new TypeError("invalid parameter format");
        index += match[0].length;
        key = match[1].toLowerCase();
        value = match[2];
        if (value.charCodeAt(0) === 34) {
          value = value.slice(1, -1);
          if (value.indexOf("\\") !== -1) value = value.replace(QESC_REGEXP, "$1");
        }
        obj.parameters[key] = value;
      }
      if (index !== header.length) throw new TypeError("invalid parameter format");
    }
    return obj;
  }
  __name(parse2, "parse");
  function getcontenttype(obj) {
    var header;
    if (typeof obj.getHeader === "function") header = obj.getHeader("content-type");
    else if (typeof obj.headers === "object") header = obj.headers && obj.headers["content-type"];
    if (typeof header !== "string") throw new TypeError("content-type header is missing from object");
    return header;
  }
  __name(getcontenttype, "getcontenttype");
  function ContentType(type) {
    this.parameters = /* @__PURE__ */ Object.create(null);
    this.type = type;
  }
  __name(ContentType, "ContentType");
}));
var import_content_type = /* @__PURE__ */ __toESM(require_content_type(), 1);
function mediaTypeEssence(header) {
  if (!header) return;
  try {
    return import_content_type.parse(header).type;
  } catch {
    const essence = (header.split(";", 1)[0] ?? "").trim().toLowerCase();
    if (essence === "" || header.slice(essence.length).includes(",")) return;
    return essence;
  }
}
__name(mediaTypeEssence, "mediaTypeEssence");
function isJsonContentType(header) {
  if (header === "application/json") return true;
  return mediaTypeEssence(header) === "application/json";
}
__name(isJsonContentType, "isJsonContentType");
var STDIO_DEFAULT_MAX_BUFFER_SIZE = 10 * 1024 * 1024;
var TOOL_NAME_REGEX = /^[A-Za-z0-9._-]{1,128}$/;
function validateToolName(name) {
  const warnings = [];
  if (name.length === 0) return {
    isValid: false,
    warnings: ["Tool name cannot be empty"]
  };
  if (name.length > 128) return {
    isValid: false,
    warnings: [`Tool name exceeds maximum length of 128 characters (current: ${name.length})`]
  };
  if (name.includes(" ")) warnings.push("Tool name contains spaces, which may cause parsing issues");
  if (name.includes(",")) warnings.push("Tool name contains commas, which may cause parsing issues");
  if (name.startsWith("-") || name.endsWith("-")) warnings.push("Tool name starts or ends with a dash, which may cause parsing issues in some contexts");
  if (name.startsWith(".") || name.endsWith(".")) warnings.push("Tool name starts or ends with a dot, which may cause parsing issues in some contexts");
  if (!TOOL_NAME_REGEX.test(name)) {
    const invalidChars = [...name].filter((char) => !/[A-Za-z0-9._-]/.test(char)).filter((char, index, arr) => arr.indexOf(char) === index);
    warnings.push(`Tool name contains invalid characters: ${invalidChars.map((c) => `"${c}"`).join(", ")}`, "Allowed characters are: A-Z, a-z, 0-9, underscore (_), dash (-), and dot (.)");
    return {
      isValid: false,
      warnings
    };
  }
  return {
    isValid: true,
    warnings
  };
}
__name(validateToolName, "validateToolName");
function issueToolNameWarning(name, warnings) {
  if (warnings.length > 0) {
    console.warn(`Tool name validation warning for "${name}":`);
    for (const warning of warnings) console.warn(`  - ${warning}`);
    console.warn("Tool registration will proceed, but this may cause compatibility issues.");
    console.warn("Consider updating the tool name to conform to the MCP tool naming standard.");
    console.warn("See SEP: Specify Format for Tool Names (https://github.com/modelcontextprotocol/modelcontextprotocol/issues/986) for more details.");
  }
}
__name(issueToolNameWarning, "issueToolNameWarning");
function validateAndWarnToolName(name) {
  const result = validateToolName(name);
  issueToolNameWarning(name, result.warnings);
  return result.isValid;
}
__name(validateAndWarnToolName, "validateAndWarnToolName");
function isZodV4Schema(v) {
  return typeof v === "object" && v !== null && "_zod" in v;
}
__name(isZodV4Schema, "isZodV4Schema");
function looksLikeZodV3(v) {
  return typeof v === "object" && v !== null && !("_zod" in v) && "_def" in v && typeof v._def?.typeName === "string";
}
__name(looksLikeZodV3, "looksLikeZodV3");
function isZodRawShape(obj) {
  if (typeof obj !== "object" || obj === null) return false;
  if (isStandardSchema(obj)) return false;
  const proto = Object.getPrototypeOf(obj);
  if (proto !== Object.prototype && proto !== null) return false;
  return Object.values(obj).every((v) => isZodV4Schema(v));
}
__name(isZodRawShape, "isZodRawShape");
function normalizeRawShapeSchema(schema) {
  if (schema === void 0) return void 0;
  if (isZodRawShape(schema)) return object(schema);
  if (typeof schema === "object" && schema !== null && !isStandardSchema(schema) && Object.values(schema).some((v) => looksLikeZodV3(v))) throw new TypeError("Raw-shape inputSchema/outputSchema/argsSchema fields must be Zod v4 schemas. Got a Zod v3 field schema. Import from `zod/v4` (or upgrade your zod import), or wrap with `z.object({...})` yourself.");
  if (!isStandardSchema(schema)) throw new TypeError("inputSchema/outputSchema/argsSchema must be a Standard Schema (e.g. z.object({...})) or a raw Zod shape ({ field: z.string() }).");
  return schema;
}
__name(normalizeRawShapeSchema, "normalizeRawShapeSchema");
function preloadSchemas() {
  buildSchemas2025();
  buildSchemas2026();
  warmRegistryMaps2025();
  warmInputSchemaMaps2026();
  warmWireResultSchemas2026();
}
__name(preloadSchemas, "preloadSchemas");

// ../../node_modules/@modelcontextprotocol/server/dist/cfWorkerProvider-hgYAfIZf.mjs
function deepCompareStrict(a, b) {
  const typeofa = typeof a;
  if (typeofa !== typeof b) return false;
  if (Array.isArray(a)) {
    if (!Array.isArray(b)) return false;
    const length = a.length;
    if (length !== b.length) return false;
    for (let i = 0; i < length; i++) if (!deepCompareStrict(a[i], b[i])) return false;
    return true;
  }
  if (typeofa === "object") {
    if (!a || !b) return a === b;
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    for (const k of aKeys) if (!deepCompareStrict(a[k], b[k])) return false;
    return true;
  }
  return a === b;
}
__name(deepCompareStrict, "deepCompareStrict");
function encodePointer(p) {
  return encodeURI(escapePointer(p));
}
__name(encodePointer, "encodePointer");
function escapePointer(p) {
  return p.replace(/~/g, "~0").replace(/\//g, "~1");
}
__name(escapePointer, "escapePointer");
var schemaArrayKeyword = {
  prefixItems: true,
  items: true,
  allOf: true,
  anyOf: true,
  oneOf: true
};
var schemaMapKeyword = {
  $defs: true,
  definitions: true,
  properties: true,
  patternProperties: true,
  dependentSchemas: true
};
var ignoredKeyword = {
  id: true,
  $id: true,
  $ref: true,
  $schema: true,
  $anchor: true,
  $vocabulary: true,
  $comment: true,
  default: true,
  enum: true,
  const: true,
  required: true,
  type: true,
  maximum: true,
  minimum: true,
  exclusiveMaximum: true,
  exclusiveMinimum: true,
  multipleOf: true,
  maxLength: true,
  minLength: true,
  pattern: true,
  format: true,
  maxItems: true,
  minItems: true,
  uniqueItems: true,
  maxProperties: true,
  minProperties: true
};
var initialBaseURI = typeof self !== "undefined" && self.location && self.location.origin !== "null" ? new URL(self.location.origin + self.location.pathname + location.search) : new URL("https://github.com/cfworker");
function dereference(schema, lookup = /* @__PURE__ */ Object.create(null), baseURI = initialBaseURI, basePointer = "") {
  if (schema && typeof schema === "object" && !Array.isArray(schema)) {
    const id = schema.$id || schema.id;
    if (id) {
      const url2 = new URL(id, baseURI.href);
      if (url2.hash.length > 1) lookup[url2.href] = schema;
      else {
        url2.hash = "";
        if (basePointer === "") baseURI = url2;
        else dereference(schema, lookup, baseURI);
      }
    }
  } else if (schema !== true && schema !== false) return lookup;
  const schemaURI = baseURI.href + (basePointer ? "#" + basePointer : "");
  if (lookup[schemaURI] !== void 0) throw new Error(`Duplicate schema URI "${schemaURI}".`);
  lookup[schemaURI] = schema;
  if (schema === true || schema === false) return lookup;
  if (schema.__absolute_uri__ === void 0) Object.defineProperty(schema, "__absolute_uri__", {
    enumerable: false,
    value: schemaURI
  });
  if (schema.$ref && schema.__absolute_ref__ === void 0) {
    const url2 = new URL(schema.$ref, baseURI.href);
    url2.hash = url2.hash;
    Object.defineProperty(schema, "__absolute_ref__", {
      enumerable: false,
      value: url2.href
    });
  }
  if (schema.$recursiveRef && schema.__absolute_recursive_ref__ === void 0) {
    const url2 = new URL(schema.$recursiveRef, baseURI.href);
    url2.hash = url2.hash;
    Object.defineProperty(schema, "__absolute_recursive_ref__", {
      enumerable: false,
      value: url2.href
    });
  }
  if (schema.$anchor) {
    const url2 = new URL("#" + schema.$anchor, baseURI.href);
    lookup[url2.href] = schema;
  }
  for (let key in schema) {
    if (ignoredKeyword[key]) continue;
    const keyBase = `${basePointer}/${encodePointer(key)}`;
    const subSchema = schema[key];
    if (Array.isArray(subSchema)) {
      if (schemaArrayKeyword[key]) {
        const length = subSchema.length;
        for (let i = 0; i < length; i++) dereference(subSchema[i], lookup, baseURI, `${keyBase}/${i}`);
      }
    } else if (schemaMapKeyword[key]) for (let subKey in subSchema) dereference(subSchema[subKey], lookup, baseURI, `${keyBase}/${encodePointer(subKey)}`);
    else dereference(subSchema, lookup, baseURI, keyBase);
  }
  return lookup;
}
__name(dereference, "dereference");
var DATE = /^(\d\d\d\d)-(\d\d)-(\d\d)$/;
var DAYS = [
  0,
  31,
  28,
  31,
  30,
  31,
  30,
  31,
  31,
  30,
  31,
  30,
  31
];
var TIME = /^(\d\d):(\d\d):(\d\d)(\.\d+)?(z|[+-]\d\d(?::?\d\d)?)?$/i;
var HOSTNAME = /^(?=.{1,253}\.?$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*\.?$/i;
var URIREF = /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
var URITEMPLATE = /^(?:(?:[^\x00-\x20"'<>%\\^`{|}]|%[0-9a-f]{2})|\{[+#./;?&=,!@|]?(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?(?:,(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?)*\})*$/i;
var URL_ = /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u{00a1}-\u{ffff}0-9]+-?)*[a-z\u{00a1}-\u{ffff}0-9]+)(?:\.(?:[a-z\u{00a1}-\u{ffff}0-9]+-?)*[a-z\u{00a1}-\u{ffff}0-9]+)*(?:\.(?:[a-z\u{00a1}-\u{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu;
var UUID = /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
var JSON_POINTER = /^(?:\/(?:[^~/]|~0|~1)*)*$/;
var JSON_POINTER_URI_FRAGMENT = /^#(?:\/(?:[a-z0-9_\-.!$&'()*+,;:=@]|%[0-9a-f]{2}|~0|~1)*)*$/i;
var RELATIVE_JSON_POINTER = /^(?:0|[1-9][0-9]*)(?:#|(?:\/(?:[^~/]|~0|~1)*)*)$/;
var EMAIL = /* @__PURE__ */ __name((input) => {
  if (input[0] === '"') return false;
  const [name, host, ...rest] = input.split("@");
  if (!name || !host || rest.length !== 0 || name.length > 64 || host.length > 253) return false;
  if (name[0] === "." || name.endsWith(".") || name.includes("..")) return false;
  if (!/^[a-z0-9.-]+$/i.test(host) || !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(name)) return false;
  return host.split(".").every((part) => /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i.test(part));
}, "EMAIL");
var IPV4 = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
var IPV6 = /^((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))$/i;
var DURATION = /* @__PURE__ */ __name((input) => input.length > 1 && input.length < 80 && (/^P\d+([.,]\d+)?W$/.test(input) || /^P[\dYMDTHS]*(\d[.,]\d+)?[YMDHS]$/.test(input) && /^P([.,\d]+Y)?([.,\d]+M)?([.,\d]+D)?(T([.,\d]+H)?([.,\d]+M)?([.,\d]+S)?)?$/.test(input)), "DURATION");
function bind(r) {
  return r.test.bind(r);
}
__name(bind, "bind");
var format = {
  date: date4,
  time: time3.bind(void 0, false),
  "date-time": date_time,
  duration: DURATION,
  uri,
  "uri-reference": bind(URIREF),
  "uri-template": bind(URITEMPLATE),
  url: bind(URL_),
  email: EMAIL,
  hostname: bind(HOSTNAME),
  ipv4: bind(IPV4),
  ipv6: bind(IPV6),
  regex,
  uuid: bind(UUID),
  "json-pointer": bind(JSON_POINTER),
  "json-pointer-uri-fragment": bind(JSON_POINTER_URI_FRAGMENT),
  "relative-json-pointer": bind(RELATIVE_JSON_POINTER)
};
function isLeapYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}
__name(isLeapYear, "isLeapYear");
function date4(str) {
  const matches = str.match(DATE);
  if (!matches) return false;
  const year = +matches[1];
  const month = +matches[2];
  const day = +matches[3];
  return month >= 1 && month <= 12 && day >= 1 && day <= (month == 2 && isLeapYear(year) ? 29 : DAYS[month]);
}
__name(date4, "date");
function time3(full, str) {
  const matches = str.match(TIME);
  if (!matches) return false;
  const hour = +matches[1];
  const minute = +matches[2];
  const second = +matches[3];
  const timeZone = !!matches[5];
  return (hour <= 23 && minute <= 59 && second <= 59 || hour == 23 && minute == 59 && second == 60) && (!full || timeZone);
}
__name(time3, "time");
var DATE_TIME_SEPARATOR = /t|\s/i;
function date_time(str) {
  const dateTime = str.split(DATE_TIME_SEPARATOR);
  return dateTime.length == 2 && date4(dateTime[0]) && time3(true, dateTime[1]);
}
__name(date_time, "date_time");
var NOT_URI_FRAGMENT = /\/|:/;
var URI_PATTERN = /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)(?:\?(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
function uri(str) {
  return NOT_URI_FRAGMENT.test(str) && URI_PATTERN.test(str);
}
__name(uri, "uri");
var Z_ANCHOR = /[^\\]\\Z/;
function regex(str) {
  if (Z_ANCHOR.test(str)) return false;
  try {
    new RegExp(str, "u");
    return true;
  } catch (e) {
    return false;
  }
}
__name(regex, "regex");
function ucs2length(s) {
  let result = 0;
  let length = s.length;
  let index = 0;
  let charCode;
  while (index < length) {
    result++;
    charCode = s.charCodeAt(index++);
    if (charCode >= 55296 && charCode <= 56319 && index < length) {
      charCode = s.charCodeAt(index);
      if ((charCode & 64512) == 56320) index++;
    }
  }
  return result;
}
__name(ucs2length, "ucs2length");
function validate2(instance, schema, draft = "2019-09", lookup = dereference(schema), shortCircuit = true, recursiveAnchor = null, instanceLocation = "#", schemaLocation = "#", evaluated = /* @__PURE__ */ Object.create(null)) {
  if (schema === true) return {
    valid: true,
    errors: []
  };
  if (schema === false) return {
    valid: false,
    errors: [{
      instanceLocation,
      keyword: "false",
      keywordLocation: instanceLocation,
      error: "False boolean schema."
    }]
  };
  const rawInstanceType = typeof instance;
  let instanceType;
  switch (rawInstanceType) {
    case "boolean":
    case "number":
    case "string":
      instanceType = rawInstanceType;
      break;
    case "object":
      if (instance === null) instanceType = "null";
      else if (Array.isArray(instance)) instanceType = "array";
      else instanceType = "object";
      break;
    default:
      throw new Error(`Instances of "${rawInstanceType}" type are not supported.`);
  }
  const { $ref, $recursiveRef, $recursiveAnchor, type: $type, const: $const, enum: $enum, required: $required, not: $not, anyOf: $anyOf, allOf: $allOf, oneOf: $oneOf, if: $if, then: $then, else: $else, format: $format, properties: $properties, patternProperties: $patternProperties, additionalProperties: $additionalProperties, unevaluatedProperties: $unevaluatedProperties, minProperties: $minProperties, maxProperties: $maxProperties, propertyNames: $propertyNames, dependentRequired: $dependentRequired, dependentSchemas: $dependentSchemas, dependencies: $dependencies, prefixItems: $prefixItems, items: $items, additionalItems: $additionalItems, unevaluatedItems: $unevaluatedItems, contains: $contains, minContains: $minContains, maxContains: $maxContains, minItems: $minItems, maxItems: $maxItems, uniqueItems: $uniqueItems, minimum: $minimum, maximum: $maximum, exclusiveMinimum: $exclusiveMinimum, exclusiveMaximum: $exclusiveMaximum, multipleOf: $multipleOf, minLength: $minLength, maxLength: $maxLength, pattern: $pattern, __absolute_ref__, __absolute_recursive_ref__ } = schema;
  const errors = [];
  if ($recursiveAnchor === true && recursiveAnchor === null) recursiveAnchor = schema;
  if ($recursiveRef === "#") {
    const refSchema = recursiveAnchor === null ? lookup[__absolute_recursive_ref__] : recursiveAnchor;
    const keywordLocation = `${schemaLocation}/$recursiveRef`;
    const result = validate2(instance, recursiveAnchor === null ? schema : recursiveAnchor, draft, lookup, shortCircuit, refSchema, instanceLocation, keywordLocation, evaluated);
    if (!result.valid) errors.push({
      instanceLocation,
      keyword: "$recursiveRef",
      keywordLocation,
      error: "A subschema had errors."
    }, ...result.errors);
  }
  if ($ref !== void 0) {
    const refSchema = lookup[__absolute_ref__ || $ref];
    if (refSchema === void 0) {
      let message = `Unresolved $ref "${$ref}".`;
      if (__absolute_ref__ && __absolute_ref__ !== $ref) message += `  Absolute URI "${__absolute_ref__}".`;
      message += `
Known schemas:
- ${Object.keys(lookup).join("\n- ")}`;
      throw new Error(message);
    }
    const keywordLocation = `${schemaLocation}/$ref`;
    const result = validate2(instance, refSchema, draft, lookup, shortCircuit, recursiveAnchor, instanceLocation, keywordLocation, evaluated);
    if (!result.valid) errors.push({
      instanceLocation,
      keyword: "$ref",
      keywordLocation,
      error: "A subschema had errors."
    }, ...result.errors);
    if (draft === "4" || draft === "7") return {
      valid: errors.length === 0,
      errors
    };
  }
  if (Array.isArray($type)) {
    let length = $type.length;
    let valid = false;
    for (let i = 0; i < length; i++) if (instanceType === $type[i] || $type[i] === "integer" && instanceType === "number" && instance % 1 === 0 && instance === instance) {
      valid = true;
      break;
    }
    if (!valid) errors.push({
      instanceLocation,
      keyword: "type",
      keywordLocation: `${schemaLocation}/type`,
      error: `Instance type "${instanceType}" is invalid. Expected "${$type.join('", "')}".`
    });
  } else if ($type === "integer") {
    if (instanceType !== "number" || instance % 1 || instance !== instance) errors.push({
      instanceLocation,
      keyword: "type",
      keywordLocation: `${schemaLocation}/type`,
      error: `Instance type "${instanceType}" is invalid. Expected "${$type}".`
    });
  } else if ($type !== void 0 && instanceType !== $type) errors.push({
    instanceLocation,
    keyword: "type",
    keywordLocation: `${schemaLocation}/type`,
    error: `Instance type "${instanceType}" is invalid. Expected "${$type}".`
  });
  if ($const !== void 0) {
    if (instanceType === "object" || instanceType === "array") {
      if (!deepCompareStrict(instance, $const)) errors.push({
        instanceLocation,
        keyword: "const",
        keywordLocation: `${schemaLocation}/const`,
        error: `Instance does not match ${JSON.stringify($const)}.`
      });
    } else if (instance !== $const) errors.push({
      instanceLocation,
      keyword: "const",
      keywordLocation: `${schemaLocation}/const`,
      error: `Instance does not match ${JSON.stringify($const)}.`
    });
  }
  if ($enum !== void 0) {
    if (instanceType === "object" || instanceType === "array") {
      if (!$enum.some((value) => deepCompareStrict(instance, value))) errors.push({
        instanceLocation,
        keyword: "enum",
        keywordLocation: `${schemaLocation}/enum`,
        error: `Instance does not match any of ${JSON.stringify($enum)}.`
      });
    } else if (!$enum.some((value) => instance === value)) errors.push({
      instanceLocation,
      keyword: "enum",
      keywordLocation: `${schemaLocation}/enum`,
      error: `Instance does not match any of ${JSON.stringify($enum)}.`
    });
  }
  if ($not !== void 0) {
    const keywordLocation = `${schemaLocation}/not`;
    if (validate2(instance, $not, draft, lookup, shortCircuit, recursiveAnchor, instanceLocation, keywordLocation).valid) errors.push({
      instanceLocation,
      keyword: "not",
      keywordLocation,
      error: 'Instance matched "not" schema.'
    });
  }
  let subEvaluateds = [];
  if ($anyOf !== void 0) {
    const keywordLocation = `${schemaLocation}/anyOf`;
    const errorsLength = errors.length;
    let anyValid = false;
    for (let i = 0; i < $anyOf.length; i++) {
      const subSchema = $anyOf[i];
      const subEvaluated = Object.create(evaluated);
      const result = validate2(instance, subSchema, draft, lookup, shortCircuit, $recursiveAnchor === true ? recursiveAnchor : null, instanceLocation, `${keywordLocation}/${i}`, subEvaluated);
      errors.push(...result.errors);
      anyValid = anyValid || result.valid;
      if (result.valid) subEvaluateds.push(subEvaluated);
    }
    if (anyValid) errors.length = errorsLength;
    else errors.splice(errorsLength, 0, {
      instanceLocation,
      keyword: "anyOf",
      keywordLocation,
      error: "Instance does not match any subschemas."
    });
  }
  if ($allOf !== void 0) {
    const keywordLocation = `${schemaLocation}/allOf`;
    const errorsLength = errors.length;
    let allValid = true;
    for (let i = 0; i < $allOf.length; i++) {
      const subSchema = $allOf[i];
      const subEvaluated = Object.create(evaluated);
      const result = validate2(instance, subSchema, draft, lookup, shortCircuit, $recursiveAnchor === true ? recursiveAnchor : null, instanceLocation, `${keywordLocation}/${i}`, subEvaluated);
      errors.push(...result.errors);
      allValid = allValid && result.valid;
      if (result.valid) subEvaluateds.push(subEvaluated);
    }
    if (allValid) errors.length = errorsLength;
    else errors.splice(errorsLength, 0, {
      instanceLocation,
      keyword: "allOf",
      keywordLocation,
      error: `Instance does not match every subschema.`
    });
  }
  if ($oneOf !== void 0) {
    const keywordLocation = `${schemaLocation}/oneOf`;
    const errorsLength = errors.length;
    const matches = $oneOf.filter((subSchema, i) => {
      const subEvaluated = Object.create(evaluated);
      const result = validate2(instance, subSchema, draft, lookup, shortCircuit, $recursiveAnchor === true ? recursiveAnchor : null, instanceLocation, `${keywordLocation}/${i}`, subEvaluated);
      errors.push(...result.errors);
      if (result.valid) subEvaluateds.push(subEvaluated);
      return result.valid;
    }).length;
    if (matches === 1) errors.length = errorsLength;
    else errors.splice(errorsLength, 0, {
      instanceLocation,
      keyword: "oneOf",
      keywordLocation,
      error: `Instance does not match exactly one subschema (${matches} matches).`
    });
  }
  if (instanceType === "object" || instanceType === "array") Object.assign(evaluated, ...subEvaluateds);
  if ($if !== void 0) {
    const keywordLocation = `${schemaLocation}/if`;
    if (validate2(instance, $if, draft, lookup, shortCircuit, recursiveAnchor, instanceLocation, keywordLocation, evaluated).valid) {
      if ($then !== void 0) {
        const thenResult = validate2(instance, $then, draft, lookup, shortCircuit, recursiveAnchor, instanceLocation, `${schemaLocation}/then`, evaluated);
        if (!thenResult.valid) errors.push({
          instanceLocation,
          keyword: "if",
          keywordLocation,
          error: `Instance does not match "then" schema.`
        }, ...thenResult.errors);
      }
    } else if ($else !== void 0) {
      const elseResult = validate2(instance, $else, draft, lookup, shortCircuit, recursiveAnchor, instanceLocation, `${schemaLocation}/else`, evaluated);
      if (!elseResult.valid) errors.push({
        instanceLocation,
        keyword: "if",
        keywordLocation,
        error: `Instance does not match "else" schema.`
      }, ...elseResult.errors);
    }
  }
  if (instanceType === "object") {
    if ($required !== void 0) {
      for (const key of $required) if (!(key in instance)) errors.push({
        instanceLocation,
        keyword: "required",
        keywordLocation: `${schemaLocation}/required`,
        error: `Instance does not have required property "${key}".`
      });
    }
    const keys = Object.keys(instance);
    if ($minProperties !== void 0 && keys.length < $minProperties) errors.push({
      instanceLocation,
      keyword: "minProperties",
      keywordLocation: `${schemaLocation}/minProperties`,
      error: `Instance does not have at least ${$minProperties} properties.`
    });
    if ($maxProperties !== void 0 && keys.length > $maxProperties) errors.push({
      instanceLocation,
      keyword: "maxProperties",
      keywordLocation: `${schemaLocation}/maxProperties`,
      error: `Instance does not have at least ${$maxProperties} properties.`
    });
    if ($propertyNames !== void 0) {
      const keywordLocation = `${schemaLocation}/propertyNames`;
      for (const key in instance) {
        const subInstancePointer = `${instanceLocation}/${encodePointer(key)}`;
        const result = validate2(key, $propertyNames, draft, lookup, shortCircuit, recursiveAnchor, subInstancePointer, keywordLocation);
        if (!result.valid) errors.push({
          instanceLocation,
          keyword: "propertyNames",
          keywordLocation,
          error: `Property name "${key}" does not match schema.`
        }, ...result.errors);
      }
    }
    if ($dependentRequired !== void 0) {
      const keywordLocation = `${schemaLocation}/dependantRequired`;
      for (const key in $dependentRequired) if (key in instance) {
        const required2 = $dependentRequired[key];
        for (const dependantKey of required2) if (!(dependantKey in instance)) errors.push({
          instanceLocation,
          keyword: "dependentRequired",
          keywordLocation,
          error: `Instance has "${key}" but does not have "${dependantKey}".`
        });
      }
    }
    if ($dependentSchemas !== void 0) for (const key in $dependentSchemas) {
      const keywordLocation = `${schemaLocation}/dependentSchemas`;
      if (key in instance) {
        const result = validate2(instance, $dependentSchemas[key], draft, lookup, shortCircuit, recursiveAnchor, instanceLocation, `${keywordLocation}/${encodePointer(key)}`, evaluated);
        if (!result.valid) errors.push({
          instanceLocation,
          keyword: "dependentSchemas",
          keywordLocation,
          error: `Instance has "${key}" but does not match dependant schema.`
        }, ...result.errors);
      }
    }
    if ($dependencies !== void 0) {
      const keywordLocation = `${schemaLocation}/dependencies`;
      for (const key in $dependencies) if (key in instance) {
        const propsOrSchema = $dependencies[key];
        if (Array.isArray(propsOrSchema)) {
          for (const dependantKey of propsOrSchema) if (!(dependantKey in instance)) errors.push({
            instanceLocation,
            keyword: "dependencies",
            keywordLocation,
            error: `Instance has "${key}" but does not have "${dependantKey}".`
          });
        } else {
          const result = validate2(instance, propsOrSchema, draft, lookup, shortCircuit, recursiveAnchor, instanceLocation, `${keywordLocation}/${encodePointer(key)}`);
          if (!result.valid) errors.push({
            instanceLocation,
            keyword: "dependencies",
            keywordLocation,
            error: `Instance has "${key}" but does not match dependant schema.`
          }, ...result.errors);
        }
      }
    }
    const thisEvaluated = /* @__PURE__ */ Object.create(null);
    let stop = false;
    if ($properties !== void 0) {
      const keywordLocation = `${schemaLocation}/properties`;
      for (const key in $properties) {
        if (!(key in instance)) continue;
        const subInstancePointer = `${instanceLocation}/${encodePointer(key)}`;
        const result = validate2(instance[key], $properties[key], draft, lookup, shortCircuit, recursiveAnchor, subInstancePointer, `${keywordLocation}/${encodePointer(key)}`);
        if (result.valid) evaluated[key] = thisEvaluated[key] = true;
        else {
          stop = shortCircuit;
          errors.push({
            instanceLocation,
            keyword: "properties",
            keywordLocation,
            error: `Property "${key}" does not match schema.`
          }, ...result.errors);
          if (stop) break;
        }
      }
    }
    if (!stop && $patternProperties !== void 0) {
      const keywordLocation = `${schemaLocation}/patternProperties`;
      for (const pattern in $patternProperties) {
        const regex$1 = new RegExp(pattern, "u");
        const subSchema = $patternProperties[pattern];
        for (const key in instance) {
          if (!regex$1.test(key)) continue;
          const subInstancePointer = `${instanceLocation}/${encodePointer(key)}`;
          const result = validate2(instance[key], subSchema, draft, lookup, shortCircuit, recursiveAnchor, subInstancePointer, `${keywordLocation}/${encodePointer(pattern)}`);
          if (result.valid) evaluated[key] = thisEvaluated[key] = true;
          else {
            stop = shortCircuit;
            errors.push({
              instanceLocation,
              keyword: "patternProperties",
              keywordLocation,
              error: `Property "${key}" matches pattern "${pattern}" but does not match associated schema.`
            }, ...result.errors);
          }
        }
      }
    }
    if (!stop && $additionalProperties !== void 0) {
      const keywordLocation = `${schemaLocation}/additionalProperties`;
      for (const key in instance) {
        if (thisEvaluated[key]) continue;
        const subInstancePointer = `${instanceLocation}/${encodePointer(key)}`;
        const result = validate2(instance[key], $additionalProperties, draft, lookup, shortCircuit, recursiveAnchor, subInstancePointer, keywordLocation);
        if (result.valid) evaluated[key] = true;
        else {
          stop = shortCircuit;
          errors.push({
            instanceLocation,
            keyword: "additionalProperties",
            keywordLocation,
            error: `Property "${key}" does not match additional properties schema.`
          }, ...result.errors);
        }
      }
    } else if (!stop && $unevaluatedProperties !== void 0) {
      const keywordLocation = `${schemaLocation}/unevaluatedProperties`;
      for (const key in instance) if (!evaluated[key]) {
        const subInstancePointer = `${instanceLocation}/${encodePointer(key)}`;
        const result = validate2(instance[key], $unevaluatedProperties, draft, lookup, shortCircuit, recursiveAnchor, subInstancePointer, keywordLocation);
        if (result.valid) evaluated[key] = true;
        else errors.push({
          instanceLocation,
          keyword: "unevaluatedProperties",
          keywordLocation,
          error: `Property "${key}" does not match unevaluated properties schema.`
        }, ...result.errors);
      }
    }
  } else if (instanceType === "array") {
    if ($maxItems !== void 0 && instance.length > $maxItems) errors.push({
      instanceLocation,
      keyword: "maxItems",
      keywordLocation: `${schemaLocation}/maxItems`,
      error: `Array has too many items (${instance.length} > ${$maxItems}).`
    });
    if ($minItems !== void 0 && instance.length < $minItems) errors.push({
      instanceLocation,
      keyword: "minItems",
      keywordLocation: `${schemaLocation}/minItems`,
      error: `Array has too few items (${instance.length} < ${$minItems}).`
    });
    const length = instance.length;
    let i = 0;
    let stop = false;
    if ($prefixItems !== void 0) {
      const keywordLocation = `${schemaLocation}/prefixItems`;
      const length2 = Math.min($prefixItems.length, length);
      for (; i < length2; i++) {
        const result = validate2(instance[i], $prefixItems[i], draft, lookup, shortCircuit, recursiveAnchor, `${instanceLocation}/${i}`, `${keywordLocation}/${i}`);
        evaluated[i] = true;
        if (!result.valid) {
          stop = shortCircuit;
          errors.push({
            instanceLocation,
            keyword: "prefixItems",
            keywordLocation,
            error: `Items did not match schema.`
          }, ...result.errors);
          if (stop) break;
        }
      }
    }
    if ($items !== void 0) {
      const keywordLocation = `${schemaLocation}/items`;
      if (Array.isArray($items)) {
        const length2 = Math.min($items.length, length);
        for (; i < length2; i++) {
          const result = validate2(instance[i], $items[i], draft, lookup, shortCircuit, recursiveAnchor, `${instanceLocation}/${i}`, `${keywordLocation}/${i}`);
          evaluated[i] = true;
          if (!result.valid) {
            stop = shortCircuit;
            errors.push({
              instanceLocation,
              keyword: "items",
              keywordLocation,
              error: `Items did not match schema.`
            }, ...result.errors);
            if (stop) break;
          }
        }
      } else for (; i < length; i++) {
        const result = validate2(instance[i], $items, draft, lookup, shortCircuit, recursiveAnchor, `${instanceLocation}/${i}`, keywordLocation);
        evaluated[i] = true;
        if (!result.valid) {
          stop = shortCircuit;
          errors.push({
            instanceLocation,
            keyword: "items",
            keywordLocation,
            error: `Items did not match schema.`
          }, ...result.errors);
          if (stop) break;
        }
      }
      if (!stop && $additionalItems !== void 0) {
        const keywordLocation$1 = `${schemaLocation}/additionalItems`;
        for (; i < length; i++) {
          const result = validate2(instance[i], $additionalItems, draft, lookup, shortCircuit, recursiveAnchor, `${instanceLocation}/${i}`, keywordLocation$1);
          evaluated[i] = true;
          if (!result.valid) {
            stop = shortCircuit;
            errors.push({
              instanceLocation,
              keyword: "additionalItems",
              keywordLocation: keywordLocation$1,
              error: `Items did not match additional items schema.`
            }, ...result.errors);
          }
        }
      }
    }
    if ($contains !== void 0) if (length === 0 && $minContains === void 0) errors.push({
      instanceLocation,
      keyword: "contains",
      keywordLocation: `${schemaLocation}/contains`,
      error: `Array is empty. It must contain at least one item matching the schema.`
    });
    else if ($minContains !== void 0 && length < $minContains) errors.push({
      instanceLocation,
      keyword: "minContains",
      keywordLocation: `${schemaLocation}/minContains`,
      error: `Array has less items (${length}) than minContains (${$minContains}).`
    });
    else {
      const keywordLocation = `${schemaLocation}/contains`;
      const errorsLength = errors.length;
      let contained = 0;
      for (let j = 0; j < length; j++) {
        const result = validate2(instance[j], $contains, draft, lookup, shortCircuit, recursiveAnchor, `${instanceLocation}/${j}`, keywordLocation);
        if (result.valid) {
          evaluated[j] = true;
          contained++;
        } else errors.push(...result.errors);
      }
      if (contained >= ($minContains || 0)) errors.length = errorsLength;
      if ($minContains === void 0 && $maxContains === void 0 && contained === 0) errors.splice(errorsLength, 0, {
        instanceLocation,
        keyword: "contains",
        keywordLocation,
        error: `Array does not contain item matching schema.`
      });
      else if ($minContains !== void 0 && contained < $minContains) errors.push({
        instanceLocation,
        keyword: "minContains",
        keywordLocation: `${schemaLocation}/minContains`,
        error: `Array must contain at least ${$minContains} items matching schema. Only ${contained} items were found.`
      });
      else if ($maxContains !== void 0 && contained > $maxContains) errors.push({
        instanceLocation,
        keyword: "maxContains",
        keywordLocation: `${schemaLocation}/maxContains`,
        error: `Array may contain at most ${$maxContains} items matching schema. ${contained} items were found.`
      });
    }
    if (!stop && $unevaluatedItems !== void 0) {
      const keywordLocation = `${schemaLocation}/unevaluatedItems`;
      for (; i < length; i++) {
        if (evaluated[i]) continue;
        const result = validate2(instance[i], $unevaluatedItems, draft, lookup, shortCircuit, recursiveAnchor, `${instanceLocation}/${i}`, keywordLocation);
        evaluated[i] = true;
        if (!result.valid) errors.push({
          instanceLocation,
          keyword: "unevaluatedItems",
          keywordLocation,
          error: `Items did not match unevaluated items schema.`
        }, ...result.errors);
      }
    }
    if ($uniqueItems) for (let j = 0; j < length; j++) {
      const a = instance[j];
      const ao = typeof a === "object" && a !== null;
      for (let k = 0; k < length; k++) {
        if (j === k) continue;
        const b = instance[k];
        if (a === b || ao && typeof b === "object" && b !== null && deepCompareStrict(a, b)) {
          errors.push({
            instanceLocation,
            keyword: "uniqueItems",
            keywordLocation: `${schemaLocation}/uniqueItems`,
            error: `Duplicate items at indexes ${j} and ${k}.`
          });
          j = Number.MAX_SAFE_INTEGER;
          k = Number.MAX_SAFE_INTEGER;
        }
      }
    }
  } else if (instanceType === "number") {
    if (draft === "4") {
      if ($minimum !== void 0 && ($exclusiveMinimum === true && instance <= $minimum || instance < $minimum)) errors.push({
        instanceLocation,
        keyword: "minimum",
        keywordLocation: `${schemaLocation}/minimum`,
        error: `${instance} is less than ${$exclusiveMinimum ? "or equal to " : ""} ${$minimum}.`
      });
      if ($maximum !== void 0 && ($exclusiveMaximum === true && instance >= $maximum || instance > $maximum)) errors.push({
        instanceLocation,
        keyword: "maximum",
        keywordLocation: `${schemaLocation}/maximum`,
        error: `${instance} is greater than ${$exclusiveMaximum ? "or equal to " : ""} ${$maximum}.`
      });
    } else {
      if ($minimum !== void 0 && instance < $minimum) errors.push({
        instanceLocation,
        keyword: "minimum",
        keywordLocation: `${schemaLocation}/minimum`,
        error: `${instance} is less than ${$minimum}.`
      });
      if ($maximum !== void 0 && instance > $maximum) errors.push({
        instanceLocation,
        keyword: "maximum",
        keywordLocation: `${schemaLocation}/maximum`,
        error: `${instance} is greater than ${$maximum}.`
      });
      if ($exclusiveMinimum !== void 0 && instance <= $exclusiveMinimum) errors.push({
        instanceLocation,
        keyword: "exclusiveMinimum",
        keywordLocation: `${schemaLocation}/exclusiveMinimum`,
        error: `${instance} is less than ${$exclusiveMinimum}.`
      });
      if ($exclusiveMaximum !== void 0 && instance >= $exclusiveMaximum) errors.push({
        instanceLocation,
        keyword: "exclusiveMaximum",
        keywordLocation: `${schemaLocation}/exclusiveMaximum`,
        error: `${instance} is greater than or equal to ${$exclusiveMaximum}.`
      });
    }
    if ($multipleOf !== void 0) {
      const remainder = instance % $multipleOf;
      if (Math.abs(0 - remainder) >= 11920929e-14 && Math.abs($multipleOf - remainder) >= 11920929e-14) errors.push({
        instanceLocation,
        keyword: "multipleOf",
        keywordLocation: `${schemaLocation}/multipleOf`,
        error: `${instance} is not a multiple of ${$multipleOf}.`
      });
    }
  } else if (instanceType === "string") {
    const length = $minLength === void 0 && $maxLength === void 0 ? 0 : ucs2length(instance);
    if ($minLength !== void 0 && length < $minLength) errors.push({
      instanceLocation,
      keyword: "minLength",
      keywordLocation: `${schemaLocation}/minLength`,
      error: `String is too short (${length} < ${$minLength}).`
    });
    if ($maxLength !== void 0 && length > $maxLength) errors.push({
      instanceLocation,
      keyword: "maxLength",
      keywordLocation: `${schemaLocation}/maxLength`,
      error: `String is too long (${length} > ${$maxLength}).`
    });
    if ($pattern !== void 0 && !new RegExp($pattern, "u").test(instance)) errors.push({
      instanceLocation,
      keyword: "pattern",
      keywordLocation: `${schemaLocation}/pattern`,
      error: `String does not match pattern.`
    });
    if ($format !== void 0 && format[$format] && !format[$format](instance)) errors.push({
      instanceLocation,
      keyword: "format",
      keywordLocation: `${schemaLocation}/format`,
      error: `String does not match format "${$format}".`
    });
  }
  return {
    valid: errors.length === 0,
    errors
  };
}
__name(validate2, "validate");
var Validator = class {
  static {
    __name(this, "Validator");
  }
  schema;
  draft;
  shortCircuit;
  lookup;
  constructor(schema, draft = "2019-09", shortCircuit = true) {
    this.schema = schema;
    this.draft = draft;
    this.shortCircuit = shortCircuit;
    this.lookup = dereference(schema);
  }
  validate(instance) {
    return validate2(instance, this.schema, this.draft, this.lookup, this.shortCircuit);
  }
  addSchema(schema, id) {
    if (id) schema = {
      ...schema,
      $id: id
    };
    dereference(schema, this.lookup);
  }
};
var CfWorkerJsonSchemaValidator = class {
  static {
    __name(this, "CfWorkerJsonSchemaValidator");
  }
  shortcircuit;
  /** Caller-supplied draft; when set, the `$schema` check is skipped (caller owns dialect). */
  draft;
  /**
  * Create a validator
  *
  * @param options - Configuration options
  * @param options.shortcircuit - If `true`, stop validation after first error (default: `true`)
  * @param options.draft - JSON Schema draft version to force for every schema. When set, the
  * `$schema` dispatch is skipped. When omitted, the provider dispatches on each schema's
  * declared `$schema` (2020-12, 2019-09, draft-07, draft-06; absent means 2020-12) and rejects others.
  */
  constructor(options) {
    this.shortcircuit = options?.shortcircuit ?? true;
    this.draft = options?.draft;
  }
  /**
  * Pick the engine draft for a schema's declared dialect (a caller-forced `{draft}` bypasses
  * this — do not second-guess by `$schema`). No `$schema` or 2020-12 → `'2020-12'`; 2019-09 →
  * `'2019-09'`; draft-07 or draft-06 → `'7'`; anything else → `Error`.
  */
  _draftFor(schema) {
    const dialect = declaredDialect(schema, "pass an explicit { draft } to CfWorkerJsonSchemaValidator to validate other dialects.");
    return dialect === "draft-7" ? "7" : dialect;
  }
  /**
  * Create a validator for the given JSON Schema
  *
  * Unlike AJV, this validator is not cached internally
  *
  * @param schema - Standard JSON Schema object
  * @returns A validator function that validates input data
  */
  getValidator(schema) {
    const validator = new Validator(schema, this.draft ?? this._draftFor(schema), this.shortcircuit);
    return (input) => {
      const result = validator.validate(input);
      return result.valid ? {
        valid: true,
        data: input,
        errorMessage: void 0
      } : {
        valid: false,
        data: void 0,
        errorMessage: result.errors.map((err) => `${err.instanceLocation}: ${err.error}`).join("; ")
      };
    };
  }
};

// ../../node_modules/@modelcontextprotocol/server/dist/shimsWorkerd.mjs
preloadSchemas();

// ../../node_modules/@modelcontextprotocol/server/dist/mcp-oHn3ureC.mjs
var COMPLETABLE_SYMBOL = /* @__PURE__ */ Symbol.for("mcp.completable");
function isCompletable(schema) {
  return !!schema && typeof schema === "object" && COMPLETABLE_SYMBOL in schema;
}
__name(isCompletable, "isCompletable");
function getCompleter(schema) {
  return schema[COMPLETABLE_SYMBOL]?.complete;
}
__name(getCompleter, "getCompleter");
var DEFAULT_SSE_KEEP_ALIVE_MS = 15e3;
var MAX_TIMER_DELAY_MS = 2 ** 31 - 1;
function armSseKeepAlive(intervalMs, onTick) {
  if (!Number.isFinite(intervalMs) || intervalMs < 1) return;
  const timer = setInterval(onTick, Math.min(intervalMs, MAX_TIMER_DELAY_MS));
  timer.unref?.();
  return timer;
}
__name(armSseKeepAlive, "armSseKeepAlive");
var readClassification;
var PerRequestHTTPServerTransport = class {
  static {
    __name(this, "PerRequestHTTPServerTransport");
  }
  static {
    readClassification = /* @__PURE__ */ __name((transport) => transport._classification, "readClassification");
  }
  onclose;
  onerror;
  onmessage;
  _classification;
  _responseMode;
  _started = false;
  _used = false;
  _closed = false;
  _terminalDelivered = false;
  /**
  * `true` only while the inbound message is being delivered synchronously
  * to the connected protocol layer. The pre-handler gates (the era
  * registry gate, the edge→instance handoff check, the missing-handler
  * rejection) answer inside this window; request handlers always run
  * after it (the protocol layer defers them to a microtask). An error
  * sent inside the window is therefore ladder-originated, and an error
  * sent after it is handler-produced.
  */
  _dispatchWindowOpen = false;
  _requestId;
  _deferredResponse;
  _sse;
  _abortCleanup;
  _keepAliveMs;
  constructor(options) {
    this._classification = options.classification;
    this._responseMode = options.responseMode ?? "auto";
    this._keepAliveMs = options.keepAliveMs ?? DEFAULT_SSE_KEEP_ALIVE_MS;
  }
  async start() {
    if (this._started) throw new Error("PerRequestHTTPServerTransport is already started");
    this._started = true;
  }
  /**
  * Serves the single exchange: delivers the classified message to the
  * connected server instance and resolves with the HTTP response.
  *
  * Throws when called a second time (the transport is strictly
  * single-use), or before a server has been connected to the transport.
  * The returned promise rejects with a connection-closed error when the
  * transport is closed before a response was produced (for example because
  * the client disconnected).
  */
  async handleMessage(message, extra) {
    if (this._used) throw new Error("PerRequestHTTPServerTransport serves exactly one exchange; construct a new transport per request");
    if (!this._started || this.onmessage === void 0) throw new Error("PerRequestHTTPServerTransport is not connected: connect a server to this transport before handling a message");
    if (this._closed) throw new Error("PerRequestHTTPServerTransport is closed");
    this._used = true;
    const signal = extra?.request?.signal;
    if (signal?.aborted) {
      await this.close();
      throw new SdkError(SdkErrorCode.ConnectionClosed, "The request was aborted before it could be handled");
    }
    const messageExtra = {
      classification: this._classification,
      ...extra?.request !== void 0 && { request: extra.request },
      ...extra?.authInfo !== void 0 && { authInfo: extra.authInfo }
    };
    if (isJSONRPCRequest(message)) {
      this._requestId = message.id;
      let resolve;
      let reject;
      const promise = new Promise((promiseResolve, promiseReject) => {
        resolve = promiseResolve;
        reject = promiseReject;
      });
      this._deferredResponse = {
        promise,
        resolve,
        reject,
        settled: false
      };
      if (signal !== void 0) {
        const onAbort = /* @__PURE__ */ __name(() => void this.close(), "onAbort");
        signal.addEventListener("abort", onAbort, { once: true });
        this._abortCleanup = () => signal.removeEventListener("abort", onAbort);
      }
      this._dispatchWindowOpen = true;
      try {
        this.onmessage(message, messageExtra);
      } finally {
        this._dispatchWindowOpen = false;
      }
      if (this._responseMode === "sse" && !this._closed && !this._deferredResponse.settled) this.upgradeToSse();
      return promise;
    }
    this.onmessage(message, messageExtra);
    return new Response(null, { status: 202 });
  }
  async send(message, options) {
    if (this._closed) return;
    const isResponse = isJSONRPCResultResponse(message) || isJSONRPCErrorResponse(message);
    const relatedId = isResponse ? message.id : options?.relatedRequestId;
    if (this._requestId === void 0 || relatedId === void 0 || relatedId !== this._requestId) {
      if (isResponse) this.onerror?.(/* @__PURE__ */ new Error(`Received a response for an unknown request id: ${String(message.id)}`));
      return;
    }
    if (isResponse) {
      if (this._terminalDelivered) return;
      this._terminalDelivered = true;
      const errorCode = isJSONRPCErrorResponse(message) ? message.error.code : void 0;
      const ladderStatus = errorCode !== void 0 && (this._dispatchWindowOpen || errorCode === ProtocolErrorCode.MissingRequiredClientCapability) ? LADDER_ERROR_HTTP_STATUS[errorCode] : void 0;
      if (ladderStatus !== void 0 && this._sse === void 0) {
        this.settleResponse(Response.json(message, {
          status: ladderStatus,
          headers: { "Content-Type": "application/json" }
        }));
        queueMicrotask(() => void this.close());
        return;
      }
      if (this._sse !== void 0 || this._responseMode === "sse") {
        if (this._sse === void 0) this.upgradeToSse();
        this.writeMessageFrame(message);
        this.finalizeStream();
        return;
      }
      this.settleResponse(Response.json(message, {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }));
      queueMicrotask(() => void this.close());
      return;
    }
    if (this._responseMode === "json") return;
    if (this._sse === void 0) this.upgradeToSse();
    this.writeMessageFrame(message);
  }
  /**
  * Writes an SSE comment frame (a keep-alive heartbeat). Dropped when the
  * exchange is not currently streaming.
  */
  writeCommentFrame(comment) {
    if (this._closed || this._sse === void 0 || this._sse.closed) return;
    const frame = comment.split("\n").map((line) => `: ${line}`).join("\n");
    this.writeFrame(`${frame}

`);
  }
  async close() {
    if (this._closed) return;
    this._closed = true;
    this._abortCleanup?.();
    this._abortCleanup = void 0;
    if (this._sse?.keepAliveTimer !== void 0) clearInterval(this._sse.keepAliveTimer);
    if (this._sse !== void 0 && !this._sse.closed) {
      this._sse.closed = true;
      try {
        this._sse.controller.close();
      } catch {
      }
    }
    if (this._deferredResponse !== void 0 && !this._deferredResponse.settled) {
      this._deferredResponse.settled = true;
      this._deferredResponse.reject(new SdkError(SdkErrorCode.ConnectionClosed, "Connection closed before a response was produced"));
    }
    this.onclose?.();
  }
  settleResponse(response) {
    if (this._deferredResponse === void 0 || this._deferredResponse.settled) return;
    this._deferredResponse.settled = true;
    this._deferredResponse.resolve(response);
  }
  upgradeToSse() {
    let controller;
    const readable = new ReadableStream({
      start: /* @__PURE__ */ __name((streamController) => {
        controller = streamController;
      }, "start"),
      cancel: /* @__PURE__ */ __name(() => {
        this.close();
      }, "cancel")
    });
    this._sse = {
      controller,
      encoder: new TextEncoder(),
      closed: false
    };
    this._sse.keepAliveTimer = armSseKeepAlive(this._keepAliveMs, () => this.writeCommentFrame("keepalive"));
    this.settleResponse(new Response(readable, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no"
      }
    }));
  }
  finalizeStream() {
    if (this._sse?.keepAliveTimer !== void 0) clearInterval(this._sse.keepAliveTimer);
    if (this._sse !== void 0 && !this._sse.closed) {
      this._sse.closed = true;
      try {
        this._sse.controller.close();
      } catch {
      }
    }
    queueMicrotask(() => void this.close());
  }
  writeMessageFrame(message) {
    this.writeFrame(`event: message
data: ${JSON.stringify(message)}

`);
  }
  writeFrame(frame) {
    if (this._sse === void 0 || this._sse.closed) return;
    try {
      this._sse.controller.enqueue(this._sse.encoder.encode(frame));
    } catch (error2) {
      this.onerror?.(/* @__PURE__ */ new Error(`Failed to write to the response stream: ${error2}`));
    }
  }
};
function perRequestClassificationOf(transport) {
  return transport instanceof PerRequestHTTPServerTransport ? readClassification(transport) : void 0;
}
__name(perRequestClassificationOf, "perRequestClassificationOf");
function headerQuotedValue(value) {
  return value.replaceAll(/[\\"]/g, String.raw`\$&`).replaceAll(/[^\u0020-\u007E]/g, " ");
}
__name(headerQuotedValue, "headerQuotedValue");
function buildWwwAuthenticateHeader(errorCode, description, requiredScopes, resourceMetadataUrl) {
  let header = `Bearer error="${headerQuotedValue(errorCode)}", error_description="${headerQuotedValue(description)}"`;
  if (requiredScopes.length > 0) header += `, scope="${headerQuotedValue(requiredScopes.join(" "))}"`;
  if (resourceMetadataUrl) header += `, resource_metadata="${headerQuotedValue(resourceMetadataUrl)}"`;
  return header;
}
__name(buildWwwAuthenticateHeader, "buildWwwAuthenticateHeader");
function bearerAuthChallengeResponse(error2, options) {
  const { requiredScopes = [], resourceMetadataUrl } = options ?? {};
  if (!(error2 instanceof OAuthError)) {
    const serverError = new OAuthError(OAuthErrorCode.ServerError, "Internal Server Error");
    return Response.json(serverError.toResponseObject(), { status: 500 });
  }
  switch (error2.code) {
    case OAuthErrorCode.InvalidToken: {
      const challenge = buildWwwAuthenticateHeader(error2.code, error2.message, requiredScopes, resourceMetadataUrl);
      return Response.json(error2.toResponseObject(), {
        status: 401,
        headers: { "WWW-Authenticate": challenge }
      });
    }
    case OAuthErrorCode.InsufficientScope: {
      const challenge = buildWwwAuthenticateHeader(error2.code, error2.message, requiredScopes, resourceMetadataUrl);
      return Response.json(error2.toResponseObject(), {
        status: 403,
        headers: { "WWW-Authenticate": challenge }
      });
    }
    case OAuthErrorCode.ServerError:
      return Response.json(error2.toResponseObject(), { status: 500 });
    default:
      return Response.json(error2.toResponseObject(), { status: 400 });
  }
}
__name(bearerAuthChallengeResponse, "bearerAuthChallengeResponse");
function getOAuthProtectedResourceMetadataUrl(serverUrl) {
  const metadataUrl = new URL(serverUrl);
  metadataUrl.pathname = protectedResourceMetadataPath(serverUrl);
  metadataUrl.hash = "";
  return metadataUrl.href;
}
__name(getOAuthProtectedResourceMetadataUrl, "getOAuthProtectedResourceMetadataUrl");
function protectedResourceMetadataPath(resourceServerUrl) {
  const rsPath = stripTrailingSlash(resourceServerUrl.pathname);
  return `/.well-known/oauth-protected-resource${rsPath === "/" ? "" : rsPath}`;
}
__name(protectedResourceMetadataPath, "protectedResourceMetadataPath");
function stripTrailingSlash(path) {
  return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
}
__name(stripTrailingSlash, "stripTrailingSlash");
function supportsScopeChallengeResolver(transport) {
  return typeof transport === "object" && transport !== null && "setScopeChallengeResolver" in transport && typeof transport.setScopeChallengeResolver === "function";
}
__name(supportsScopeChallengeResolver, "supportsScopeChallengeResolver");
function assertScope(scope, location2) {
  if (typeof scope !== "string" || !/^[\u0021\u0023-\u005B\u005D-\u007E]+$/.test(scope)) throw new TypeError(`${location2} must satisfy the OAuth scope-token grammar`);
}
__name(assertScope, "assertScope");
function validateScopeChallenge(challenge) {
  if (challenge === null || typeof challenge !== "object" || !Array.isArray(challenge.scopes) || challenge.scopes.length === 0) throw new TypeError("scope challenge must contain at least one scope");
  for (const [index, scope] of challenge.scopes.entries()) assertScope(scope, `scope challenge scopes[${index}]`);
  if (challenge.errorDescription !== void 0 && typeof challenge.errorDescription !== "string") throw new TypeError("scope challenge errorDescription must be a string");
  if (challenge.errorDescription !== void 0 && !/^[\u0020-\u0021\u0023-\u005B\u005D-\u007E]+$/.test(challenge.errorDescription)) throw new TypeError("scope challenge errorDescription must satisfy the RFC 6750 error-description grammar");
  return challenge;
}
__name(validateScopeChallenge, "validateScopeChallenge");
async function findScopeChallenge(requests, authInfo, resolve) {
  for (const request of requests) {
    const challenge = await resolve({
      request,
      ...authInfo !== void 0 && { authInfo }
    });
    if (challenge !== void 0) return validateScopeChallenge(challenge);
  }
}
__name(findScopeChallenge, "findScopeChallenge");
function scopeChallengeResourceMetadataUrl(authInfo) {
  if (authInfo?.resourceMetadataUrl !== void 0) return authInfo.resourceMetadataUrl;
  if (authInfo?.resource?.protocol === "https:" || authInfo?.resource?.protocol === "http:") return getOAuthProtectedResourceMetadataUrl(authInfo.resource);
}
__name(scopeChallengeResourceMetadataUrl, "scopeChallengeResourceMetadataUrl");
function createScopeChallengeResponse(challenge, resourceMetadataUrl) {
  return bearerAuthChallengeResponse(new OAuthError(OAuthErrorCode.InsufficientScope, challenge.errorDescription ?? "Insufficient scope"), {
    requiredScopes: [...challenge.scopes],
    resourceMetadataUrl
  });
}
__name(createScopeChallengeResponse, "createScopeChallengeResponse");
var DEFAULT_LEGACY_SHIM_MAX_ROUNDS = 8;
var DEFAULT_LEGACY_SHIM_ROUND_TIMEOUT_MS = 6e5;
function resolveLegacyShimOptions(options) {
  if (options?.maxRounds !== void 0 && (!Number.isInteger(options.maxRounds) || options.maxRounds < 1)) throw new RangeError(`inputRequired.maxRounds must be a positive integer (got ${options.maxRounds})`);
  if (options?.roundTimeoutMs !== void 0 && (!Number.isFinite(options.roundTimeoutMs) || options.roundTimeoutMs <= 0)) throw new RangeError(`inputRequired.roundTimeoutMs must be a positive number (got ${options.roundTimeoutMs})`);
  return {
    maxRounds: options?.maxRounds ?? DEFAULT_LEGACY_SHIM_MAX_ROUNDS,
    roundTimeoutMs: options?.roundTimeoutMs ?? DEFAULT_LEGACY_SHIM_ROUND_TIMEOUT_MS,
    legacyShim: options?.legacyShim ?? true
  };
}
__name(resolveLegacyShimOptions, "resolveLegacyShimOptions");
function coerceEmbeddedInputRequest(method, key, entry) {
  if (entry === null || typeof entry !== "object" || typeof entry.method !== "string") throw new ProtocolError(ProtocolErrorCode.InternalError, `Handler for ${method} returned an invalid input request '${key}': each inputRequests entry must be an embedded elicitation/create, sampling/createMessage, or roots/list request`);
  const embedded = entry;
  const required2 = requiredClientCapabilitiesForInputRequest(embedded);
  if (required2 === void 0) throw new ProtocolError(ProtocolErrorCode.InternalError, `Handler for ${method} returned an input request '${key}' of kind '${embedded.method}', which is not an embedded request the 2026-07-28 revision defines`);
  return {
    embedded,
    required: required2
  };
}
__name(coerceEmbeddedInputRequest, "coerceEmbeddedInputRequest");
function syntheticElicitationId() {
  const webCrypto = globalThis.crypto;
  if (webCrypto?.randomUUID !== void 0) return webCrypto.randomUUID();
  const bytes2 = new Uint8Array(16);
  webCrypto.getRandomValues(bytes2);
  bytes2[6] = bytes2[6] & 15 | 64;
  bytes2[8] = bytes2[8] & 63 | 128;
  const hex = [...bytes2].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
__name(syntheticElicitationId, "syntheticElicitationId");
function legacyShimFailure(method, message) {
  if (method === "tools/call") return {
    content: [{
      type: "text",
      text: message
    }],
    isError: true
  };
  throw new ProtocolError(ProtocolErrorCode.InternalError, message);
}
__name(legacyShimFailure, "legacyShimFailure");
var LegacyInputRequiredShim = class {
  static {
    __name(this, "LegacyInputRequiredShim");
  }
  constructor(_host) {
    this._host = _host;
  }
  async fulfill(method, handler, request, ctx, firstResult) {
    const { maxRounds, roundTimeoutMs } = this._host;
    const outerSignal = ctx.mcpReq.signal;
    let current = firstResult;
    let round4 = 0;
    while (true) {
      round4 += 1;
      if (round4 > maxRounds) return legacyShimFailure(method, inputRequiredRoundsExceededMessage(method, maxRounds));
      const inputRequests = current.inputRequests;
      const hasInputRequests = inputRequests != null && Object.keys(inputRequests).length > 0;
      const requestState = typeof current.requestState === "string" ? current.requestState : void 0;
      if (!hasInputRequests && requestState === void 0) throw new ProtocolError(ProtocolErrorCode.InternalError, `Handler for ${method} returned an input-required result with neither inputRequests nor requestState (every InputRequiredResult must include at least one of the two)`);
      let responses;
      if (hasInputRequests) {
        const declared = this._host.resolvedClientCapabilities(ctx);
        const coerced = [];
        for (const [key, entry] of Object.entries(inputRequests)) {
          const { embedded, required: required2 } = coerceEmbeddedInputRequest(method, key, entry);
          if (embedded.method !== "roots/list" && embedded.params === void 0) throw new ProtocolError(ProtocolErrorCode.InternalError, `Handler for ${method} returned an input request '${key}' of kind '${embedded.method}' without params`);
          if (missingClientCapabilities(required2, declared) !== void 0) return legacyShimFailure(method, `Cannot request input '${key}' (${embedded.method}): the client on this 2025-era connection did not declare the required capability${declared === void 0 ? " (no client capabilities are available on this connection \u2014 per-request legacy serving cannot receive server-to-client requests)" : ""}`);
          coerced.push([key, embedded]);
        }
        const roundAbort = linkedRoundAbort(outerSignal);
        try {
          const legOptions = {
            relatedRequestId: ctx.mcpReq.id,
            timeout: roundTimeoutMs,
            resetTimeoutOnProgress: true,
            onprogress: /* @__PURE__ */ __name(() => {
            }, "onprogress"),
            signal: roundAbort.signal
          };
          const fulfilled = await Promise.all(coerced.map(async ([key, embedded]) => {
            try {
              return [key, await this._dispatchLeg(embedded, legOptions)];
            } catch (error2) {
              roundAbort.abort(error2);
              throw error2;
            }
          }));
          responses = Object.fromEntries(fulfilled);
        } catch (error2) {
          if (outerSignal.aborted) throw error2;
          return legacyShimFailure(method, `Fulfilling input required by '${method}' failed: ${error2 instanceof Error ? error2.message : String(error2)}`);
        } finally {
          roundAbort.dispose();
        }
      } else await sleep(REQUEST_STATE_ONLY_LEG_PACING_MS, outerSignal);
      let ctxNext = {
        ...ctx,
        mcpReq: {
          ...ctx.mcpReq,
          inputResponses: responses,
          droppedInputResponseKeys: void 0,
          requestState: requestStateAccessor(requestState)
        }
      };
      if (requestState !== void 0) {
        const decoded = await this._host.verifyRequestState(requestState, ctxNext, method);
        if (decoded !== void 0) ctxNext = withRequestStateValue(ctxNext, decoded);
      }
      const next = await handler(request, ctxNext);
      if (!isInputRequiredResult(next)) return next;
      current = next;
    }
  }
  /** Routes one embedded request through the host's existing 2025-era senders (gate already ran). */
  async _dispatchLeg(embedded, options) {
    switch (embedded.method) {
      case "elicitation/create": {
        let params = embedded.params;
        if (params.mode === "url" && params.elicitationId === void 0) params = {
          ...params,
          elicitationId: syntheticElicitationId()
        };
        return await this._host.sendElicitation(params, options);
      }
      case "sampling/createMessage":
        return await this._host.sendSampling(embedded.params, options);
      case "roots/list":
        return await this._host.listRoots(embedded.params, options);
    }
  }
};
var INPUT_REQUIRED_CAPABLE_METHODS = /* @__PURE__ */ new Set([
  "tools/call",
  "prompts/get",
  "resources/read"
]);
var writeClientIdentity;
var installDiscoverHandler;
var readServerIdentity;
function seedClientIdentityFromEnvelope(server, identity) {
  writeClientIdentity(server, identity);
}
__name(seedClientIdentityFromEnvelope, "seedClientIdentityFromEnvelope");
function installModernOnlyHandlers(server, servedModernVersions) {
  installDiscoverHandler(server, servedModernVersions);
}
__name(installModernOnlyHandlers, "installModernOnlyHandlers");
function serverIdentityOf(server) {
  return readServerIdentity(server);
}
__name(serverIdentityOf, "serverIdentityOf");
var Server = class extends Protocol {
  static {
    __name(this, "Server");
  }
  _clientCapabilities;
  _clientVersion;
  static {
    writeClientIdentity = /* @__PURE__ */ __name((server, identity) => {
      if (identity.clientCapabilities !== void 0) server._clientCapabilities = identity.clientCapabilities;
      if (identity.clientInfo !== void 0) server._clientVersion = identity.clientInfo;
    }, "writeClientIdentity");
    installDiscoverHandler = /* @__PURE__ */ __name((server, servedModernVersions) => {
      const missing = servedModernVersions.filter((version3) => !server._supportedProtocolVersions.includes(version3));
      if (missing.length > 0) server._supportedProtocolVersions = [...server._supportedProtocolVersions, ...missing];
      server.setRequestHandler("server/discover", () => server._ondiscover());
    }, "installDiscoverHandler");
    readServerIdentity = /* @__PURE__ */ __name((server) => server._serverInfo, "readServerIdentity");
  }
  _capabilities;
  _instructions;
  _jsonSchemaValidator;
  _cacheHints;
  _requestStateVerify;
  _inputRequiredServing;
  _legacyShim;
  _boundFromTransport = false;
  /** Lazily-built legacy shim; the loop lives in legacyInputRequiredShim.ts behind a narrow host contract. */
  _legacyInputRequiredShim() {
    return this._legacyShim ??= new LegacyInputRequiredShim({
      maxRounds: this._inputRequiredServing.maxRounds,
      roundTimeoutMs: this._inputRequiredServing.roundTimeoutMs,
      resolvedClientCapabilities: /* @__PURE__ */ __name((ctx) => this._inputRequestCapabilityView(ctx), "resolvedClientCapabilities"),
      verifyRequestState: /* @__PURE__ */ __name((state, ctx, method) => this._verifyRequestState(state, ctx, method), "verifyRequestState"),
      sendElicitation: /* @__PURE__ */ __name((params, options) => this._sendElicitationLeg(params, options, { validateAcceptedContent: false }), "sendElicitation"),
      sendSampling: /* @__PURE__ */ __name((params, options) => this.createMessage(params, options), "sendSampling"),
      listRoots: /* @__PURE__ */ __name((params, options) => this.listRoots(params, options), "listRoots")
    });
  }
  /**
  * Callback for when initialization has fully completed (i.e., the client has sent an `notifications/initialized` notification).
  */
  oninitialized;
  /**
  * Initializes this server with the given name and version information.
  */
  constructor(_serverInfo, options) {
    super(options);
    this._serverInfo = _serverInfo;
    this._capabilities = options?.capabilities ? { ...options.capabilities } : {};
    this._instructions = options?.instructions;
    this._jsonSchemaValidator = options?.jsonSchemaValidator ?? new CfWorkerJsonSchemaValidator();
    this._requestStateVerify = options?.requestState?.verify;
    this._inputRequiredServing = resolveLegacyShimOptions(options?.inputRequired);
    if (options?.cacheHints !== void 0) {
      for (const [operation, hint] of Object.entries(options.cacheHints)) if (hint !== void 0) assertValidCacheHint(hint, `cacheHints['${operation}']`);
      this._cacheHints = options.cacheHints;
    }
    this.setRequestHandler("initialize", (request) => this._oninitialize(request));
    this.setNotificationHandler("notifications/initialized", () => this.oninitialized?.());
    if (modernProtocolVersions(this._supportedProtocolVersions).length > 0) this.setRequestHandler("server/discover", () => this._ondiscover());
    if (this._capabilities.logging) this._registerLoggingHandler();
  }
  /** Attaches to the given transport; rejects while this instance is connected to another one. */
  async connect(transport) {
    if (this.transport !== void 0) throw new SdkError(SdkErrorCode.AlreadyConnected, "Use a separate Server instance per connection: this instance is already connected to a transport. To connect it to a new transport, call close() first.");
    if (this._boundFromTransport) {
      this._boundFromTransport = false;
      this._negotiatedProtocolVersion = void 0;
    }
    const revision = perRequestClassificationOf(transport)?.revision;
    if (revision !== void 0 && !this._servedModernEra() && SUPPORTED_MODERN_PROTOCOL_VERSIONS.includes(revision) && modernProtocolVersions(this._supportedProtocolVersions).includes(revision)) {
      this._negotiatedProtocolVersion = revision;
      this._boundFromTransport = true;
    }
    await super.connect(transport);
  }
  /**
  * Registers the built-in `logging/setLevel` request handler.
  *
  * @deprecated Deprecated as of protocol version 2026-07-28 (SEP-2577).
  * Remains functional during the deprecation window (at least twelve months).
  * Migrate to stderr logging (STDIO servers) or OpenTelemetry.
  */
  _registerLoggingHandler() {
    this.setRequestHandler("logging/setLevel", async (request, ctx) => {
      const transportSessionId = ctx.sessionId || ctx.http?.req?.headers.get("mcp-session-id") || void 0;
      const { level } = request.params;
      const parseResult = parseSchema(LoggingLevelSchema, level);
      if (parseResult.success) this._loggingLevels.set(transportSessionId, parseResult.data);
      return {};
    });
  }
  buildContext(ctx, transportInfo) {
    const hasHttpInfo = ctx.http || transportInfo?.request || transportInfo?.closeSSEStream || transportInfo?.closeStandaloneSSEStream;
    return {
      ...ctx,
      mcpReq: {
        ...ctx.mcpReq,
        log: /* @__PURE__ */ __name((level, data, logger) => {
          if (!this._capabilities.logging) return Promise.resolve();
          let threshold;
          if (this._servedModernEra()) {
            threshold = ctx.mcpReq.envelope?.[LOG_LEVEL_META_KEY];
            if (threshold === void 0) return Promise.resolve();
          } else threshold = this._loggingLevels.get(ctx.sessionId) ?? this._loggingLevels.get(void 0);
          if (threshold !== void 0 && this.LOG_LEVEL_SEVERITY.get(level) < this.LOG_LEVEL_SEVERITY.get(threshold)) return Promise.resolve();
          return ctx.mcpReq.notify({
            method: "notifications/message",
            params: {
              level,
              data,
              logger
            }
          });
        }, "log"),
        elicitInput: /* @__PURE__ */ __name((params, options) => this.elicitInput(params, options), "elicitInput"),
        requestSampling: /* @__PURE__ */ __name((params, options) => this.createMessage(params, options), "requestSampling")
      },
      http: hasHttpInfo ? {
        ...ctx.http,
        req: transportInfo?.request,
        closeSSE: transportInfo?.closeSSEStream,
        closeStandaloneSSE: transportInfo?.closeStandaloneSSEStream
      } : void 0
    };
  }
  _loggingLevels = /* @__PURE__ */ new Map();
  LOG_LEVEL_SEVERITY = new Map(LoggingLevelSchema.options.map((level, index) => [level, index]));
  isMessageIgnored = /* @__PURE__ */ __name((level, sessionId) => {
    const currentLevel = this._loggingLevels.get(sessionId);
    return currentLevel ? this.LOG_LEVEL_SEVERITY.get(level) < this.LOG_LEVEL_SEVERITY.get(currentLevel) : false;
  }, "isMessageIgnored");
  /**
  * Registers new capabilities. This can only be called before connecting to a transport.
  *
  * The new capabilities will be merged with any existing capabilities previously given (e.g., at initialization).
  */
  registerCapabilities(capabilities) {
    if (this.transport) throw new SdkError(SdkErrorCode.AlreadyConnected, "Cannot register capabilities after connecting to transport");
    const hadLogging = !!this._capabilities.logging;
    this._capabilities = mergeCapabilities(this._capabilities, capabilities);
    if (!hadLogging && this._capabilities.logging) this._registerLoggingHandler();
  }
  /**
  * Enforces server-side validation for `tools/call` results regardless of how the
  * handler was registered, attaches the configured per-operation cache hint
  * (when one exists) so the 2026-07-28 encode seam can fill `ttlMs`/`cacheScope`
  * for results that do not provide their own, and owns the multi-round-trip
  * seam: on the methods whose 2026-07-28 result vocabulary includes
  * `input_required` (`tools/call`, `prompts/get`, `resources/read`) an
  * input-required return skips result-schema validation and is checked
  * against the served era, the at-least-one rule, and the request's own
  * declared client capabilities; on every other method an input-required
  * return is a server bug and fails loudly. The hint rides a symbol-keyed
  * property that is never serialized, so 2025-era responses are unaffected.
  */
  _wrapHandler(method, handler) {
    if (method !== "tools/call") {
      const cacheHint = this._cacheHints?.[method];
      const isInputRequiredCapable = INPUT_REQUIRED_CAPABLE_METHODS.has(method);
      if (cacheHint === void 0 && !isInputRequiredCapable) return async (request, ctx) => {
        const result = await handler(request, ctx);
        if (isInputRequiredResult(result)) throw new ProtocolError(ProtocolErrorCode.InternalError, `Handler for ${method} returned an input-required result, but only tools/call, prompts/get and resources/read support input_required (protocol revision 2026-07-28)`);
        return result;
      };
      return async (request, ctx) => {
        const result = isInputRequiredCapable ? await this._invokeInputRequiredCapableHandler(method, handler, request, ctx) : await handler(request, ctx);
        if (isInputRequiredResult(result)) {
          if (!isInputRequiredCapable) throw new ProtocolError(ProtocolErrorCode.InternalError, `Handler for ${method} returned an input-required result, but only tools/call, prompts/get and resources/read support input_required (protocol revision 2026-07-28)`);
          return result;
        }
        return cacheHint === void 0 ? result : attachCacheHintFallback(result, cacheHint);
      };
    }
    return async (request, ctx) => {
      const codec = codecForVersion(this._negotiatedProtocolVersion);
      const validatedRequest = codec.validateRequest("tools/call", request);
      if (!validatedRequest.ok) throw new ProtocolError(validatedRequest.reason === "not-in-era" ? ProtocolErrorCode.InternalError : ProtocolErrorCode.InvalidParams, validatedRequest.reason === "not-in-era" ? "No wire schema for tools/call in the resolved era" : `Invalid tools/call request: ${validatedRequest.message}`);
      const result = await this._invokeInputRequiredCapableHandler("tools/call", handler, request, ctx);
      if (isInputRequiredResult(result)) return result;
      const normalizedResult = normalizeContentlessToolResult(result);
      const validationResult = codec.validateResult("tools/call", normalizedResult);
      if (!validationResult.ok) throw new ProtocolError(validationResult.reason === "not-in-era" ? ProtocolErrorCode.InternalError : ProtocolErrorCode.InvalidParams, validationResult.reason === "not-in-era" ? "No wire schema for tools/call in the resolved era" : `Invalid tools/call result: ${validationResult.message}`);
      return validationResult.value;
    };
  }
  /**
  * Whether this instance is bound to a 2026-07-28-or-later protocol
  * revision. Era is instance state — a serving entry (`createMcpHandler`,
  * `serveStdio`) marks the instance modern at construction; a 2025-era
  * `initialize` handshake binds it legacy. The multi-round-trip seam reads
  * this directly: there is no per-request era consult.
  */
  _servedModernEra() {
    return this._negotiatedProtocolVersion !== void 0 && isModernProtocolVersion(this._negotiatedProtocolVersion);
  }
  /**
  * Invokes a handler for one of the multi-round-trip methods and applies
  * the input-required seam:
  *
  * - a `UrlElicitationRequiredError` (or any 2025-style server→client
  *   request idiom) escaping the handler on a request served on the
  *   2026-07-28 era fails LOUDLY with a clear steer to
  *   `inputRequired.elicitUrl(...)` — the `-32042` error never reaches the
  *   2026-07-28 wire and the throw is not silently converted. Requests
  *   served on the 2025 era keep today's `-32042` behavior byte-exact (the
  *   error is rethrown unchanged).
  * - an input-required RETURN toward a 2026-07-28 request must satisfy
  *   the at-least-one rule, and every embedded request must be covered by
  *   the capabilities declared on the request's envelope (violations
  *   answer the typed `-32021` error). Toward a 2025-era request the
  *   return is fulfilled by the default-on legacy shim, whose own gate
  *   consults the initialize-declared capabilities and surfaces
  *   violations per family; `inputRequired.legacyShim: false` restores
  *   the pre-shim loud failure.
  */
  async _invokeInputRequiredCapableHandler(method, handler, request, ctx) {
    const servedModern = this._servedModernEra();
    const rawRequestState = ctx.mcpReq.requestState();
    if (rawRequestState !== void 0 && typeof rawRequestState !== "string") throw new ProtocolError(ProtocolErrorCode.InvalidParams, "Invalid or expired requestState", { reason: "invalid_request_state" });
    let ctxForHandler = ctx;
    if (typeof rawRequestState === "string") {
      const decoded = await this._verifyRequestState(rawRequestState, ctx, method);
      if (decoded !== void 0) ctxForHandler = withRequestStateValue(ctx, decoded);
    }
    let result;
    try {
      result = await handler(request, ctxForHandler);
    } catch (error2) {
      if (error2 instanceof ProtocolError && error2.code === ProtocolErrorCode.UrlElicitationRequired) {
        if (!servedModern) throw error2;
        throw new ProtocolError(ProtocolErrorCode.InternalError, `URL elicitation cannot be signalled by throwing UrlElicitationRequiredError on protocol revision ${this._negotiatedProtocolVersion}: return inputRequired({ inputRequests: { \u2026: inputRequired.elicitUrl(...) } }) from the handler instead. The urlElicitationRequired error (-32042) of earlier revisions is not available on this revision.`);
      }
      throw error2;
    }
    if (!isInputRequiredResult(result)) return result;
    if (!servedModern) {
      if (!this._inputRequiredServing.legacyShim) throw new ProtocolError(ProtocolErrorCode.InternalError, `Handler for ${method} returned an input-required result, but this request is served on protocol revision ${this._negotiatedProtocolVersion ?? LATEST_PROTOCOL_VERSION}, which has no input_required vocabulary`);
      return await this._legacyInputRequiredShim().fulfill(method, handler, request, ctxForHandler, result);
    }
    const inputRequests = result.inputRequests;
    const hasInputRequests = inputRequests != null && Object.keys(inputRequests).length > 0;
    const hasRequestState = typeof result.requestState === "string";
    if (!hasInputRequests && !hasRequestState) throw new ProtocolError(ProtocolErrorCode.InternalError, `Handler for ${method} returned an input-required result with neither inputRequests nor requestState (every InputRequiredResult must include at least one of the two)`);
    if (hasInputRequests) {
      const declared = this._inputRequestCapabilityView(ctx);
      for (const [key, entry] of Object.entries(inputRequests)) {
        const { embedded, required: required2 } = coerceEmbeddedInputRequest(method, key, entry);
        const missing = missingClientCapabilities(required2, declared);
        if (missing !== void 0) throw new MissingRequiredClientCapabilityError({ requiredCapabilities: missing }, `Cannot request input '${key}' (${embedded.method}): the request's client capabilities do not declare the required capability`);
      }
    }
    return result;
  }
  /**
  * Runs the configured `requestState.verify` hook and returns its
  * resolved value (`undefined` when unconfigured or the hook returns
  * nothing). Deny-on-error: any hook failure answers the frozen `-32602`;
  * the reason goes to `onerror` only.
  */
  async _verifyRequestState(state, ctx, method) {
    if (this._requestStateVerify === void 0) return;
    try {
      return await this._requestStateVerify(state, ctx);
    } catch (error2) {
      this.onerror?.(/* @__PURE__ */ new Error(`requestState verification rejected ${method}: ${error2 instanceof Error ? error2.message : String(error2)}`));
      throw new ProtocolError(ProtocolErrorCode.InvalidParams, "Invalid or expired requestState", { reason: "invalid_request_state" });
    }
  }
  /**
  * The per-request resolved client-capabilities view: the request's own
  * `_meta` envelope on the 2026 era; the `initialize`-declared state on a
  * 2025-era connection. Per-request instances that never saw an
  * initialize (stateless legacy) hold nothing, so gates refuse there.
  */
  _inputRequestCapabilityView(ctx) {
    return this._servedModernEra() ? ctx.mcpReq.envelope?.[CLIENT_CAPABILITIES_META_KEY] : this._clientCapabilities;
  }
  /**
  * Guard for the push-style server→client request APIs ({@linkcode createMessage},
  * {@linkcode elicitInput}, {@linkcode listRoots}, {@linkcode ping}) on a
  * modern-era instance: the 2026-07-28 revision has no server→client request
  * channel, so the call fails before any wire traffic with a typed error
  * whose message steers to `inputRequired(...)`. The base era gate would
  * also reject it; this guard runs first to carry the steer.
  */
  _assertPushApiInServedEra(method) {
    if (this._servedModernEra()) throw new SdkError(SdkErrorCode.MethodNotSupportedByProtocolVersion, `Server-to-client requests are not available on protocol revision ${this._negotiatedProtocolVersion}: '${method}' cannot be sent while serving a request on that revision. Return inputRequired({ ... }) from the handler instead \u2014 the client fulfils the embedded requests and retries the original request (multi round-trip requests).`, {
      method,
      era: "2026-07-28"
    });
  }
  assertCapabilityForMethod(method) {
    switch (method) {
      case "sampling/createMessage":
        if (!this._clientCapabilities?.sampling) throw new SdkError(SdkErrorCode.CapabilityNotSupported, `Client does not support sampling (required for ${method})`);
        break;
      case "elicitation/create":
        if (!this._clientCapabilities?.elicitation) throw new SdkError(SdkErrorCode.CapabilityNotSupported, `Client does not support elicitation (required for ${method})`);
        break;
      case "roots/list":
        if (!this._clientCapabilities?.roots) throw new SdkError(SdkErrorCode.CapabilityNotSupported, `Client does not support listing roots (required for ${method})`);
        break;
      case "ping":
        break;
    }
  }
  assertNotificationCapability(method) {
    switch (method) {
      case "notifications/message":
        if (!this._capabilities.logging) throw new SdkError(SdkErrorCode.CapabilityNotSupported, `Server does not support logging (required for ${method})`);
        break;
      case "notifications/resources/updated":
      case "notifications/resources/list_changed":
        if (!this._capabilities.resources) throw new SdkError(SdkErrorCode.CapabilityNotSupported, `Server does not support notifying about resources (required for ${method})`);
        break;
      case "notifications/tools/list_changed":
        if (!this._capabilities.tools) throw new SdkError(SdkErrorCode.CapabilityNotSupported, `Server does not support notifying of tool list changes (required for ${method})`);
        break;
      case "notifications/prompts/list_changed":
        if (!this._capabilities.prompts) throw new SdkError(SdkErrorCode.CapabilityNotSupported, `Server does not support notifying of prompt list changes (required for ${method})`);
        break;
      case "notifications/elicitation/complete":
        if (!this._clientCapabilities?.elicitation?.url) throw new SdkError(SdkErrorCode.CapabilityNotSupported, `Client does not support URL elicitation (required for ${method})`);
        break;
      case "notifications/cancelled":
        break;
      case "notifications/progress":
        break;
    }
  }
  assertRequestHandlerCapability(method) {
    switch (method) {
      case "completion/complete":
        if (!this._capabilities.completions) throw new SdkError(SdkErrorCode.CapabilityNotSupported, `Server does not support completions (required for ${method})`);
        break;
      case "logging/setLevel":
        if (!this._capabilities.logging) throw new SdkError(SdkErrorCode.CapabilityNotSupported, `Server does not support logging (required for ${method})`);
        break;
      case "prompts/get":
      case "prompts/list":
        if (!this._capabilities.prompts) throw new SdkError(SdkErrorCode.CapabilityNotSupported, `Server does not support prompts (required for ${method})`);
        break;
      case "resources/list":
      case "resources/templates/list":
      case "resources/read":
        if (!this._capabilities.resources) throw new SdkError(SdkErrorCode.CapabilityNotSupported, `Server does not support resources (required for ${method})`);
        break;
      case "tools/call":
      case "tools/list":
        if (!this._capabilities.tools) throw new SdkError(SdkErrorCode.CapabilityNotSupported, `Server does not support tools (required for ${method})`);
        break;
      case "ping":
      case "initialize":
        break;
    }
  }
  async _oninitialize(request) {
    const requestedVersion = request.params.protocolVersion;
    this._clientCapabilities = request.params.capabilities;
    this._clientVersion = request.params.clientInfo;
    const legacyVersions = legacyProtocolVersions(this._supportedProtocolVersions);
    const protocolVersion = legacyVersions.includes(requestedVersion) ? requestedVersion : legacyVersions[0] ?? LATEST_PROTOCOL_VERSION;
    this._negotiatedProtocolVersion = protocolVersion;
    this.transport?.setProtocolVersion?.(protocolVersion);
    return {
      protocolVersion,
      capabilities: this.getCapabilities(),
      serverInfo: this._serverInfo,
      ...this._instructions && { instructions: this._instructions }
    };
  }
  /**
  * Answers `server/discover` (protocol revision 2026-07-28). `supportedVersions`
  * lists only modern revisions (2025-era versions are negotiated via `initialize`);
  * the capabilities are advertised as-is, listChanged/subscribe bits included
  * (see {@linkcode discoverAdvertisedCapabilities}).
  */
  _ondiscover() {
    return {
      supportedVersions: modernProtocolVersions(this._supportedProtocolVersions),
      capabilities: discoverAdvertisedCapabilities(this.getCapabilities()),
      ...this._instructions && { instructions: this._instructions }
    };
  }
  /**
  * The identity the 2026-era encode seam stamps into every outbound
  * result's `_meta` under `io.modelcontextprotocol/serverInfo` (spec PR
  * #3002: servers SHOULD identify themselves on every response).
  */
  _outboundServerInfo() {
    return this._serverInfo;
  }
  /**
  * After initialization has completed, this will be populated with the client's reported capabilities.
  *
  * @deprecated Read client identity from the per-request handler context instead: on
  * 2026-07-28 (per-request envelope) requests `ctx.mcpReq.envelope` carries the client's
  * declared capabilities, while on 2025-era connections this accessor keeps returning the
  * `initialize`-scoped value. The accessor remains functional where `createMcpHandler`
  * serves the 2026-07-28 era: it backfills it per request from the validated envelope.
  */
  getClientCapabilities() {
    return this._clientCapabilities;
  }
  /**
  * After initialization has completed, this will be populated with information about the client's name and version.
  *
  * @deprecated Read client identity from the per-request handler context instead: on
  * 2026-07-28 (per-request envelope) requests `ctx.mcpReq.envelope` carries the client's
  * name and version, while on 2025-era connections this accessor keeps returning the
  * `initialize`-scoped value. The accessor remains functional where `createMcpHandler`
  * serves the 2026-07-28 era: it backfills it per request from the validated envelope.
  */
  getClientVersion() {
    return this._clientVersion;
  }
  /**
  * After initialization has completed, this will be populated with the protocol version negotiated
  * with the client (the version the server responded with during the initialize handshake), or
  * `undefined` before initialization.
  *
  * @deprecated Read the protocol revision from the per-request handler context instead: on
  * 2026-07-28 (per-request envelope) requests `ctx.mcpReq.envelope` names the revision the
  * request was sent for, while on 2025-era connections this accessor keeps returning the
  * `initialize`-negotiated version. The accessor remains functional — instances serving the
  * 2026-07-28 era report that revision.
  */
  getNegotiatedProtocolVersion() {
    return this._negotiatedProtocolVersion;
  }
  /**
  * Project a `tools/call` result through this instance's negotiated wire
  * codec — the era-agnostic SEP-2106 §4.3 TextContent auto-append, plus on
  * the 2025 era the `{result:…}` wrap when `structuredContent` is a
  * non-object value or the advertised `outputSchema` had a non-object root.
  * Identity for object-shaped `structuredContent` on the 2026 era.
  *
  * `McpServer`'s built-in `tools/call` handler routes through this method.
  * Low-level `setRequestHandler('tools/call', …)` authors call it
  * themselves so the projection lives in one place (the codec) and the
  * server-side handler stays era-blind.
  *
  * This is the only codec function exposed on `Server` — the full
  * `WireCodec` is intentionally not part of the public surface.
  */
  projectCallToolResult(result, advertisedOutputSchema) {
    return this._wireCodec().projectCallToolResult(result, advertisedOutputSchema);
  }
  /**
  * Returns the current server capabilities.
  */
  getCapabilities() {
    return this._capabilities;
  }
  /**
  * Sends a `ping` request to the connected client.
  *
  * @deprecated The 2026-07-28 protocol removed ping; it throws on a 2026-07-28-era instance.
  * If your factory serves both eras, this only works on the legacy path.
  */
  async ping() {
    this._assertPushApiInServedEra("ping");
    return this.request({ method: "ping" });
  }
  async createMessage(params, options) {
    this._assertPushApiInServedEra("sampling/createMessage");
    if ((params.tools || params.toolChoice) && !this._clientCapabilities?.sampling?.tools) throw new SdkError(SdkErrorCode.CapabilityNotSupported, "Client does not support sampling tools capability.");
    if (params.messages.length > 0) {
      const lastMessage = params.messages.at(-1);
      const lastContent = Array.isArray(lastMessage.content) ? lastMessage.content : [lastMessage.content];
      const hasToolResults = lastContent.some((c) => c.type === "tool_result");
      const previousMessage = params.messages.length > 1 ? params.messages.at(-2) : void 0;
      const previousContent = previousMessage ? Array.isArray(previousMessage.content) ? previousMessage.content : [previousMessage.content] : [];
      const hasPreviousToolUse = previousContent.some((c) => c.type === "tool_use");
      if (hasToolResults) {
        if (lastContent.some((c) => c.type !== "tool_result")) throw new ProtocolError(ProtocolErrorCode.InvalidParams, "The last message must contain only tool_result content if any is present");
        if (!hasPreviousToolUse) throw new ProtocolError(ProtocolErrorCode.InvalidParams, "tool_result blocks are not matching any tool_use from the previous message");
      }
      if (hasPreviousToolUse) {
        const toolUseIds = new Set(previousContent.filter((c) => c.type === "tool_use").map((c) => c.id));
        const toolResultIds = new Set(lastContent.filter((c) => c.type === "tool_result").map((c) => c.toolUseId));
        if (toolUseIds.size !== toolResultIds.size || ![...toolUseIds].every((id) => toolResultIds.has(id))) throw new ProtocolError(ProtocolErrorCode.InvalidParams, "ids of tool_result blocks and tool_use blocks from previous message do not match");
      }
    }
    const hasTools = Boolean(params.tools || params.toolChoice);
    const wide = await this.request({
      method: "sampling/createMessage",
      params
    }, options);
    const outcome = this._wireCodec().samplingResultVariant(hasTools, wide);
    if (!outcome.ok) throw new SdkError(SdkErrorCode.InvalidResult, `Invalid sampling/createMessage result: ${outcome.reason === "invalid" ? outcome.message : outcome.reason}`);
    return outcome.value;
  }
  /**
  * Creates an elicitation request for the given parameters.
  * For backwards compatibility, `mode` may be omitted for form requests and will default to `"form"`.
  * @param params The parameters for the elicitation request.
  * @param options Optional request options.
  * @returns The result of the elicitation request.
  *
  * @deprecated Throws on a 2026-07-28-era request — use {@link index.inputRequired | inputRequired} (multi-round-trip)
  * instead. The 2025 push-style server-to-client request model is replaced by input_required
  * results in the 2026-07-28 protocol. If your factory serves both eras, this only works on the
  * legacy path.
  */
  async elicitInput(params, options) {
    this._assertPushApiInServedEra("elicitation/create");
    switch (params.mode ?? "form") {
      case "url":
        if (!this._clientCapabilities?.elicitation?.url) throw new SdkError(SdkErrorCode.CapabilityNotSupported, "Client does not support url elicitation.");
        break;
      case "form":
        if (!this._clientCapabilities?.elicitation?.form) throw new SdkError(SdkErrorCode.CapabilityNotSupported, "Client does not support form elicitation.");
        break;
    }
    return this._sendElicitationLeg(params, options);
  }
  /**
  * The capability-check-free core of {@linkcode elicitInput}. The shim
  * uses it because its gate differs from the public checks: a bare
  * `elicitation: {}` counts as form support (the pre-mode rule), and
  * accepted content passes through unvalidated for parity with the
  * modern client driver (handlers validate via the schema-aware
  * `acceptedContent` overload and can re-ask).
  */
  async _sendElicitationLeg(params, options, behavior) {
    const mode = params.mode ?? "form";
    const validateAcceptedContent = behavior?.validateAcceptedContent ?? true;
    switch (mode) {
      case "url": {
        const urlParams = params;
        return this.request({
          method: "elicitation/create",
          params: urlParams
        }, options);
      }
      case "form": {
        const formParams = params.mode === "form" ? params : {
          ...params,
          mode: "form"
        };
        const result = await this.request({
          method: "elicitation/create",
          params: formParams
        }, options);
        if (validateAcceptedContent && result.action === "accept" && result.content && formParams.requestedSchema) try {
          const validationResult = this._jsonSchemaValidator.getValidator(formParams.requestedSchema)(result.content);
          if (!validationResult.valid) throw new ProtocolError(ProtocolErrorCode.InvalidParams, `Elicitation response content does not match requested schema: ${validationResult.errorMessage}`);
        } catch (error2) {
          if (error2 instanceof ProtocolError) throw error2;
          throw new ProtocolError(ProtocolErrorCode.InternalError, `Error validating elicitation response: ${error2 instanceof Error ? error2.message : String(error2)}`);
        }
        return result;
      }
    }
  }
  /**
  * Creates a reusable callback that, when invoked, will send a `notifications/elicitation/complete`
  * notification for the specified elicitation ID.
  *
  * The notification (and the `elicitationId` it references) exists only on protocol revision
  * 2025-11-25 — the 2026-07-28 revision removed both. On a connection negotiated at 2026-07-28 the
  * returned callback rejects with a typed local error before anything reaches the transport
  * (the method is not part of that revision's wire registry).
  *
  * @param elicitationId The ID of the elicitation to mark as complete.
  * @param options Optional notification options. Useful when the completion notification should be related to a prior request.
  * @returns A function that emits the completion notification when awaited.
  */
  createElicitationCompletionNotifier(elicitationId, options) {
    if (!this._clientCapabilities?.elicitation?.url) throw new SdkError(SdkErrorCode.CapabilityNotSupported, "Client does not support URL elicitation (required for notifications/elicitation/complete)");
    return () => this.notification({
      method: "notifications/elicitation/complete",
      params: { elicitationId }
    }, options);
  }
  /**
  * Requests the list of roots from the client.
  *
  * @deprecated Deprecated as of protocol version 2026-07-28 (SEP-2577).
  * Throws on a 2026-07-28-era request — use {@link index.inputRequired | inputRequired} (multi-round-trip) instead,
  * or migrate to passing paths via tool parameters, resource URIs, or configuration. The 2025
  * push-style server-to-client request model is replaced by input_required results in the
  * 2026-07-28 protocol. If your factory serves both eras, this only works on the legacy path.
  */
  async listRoots(params, options) {
    this._assertPushApiInServedEra("roots/list");
    return this.request({
      method: "roots/list",
      params
    }, options);
  }
  /**
  * Sends a logging message to the client, if connected.
  * Note: You only need to send the parameters object, not the entire JSON-RPC message.
  * @see {@linkcode LoggingMessageNotification}
  * @param params
  * @param sessionId Optional for stateless transports and backward compatibility.
  *
  * @deprecated Deprecated as of protocol version 2026-07-28 (SEP-2577).
  * Remains functional during the deprecation window (at least twelve months).
  * Migrate to stderr logging (STDIO servers) or OpenTelemetry.
  */
  async sendLoggingMessage(params, sessionId) {
    if (this._capabilities.logging && !this.isMessageIgnored(params.level, sessionId)) return this.notification({
      method: "notifications/message",
      params
    });
  }
  async sendResourceUpdated(params) {
    return this.notification({
      method: "notifications/resources/updated",
      params
    });
  }
  async sendResourceListChanged() {
    return this.notification({ method: "notifications/resources/list_changed" });
  }
  async sendToolListChanged() {
    return this.notification({ method: "notifications/tools/list_changed" });
  }
  async sendPromptListChanged() {
    return this.notification({ method: "notifications/prompts/list_changed" });
  }
};
function discoverAdvertisedCapabilities(capabilities) {
  return { ...capabilities };
}
__name(discoverAdvertisedCapabilities, "discoverAdvertisedCapabilities");
function toolInputElementCount(value, max) {
  let count = 0;
  const stack = [value];
  while (stack.length > 0) {
    const node2 = stack.pop();
    if (node2 === null || typeof node2 !== "object") continue;
    if (Array.isArray(node2)) for (const child of node2) {
      if (++count > max) return count;
      if (child !== null && typeof child === "object") stack.push(child);
    }
    else for (const key in node2) {
      if (!Object.prototype.hasOwnProperty.call(node2, key)) continue;
      if (++count > max) return count;
      const child = node2[key];
      if (child !== null && typeof child === "object") stack.push(child);
    }
  }
  return count;
}
__name(toolInputElementCount, "toolInputElementCount");
function resolveMaxToolInputElements(value) {
  if (value === void 0 || value === Infinity) return void 0;
  if (typeof value !== "number" || Number.isNaN(value) || value < 1) throw new RangeError(`maxToolInputElements must be a number of at least 1, or Infinity, got ${String(value)}`);
  return value;
}
__name(resolveMaxToolInputElements, "resolveMaxToolInputElements");
var McpServer = class {
  static {
    __name(this, "McpServer");
  }
  /**
  * The underlying {@linkcode Server} instance, useful for advanced operations like sending notifications.
  */
  server;
  _maxToolInputElements;
  _registeredResources = {};
  _registeredResourceTemplates = {};
  _registeredTools = {};
  _registeredPrompts = {};
  /** Per-tool JSON-converted `inputSchema`, filled on first use by `toolInputSchemaJson()`. */
  _toolInputSchemaJson = {};
  /**
  * The JSON-serialized `inputSchema` of a registered tool, or `undefined`
  * when no such tool is registered. Used by the HTTP entry's pre-dispatch
  * SEP-2243 `Mcp-Param-*` validation step (which needs the same JSON Schema
  * `tools/list` would emit, before dispatch reaches the handler).
  *
  * @internal
  */
  toolInputSchemaJson(name) {
    const tool = this._registeredTools[name];
    if (tool === void 0 || !tool.enabled) return void 0;
    if (Object.hasOwn(this._toolInputSchemaJson, name)) return this._toolInputSchemaJson[name];
    if (tool.inputSchema === void 0) return EMPTY_OBJECT_JSON_SCHEMA;
    try {
      const json = standardSchemaToJsonSchema(tool.inputSchema, "input");
      this._toolInputSchemaJson[name] = json;
      return json;
    } catch {
      return;
    }
  }
  constructor(serverInfo, options) {
    this.server = new Server(serverInfo, options);
    this._maxToolInputElements = resolveMaxToolInputElements(options?.maxToolInputElements);
    if (options?.capabilities?.tools) this.setToolRequestHandlers();
    if (options?.capabilities?.resources) this.setResourceRequestHandlers();
    if (options?.capabilities?.prompts) this.setPromptRequestHandlers();
  }
  /**
  * Attaches to the given transport, starts it, and starts listening for messages.
  *
  * The `server` object assumes ownership of the {@linkcode Transport}, replacing any callbacks that have already been set, and expects that it is the only user of the {@linkcode Transport} instance going forward.
  *
  * @example
  * ```ts source="./mcp.examples.ts#McpServer_connect_stdio"
  * const server = new McpServer({ name: 'my-server', version: '1.0.0' });
  * const transport = new StdioServerTransport();
  * await server.connect(transport);
  * ```
  */
  async connect(transport) {
    if (supportsScopeChallengeResolver(transport)) transport.setScopeChallengeResolver((context) => this.resolveScopeChallenge(context));
    return await this.server.connect(transport);
  }
  /**
  * Closes the connection.
  */
  async close() {
    await this.server.close();
  }
  /** @internal */
  resolveScopeChallenge = /* @__PURE__ */ __name((context) => {
    switch (context.request.method) {
      case "tools/call": {
        const toolName = context.request.params?.name;
        if (typeof toolName !== "string") return;
        const tool = this._registeredTools[toolName];
        if (tool === void 0 || !tool.enabled) return;
        return tool.scopeChallenge?.(context);
      }
      case "resources/read": {
        const resourceUri = context.request.params?.uri;
        if (typeof resourceUri !== "string") return;
        let uri2;
        try {
          uri2 = new URL(resourceUri);
        } catch {
          return;
        }
        const resource = this._registeredResources[uri2.toString()];
        if (resource !== void 0) return resource.enabled ? resource.scopeChallenge?.(context) : void 0;
        for (const template of Object.values(this._registeredResourceTemplates)) if (template.resourceTemplate.uriTemplate.match(uri2.toString())) return template.enabled ? template.scopeChallenge?.(context) : void 0;
        return;
      }
      case "prompts/get": {
        const promptName = context.request.params?.name;
        if (typeof promptName !== "string") return;
        const prompt = this._registeredPrompts[promptName];
        if (prompt === void 0 || !prompt.enabled) return;
        return prompt.scopeChallenge?.(context);
      }
      default:
        return;
    }
  }, "resolveScopeChallenge");
  _toolHandlersInitialized = false;
  setToolRequestHandlers() {
    if (this._toolHandlersInitialized) return;
    this.server.assertCanSetRequestHandler("tools/list");
    this.server.assertCanSetRequestHandler("tools/call");
    this.server.registerCapabilities({ tools: { listChanged: this.server.getCapabilities().tools?.listChanged ?? true } });
    this.server.setRequestHandler("tools/list", () => ({ tools: Object.entries(this._registeredTools).filter(([, tool]) => tool.enabled).map(([name, tool]) => {
      const toolDefinition = {
        name,
        title: tool.title,
        description: tool.description,
        inputSchema: tool.inputSchema ? convertListedInputSchema(name, tool.inputSchema) : EMPTY_OBJECT_JSON_SCHEMA,
        annotations: tool.annotations,
        icons: tool.icons,
        execution: tool.execution,
        _meta: tool._meta
      };
      if (tool.outputSchema) toolDefinition.outputSchema = standardSchemaToJsonSchema(tool.outputSchema, "output");
      return toolDefinition;
    }) }));
    this.server.setRequestHandler("tools/call", async (request, ctx) => {
      const tool = this._registeredTools[request.params.name];
      if (!tool) throw new ProtocolError(ProtocolErrorCode.InvalidParams, `Tool ${request.params.name} not found`);
      if (!tool.enabled) throw new ProtocolError(ProtocolErrorCode.InvalidParams, `Tool ${request.params.name} disabled`);
      try {
        const args = await this.validateToolInput(tool, request.params.arguments, request.params.name);
        const result = await this.executeToolHandler(tool, args, ctx);
        await this.validateToolOutput(tool, result, request.params.name);
        if (isInputRequiredResult(result)) return result;
        return this.server.projectCallToolResult(result, tool.outputSchemaJson);
      } catch (error2) {
        if (error2 instanceof ProtocolError && error2.code === ProtocolErrorCode.UrlElicitationRequired) throw error2;
        return this.createToolError(error2 instanceof Error ? error2.message : String(error2));
      }
    });
    this._toolHandlersInitialized = true;
  }
  /**
  * Creates a tool error result.
  *
  * @param errorMessage - The error message.
  * @returns The tool error result.
  */
  createToolError(errorMessage) {
    return {
      content: [{
        type: "text",
        text: errorMessage
      }],
      isError: true
    };
  }
  /**
  * Validates tool input arguments against the tool's input schema.
  */
  async validateToolInput(tool, args, toolName) {
    if (this._maxToolInputElements !== void 0 && toolInputElementCount(args, this._maxToolInputElements) > this._maxToolInputElements) throw new ProtocolError(ProtocolErrorCode.InvalidParams, `Invalid arguments for tool ${toolName}: arguments contain more than the maximum of ${this._maxToolInputElements} elements`);
    if (!tool.inputSchema) return;
    const parseResult = await validateStandardSchema(tool.inputSchema, args ?? {});
    if (!parseResult.success) throw new ProtocolError(ProtocolErrorCode.InvalidParams, `Input validation error: Invalid arguments for tool ${toolName}: ${parseResult.error}`);
    return parseResult.data;
  }
  /**
  * Validates tool output against the tool's output schema.
  */
  async validateToolOutput(tool, result, toolName) {
    if (!tool.outputSchema) return;
    if (isInputRequiredResult(result)) return;
    if (result.isError) return;
    if (result.structuredContent === void 0) throw new ProtocolError(ProtocolErrorCode.InvalidParams, `Output validation error: Tool ${toolName} has an output schema but no structured content was provided`);
    const parseResult = await validateStandardSchema(tool.outputSchema, result.structuredContent);
    if (!parseResult.success) throw new ProtocolError(ProtocolErrorCode.InvalidParams, `Output validation error: Invalid structured content for tool ${toolName}: ${parseResult.error}`);
  }
  /**
  * Executes a tool handler.
  */
  async executeToolHandler(tool, args, ctx) {
    return tool.executor(args, ctx);
  }
  _completionHandlerInitialized = false;
  setCompletionRequestHandler() {
    if (this._completionHandlerInitialized) return;
    this.server.assertCanSetRequestHandler("completion/complete");
    this.server.registerCapabilities({ completions: {} });
    this.server.setRequestHandler("completion/complete", async (request) => {
      switch (request.params.ref.type) {
        case "ref/prompt":
          assertCompleteRequestPrompt(request);
          return this.handlePromptCompletion(request, request.params.ref);
        case "ref/resource":
          assertCompleteRequestResourceTemplate(request);
          return this.handleResourceCompletion(request, request.params.ref);
        default:
          throw new ProtocolError(ProtocolErrorCode.InvalidParams, `Invalid completion reference: ${request.params.ref}`);
      }
    });
    this._completionHandlerInitialized = true;
  }
  async handlePromptCompletion(request, ref) {
    const prompt = this._registeredPrompts[ref.name];
    if (!prompt) throw new ProtocolError(ProtocolErrorCode.InvalidParams, `Prompt ${ref.name} not found`);
    if (!prompt.enabled) throw new ProtocolError(ProtocolErrorCode.InvalidParams, `Prompt ${ref.name} disabled`);
    if (!prompt.argsSchema) return EMPTY_COMPLETION_RESULT;
    const field = unwrapOptionalSchema(getSchemaShape(prompt.argsSchema)?.[request.params.argument.name]);
    if (!isCompletable(field)) return EMPTY_COMPLETION_RESULT;
    const completer = getCompleter(field);
    if (!completer) return EMPTY_COMPLETION_RESULT;
    return createCompletionResult(await completer(request.params.argument.value, request.params.context));
  }
  async handleResourceCompletion(request, ref) {
    const template = Object.values(this._registeredResourceTemplates).find((t) => t.resourceTemplate.uriTemplate.toString() === ref.uri);
    if (!template) {
      if (this._registeredResources[ref.uri]) return EMPTY_COMPLETION_RESULT;
      throw new ProtocolError(ProtocolErrorCode.InvalidParams, `Resource template ${request.params.ref.uri} not found`);
    }
    const completer = template.resourceTemplate.completeCallback(request.params.argument.name);
    if (!completer) return EMPTY_COMPLETION_RESULT;
    return createCompletionResult(await completer(request.params.argument.value, request.params.context));
  }
  _resourceHandlersInitialized = false;
  setResourceRequestHandlers() {
    if (this._resourceHandlersInitialized) return;
    this.server.assertCanSetRequestHandler("resources/list");
    this.server.assertCanSetRequestHandler("resources/templates/list");
    this.server.assertCanSetRequestHandler("resources/read");
    this.server.registerCapabilities({ resources: { listChanged: this.server.getCapabilities().resources?.listChanged ?? true } });
    this.server.setRequestHandler("resources/list", async (_request, ctx) => {
      const resources = Object.entries(this._registeredResources).filter(([_, resource]) => resource.enabled).map(([uri2, resource]) => ({
        uri: uri2,
        name: resource.name,
        ...resource.metadata
      }));
      const templateResources = [];
      for (const template of Object.values(this._registeredResourceTemplates)) {
        if (!template.resourceTemplate.listCallback) continue;
        const result = await template.resourceTemplate.listCallback(ctx);
        for (const resource of result.resources) templateResources.push({
          ...template.metadata,
          ...resource
        });
      }
      return { resources: [...resources, ...templateResources] };
    });
    this.server.setRequestHandler("resources/templates/list", async () => {
      return { resourceTemplates: Object.entries(this._registeredResourceTemplates).map(([name, template]) => ({
        name,
        uriTemplate: template.resourceTemplate.uriTemplate.toString(),
        ...template.metadata
      })) };
    });
    this.server.setRequestHandler("resources/read", async (request, ctx) => {
      let uri2;
      try {
        uri2 = new URL(request.params.uri);
      } catch {
        throw new ProtocolError(ProtocolErrorCode.InvalidParams, `Resource URI ${request.params.uri} is invalid`, {
          uri: request.params.uri,
          reason: "invalid_uri"
        });
      }
      const resource = this._registeredResources[uri2.toString()];
      if (resource) {
        if (!resource.enabled) throw new ProtocolError(ProtocolErrorCode.InvalidParams, `Resource ${uri2} disabled`);
        return attachCacheHintFallback(await resource.readCallback(uri2, ctx), resource.cacheHint);
      }
      for (const template of Object.values(this._registeredResourceTemplates)) {
        const variables = template.resourceTemplate.uriTemplate.match(uri2.toString());
        if (variables) {
          if (!template.enabled) throw new ProtocolError(ProtocolErrorCode.InvalidParams, `Resource template ${template.resourceTemplate.uriTemplate} disabled`);
          return attachCacheHintFallback(await template.readCallback(uri2, variables, ctx), template.cacheHint);
        }
      }
      throw new ResourceNotFoundError(request.params.uri);
    });
    this._resourceHandlersInitialized = true;
  }
  _promptHandlersInitialized = false;
  setPromptRequestHandlers() {
    if (this._promptHandlersInitialized) return;
    this.server.assertCanSetRequestHandler("prompts/list");
    this.server.assertCanSetRequestHandler("prompts/get");
    this.server.registerCapabilities({ prompts: { listChanged: this.server.getCapabilities().prompts?.listChanged ?? true } });
    this.server.setRequestHandler("prompts/list", () => ({ prompts: Object.entries(this._registeredPrompts).filter(([, prompt]) => prompt.enabled).map(([name, prompt]) => {
      return {
        name,
        title: prompt.title,
        description: prompt.description,
        arguments: prompt.argsSchema ? promptArgumentsFromStandardSchema(prompt.argsSchema) : void 0,
        icons: prompt.icons,
        _meta: prompt._meta
      };
    }) }));
    this.server.setRequestHandler("prompts/get", async (request, ctx) => {
      const prompt = this._registeredPrompts[request.params.name];
      if (!prompt) throw new ProtocolError(ProtocolErrorCode.InvalidParams, `Prompt ${request.params.name} not found`);
      if (!prompt.enabled) throw new ProtocolError(ProtocolErrorCode.InvalidParams, `Prompt ${request.params.name} disabled`);
      return prompt.handler(request.params.arguments, ctx);
    });
    this._promptHandlersInitialized = true;
  }
  registerResource(name, uriOrTemplate, config2, readCallback) {
    const { cacheHint, scopeChallenge, ...resourceMetadata } = config2;
    const metadata = resourceMetadata;
    if (cacheHint !== void 0) assertValidCacheHint(cacheHint, `resource ${name}`);
    if (typeof uriOrTemplate === "string") {
      if (this._registeredResources[uriOrTemplate]) throw new Error(`Resource ${uriOrTemplate} is already registered`);
      const registeredResource = this._createRegisteredResource(name, config2.title, uriOrTemplate, metadata, scopeChallenge, readCallback);
      if (cacheHint !== void 0) registeredResource.cacheHint = cacheHint;
      this.setResourceRequestHandlers();
      this.sendResourceListChanged();
      return registeredResource;
    } else {
      if (this._registeredResourceTemplates[name]) throw new Error(`Resource template ${name} is already registered`);
      const registeredResourceTemplate = this._createRegisteredResourceTemplate(name, config2.title, uriOrTemplate, metadata, scopeChallenge, readCallback);
      if (cacheHint !== void 0) registeredResourceTemplate.cacheHint = cacheHint;
      this.setResourceRequestHandlers();
      this.sendResourceListChanged();
      return registeredResourceTemplate;
    }
  }
  _createRegisteredResource(name, title, uri2, metadata, scopeChallenge, readCallback) {
    const registeredResource = {
      name,
      title,
      metadata,
      readCallback,
      scopeChallenge,
      enabled: true,
      disable: /* @__PURE__ */ __name(() => registeredResource.update({ enabled: false }), "disable"),
      enable: /* @__PURE__ */ __name(() => registeredResource.update({ enabled: true }), "enable"),
      remove: /* @__PURE__ */ __name(() => registeredResource.update({ uri: null }), "remove"),
      update: /* @__PURE__ */ __name((updates) => {
        if (updates.uri !== void 0 && updates.uri !== uri2) {
          delete this._registeredResources[uri2];
          if (updates.uri) this._registeredResources[updates.uri] = registeredResource;
        }
        if (updates.name !== void 0) registeredResource.name = updates.name;
        if (updates.metadata !== void 0) registeredResource.metadata = updates.metadata;
        if (updates.title !== void 0) {
          registeredResource.title = updates.title;
          registeredResource.metadata = {
            ...registeredResource.metadata,
            title: updates.title
          };
        }
        if (updates.callback !== void 0) registeredResource.readCallback = updates.callback;
        if (updates.scopeChallenge !== void 0) registeredResource.scopeChallenge = updates.scopeChallenge === null ? void 0 : updates.scopeChallenge;
        if (updates.enabled !== void 0) registeredResource.enabled = updates.enabled;
        this.sendResourceListChanged();
      }, "update")
    };
    this._registeredResources[uri2] = registeredResource;
    return registeredResource;
  }
  _createRegisteredResourceTemplate(name, title, template, metadata, scopeChallenge, readCallback) {
    const registeredResourceTemplate = {
      resourceTemplate: template,
      title,
      metadata,
      readCallback,
      scopeChallenge,
      enabled: true,
      disable: /* @__PURE__ */ __name(() => registeredResourceTemplate.update({ enabled: false }), "disable"),
      enable: /* @__PURE__ */ __name(() => registeredResourceTemplate.update({ enabled: true }), "enable"),
      remove: /* @__PURE__ */ __name(() => registeredResourceTemplate.update({ name: null }), "remove"),
      update: /* @__PURE__ */ __name((updates) => {
        if (updates.name !== void 0 && updates.name !== name) {
          delete this._registeredResourceTemplates[name];
          if (updates.name) this._registeredResourceTemplates[updates.name] = registeredResourceTemplate;
        }
        if (updates.template !== void 0) registeredResourceTemplate.resourceTemplate = updates.template;
        if (updates.metadata !== void 0) registeredResourceTemplate.metadata = updates.metadata;
        if (updates.title !== void 0) {
          registeredResourceTemplate.title = updates.title;
          registeredResourceTemplate.metadata = {
            ...registeredResourceTemplate.metadata,
            title: updates.title
          };
        }
        if (updates.callback !== void 0) registeredResourceTemplate.readCallback = updates.callback;
        if (updates.scopeChallenge !== void 0) registeredResourceTemplate.scopeChallenge = updates.scopeChallenge === null ? void 0 : updates.scopeChallenge;
        if (updates.enabled !== void 0) registeredResourceTemplate.enabled = updates.enabled;
        this.sendResourceListChanged();
      }, "update")
    };
    this._registeredResourceTemplates[name] = registeredResourceTemplate;
    const variableNames = template.uriTemplate.variableNames;
    if (Array.isArray(variableNames) && variableNames.some((v) => !!template.completeCallback(v))) this.setCompletionRequestHandler();
    return registeredResourceTemplate;
  }
  _createRegisteredPrompt(name, title, description, argsSchema, callback, icons, scopeChallenge, _meta) {
    let currentArgsSchema = argsSchema;
    let currentCallback = callback;
    const registeredPrompt = {
      title,
      description,
      argsSchema,
      icons,
      scopeChallenge,
      _meta,
      handler: createPromptHandler(name, argsSchema, callback),
      enabled: true,
      disable: /* @__PURE__ */ __name(() => registeredPrompt.update({ enabled: false }), "disable"),
      enable: /* @__PURE__ */ __name(() => registeredPrompt.update({ enabled: true }), "enable"),
      remove: /* @__PURE__ */ __name(() => registeredPrompt.update({ name: null }), "remove"),
      update: /* @__PURE__ */ __name((updates) => {
        if (updates.name !== void 0 && updates.name !== name) {
          delete this._registeredPrompts[name];
          if (updates.name) this._registeredPrompts[updates.name] = registeredPrompt;
        }
        if (updates.title !== void 0) registeredPrompt.title = updates.title;
        if (updates.description !== void 0) registeredPrompt.description = updates.description;
        if (updates.icons !== void 0) registeredPrompt.icons = updates.icons;
        if (updates.scopeChallenge !== void 0) registeredPrompt.scopeChallenge = updates.scopeChallenge === null ? void 0 : updates.scopeChallenge;
        if (updates._meta !== void 0) registeredPrompt._meta = updates._meta;
        let needsHandlerRegen = false;
        if (updates.argsSchema !== void 0) {
          registeredPrompt.argsSchema = updates.argsSchema;
          currentArgsSchema = updates.argsSchema;
          needsHandlerRegen = true;
        }
        if (updates.callback !== void 0) {
          currentCallback = updates.callback;
          needsHandlerRegen = true;
        }
        if (needsHandlerRegen) registeredPrompt.handler = createPromptHandler(name, currentArgsSchema, currentCallback);
        if (updates.enabled !== void 0) registeredPrompt.enabled = updates.enabled;
        this.sendPromptListChanged();
      }, "update")
    };
    this._registeredPrompts[name] = registeredPrompt;
    if (argsSchema) {
      const shape = getSchemaShape(argsSchema);
      if (shape) {
        if (Object.values(shape).some((field) => {
          return isCompletable(unwrapOptionalSchema(field));
        })) this.setCompletionRequestHandler();
      }
    }
    return registeredPrompt;
  }
  _createRegisteredTool(name, title, description, inputSchema, outputSchema, annotations, icons, execution, scopeChallenge, _meta, handler) {
    validateAndWarnToolName(name);
    let currentHandler = handler;
    let outputSchemaJson;
    const registeredTool = {
      title,
      description,
      inputSchema,
      outputSchema,
      get outputSchemaJson() {
        return outputSchemaJson ??= convertOutputSchemaJson(registeredTool.outputSchema);
      },
      set outputSchemaJson(value) {
        outputSchemaJson = value;
      },
      annotations,
      icons,
      execution,
      scopeChallenge,
      _meta,
      handler,
      executor: createToolExecutor(inputSchema, handler),
      enabled: true,
      disable: /* @__PURE__ */ __name(() => registeredTool.update({ enabled: false }), "disable"),
      enable: /* @__PURE__ */ __name(() => registeredTool.update({ enabled: true }), "enable"),
      remove: /* @__PURE__ */ __name(() => registeredTool.update({ name: null }), "remove"),
      update: /* @__PURE__ */ __name((updates) => {
        if (updates.name !== void 0 && updates.name !== name) {
          if (typeof updates.name === "string") validateAndWarnToolName(updates.name);
          delete this._registeredTools[name];
          delete this._toolInputSchemaJson[name];
          if (updates.name) {
            delete this._toolInputSchemaJson[updates.name];
            this._registeredTools[updates.name] = registeredTool;
            name = updates.name;
          }
        }
        if (updates.title !== void 0) registeredTool.title = updates.title;
        if (updates.description !== void 0) registeredTool.description = updates.description;
        let needsExecutorRegen = false;
        if (updates.paramsSchema !== void 0) {
          registeredTool.inputSchema = updates.paramsSchema;
          delete this._toolInputSchemaJson[name];
          needsExecutorRegen = true;
        }
        if (updates.callback !== void 0) {
          registeredTool.handler = updates.callback;
          currentHandler = updates.callback;
          needsExecutorRegen = true;
        }
        if (needsExecutorRegen) registeredTool.executor = createToolExecutor(registeredTool.inputSchema, currentHandler);
        if (updates.outputSchema !== void 0) {
          registeredTool.outputSchema = updates.outputSchema;
          registeredTool.outputSchemaJson = convertOutputSchemaJson(updates.outputSchema);
        }
        if (updates.annotations !== void 0) registeredTool.annotations = updates.annotations;
        if (updates.icons !== void 0) registeredTool.icons = updates.icons;
        if (updates.scopeChallenge !== void 0) registeredTool.scopeChallenge = updates.scopeChallenge === null ? void 0 : updates.scopeChallenge;
        if (updates._meta !== void 0) registeredTool._meta = updates._meta;
        if (updates.enabled !== void 0) registeredTool.enabled = updates.enabled;
        this.sendToolListChanged();
      }, "update")
    };
    this._registeredTools[name] = registeredTool;
    this.setToolRequestHandlers();
    this.sendToolListChanged();
    return registeredTool;
  }
  registerTool(name, config2, cb) {
    if (this._registeredTools[name]) throw new Error(`Tool ${name} is already registered`);
    const { title, description, inputSchema, outputSchema, annotations, icons, scopeChallenge, _meta } = config2;
    return this._createRegisteredTool(name, title, description, normalizeRawShapeSchema(inputSchema), normalizeRawShapeSchema(outputSchema), annotations, icons, void 0, scopeChallenge, _meta, cb);
  }
  registerPrompt(name, config2, cb) {
    if (this._registeredPrompts[name]) throw new Error(`Prompt ${name} is already registered`);
    const { title, description, argsSchema, icons, scopeChallenge, _meta } = config2;
    const registeredPrompt = this._createRegisteredPrompt(name, title, description, normalizeRawShapeSchema(argsSchema), cb, icons, scopeChallenge, _meta);
    this.setPromptRequestHandlers();
    this.sendPromptListChanged();
    return registeredPrompt;
  }
  /**
  * Checks if the server is connected to a transport.
  * @returns `true` if the server is connected
  */
  isConnected() {
    return this.server.transport !== void 0;
  }
  /**
  * Sends a logging message to the client, if connected.
  * Note: You only need to send the parameters object, not the entire JSON-RPC message.
  * @see {@linkcode LoggingMessageNotification}
  * @param params
  * @param sessionId Optional for stateless transports and backward compatibility.
  *
  * @example
  * ```ts source="./mcp.examples.ts#McpServer_sendLoggingMessage_basic"
  * await server.sendLoggingMessage({
  *     level: 'info',
  *     data: 'Processing complete'
  * });
  * ```
  *
  * @deprecated Deprecated as of protocol version 2026-07-28 (SEP-2577).
  * Remains functional during the deprecation window (at least twelve months).
  * Migrate to stderr logging (STDIO servers) or OpenTelemetry.
  */
  async sendLoggingMessage(params, sessionId) {
    return this.server.sendLoggingMessage(params, sessionId);
  }
  /**
  * Sends a resource list changed event to the client, if connected.
  */
  sendResourceListChanged() {
    if (this.isConnected()) this.server.sendResourceListChanged();
  }
  /**
  * Sends a tool list changed event to the client, if connected.
  */
  sendToolListChanged() {
    if (this.isConnected()) this.server.sendToolListChanged();
  }
  /**
  * Sends a prompt list changed event to the client, if connected.
  */
  sendPromptListChanged() {
    if (this.isConnected()) this.server.sendPromptListChanged();
  }
};
function createToolExecutor(inputSchema, handler) {
  if (inputSchema) {
    const callback$1 = handler;
    return async (args, ctx) => callback$1(args, ctx);
  }
  const callback = handler;
  return async (_args, ctx) => callback(ctx);
}
__name(createToolExecutor, "createToolExecutor");
var EMPTY_OBJECT_JSON_SCHEMA = {
  type: "object",
  properties: {}
};
function convertListedInputSchema(name, inputSchema) {
  const json = standardSchemaToJsonSchema(inputSchema, "input");
  const scan = scanXMcpHeaderDeclarations(json);
  if (!scan.valid) console.warn(`[mcp-sdk] tool '${name}' carries an invalid x-mcp-header declaration and will be excluded by conforming Streamable HTTP clients: ${scan.reason}`);
  return json;
}
__name(convertListedInputSchema, "convertListedInputSchema");
function convertOutputSchemaJson(outputSchema) {
  if (outputSchema === void 0) return void 0;
  try {
    return standardSchemaToJsonSchema(outputSchema, "output");
  } catch {
    return;
  }
}
__name(convertOutputSchemaJson, "convertOutputSchemaJson");
function createPromptHandler(name, argsSchema, callback) {
  if (argsSchema) {
    const typedCallback = callback;
    return async (args, ctx) => {
      const parseResult = await validateStandardSchema(argsSchema, args ?? {});
      if (!parseResult.success) throw new ProtocolError(ProtocolErrorCode.InvalidParams, `Invalid arguments for prompt ${name}: ${parseResult.error}`);
      return typedCallback(parseResult.data, ctx);
    };
  } else {
    const typedCallback = callback;
    return async (_args, ctx) => {
      return typedCallback(ctx);
    };
  }
}
__name(createPromptHandler, "createPromptHandler");
function createCompletionResult(suggestions) {
  return { completion: {
    values: suggestions.map(String).slice(0, 100),
    total: suggestions.length,
    hasMore: suggestions.length > 100
  } };
}
__name(createCompletionResult, "createCompletionResult");
var EMPTY_COMPLETION_RESULT = { completion: {
  values: [],
  hasMore: false
} };
function getSchemaShape(schema) {
  const candidate = schema;
  if (candidate.shape && typeof candidate.shape === "object") return candidate.shape;
}
__name(getSchemaShape, "getSchemaShape");
function isOptionalSchema(schema) {
  return schema?.type === "optional";
}
__name(isOptionalSchema, "isOptionalSchema");
function unwrapOptionalSchema(schema) {
  if (!isOptionalSchema(schema)) return schema;
  return schema.def?.innerType ?? schema;
}
__name(unwrapOptionalSchema, "unwrapOptionalSchema");

// ../../node_modules/@modelcontextprotocol/server/dist/listenRouter-Bartj63y.mjs
var InMemoryServerEventBus = class {
  static {
    __name(this, "InMemoryServerEventBus");
  }
  _listeners = /* @__PURE__ */ new Set();
  /**
  * @param onerror - Optional callback for errors thrown by listeners
  *   during dispatch.
  */
  constructor(onerror) {
    this.onerror = onerror;
  }
  publish(event) {
    for (const listener of this._listeners) try {
      listener(event);
    } catch (error2) {
      this.onerror?.(error2 instanceof Error ? error2 : new Error(String(error2)));
    }
  }
  subscribe(listener) {
    this._listeners.add(listener);
    let live = true;
    return () => {
      if (!live) return;
      live = false;
      this._listeners.delete(listener);
    };
  }
  /** The number of currently registered listeners (test/introspection only — the routers track capacity via their own open-subscription set). */
  get listenerCount() {
    return this._listeners.size;
  }
};
function createServerNotifier(bus) {
  return {
    toolsChanged: /* @__PURE__ */ __name(() => bus.publish({ kind: "tools_list_changed" }), "toolsChanged"),
    promptsChanged: /* @__PURE__ */ __name(() => bus.publish({ kind: "prompts_list_changed" }), "promptsChanged"),
    resourcesChanged: /* @__PURE__ */ __name(() => bus.publish({ kind: "resources_list_changed" }), "resourcesChanged"),
    resourceUpdated: /* @__PURE__ */ __name((uri2) => bus.publish({
      kind: "resource_updated",
      uri: uri2
    }), "resourceUpdated")
  };
}
__name(createServerNotifier, "createServerNotifier");
function listenFilterAccepts(filter, event) {
  switch (event.kind) {
    case "tools_list_changed":
      return filter.toolsListChanged === true;
    case "prompts_list_changed":
      return filter.promptsListChanged === true;
    case "resources_list_changed":
      return filter.resourcesListChanged === true;
    case "resource_updated":
      return filter.resourceSubscriptions !== void 0 && filter.resourceSubscriptions.includes(event.uri);
  }
}
__name(listenFilterAccepts, "listenFilterAccepts");
function honoredSubset(requested, capabilities) {
  const honored = {};
  const allow = /* @__PURE__ */ __name((bit) => capabilities === void 0 || bit === true, "allow");
  if (requested.toolsListChanged === true && allow(capabilities?.tools?.listChanged)) honored.toolsListChanged = true;
  if (requested.promptsListChanged === true && allow(capabilities?.prompts?.listChanged)) honored.promptsListChanged = true;
  if (requested.resourcesListChanged === true && allow(capabilities?.resources?.listChanged)) honored.resourcesListChanged = true;
  if (requested.resourceSubscriptions !== void 0 && requested.resourceSubscriptions.length > 0 && allow(capabilities?.resources?.subscribe)) honored.resourceSubscriptions = [...requested.resourceSubscriptions];
  return honored;
}
__name(honoredSubset, "honoredSubset");
function serverEventToNotification(event) {
  switch (event.kind) {
    case "tools_list_changed":
      return {
        method: "notifications/tools/list_changed",
        ...event.params !== void 0 && { params: event.params }
      };
    case "prompts_list_changed":
      return {
        method: "notifications/prompts/list_changed",
        ...event.params !== void 0 && { params: event.params }
      };
    case "resources_list_changed":
      return {
        method: "notifications/resources/list_changed",
        ...event.params !== void 0 && { params: event.params }
      };
    case "resource_updated":
      return {
        method: "notifications/resources/updated",
        params: {
          ...event.params,
          uri: event.uri
        }
      };
  }
}
__name(serverEventToNotification, "serverEventToNotification");
var DEFAULT_MAX_SUBSCRIPTIONS = 1024;
function jsonRpcError(id, code, message) {
  return Response.json({
    jsonrpc: "2.0",
    error: {
      code,
      message
    },
    id
  }, { status: 200 });
}
__name(jsonRpcError, "jsonRpcError");
function stampSubscriptionId(notification, subscriptionId) {
  return {
    method: notification.method,
    params: {
      ...notification.params,
      _meta: {
        ...notification.params?._meta,
        [SUBSCRIPTION_ID_META_KEY]: subscriptionId
      }
    }
  };
}
__name(stampSubscriptionId, "stampSubscriptionId");
function parseListenFilter(message) {
  const outcome = codecForVersion(MODERN_WIRE_REVISION).validateRequest("subscriptions/listen", message);
  return outcome.ok ? outcome.value.params?.notifications : void 0;
}
__name(parseListenFilter, "parseListenFilter");
function createListenRouter(options) {
  const { bus, onerror } = options;
  const maxSubscriptions = options.maxSubscriptions ?? DEFAULT_MAX_SUBSCRIPTIONS;
  const keepAliveMs = options.keepAliveMs ?? DEFAULT_SSE_KEEP_ALIVE_MS;
  const open2 = /* @__PURE__ */ new Set();
  function serve(message, signal, capabilities, serverInfo) {
    if (open2.size >= maxSubscriptions) {
      onerror?.(/* @__PURE__ */ new Error(`subscriptions/listen refused: subscription limit reached (${maxSubscriptions})`));
      return jsonRpcError(message.id, -32603, "Subscription limit reached");
    }
    const filter = parseListenFilter(message);
    if (filter === void 0) return jsonRpcError(message.id, -32602, "Invalid params: 'notifications' is required and must be a valid SubscriptionFilter");
    const honored = honoredSubset(filter, capabilities);
    const subscriptionId = message.id;
    const encoder3 = new TextEncoder();
    let controller;
    let closed = false;
    let unsubscribe;
    let keepAliveTimer;
    let abortCleanup;
    const writeFrame = /* @__PURE__ */ __name((frame) => {
      if (closed) return;
      try {
        controller.enqueue(encoder3.encode(frame));
      } catch (error2) {
        onerror?.(error2 instanceof Error ? error2 : new Error(String(error2)));
      }
    }, "writeFrame");
    const writeNotification = /* @__PURE__ */ __name((method, params) => {
      writeFrame(`event: message
data: ${JSON.stringify({
        jsonrpc: "2.0",
        method,
        params
      })}

`);
    }, "writeNotification");
    const teardown = /* @__PURE__ */ __name((graceful) => {
      if (closed) return;
      if (graceful) writeFrame(`event: message
data: ${JSON.stringify({
        jsonrpc: "2.0",
        id: subscriptionId,
        result: {
          resultType: "complete",
          _meta: {
            [SUBSCRIPTION_ID_META_KEY]: subscriptionId,
            [SERVER_INFO_META_KEY]: serverInfo
          }
        }
      })}

`);
      closed = true;
      try {
        unsubscribe?.();
      } catch (error2) {
        onerror?.(error2 instanceof Error ? error2 : new Error(String(error2)));
      }
      if (keepAliveTimer !== void 0) clearInterval(keepAliveTimer);
      abortCleanup?.();
      open2.delete(teardown);
      try {
        controller.close();
      } catch {
      }
    }, "teardown");
    const readable = new ReadableStream({
      start(streamController) {
        controller = streamController;
        const ack = stampSubscriptionId({
          method: "notifications/subscriptions/acknowledged",
          params: { notifications: honored }
        }, subscriptionId);
        writeNotification(ack.method, ack.params);
        if (Object.keys(honored).length === 0) {
          teardown(true);
          return;
        }
        unsubscribe = bus.subscribe((event) => {
          if (closed || !listenFilterAccepts(honored, event)) return;
          const note = stampSubscriptionId(serverEventToNotification(event), subscriptionId);
          writeNotification(note.method, note.params);
        });
        keepAliveTimer = armSseKeepAlive(keepAliveMs, () => writeFrame(": keepalive\n\n"));
        open2.add(teardown);
      },
      cancel() {
        teardown(false);
      }
    });
    if (signal !== void 0) if (signal.aborted) teardown(false);
    else {
      const onAbort = /* @__PURE__ */ __name(() => teardown(false), "onAbort");
      signal.addEventListener("abort", onAbort, { once: true });
      abortCleanup = /* @__PURE__ */ __name(() => signal.removeEventListener("abort", onAbort), "abortCleanup");
    }
    return new Response(readable, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no"
      }
    });
  }
  __name(serve, "serve");
  return {
    serve,
    closeAll() {
      for (const teardown of open2) teardown(true);
    },
    get openCount() {
      return open2.size;
    }
  };
}
__name(createListenRouter, "createListenRouter");

// ../../node_modules/@modelcontextprotocol/server/dist/index.mjs
async function invoke(server, message, ctx) {
  const transport = new PerRequestHTTPServerTransport({
    classification: ctx.classification,
    ...ctx.responseMode !== void 0 && { responseMode: ctx.responseMode },
    ...ctx.keepAliveMs !== void 0 && { keepAliveMs: ctx.keepAliveMs }
  });
  await server.connect(transport);
  return transport.handleMessage(message, {
    ...ctx.request !== void 0 && { request: ctx.request },
    ...ctx.authInfo !== void 0 && { authInfo: ctx.authInfo }
  });
}
__name(invoke, "invoke");
var DEFAULT_MAX_REQUEST_BODY_SIZE = 4 * 1024 * 1024;
var MAX_BATCH_SIZE = 100;
function requestBodyTooLargeMessage(maxBytes) {
  return `Payload Too Large: Request body must not exceed ${maxBytes} bytes`;
}
__name(requestBodyTooLargeMessage, "requestBodyTooLargeMessage");
function resolveMaxRequestBodySize(value) {
  if (value === void 0) return DEFAULT_MAX_REQUEST_BODY_SIZE;
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) throw new RangeError(`maxRequestBodySize must be a positive number of bytes, got ${String(value)}`);
  return value;
}
__name(resolveMaxRequestBodySize, "resolveMaxRequestBodySize");
async function readRequestBody(request, maxBytes = DEFAULT_MAX_REQUEST_BODY_SIZE) {
  if (Number(request.headers.get("content-length")) > maxBytes) return { tooLarge: true };
  if (request.body === null) return {
    tooLarge: false,
    text: ""
  };
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let received = 0;
  let text = "";
  try {
    for (; ; ) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > maxBytes) return { tooLarge: true };
      text += decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }
  return {
    tooLarge: false,
    text: text + decoder.decode()
  };
}
__name(readRequestBody, "readRequestBody");
var WebStandardStreamableHTTPServerTransport = class {
  static {
    __name(this, "WebStandardStreamableHTTPServerTransport");
  }
  sessionIdGenerator;
  _started = false;
  _hasHandledRequest = false;
  _closed = false;
  _streamMapping = /* @__PURE__ */ new Map();
  _requestToStreamMapping = /* @__PURE__ */ new Map();
  _requestResponseMap = /* @__PURE__ */ new Map();
  _initialized = false;
  _enableJsonResponse = false;
  _standaloneSseStreamId = "_GET_stream";
  _eventStore;
  _onsessioninitialized;
  _onsessionclosed;
  _allowedHosts;
  _allowedOrigins;
  _enableDnsRebindingProtection;
  _retryInterval;
  _supportedProtocolVersions;
  _keepAliveMs;
  _maxRequestBodySize;
  _scopeChallengeResolver;
  sessionId;
  onclose;
  onerror;
  onmessage;
  constructor(options = {}) {
    this.sessionIdGenerator = options.sessionIdGenerator;
    this._enableJsonResponse = options.enableJsonResponse ?? false;
    this._eventStore = options.eventStore;
    this._onsessioninitialized = options.onsessioninitialized;
    this._onsessionclosed = options.onsessionclosed;
    this._allowedHosts = options.allowedHosts;
    this._allowedOrigins = options.allowedOrigins;
    this._enableDnsRebindingProtection = options.enableDnsRebindingProtection ?? false;
    this._retryInterval = options.retryInterval;
    this._supportedProtocolVersions = options.supportedProtocolVersions ?? SUPPORTED_PROTOCOL_VERSIONS;
    this._keepAliveMs = options.keepAliveMs ?? DEFAULT_SSE_KEEP_ALIVE_MS;
    this._maxRequestBodySize = resolveMaxRequestBodySize(options.maxRequestBodySize);
  }
  startKeepAlive(controller, encoder3) {
    if (this._closed) return void 0;
    const timer = armSseKeepAlive(this._keepAliveMs, () => {
      try {
        controller.enqueue(encoder3.encode(": keepalive\n\n"));
      } catch {
        if (timer !== void 0) clearInterval(timer);
      }
    });
    return timer;
  }
  /** Sets the scope challenge resolver for parsed JSON-RPC requests. */
  setScopeChallengeResolver(resolver) {
    this._scopeChallengeResolver = resolver;
  }
  /**
  * Starts the transport. This is required by the {@linkcode Transport} interface but is a no-op
  * for the Streamable HTTP transport as connections are managed per-request.
  */
  async start() {
    if (this._started) throw new Error("Transport already started");
    this._started = true;
  }
  /**
  * Sets the supported protocol versions for header validation.
  * Called by the server during {@linkcode server/server.Server.connect | connect()} to pass its supported versions.
  */
  setSupportedProtocolVersions(versions) {
    this._supportedProtocolVersions = versions;
  }
  /**
  * Helper to create a JSON error response
  */
  createJsonErrorResponse(status, code, message, options) {
    const error2 = {
      code,
      message
    };
    if (options?.data !== void 0) error2.data = options.data;
    return Response.json({
      jsonrpc: "2.0",
      error: error2,
      id: null
    }, {
      status,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers
      }
    });
  }
  async _checkScopeChallenge(messages, authInfo) {
    if (!this._scopeChallengeResolver) return;
    const challenge = await findScopeChallenge(messages.filter((message) => isJSONRPCRequest(message)), authInfo, this._scopeChallengeResolver);
    return challenge === void 0 ? void 0 : createScopeChallengeResponse(challenge, scopeChallengeResourceMetadataUrl(authInfo));
  }
  /**
  * Validates request headers for DNS rebinding protection.
  * @returns Error response if validation fails, `undefined` if validation passes.
  */
  validateRequestHeaders(req) {
    if (!this._enableDnsRebindingProtection) return;
    if (this._allowedHosts && this._allowedHosts.length > 0) {
      const hostHeader = req.headers.get("host");
      if (!hostHeader || !this._allowedHosts.includes(hostHeader)) {
        const error2 = `Invalid Host header: ${hostHeader}`;
        this.onerror?.(new Error(error2));
        return this.createJsonErrorResponse(403, -32e3, error2);
      }
    }
    if (this._allowedOrigins && this._allowedOrigins.length > 0) {
      const originHeader = req.headers.get("origin");
      if (originHeader && !this._allowedOrigins.includes(originHeader)) {
        const error2 = `Invalid Origin header: ${originHeader}`;
        this.onerror?.(new Error(error2));
        return this.createJsonErrorResponse(403, -32e3, error2);
      }
    }
  }
  /**
  * Handles an incoming HTTP request, whether `GET`, `POST`, or `DELETE`
  * Returns a `Response` object (Web Standard)
  */
  async handleRequest(req, options) {
    if (this._closed) return this.createJsonErrorResponse(404, -32001, "Session not found");
    if (!this.sessionIdGenerator && this._hasHandledRequest) throw new Error("Stateless transport cannot be reused across requests. Create a new transport per request.");
    this._hasHandledRequest = true;
    const validationError = this.validateRequestHeaders(req);
    if (validationError) return validationError;
    switch (req.method) {
      case "POST":
        return this.handlePostRequest(req, options);
      case "GET":
        return this.handleGetRequest(req);
      case "DELETE":
        return this.handleDeleteRequest(req);
      default:
        return this.handleUnsupportedRequest();
    }
  }
  /**
  * Returns true if the client's protocol version supports empty SSE data in
  * priming events (the fix shipped with protocol version `2025-11-25`).
  *
  * The version is checked for membership in this transport instance's
  * supported protocol versions rather than with an open-ended
  * `>= '2025-11-25'` comparison: the value may come from an `initialize`
  * request body, which (unlike the `MCP-Protocol-Version` header) is not
  * validated against `supportedProtocolVersions` before reaching this
  * check. An unknown future version string must not silently enable
  * behavior reserved for versions this transport actually supports.
  */
  supportsEmptySSEData(protocolVersion) {
    return this._supportedProtocolVersions.includes(protocolVersion) && protocolVersion >= "2025-11-25";
  }
  /**
  * Writes a priming event to establish resumption capability.
  * Only sends if `eventStore` is configured (opt-in for resumability) and
  * the client's protocol version supports empty SSE data (a supported
  * version that is >= `2025-11-25`).
  */
  async writePrimingEvent(controller, encoder3, streamId, protocolVersion) {
    if (!this._eventStore) return;
    if (!this.supportsEmptySSEData(protocolVersion)) return;
    const primingEventId = await this._eventStore.storeEvent(streamId, {});
    let primingEvent = `id: ${primingEventId}
data: 

`;
    if (this._retryInterval !== void 0) primingEvent = `id: ${primingEventId}
retry: ${this._retryInterval}
data: 

`;
    controller.enqueue(encoder3.encode(primingEvent));
  }
  /**
  * Handles `GET` requests for SSE stream
  */
  async handleGetRequest(req) {
    if (!req.headers.get("accept")?.includes("text/event-stream")) {
      this.onerror?.(/* @__PURE__ */ new Error("Not Acceptable: Client must accept text/event-stream"));
      return this.createJsonErrorResponse(406, -32e3, "Not Acceptable: Client must accept text/event-stream");
    }
    const sessionError = this.validateSession(req);
    if (sessionError) return sessionError;
    const protocolError = this.validateProtocolVersion(req);
    if (protocolError) return protocolError;
    if (this._eventStore) {
      const lastEventId = req.headers.get("last-event-id");
      if (lastEventId) return this.replayEvents(lastEventId);
    }
    if (this._streamMapping.get(this._standaloneSseStreamId) !== void 0) {
      this.onerror?.(/* @__PURE__ */ new Error("Conflict: Only one SSE stream is allowed per session"));
      return this.createJsonErrorResponse(409, -32e3, "Conflict: Only one SSE stream is allowed per session");
    }
    const encoder3 = new TextEncoder();
    let streamController;
    let keepAliveTimer;
    const readable = new ReadableStream({
      start: /* @__PURE__ */ __name((controller) => {
        streamController = controller;
      }, "start"),
      cancel: /* @__PURE__ */ __name(() => {
        if (keepAliveTimer !== void 0) clearInterval(keepAliveTimer);
        if (this._streamMapping.get(this._standaloneSseStreamId)?.controller === streamController) this._streamMapping.delete(this._standaloneSseStreamId);
      }, "cancel")
    });
    const headers = {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no"
    };
    if (this.sessionId !== void 0) headers["mcp-session-id"] = this.sessionId;
    this._streamMapping.set(this._standaloneSseStreamId, {
      controller: streamController,
      encoder: encoder3,
      cleanup: /* @__PURE__ */ __name(() => {
        if (keepAliveTimer !== void 0) clearInterval(keepAliveTimer);
        this._streamMapping.delete(this._standaloneSseStreamId);
        try {
          streamController.close();
        } catch {
        }
      }, "cleanup")
    });
    keepAliveTimer = this.startKeepAlive(streamController, encoder3);
    return new Response(readable, { headers });
  }
  /**
  * Replays events that would have been sent after the specified event ID
  * Only used when resumability is enabled
  */
  async replayEvents(lastEventId) {
    if (!this._eventStore) {
      this.onerror?.(/* @__PURE__ */ new Error("Event store not configured"));
      return this.createJsonErrorResponse(400, -32e3, "Event store not configured");
    }
    try {
      let streamId;
      if (this._eventStore.getStreamIdForEventId) {
        streamId = await this._eventStore.getStreamIdForEventId(lastEventId);
        if (!streamId) {
          this.onerror?.(/* @__PURE__ */ new Error("Invalid event ID format"));
          return this.createJsonErrorResponse(400, -32e3, "Invalid event ID format");
        }
        if (this._streamMapping.get(streamId) !== void 0) {
          this.onerror?.(/* @__PURE__ */ new Error("Conflict: Stream already has an active connection"));
          return this.createJsonErrorResponse(409, -32e3, "Conflict: Stream already has an active connection");
        }
      }
      const headers = {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no"
      };
      if (this.sessionId !== void 0) headers["mcp-session-id"] = this.sessionId;
      const encoder3 = new TextEncoder();
      let streamController;
      let keepAliveTimer;
      let cancelled = false;
      let replayedStreamId;
      const readable = new ReadableStream({
        start: /* @__PURE__ */ __name((controller) => {
          streamController = controller;
        }, "start"),
        cancel: /* @__PURE__ */ __name(() => {
          cancelled = true;
          if (keepAliveTimer !== void 0) clearInterval(keepAliveTimer);
          if (replayedStreamId !== void 0 && this._streamMapping.get(replayedStreamId)?.controller === streamController) this._streamMapping.delete(replayedStreamId);
        }, "cancel")
      });
      const replayedEventIds = /* @__PURE__ */ new Set();
      replayedStreamId = await this._eventStore.replayEventsAfter(lastEventId, { send: /* @__PURE__ */ __name(async (eventId, message) => {
        replayedEventIds.add(eventId);
        if (!this.writeSSEEvent(streamController, encoder3, message, eventId)) try {
          streamController.close();
        } catch {
        }
      }, "send") });
      if (this._closed || cancelled) {
        try {
          streamController.close();
        } catch {
        }
        return this.createJsonErrorResponse(404, -32001, "Session not found");
      }
      this._streamMapping.get(replayedStreamId)?.cleanup();
      this._streamMapping.set(replayedStreamId, {
        controller: streamController,
        encoder: encoder3,
        replayedEventIds,
        cleanup: /* @__PURE__ */ __name(() => {
          if (keepAliveTimer !== void 0) clearInterval(keepAliveTimer);
          this._streamMapping.delete(replayedStreamId);
          try {
            streamController.close();
          } catch {
          }
        }, "cleanup")
      });
      if (replayedStreamId !== this._standaloneSseStreamId) {
        if (![...this._requestToStreamMapping.values()].includes(replayedStreamId)) {
          this._streamMapping.delete(replayedStreamId);
          try {
            streamController.close();
          } catch {
          }
        }
      }
      if (this._streamMapping.get(replayedStreamId)?.controller === streamController) keepAliveTimer = this.startKeepAlive(streamController, encoder3);
      return new Response(readable, { headers });
    } catch (error2) {
      this.onerror?.(error2);
      return this.createJsonErrorResponse(500, -32e3, "Error replaying events");
    }
  }
  /**
  * Writes an event to an SSE stream via controller with proper formatting
  */
  writeSSEEvent(controller, encoder3, message, eventId) {
    try {
      let eventData = `event: message
`;
      if (eventId) eventData += `id: ${eventId}
`;
      eventData += `data: ${JSON.stringify(message)}

`;
      controller.enqueue(encoder3.encode(eventData));
      return true;
    } catch (error2) {
      this.onerror?.(error2);
      return false;
    }
  }
  /**
  * Handles unsupported requests (`PUT`, `PATCH`, etc.)
  */
  handleUnsupportedRequest() {
    this.onerror?.(/* @__PURE__ */ new Error("Method not allowed."));
    return Response.json({
      jsonrpc: "2.0",
      error: {
        code: -32e3,
        message: "Method not allowed."
      },
      id: null
    }, {
      status: 405,
      headers: {
        Allow: "GET, POST, DELETE",
        "Content-Type": "application/json"
      }
    });
  }
  /**
  * Handles `POST` requests containing JSON-RPC messages
  */
  async handlePostRequest(req, options) {
    try {
      const acceptHeader = req.headers.get("accept");
      if (!acceptHeader?.includes("application/json") || !acceptHeader.includes("text/event-stream")) {
        this.onerror?.(/* @__PURE__ */ new Error("Not Acceptable: Client must accept both application/json and text/event-stream"));
        return this.createJsonErrorResponse(406, -32e3, "Not Acceptable: Client must accept both application/json and text/event-stream");
      }
      if (!isJsonContentType(req.headers.get("content-type"))) {
        this.onerror?.(/* @__PURE__ */ new Error("Unsupported Media Type: Content-Type must be application/json"));
        return this.createJsonErrorResponse(415, -32e3, "Unsupported Media Type: Content-Type must be application/json");
      }
      const request = req;
      let rawMessage;
      if (options?.parsedBody === void 0) try {
        const body = await readRequestBody(req, this._maxRequestBodySize);
        if (body.tooLarge) {
          const message = requestBodyTooLargeMessage(this._maxRequestBodySize);
          this.onerror?.(new Error(message));
          return this.createJsonErrorResponse(413, -32e3, message);
        }
        rawMessage = JSON.parse(body.text);
      } catch (error2) {
        this.onerror?.(error2);
        return this.createJsonErrorResponse(400, -32700, "Parse error: Invalid JSON");
      }
      else rawMessage = options.parsedBody;
      if (Array.isArray(rawMessage) && rawMessage.length > MAX_BATCH_SIZE) {
        this.onerror?.(/* @__PURE__ */ new Error(`Invalid Request: Batch must not exceed ${MAX_BATCH_SIZE} messages`));
        return this.createJsonErrorResponse(400, -32600, `Invalid Request: Batch must not exceed ${MAX_BATCH_SIZE} messages`);
      }
      let messages;
      try {
        messages = Array.isArray(rawMessage) ? rawMessage.map((msg) => JSONRPCMessageSchema.parse(msg)) : [JSONRPCMessageSchema.parse(rawMessage)];
      } catch (error2) {
        this.onerror?.(error2);
        return this.createJsonErrorResponse(400, -32700, "Parse error: Invalid JSON-RPC message");
      }
      if (this._closed) return this.createJsonErrorResponse(404, -32001, "Session not found");
      const isInitializationRequest = messages.some((element) => isInitializeRequest(element));
      if (isInitializationRequest) {
        if (this._initialized && this.sessionId !== void 0) {
          this.onerror?.(/* @__PURE__ */ new Error("Invalid Request: Server already initialized"));
          return this.createJsonErrorResponse(400, -32600, "Invalid Request: Server already initialized");
        }
        if (messages.length > 1) {
          this.onerror?.(/* @__PURE__ */ new Error("Invalid Request: Only one initialization request is allowed"));
          return this.createJsonErrorResponse(400, -32600, "Invalid Request: Only one initialization request is allowed");
        }
        this.sessionId = this.sessionIdGenerator?.();
        this._initialized = true;
        if (this.sessionId && this._onsessioninitialized) await Promise.resolve(this._onsessioninitialized(this.sessionId));
      }
      if (!isInitializationRequest) {
        const sessionError = this.validateSession(req);
        if (sessionError) return sessionError;
        const protocolError = this.validateProtocolVersion(req);
        if (protocolError) return protocolError;
      }
      if (this._closed) return this.createJsonErrorResponse(404, -32001, "Session not found");
      let scopeChallengeResponse;
      try {
        scopeChallengeResponse = await this._checkScopeChallenge(messages, options?.authInfo);
      } catch (error2) {
        this.onerror?.(error2);
        return this.createJsonErrorResponse(500, -32603, "Internal server error");
      }
      if (scopeChallengeResponse) return scopeChallengeResponse;
      if (!messages.some((element) => isJSONRPCRequest(element))) {
        for (const message of messages) this.onmessage?.(message, {
          authInfo: options?.authInfo,
          request
        });
        return new Response(null, { status: 202 });
      }
      const streamId = crypto.randomUUID();
      const initRequest = messages.find((m) => isInitializeRequest(m));
      const clientProtocolVersion = initRequest ? initRequest.params.protocolVersion : req.headers.get("mcp-protocol-version") ?? DEFAULT_NEGOTIATED_PROTOCOL_VERSION;
      if (this._enableJsonResponse) return new Promise((resolve) => {
        this._streamMapping.set(streamId, {
          resolveJson: resolve,
          cleanup: /* @__PURE__ */ __name(() => {
            this._streamMapping.delete(streamId);
          }, "cleanup")
        });
        for (const message of messages) if (isJSONRPCRequest(message)) this._requestToStreamMapping.set(message.id, streamId);
        for (const message of messages) this.onmessage?.(message, {
          authInfo: options?.authInfo,
          request
        });
      });
      const encoder3 = new TextEncoder();
      let streamController;
      let keepAliveTimer;
      const readable = new ReadableStream({
        start: /* @__PURE__ */ __name((controller) => {
          streamController = controller;
        }, "start"),
        cancel: /* @__PURE__ */ __name(() => {
          if (keepAliveTimer !== void 0) clearInterval(keepAliveTimer);
          if (this._streamMapping.get(streamId)?.controller === streamController) this._streamMapping.delete(streamId);
        }, "cancel")
      });
      const headers = {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no"
      };
      if (this.sessionId !== void 0) headers["mcp-session-id"] = this.sessionId;
      for (const message of messages) if (isJSONRPCRequest(message)) {
        this._streamMapping.set(streamId, {
          controller: streamController,
          encoder: encoder3,
          cleanup: /* @__PURE__ */ __name(() => {
            if (keepAliveTimer !== void 0) clearInterval(keepAliveTimer);
            this._streamMapping.delete(streamId);
            try {
              streamController.close();
            } catch {
            }
          }, "cleanup")
        });
        this._requestToStreamMapping.set(message.id, streamId);
      }
      await this.writePrimingEvent(streamController, encoder3, streamId, clientProtocolVersion);
      for (const message of messages) {
        let closeSSEStream;
        let closeStandaloneSSEStream;
        if (isJSONRPCRequest(message) && this._eventStore && this.supportsEmptySSEData(clientProtocolVersion)) {
          closeSSEStream = /* @__PURE__ */ __name(() => {
            this.closeSSEStream(message.id);
          }, "closeSSEStream");
          closeStandaloneSSEStream = /* @__PURE__ */ __name(() => {
            this.closeStandaloneSSEStream();
          }, "closeStandaloneSSEStream");
        }
        this.onmessage?.(message, {
          authInfo: options?.authInfo,
          request,
          closeSSEStream,
          closeStandaloneSSEStream
        });
      }
      if (this._streamMapping.get(streamId)?.controller === streamController) keepAliveTimer = this.startKeepAlive(streamController, encoder3);
      return new Response(readable, {
        status: 200,
        headers
      });
    } catch (error2) {
      this.onerror?.(error2);
      return this.createJsonErrorResponse(400, -32700, "Parse error", { data: String(error2) });
    }
  }
  /**
  * Handles `DELETE` requests to terminate sessions
  */
  async handleDeleteRequest(req) {
    const sessionError = this.validateSession(req);
    if (sessionError) return sessionError;
    const protocolError = this.validateProtocolVersion(req);
    if (protocolError) return protocolError;
    try {
      await Promise.resolve(this._onsessionclosed?.(this.sessionId));
      return new Response(null, { status: 200 });
    } finally {
      await this.close();
    }
  }
  /**
  * Validates session ID for non-initialization requests.
  * Returns `Response` error if invalid, `undefined` otherwise
  */
  validateSession(req) {
    if (this.sessionIdGenerator === void 0) return;
    if (!this._initialized) {
      this.onerror?.(/* @__PURE__ */ new Error("Bad Request: Server not initialized"));
      return this.createJsonErrorResponse(400, -32e3, "Bad Request: Server not initialized");
    }
    const sessionId = req.headers.get("mcp-session-id");
    if (!sessionId) {
      this.onerror?.(/* @__PURE__ */ new Error("Bad Request: Mcp-Session-Id header is required"));
      return this.createJsonErrorResponse(400, -32e3, "Bad Request: Mcp-Session-Id header is required");
    }
    if (sessionId !== this.sessionId) {
      this.onerror?.(/* @__PURE__ */ new Error("Session not found"));
      return this.createJsonErrorResponse(404, -32001, "Session not found");
    }
  }
  /**
  * Validates the `MCP-Protocol-Version` header on incoming requests.
  *
  * For initialization: Version negotiation handles unknown versions gracefully
  * (server responds with its supported version).
  *
  * For subsequent requests with `MCP-Protocol-Version` header:
  * - Accept if in supported list
  * - 400 if unsupported
  *
  * For HTTP requests without the `MCP-Protocol-Version` header:
  * - Accept and default to the version negotiated at initialization
  */
  validateProtocolVersion(req) {
    const protocolVersion = req.headers.get("mcp-protocol-version");
    if (protocolVersion !== null && !this._supportedProtocolVersions.includes(protocolVersion)) {
      const error2 = `Bad Request: Unsupported protocol version: ${protocolVersion} (supported versions: ${this._supportedProtocolVersions.join(", ")})`;
      this.onerror?.(new Error(error2));
      return this.createJsonErrorResponse(400, -32e3, error2);
    }
  }
  async close() {
    if (this._closed) return;
    this._closed = true;
    for (const { cleanup } of this._streamMapping.values()) cleanup();
    this._streamMapping.clear();
    this._requestResponseMap.clear();
    this.onclose?.();
  }
  /**
  * Close an SSE stream for a specific request, triggering client reconnection.
  * Use this to implement polling behavior during long-running operations -
  * client will reconnect after the retry interval specified in the priming event.
  */
  closeSSEStream(requestId) {
    const streamId = this._requestToStreamMapping.get(requestId);
    if (!streamId) return;
    const stream2 = this._streamMapping.get(streamId);
    if (stream2) stream2.cleanup();
  }
  /**
  * Close the standalone `GET` SSE stream, triggering client reconnection.
  * Use this to implement polling behavior for server-initiated notifications.
  */
  closeStandaloneSSEStream() {
    const stream2 = this._streamMapping.get(this._standaloneSseStreamId);
    if (stream2) stream2.cleanup();
  }
  async send(message, options) {
    let requestId = options?.relatedRequestId;
    if (isJSONRPCResultResponse(message) || isJSONRPCErrorResponse(message)) requestId = message.id;
    if (requestId === void 0) {
      if (isJSONRPCResultResponse(message) || isJSONRPCErrorResponse(message)) throw new Error("Cannot send a response on a standalone SSE stream unless resuming a previous client request");
      let eventId;
      if (this._eventStore) eventId = await this._eventStore.storeEvent(this._standaloneSseStreamId, message);
      const standaloneSse = this._streamMapping.get(this._standaloneSseStreamId);
      if (standaloneSse === void 0) return;
      if (standaloneSse.controller && standaloneSse.encoder && (eventId === void 0 || !standaloneSse.replayedEventIds?.has(eventId))) this.writeSSEEvent(standaloneSse.controller, standaloneSse.encoder, message, eventId);
      return;
    }
    const streamId = this._requestToStreamMapping.get(requestId);
    if (!streamId) throw new Error(`No connection established for request ID: ${String(requestId)}`);
    let stream2 = this._streamMapping.get(streamId);
    if (!this._enableJsonResponse) {
      let eventId;
      if (this._eventStore) {
        eventId = await this._eventStore.storeEvent(streamId, message);
        stream2 = this._streamMapping.get(streamId);
      }
      if (stream2?.controller && stream2?.encoder && (eventId === void 0 || !stream2.replayedEventIds?.has(eventId))) this.writeSSEEvent(stream2.controller, stream2.encoder, message, eventId);
    }
    if (isJSONRPCResultResponse(message) || isJSONRPCErrorResponse(message)) {
      this._requestResponseMap.set(requestId, message);
      const relatedIds = [...this._requestToStreamMapping.entries()].filter(([_, sid]) => sid === streamId).map(([id]) => id);
      if (relatedIds.every((id) => this._requestResponseMap.has(id))) {
        if (!stream2) {
          if (this._enableJsonResponse) throw new Error(`No connection established for request ID: ${String(requestId)}`);
          if (!this._eventStore) {
            this.onerror?.(/* @__PURE__ */ new Error(`Response for request ID ${String(requestId)} is undeliverable: per-request stream is disconnected and no eventStore is configured`));
            for (const id of relatedIds) {
              this._requestResponseMap.delete(id);
              this._requestToStreamMapping.delete(id);
            }
            return;
          }
          for (const id of relatedIds) {
            this._requestResponseMap.delete(id);
            this._requestToStreamMapping.delete(id);
          }
          return;
        }
        if (this._enableJsonResponse && stream2.resolveJson) {
          const headers = { "Content-Type": "application/json" };
          if (this.sessionId !== void 0) headers["mcp-session-id"] = this.sessionId;
          const responses = relatedIds.map((id) => this._requestResponseMap.get(id));
          if (responses.length === 1) stream2.resolveJson(Response.json(responses[0], {
            status: 200,
            headers
          }));
          else stream2.resolveJson(Response.json(responses, {
            status: 200,
            headers
          }));
          stream2.cleanup();
        } else stream2.cleanup();
        for (const id of relatedIds) {
          this._requestResponseMap.delete(id);
          this._requestToStreamMapping.delete(id);
        }
      }
    }
  }
};
function echoableRequestId(body) {
  if (body === null || typeof body !== "object" || Array.isArray(body)) return null;
  const { method, id } = body;
  if (typeof method !== "string") return null;
  return typeof id === "string" || typeof id === "number" ? id : null;
}
__name(echoableRequestId, "echoableRequestId");
function jsonRpcErrorResponse(httpStatus, code, message, data, id = null) {
  return Response.json({
    jsonrpc: "2.0",
    error: {
      code,
      message,
      ...data !== void 0 && { data }
    },
    id
  }, {
    status: httpStatus,
    ...httpStatus === 405 && { headers: { Allow: "POST" } }
  });
}
__name(jsonRpcErrorResponse, "jsonRpcErrorResponse");
function rejectionResponse(rejection2, id = null) {
  return jsonRpcErrorResponse(rejection2.httpStatus, rejection2.code, rejection2.message, rejection2.data, id);
}
__name(rejectionResponse, "rejectionResponse");
function toError(value) {
  return value instanceof Error ? value : new Error(String(value));
}
__name(toError, "toError");
function internalServerErrorResponse(id = null) {
  return jsonRpcErrorResponse(500, -32603, "Internal server error", void 0, id);
}
__name(internalServerErrorResponse, "internalServerErrorResponse");
function assertNotServing(server) {
  if (server.transport !== void 0) throw new Error("The factory returned an instance that is still serving another request. Return a new instance for each request.");
}
__name(assertNotServing, "assertNotServing");
function createLegacyStatelessFallback(factory, onerror, keepAliveMs, maxRequestBodySize) {
  return async (request, options) => {
    if (request.method.toUpperCase() !== "POST") return jsonRpcErrorResponse(405, -32e3, "Method not allowed.");
    try {
      const product = await factory({
        era: "legacy",
        ...options?.authInfo !== void 0 && { authInfo: options.authInfo },
        requestInfo: request
      });
      const transport = new WebStandardStreamableHTTPServerTransport({
        sessionIdGenerator: void 0,
        ...keepAliveMs !== void 0 && { keepAliveMs },
        ...maxRequestBodySize !== void 0 && { maxRequestBodySize }
      });
      await product.connect(transport);
      const teardown = /* @__PURE__ */ __name(() => {
        transport.close().catch(() => {
        });
        product.close().catch(() => {
        });
      }, "teardown");
      request.signal?.addEventListener("abort", teardown, { once: true });
      const response = await transport.handleRequest(request, {
        ...options?.authInfo !== void 0 && { authInfo: options.authInfo },
        ...options?.parsedBody !== void 0 && { parsedBody: options.parsedBody }
      });
      if (response.body === null || mediaTypeEssence(response.headers.get("content-type")) !== "text/event-stream") {
        teardown();
        return response;
      }
      const reader = response.body.getReader();
      let toreDown = false;
      const completeExchange = /* @__PURE__ */ __name(() => {
        if (!toreDown) {
          toreDown = true;
          teardown();
        }
      }, "completeExchange");
      const monitoredBody = new ReadableStream({
        pull: /* @__PURE__ */ __name(async (controller) => {
          try {
            const { done, value } = await reader.read();
            if (done) {
              completeExchange();
              controller.close();
              return;
            }
            if (value !== void 0) controller.enqueue(value);
          } catch (error2) {
            completeExchange();
            controller.error(error2);
          }
        }, "pull"),
        cancel: /* @__PURE__ */ __name((reason) => {
          completeExchange();
          return reader.cancel(reason).catch(() => {
          });
        }, "cancel")
      });
      return new Response(monitoredBody, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
    } catch (error2) {
      try {
        onerror?.(toError(error2));
      } catch {
      }
      return internalServerErrorResponse(echoableRequestId(options?.parsedBody));
    }
  };
}
__name(createLegacyStatelessFallback, "createLegacyStatelessFallback");
function standardHeadersOf(request) {
  return {
    protocolVersionHeader: request.headers.get("mcp-protocol-version") ?? void 0,
    mcpMethodHeader: request.headers.get("mcp-method") ?? void 0,
    mcpNameHeader: request.headers.get("mcp-name") ?? void 0
  };
}
__name(standardHeadersOf, "standardHeadersOf");
async function classifyEntryRequest(request, providedParsedBody, needsForward = true, maxRequestBodySize = DEFAULT_MAX_REQUEST_BODY_SIZE) {
  const httpMethod = request.method.toUpperCase();
  let body;
  let parsedBody = providedParsedBody;
  let forwardRequest = request;
  let unparseable = false;
  if (httpMethod === "POST") {
    if (parsedBody === void 0) {
      if (needsForward) forwardRequest = request.clone();
      let bodyText;
      try {
        const read = await readRequestBody(request, maxRequestBodySize);
        if (read.tooLarge) return { step: "body-too-large" };
        bodyText = read.text;
      } catch {
        return { step: "unreadable-body" };
      }
      try {
        body = bodyText.length === 0 ? void 0 : JSON.parse(bodyText);
      } catch {
        unparseable = true;
      }
      if (!unparseable && body !== void 0) parsedBody = body;
    } else body = parsedBody;
    if (unparseable || body === void 0) return {
      step: "no-json-body",
      forwardRequest
    };
  }
  return {
    step: "classified",
    outcome: classifyInboundRequest({
      httpMethod,
      ...standardHeadersOf(request),
      ...body !== void 0 && { body }
    }),
    body,
    parsedBody,
    forwardRequest
  };
}
__name(classifyEntryRequest, "classifyEntryRequest");
function createMcpHandler(factory, options = {}) {
  const { legacy, onerror, responseMode } = options;
  const maxRequestBodySize = resolveMaxRequestBodySize(options.maxRequestBodySize);
  if (typeof legacy === "function") throw new TypeError("The 'legacy' option only accepts 'stateless' or 'reject', not a handler function. To serve 2025-era traffic with your own handler, route in user land with the exported isLegacyRequest(request) predicate in front of a strict (legacy: 'reject') handler.");
  const inflight = /* @__PURE__ */ new Set();
  let closed = false;
  const reportError = /* @__PURE__ */ __name((error2) => {
    try {
      onerror?.(error2);
    } catch {
    }
  }, "reportError");
  const bus = options.bus ?? new InMemoryServerEventBus(reportError);
  const notify = createServerNotifier(bus);
  const listenRouter = createListenRouter({
    bus,
    maxSubscriptions: options.maxSubscriptions ?? DEFAULT_MAX_SUBSCRIPTIONS,
    keepAliveMs: options.keepAliveMs ?? DEFAULT_SSE_KEEP_ALIVE_MS,
    onerror: reportError
  });
  if (responseMode === "json") console.warn("responseMode: 'json' drops mid-call notifications. subscriptions/listen streams are always served over SSE regardless; other notifications emitted before a result are dropped.");
  const legacyHandler = legacy === "reject" ? void 0 : createLegacyStatelessFallback(factory, reportError, options.keepAliveMs, maxRequestBodySize);
  async function serveModern(route, request, authInfo) {
    const claimedRevision = route.classification.revision;
    if (claimedRevision === void 0 || !SUPPORTED_MODERN_PROTOCOL_VERSIONS.includes(claimedRevision)) {
      const error2 = new UnsupportedProtocolVersionError({
        supported: [...SUPPORTED_MODERN_PROTOCOL_VERSIONS],
        requested: claimedRevision ?? "unknown"
      });
      reportError(error2);
      return jsonRpcErrorResponse(400, error2.code, error2.message, error2.data, echoableRequestId(route.message));
    }
    const stdHeaderRejection = validateStandardRequestHeaders({
      httpMethod: request.method,
      ...standardHeadersOf(request)
    }, route);
    if (stdHeaderRejection !== void 0) {
      reportError(/* @__PURE__ */ new Error(`Rejected inbound request (${stdHeaderRejection.cell}): ${stdHeaderRejection.message}`));
      return rejectionResponse(stdHeaderRejection, echoableRequestId(route.message));
    }
    const meta2 = route.messageKind === "request" ? requestMetaOf(route.message.params) : void 0;
    const declaredClientCapabilities = meta2?.[CLIENT_CAPABILITIES_META_KEY];
    if (route.messageKind === "request") {
      const required2 = requiredClientCapabilitiesForRequest(route.message.method);
      if (required2 !== void 0) {
        const missing = missingClientCapabilities(required2, declaredClientCapabilities);
        if (missing !== void 0) {
          const error2 = new MissingRequiredClientCapabilityError({ requiredCapabilities: missing });
          reportError(error2);
          return jsonRpcErrorResponse(httpStatusForErrorCode(error2.code, "ladder"), error2.code, error2.message, error2.data, route.message.id);
        }
      }
    }
    const product = await factory({
      era: "modern",
      ...authInfo !== void 0 && { authInfo },
      requestInfo: request
    });
    const server = product instanceof McpServer ? product.server : product;
    assertNotServing(server);
    if (route.messageKind === "request" && route.message.method === "subscriptions/listen") {
      const capabilities = server.getCapabilities();
      const serverInfo = serverIdentityOf(server);
      product.close().catch(reportError);
      return listenRouter.serve(route.message, request.signal, capabilities, serverInfo);
    }
    if (route.messageKind === "request" && route.message.method === "tools/call" && product instanceof McpServer) {
      const callParams = route.message.params;
      const toolName = typeof callParams?.name === "string" ? callParams.name : void 0;
      const inputSchema = toolName === void 0 ? void 0 : product.toolInputSchemaJson(toolName);
      if (inputSchema !== void 0) {
        const scan = scanXMcpHeaderDeclarations(inputSchema);
        if (scan.declarations !== void 0 && scan.declarations.length > 0) {
          const rejection2 = validateMcpParamHeaders(scan.declarations, callParams?.arguments, request.headers);
          if (rejection2 !== void 0) {
            product.close().catch(reportError);
            reportError(/* @__PURE__ */ new Error(`Rejected inbound request (${rejection2.cell}): ${rejection2.message}`));
            return rejectionResponse(rejection2, route.message.id);
          }
        }
      }
    }
    if (route.messageKind === "request" && product instanceof McpServer) try {
      const challenge = await findScopeChallenge([route.message], authInfo, (context) => product.resolveScopeChallenge(context));
      if (challenge !== void 0) {
        product.close().catch(reportError);
        return createScopeChallengeResponse(challenge, scopeChallengeResourceMetadataUrl(authInfo));
      }
    } catch (error2) {
      product.close().catch(reportError);
      reportError(toError(error2));
      return internalServerErrorResponse(route.message.id);
    }
    assertNotServing(server);
    setNegotiatedProtocolVersion(server, claimedRevision);
    installModernOnlyHandlers(server, SUPPORTED_MODERN_PROTOCOL_VERSIONS);
    if (meta2 !== void 0) seedClientIdentityFromEnvelope(server, {
      clientInfo: meta2[CLIENT_INFO_META_KEY],
      clientCapabilities: declaredClientCapabilities
    });
    const previousOnClose = server.onclose;
    inflight.add(server);
    const onExchangeClose = /* @__PURE__ */ __name(() => {
      inflight.delete(server);
      if (server.onclose === onExchangeClose) server.onclose = previousOnClose;
      previousOnClose?.();
    }, "onExchangeClose");
    server.onclose = onExchangeClose;
    try {
      const response = await invoke(product, route.message, {
        classification: route.classification,
        request,
        ...authInfo !== void 0 && { authInfo },
        ...responseMode !== void 0 && { responseMode },
        ...options.keepAliveMs !== void 0 && { keepAliveMs: options.keepAliveMs }
      });
      if (route.messageKind === "notification") queueMicrotask(() => void server.close().catch(() => {
      }));
      return response;
    } catch (error2) {
      if (error2 instanceof SdkError && error2.code === SdkErrorCode.ConnectionClosed) return new Response(null, { status: 499 });
      await server.close().catch(() => {
      });
      inflight.delete(server);
      reportError(toError(error2));
      return internalServerErrorResponse(echoableRequestId(route.message));
    }
  }
  __name(serveModern, "serveModern");
  async function serveLegacyRoute(route, forwardRequest, authInfo, parsedBody) {
    if (legacyHandler !== void 0) return legacyHandler(forwardRequest, {
      ...authInfo !== void 0 && { authInfo },
      ...parsedBody !== void 0 && { parsedBody }
    });
    const strict = modernOnlyStrictRejection(route, SUPPORTED_MODERN_PROTOCOL_VERSIONS);
    if (strict === void 0) return new Response(null, { status: 202 });
    reportError(/* @__PURE__ */ new Error(`Rejected 2025-era request on a modern-only endpoint (${strict.cell}): ${strict.message}`));
    return rejectionResponse(strict, echoableRequestId(parsedBody));
  }
  __name(serveLegacyRoute, "serveLegacyRoute");
  async function handle(request, requestOptions) {
    const authInfo = requestOptions?.authInfo;
    if (request.method.toUpperCase() === "POST" && !isJsonContentType(request.headers.get("content-type"))) {
      reportError(/* @__PURE__ */ new Error("Unsupported Media Type: Content-Type must be application/json"));
      return jsonRpcErrorResponse(415, -32e3, "Unsupported Media Type: Content-Type must be application/json");
    }
    const classified = await classifyEntryRequest(request, requestOptions?.parsedBody, true, maxRequestBodySize);
    if (classified.step === "unreadable-body") return jsonRpcErrorResponse(400, -32700, "Parse error: the request body could not be read");
    if (classified.step === "body-too-large") return jsonRpcErrorResponse(413, -32e3, requestBodyTooLargeMessage(maxRequestBodySize));
    if (classified.step === "no-json-body") {
      if (legacyHandler !== void 0) return legacyHandler(classified.forwardRequest, { ...authInfo !== void 0 && { authInfo } });
      return jsonRpcErrorResponse(400, -32700, "Parse error: the request body is not valid JSON");
    }
    const { outcome, body, parsedBody, forwardRequest } = classified;
    try {
      switch (outcome.kind) {
        case "reject":
          reportError(/* @__PURE__ */ new Error(`Rejected inbound request (${outcome.cell}): ${outcome.message}`));
          return rejectionResponse(outcome, echoableRequestId(body));
        case "modern":
          return await serveModern(outcome, request, authInfo);
        case "legacy":
          return await serveLegacyRoute(outcome, forwardRequest, authInfo, parsedBody);
      }
    } catch (error2) {
      reportError(toError(error2));
      return internalServerErrorResponse(echoableRequestId(body));
    }
  }
  __name(handle, "handle");
  const fetchFace = /* @__PURE__ */ __name(async (request, requestOptions) => {
    if (closed) throw new Error("This MCP handler has been closed");
    try {
      return await handle(request, requestOptions);
    } catch (error2) {
      reportError(toError(error2));
      return internalServerErrorResponse(echoableRequestId(requestOptions?.parsedBody));
    }
  }, "fetchFace");
  return {
    fetch: fetchFace,
    notify,
    bus,
    close: /* @__PURE__ */ __name(async () => {
      closed = true;
      listenRouter.closeAll();
      const closing = [...inflight].map((server) => server.close().catch(() => {
      }));
      inflight.clear();
      await Promise.all(closing);
    }, "close")
  };
}
__name(createMcpHandler, "createMcpHandler");

// src/index.js
import { env as workerEnv } from "cloudflare:workers";

// ../../node_modules/@cloudflare/workers-oauth-provider/dist/oauth-provider.js
import { WorkerEntrypoint } from "cloudflare:workers";
var OAUTH_SCOPE_TOKEN_PATTERN = /^[\x21\x23-\x5B\x5D-\x7E]+$/;
function isValidOAuthScopeToken(scopeToken) {
  return OAUTH_SCOPE_TOKEN_PATTERN.test(scopeToken);
}
__name(isValidOAuthScopeToken, "isValidOAuthScopeToken");
var version2 = "1.2.4";
var OUTBOUND_USER_AGENT = `workers-oauth-provider/${version2} (+https://github.com/cloudflare/workers-oauth-provider)`;
function withCorsHeaders(response, request) {
  const origin = request.headers.get("Origin");
  if (!origin) return response;
  const cors = new Response(response.body, response);
  const setUnlessPresent = /* @__PURE__ */ __name((name, value) => {
    if (!cors.headers.has(name)) cors.headers.set(name, value);
  }, "setUnlessPresent");
  setUnlessPresent("Access-Control-Allow-Origin", origin);
  setUnlessPresent("Access-Control-Allow-Methods", "*");
  setUnlessPresent("Access-Control-Allow-Headers", "Authorization, *");
  setUnlessPresent("Access-Control-Max-Age", "86400");
  appendHeaderValue(cors.headers, "Vary", "Origin");
  appendHeaderValue(cors.headers, "Access-Control-Expose-Headers", "WWW-Authenticate");
  appendHeaderValue(cors.headers, "Access-Control-Expose-Headers", "Retry-After");
  return cors;
}
__name(withCorsHeaders, "withCorsHeaders");
function appendHeaderValue(headers, name, value) {
  const values = (headers.get(name) ?? "").split(",").map((item) => item.trim()).filter(Boolean);
  if (!values.some((item) => item.toLowerCase() === value.toLowerCase())) values.push(value);
  headers.set(name, values.join(", "));
}
__name(appendHeaderValue, "appendHeaderValue");
function resolveRequiredScopes(requiredScopes, deprecatedScopesSupported) {
  if (requiredScopes !== void 0 && deprecatedScopesSupported !== void 0) throw new TypeError("Set requiredScopes only: resourceMetadata.scopes_supported is deprecated in its favour");
  const scopes = requiredScopes ?? deprecatedScopesSupported;
  return scopes === void 0 ? void 0 : [...scopes];
}
__name(resolveRequiredScopes, "resolveRequiredScopes");
function baselineResourceScopes(scopes) {
  return [...new Set(scopes)].filter((scope) => scope !== "offline_access");
}
__name(baselineResourceScopes, "baselineResourceScopes");
var OAuthError3 = class extends Error {
  static {
    __name(this, "OAuthError");
  }
  constructor(code, options) {
    super(options.description);
    this.name = "OAuthError";
    this.code = code;
    this.options = {
      ...options,
      statusCode: options.statusCode ?? 400
    };
    this.description = this.options.description;
    this.statusCode = this.options.statusCode;
    this.headers = this.options.headers;
    this.requiredScopes = this.options.requiredScopes;
  }
};
var EMA_MAX_JWT_BYTES = 16 * 1024;
var EMA_JWKS_MAX_SIZE_BYTES = 64 * 1024;
var CLIENT_ASSERTION_MAX_BYTES = 16 * 1024;
function isLoopbackHostname(hostname) {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host === "::1" || host === "[::1]") return true;
  const ipv42 = /^127\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  return ipv42 !== null && ipv42.slice(1).every((octet) => Number(octet) <= 255);
}
__name(isLoopbackHostname, "isLoopbackHostname");
function hasAcceptedCanonicalScheme(url2) {
  return url2.protocol === "https:" || url2.protocol === "http:" && isLoopbackHostname(url2.hostname);
}
__name(hasAcceptedCanonicalScheme, "hasAcceptedCanonicalScheme");
function validateResourceUri(uri2) {
  if (!uri2 || typeof uri2 !== "string") return false;
  if (!/^[\x21-\x7e]+$/.test(uri2) || /["\\#]/.test(uri2) || !/^[A-Za-z][A-Za-z0-9+.-]*:\/\/[^/?#]+(?:\/[^?#]*)?(?:\?[^#]*)?$/.test(uri2) || /%(?![0-9A-Fa-f]{2})/.test(uri2) || !/^[A-Za-z0-9:/?@!$&'()*+,;=._~%\[\]-]+$/.test(uri2)) return false;
  try {
    const parsed = new URL(uri2);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
__name(validateResourceUri, "validateResourceUri");
function resourceMatches(requested, granted) {
  const foldedRequested = foldResourceSchemeAndHost(requested);
  const foldedGranted = foldResourceSchemeAndHost(granted);
  if (foldedRequested === void 0 || foldedGranted === void 0) return false;
  return normalizeEmptyPath(foldedRequested) === normalizeEmptyPath(foldedGranted);
}
__name(resourceMatches, "resourceMatches");
function foldResourceSchemeAndHost(resource) {
  const schemeSeparator = resource.indexOf("://");
  if (schemeSeparator <= 0) return void 0;
  const authorityStart = schemeSeparator + 3;
  const authorityEndOffset = resource.slice(authorityStart).search(/[/?#]/);
  const authorityEnd = authorityEndOffset === -1 ? resource.length : authorityStart + authorityEndOffset;
  const authority = resource.slice(authorityStart, authorityEnd);
  const hostStart = authority.lastIndexOf("@") + 1;
  let hostEnd;
  if (authority[hostStart] === "[") {
    const closingBracket = authority.indexOf("]", hostStart + 1);
    if (closingBracket === -1) return void 0;
    hostEnd = closingBracket + 1;
  } else {
    const portSeparator = authority.indexOf(":", hostStart);
    hostEnd = portSeparator === -1 ? authority.length : portSeparator;
  }
  const asciiLower = /* @__PURE__ */ __name((value) => value.replace(/[A-Z]/g, (character) => character.toLowerCase()), "asciiLower");
  return asciiLower(resource.slice(0, schemeSeparator)) + "://" + authority.slice(0, hostStart) + asciiLower(authority.slice(hostStart, hostEnd)) + authority.slice(hostEnd) + resource.slice(authorityEnd);
}
__name(foldResourceSchemeAndHost, "foldResourceSchemeAndHost");
function normalizeEmptyPath(resource) {
  const authorityStart = resource.indexOf("://") + 3;
  const pathOffset = resource.slice(authorityStart).search(/[/?#]/);
  if (pathOffset === -1) return `${resource}/`;
  const pathStart = authorityStart + pathOffset;
  return resource[pathStart] === "/" ? resource : `${resource.slice(0, pathStart)}/${resource.slice(pathStart)}`;
}
__name(normalizeEmptyPath, "normalizeEmptyPath");
function requestCarriesResourceQuery(requestUrl, resourceUrl) {
  for (const [name, value] of resourceUrl.searchParams) if (!requestUrl.searchParams.getAll(name).includes(value)) return false;
  return true;
}
__name(requestCarriesResourceQuery, "requestCarriesResourceQuery");
var CIMD_MAX_SIZE_BYTES = 5 * 1024;
var CIMD_CACHE_MAX_TTL_SECONDS = 10080 * 60;
var PROTECTED_RESOURCE_WELL_KNOWN_PREFIX$1 = "/.well-known/oauth-protected-resource";
var NO_CACHE_HEADERS$1 = {
  "Cache-Control": "no-store",
  Pragma: "no-cache"
};
function insufficientScope(auth, scope, description) {
  if (!Array.isArray(scope) || scope.length === 0 || scope.some((value) => typeof value !== "string" || !isValidOAuthScopeToken(value))) throw new TypeError("insufficientScope requires at least one valid OAuth scope token");
  let challenge = `Bearer realm="OAuth", error="insufficient_scope", scope="${[...new Set(scope)].join(" ")}"`;
  challenge += `, resource_metadata="${getResourceMetadataUrl(auth.audience)}"`;
  if (description !== void 0) {
    const quotable = description.replace(/["\\]/g, "").replace(/[^\x21-\x7e]+/g, " ").trim();
    if (quotable) challenge += `, error_description="${quotable}"`;
  }
  return new Response(JSON.stringify({
    error: "insufficient_scope",
    ...description !== void 0 ? { error_description: description } : {}
  }), {
    status: 403,
    headers: {
      ...NO_CACHE_HEADERS$1,
      "Content-Type": "application/json",
      "WWW-Authenticate": challenge
    }
  });
}
__name(insufficientScope, "insufficientScope");
var OAuthResourceServer = class {
  static {
    __name(this, "OAuthResourceServer");
  }
  #options;
  #validated;
  constructor(options) {
    this.#validated = validateOptions(options);
    this.#options = options;
  }
  async fetch(request, env, ctx) {
    const options = this.#options;
    const validated = this.#validated;
    const url2 = new URL(request.url);
    if (isProtectedResourceMetadataPath(url2)) {
      if (request.method === "OPTIONS") return withCorsHeaders(new Response(null, {
        status: 204,
        headers: { "Content-Length": "0" }
      }), request);
      if (!isMetadataUrlRequest(url2, validated.metadataUrl)) return withCorsHeaders(new Response(null, { status: 404 }), request);
      if (request.method !== "GET" && request.method !== "HEAD") return withCorsHeaders(new Response(null, {
        status: 405,
        headers: { Allow: "GET, HEAD, OPTIONS" }
      }), request);
      const metadata = Response.json(validated.metadata, { headers: NO_CACHE_HEADERS$1 });
      return withCorsHeaders(request.method === "HEAD" ? new Response(null, {
        status: 200,
        headers: metadata.headers
      }) : metadata, request);
    }
    if (!isCanonicalResourceRequest(url2, validated.resourceUrl)) return new Response(null, { status: 404 });
    if (request.method === "OPTIONS") return withCorsHeaders(new Response(null, {
      status: 204,
      headers: { "Content-Length": "0" }
    }), request);
    const token = parseBearerToken(request.headers.get("Authorization"));
    if (!token) return withCorsHeaders(createBearerChallenge(url2, validated, false), request);
    let validation;
    try {
      validation = await options.validateToken(env, request)(validated.resource, token);
    } catch (error2) {
      if (error2 instanceof OAuthError3) return withCorsHeaders(createOAuthErrorResponse(error2, url2, validated), request);
      return withCorsHeaders(createValidationUnavailableResponse(), request);
    }
    if (!isValidTokenValidation(validation, validated.resource)) return withCorsHeaders(createBearerChallenge(url2, validated, true), request);
    const context = ctx;
    context.props = validation.props;
    context.auth = {
      token,
      audience: validated.resource,
      ...validation.expiresAt !== void 0 ? { expiresAt: validation.expiresAt } : {},
      scope: [...validation.scope ?? []],
      ...validation.userId !== void 0 ? { userId: validation.userId } : {},
      ...validation.clientId !== void 0 ? { clientId: validation.clientId } : {}
    };
    const handler = options.handler;
    return withCorsHeaders(isEntrypointClass(handler) ? await new handler(context, env).fetch(request) : await handler.fetch(request, env, context), request);
  }
};
function validateOptions(options) {
  if (!options || typeof options !== "object") throw new TypeError("OAuth resource server options are required");
  if (!options.handler || !isEntrypointClass(options.handler) && typeof options.handler.fetch !== "function") throw new TypeError("handler must provide a fetch function or extend WorkerEntrypoint");
  if (typeof options.validateToken !== "function") throw new TypeError("validateToken must be a function");
  const resource = options.resourceMetadata?.resource;
  const resourceUrl = parseCanonicalUrl(resource);
  if (!resourceUrl) throw new TypeError("resourceMetadata.resource must be a canonical absolute HTTPS URI without a fragment (http is accepted only on a loopback host)");
  if (isProtectedResourceMetadataPath(resourceUrl)) throw new TypeError(`resourceMetadata.resource must not be inside the ${PROTECTED_RESOURCE_WELL_KNOWN_PREFIX$1} namespace`);
  const authorizationServers = options.resourceMetadata.authorization_servers;
  if (!Array.isArray(authorizationServers) || authorizationServers.length === 0) throw new TypeError("resourceMetadata.authorization_servers must contain at least one issuer");
  for (const issuer of authorizationServers) {
    const issuerUrl = parseCanonicalUrl(issuer);
    if (!issuerUrl || issuerUrl.search || issuerUrl.hash) throw new TypeError("resourceMetadata.authorization_servers must contain canonical HTTPS issuer URLs (http is accepted only on a loopback host)");
  }
  const bearerMethods = options.resourceMetadata.bearer_methods_supported;
  if (bearerMethods !== void 0 && (bearerMethods.length !== 1 || bearerMethods[0] !== "header")) throw new TypeError("resourceMetadata.bearer_methods_supported only supports 'header'");
  const configuredScopes = resolveRequiredScopes(options.requiredScopes, options.resourceMetadata.scopes_supported) ?? [];
  if (configuredScopes.some((scope) => typeof scope !== "string" || !isValidOAuthScopeToken(scope))) throw new TypeError("requiredScopes (or the deprecated resourceMetadata.scopes_supported) must contain valid OAuth scope tokens");
  const resourceScopes = baselineResourceScopes(configuredScopes);
  return {
    resource,
    resourceUrl,
    metadataUrl: new URL(getResourceMetadataUrl(resource)),
    metadata: {
      resource,
      authorization_servers: [...authorizationServers],
      ...resourceScopes.length ? { scopes_supported: resourceScopes } : {},
      bearer_methods_supported: bearerMethods ? [...bearerMethods] : ["header"],
      ...options.resourceMetadata.resource_name !== void 0 ? { resource_name: options.resourceMetadata.resource_name } : {}
    }
  };
}
__name(validateOptions, "validateOptions");
function parseCanonicalUrl(value) {
  if (typeof value !== "string" || !validateResourceUri(value)) return null;
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return null;
  }
  if (!hasAcceptedCanonicalScheme(parsed) || parsed.username || parsed.password || parsed.protocol !== parsed.protocol.toLowerCase() || parsed.hostname !== parsed.hostname.toLowerCase()) return null;
  if (parsed.href !== value && parsed.origin !== value) return null;
  return parsed;
}
__name(parseCanonicalUrl, "parseCanonicalUrl");
function getResourceMetadataUrl(resource) {
  const parsed = new URL(resource);
  const suffix = parsed.pathname === "/" ? "" : parsed.pathname;
  return `${parsed.origin}${PROTECTED_RESOURCE_WELL_KNOWN_PREFIX$1}${suffix}${parsed.search}`;
}
__name(getResourceMetadataUrl, "getResourceMetadataUrl");
function isEntrypointClass(handler) {
  return typeof handler === "function" && handler.prototype instanceof WorkerEntrypoint;
}
__name(isEntrypointClass, "isEntrypointClass");
function isProtectedResourceMetadataPath(url2) {
  return url2.pathname === PROTECTED_RESOURCE_WELL_KNOWN_PREFIX$1 || url2.pathname.startsWith(`${PROTECTED_RESOURCE_WELL_KNOWN_PREFIX$1}/`);
}
__name(isProtectedResourceMetadataPath, "isProtectedResourceMetadataPath");
function isMetadataUrlRequest(requestUrl, metadataUrl) {
  return requestUrl.origin === metadataUrl.origin && requestUrl.pathname === metadataUrl.pathname && requestCarriesResourceQuery(requestUrl, metadataUrl);
}
__name(isMetadataUrlRequest, "isMetadataUrlRequest");
function isCanonicalResourceRequest(requestUrl, resourceUrl) {
  if (requestUrl.origin !== resourceUrl.origin) return false;
  if (!requestCarriesResourceQuery(requestUrl, resourceUrl)) return false;
  const resourcePath = resourceUrl.pathname;
  if (requestUrl.pathname === resourcePath) return true;
  if (resourcePath === "/") return requestUrl.pathname.startsWith("/");
  const descendantPrefix = resourcePath.endsWith("/") ? resourcePath : `${resourcePath}/`;
  return requestUrl.pathname.startsWith(descendantPrefix);
}
__name(isCanonicalResourceRequest, "isCanonicalResourceRequest");
function parseBearerToken(authorization) {
  if (!authorization) return null;
  return /^Bearer[\t ]+([^\s,]+)$/i.exec(authorization)?.[1] || null;
}
__name(parseBearerToken, "parseBearerToken");
function isValidTokenValidation(validation, canonicalResource) {
  if (!validation || typeof validation !== "object") return false;
  if (typeof validation.audience !== "string" || !resourceMatches(validation.audience, canonicalResource)) return false;
  if (!Object.prototype.hasOwnProperty.call(validation, "props")) return false;
  if (validation.expiresAt !== void 0) {
    if (typeof validation.expiresAt !== "number" || !Number.isFinite(validation.expiresAt)) return false;
    if (validation.expiresAt <= Date.now() / 1e3) return false;
  }
  if (validation.scope !== void 0) {
    if (!Array.isArray(validation.scope)) return false;
    if (validation.scope.some((scope) => typeof scope !== "string" || !isValidOAuthScopeToken(scope))) return false;
  }
  if (validation.userId !== void 0 && typeof validation.userId !== "string") return false;
  if (validation.clientId !== void 0 && typeof validation.clientId !== "string") return false;
  return true;
}
__name(isValidTokenValidation, "isValidTokenValidation");
function createBearerChallenge(requestUrl, validated, invalidToken) {
  let challenge = 'Bearer realm="OAuth"';
  if (isCanonicalResourceRequest(requestUrl, validated.resourceUrl)) challenge += `, resource_metadata="${validated.metadataUrl.href}"`;
  if (invalidToken) challenge += ', error="invalid_token"';
  const scopes = validated.metadata.scopes_supported;
  if (scopes && scopes.length > 0) challenge += `, scope="${scopes.join(" ")}"`;
  return new Response(null, {
    status: 401,
    headers: {
      ...NO_CACHE_HEADERS$1,
      "WWW-Authenticate": challenge
    }
  });
}
__name(createBearerChallenge, "createBearerChallenge");
function createOAuthErrorResponse(error2, requestUrl, validated) {
  const headers = {
    ...NO_CACHE_HEADERS$1,
    "Content-Type": "application/json",
    ...error2.headers
  };
  const hasChallenge = Object.keys(headers).some((name) => name.toLowerCase() === "www-authenticate");
  let status = error2.statusCode;
  if (error2.code === "invalid_token") {
    status = 401;
    if (!hasChallenge) headers["WWW-Authenticate"] = createBearerChallenge(requestUrl, validated, true).headers.get("WWW-Authenticate");
  } else if (error2.code === "insufficient_scope") {
    status = 403;
    if (!hasChallenge) {
      const scopes = [...new Set(error2.requiredScopes ?? validated.metadata.scopes_supported ?? [])];
      if (scopes.some((scope) => typeof scope !== "string" || !isValidOAuthScopeToken(scope))) return createValidationUnavailableResponse();
      headers["WWW-Authenticate"] = 'Bearer realm="OAuth", error="insufficient_scope"' + (scopes.length > 0 ? `, scope="${scopes.join(" ")}"` : "") + `, resource_metadata="${validated.metadataUrl.href}"`;
    }
  }
  return new Response(JSON.stringify({
    error: error2.code,
    error_description: error2.description
  }), {
    status,
    headers
  });
}
__name(createOAuthErrorResponse, "createOAuthErrorResponse");
function createValidationUnavailableResponse() {
  return new Response(null, {
    status: 503,
    headers: NO_CACHE_HEADERS$1
  });
}
__name(createValidationUnavailableResponse, "createValidationUnavailableResponse");
var DEFAULT_REMEMBER_SECONDS = 720 * 60 * 60;
if (!(typeof Cloudflare !== "undefined" && Cloudflare.compatibilityFlags?.global_fetch_strictly_public === true)) console.warn(`CIMD (Client ID Metadata Document) is disabled: add '"compatibility_flags": ["global_fetch_strictly_public"]' to your wrangler.jsonc to enable. See: https://developers.cloudflare.com/workers/configuration/compatibility-flags/#global-fetch-strictly-public`);
var DEFAULT_REFRESH_TOKEN_TTL = 720 * 60 * 60;
var DEFAULT_CLIENT_REGISTRATION_TTL = 2160 * 60 * 60;
var TOKEN_LENGTH = 32;
var ISSUED_TOKEN_SECRET_PATTERN = /* @__PURE__ */ new RegExp(`^[A-Za-z0-9_-]{${TOKEN_LENGTH}}$`);
var WRAPPING_KEY_HMAC_KEY = new Uint8Array([
  34,
  126,
  38,
  134,
  141,
  241,
  225,
  109,
  128,
  112,
  234,
  23,
  151,
  91,
  71,
  166,
  130,
  24,
  250,
  135,
  40,
  174,
  222,
  133,
  181,
  29,
  74,
  217,
  150,
  202,
  202,
  67
]);

// ../../src/stroke-intent.js
var TAU = 2 * Math.PI;

// ../../src/drawn-path.js
var PATH_WIDTH = 600;
var PATH_HEIGHT = 1300;
var MAX_DRAWN_POINTS = 96;
var clamp = /* @__PURE__ */ __name((n, a, b) => Math.max(a, Math.min(b, n)), "clamp");
var distance = /* @__PURE__ */ __name((a, b) => Math.hypot((a[0] - b[0]) * PATH_WIDTH, (a[1] - b[1]) * PATH_HEIGHT), "distance");
var interpolate = /* @__PURE__ */ __name((a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], "interpolate");
var round = /* @__PURE__ */ __name((x) => Math.round(x * 1e5) / 1e5, "round");
var DRAW_COORD_MIN = -2;
var DRAW_COORD_MAX = 3;
function normalizedDrawnPath(input, withIndexMap = false) {
  if (!Array.isArray(input)) return { points: [], indexMap: [] };
  const points = [], indexMap = withIndexMap ? [] : null;
  for (let i = 0; i < Math.min(input.length, 1200); i++) {
    const point3 = input[i];
    if (!Array.isArray(point3) || point3.length < 2) continue;
    const x = Number(point3[0]), y = Number(point3[1]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    const next = [round(clamp(x, DRAW_COORD_MIN, DRAW_COORD_MAX)), round(clamp(y, DRAW_COORD_MIN, DRAW_COORD_MAX))];
    if (!points.length || distance(next, points.at(-1)) >= 0.75) points.push(next);
    if (indexMap) indexMap[i] = points.length - 1;
  }
  if (points.length < 2) return { points: [], indexMap: [] };
  const length = points.slice(1).reduce((sum, p, i) => sum + distance(p, points[i]), 0);
  if (length < 35) return { points: [], indexMap: [] };
  const reduced = points.length > MAX_DRAWN_POINTS ? resamplePath(points, MAX_DRAWN_POINTS) : points;
  if (indexMap && points.length > MAX_DRAWN_POINTS) {
    const arc = [0];
    for (let i = 1; i < points.length; i++) arc.push(arc.at(-1) + distance(points[i - 1], points[i]));
    for (let i = 0; i < indexMap.length; i++) if (Number.isInteger(indexMap[i]))
      indexMap[i] = Math.min(
        MAX_DRAWN_POINTS - 1,
        Math.round(arc[indexMap[i]] / length * (MAX_DRAWN_POINTS - 1))
      );
  }
  return { points: reduced.map(([x, y]) => [round(x), round(y)]), indexMap: indexMap || [] };
}
__name(normalizedDrawnPath, "normalizedDrawnPath");
function normalizeDrawnPath(input) {
  return normalizedDrawnPath(input).points;
}
__name(normalizeDrawnPath, "normalizeDrawnPath");
function normalizeDrawnPathWithIndexMap(input) {
  return normalizedDrawnPath(input, true);
}
__name(normalizeDrawnPathWithIndexMap, "normalizeDrawnPathWithIndexMap");
function resamplePath(points, count) {
  if (points.length < 2) return points.slice();
  const cum = [0];
  for (let i = 1; i < points.length; i++) cum.push(cum.at(-1) + distance(points[i - 1], points[i]));
  const total = cum.at(-1);
  if (total <= 0) return [points[0], points.at(-1)];
  const out = [];
  let j = 1;
  for (let i = 0; i < count; i++) {
    const pos = total * i / (count - 1);
    while (j < cum.length - 1 && cum[j] < pos) j++;
    const f = clamp((pos - cum[j - 1]) / (cum[j] - cum[j - 1] || 1), 0, 1);
    out.push(interpolate(points[j - 1], points[j], f));
  }
  return out;
}
__name(resamplePath, "resamplePath");
function soften(points, rounds) {
  let out = points;
  for (let step = 0; step < rounds; step++) {
    if (out.length <= 2) break;
    const next = [out[0]];
    for (let i = 1; i < out.length; i++) {
      next.push(interpolate(out[i - 1], out[i], 0.25), interpolate(out[i - 1], out[i], 0.75));
    }
    next.push(out.at(-1));
    out = next;
  }
  return out;
}
__name(soften, "soften");
function prepareDrawnPath(input) {
  const stored = normalizeDrawnPath(input);
  if (stored.length < 2) return null;
  const shaped = stored.length < 20 ? resamplePath(soften(stored, 3), MAX_DRAWN_POINTS) : stored;
  const points = shaped.map(([x, y]) => ({ x: x * PATH_WIDTH - PATH_WIDTH / 2, y: y * PATH_HEIGHT - PATH_HEIGHT / 2 }));
  const lengths = [0];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    lengths.push(lengths.at(-1) + Math.hypot(b.x - a.x, b.y - a.y));
  }
  return { points, lengths, total: lengths.at(-1), closed: distance(stored[0], stored.at(-1)) <= 6 };
}
__name(prepareDrawnPath, "prepareDrawnPath");
function safeDrawnBandSpan(path) {
  if (!path) return 120;
  const radii = [], points = path.points;
  for (let i = 2; i < points.length - 2; i++) {
    const a = points[i - 2], b = points[i], c = points[i + 2];
    const ab = Math.hypot(b.x - a.x, b.y - a.y);
    const bc = Math.hypot(c.x - b.x, c.y - b.y);
    const ac = Math.hypot(c.x - a.x, c.y - a.y);
    if (Math.min(ab, bc) < 2) continue;
    const vx = b.x - a.x, vy = b.y - a.y, wx = c.x - b.x, wy = c.y - b.y;
    const cross2 = Math.abs(vx * wy - vy * wx);
    const turn = Math.atan2(cross2, vx * wx + vy * wy);
    if (turn < 0.05) continue;
    const radius = ab * bc * ac / (2 * cross2 || 1);
    if (Number.isFinite(radius)) radii.push(radius);
  }
  if (!radii.length) return 360;
  radii.sort((a, b) => a - b);
  const r = radii[Math.floor((radii.length - 1) * 0.05)];
  return Math.max(16, Math.min(360, r * 0.55));
}
__name(safeDrawnBandSpan, "safeDrawnBandSpan");

// ../../src/path-geometry.js
var TAU2 = Math.PI * 2;
var SHAPES = ["straight", "wave", "zigzag", "chevron", "jagged", "stepped", "arc", "contour", "hairpin", "loop", "loops", "drawn"];

// ../../src/photo-look.js
var PHOTO_PRESETS = Object.freeze({
  "film-slide": Object.freeze({ family: "film", contrast: 1.2, saturation: 1.13, shadow: 0, highlight: 0.07, red: 0.014, green: 0, blue: -0.014, grain: 12, vignette: 9 }),
  "film-negative": Object.freeze({ family: "film", contrast: 0.93, saturation: 0.87, shadow: 0.035, highlight: 0.055, red: 0.014, green: 5e-3, blue: -0.012, grain: 19, vignette: 12 }),
  // Exact muted-negative grade and grain, but opt-in shadow floor preservation.
  "film-negative-deepblack": Object.freeze({ family: "film", contrast: 0.93, saturation: 0.87, shadow: 0.035, highlight: 0.055, red: 0.014, green: 5e-3, blue: -0.012, grain: 19, vignette: 12 }),
  "film-mono": Object.freeze({ family: "film", contrast: 1.13, saturation: 0, shadow: 9e-3, highlight: 0.05, red: 0, green: 0, blue: 0, grain: 16, vignette: 8 }),
  "film-grain-only": Object.freeze({ family: "film", contrast: 1, saturation: 1, shadow: 0, highlight: 0, red: 0, green: 0, blue: 0, grain: 58, vignette: 0 }),
  "film-halation-only": Object.freeze({ family: "film", contrast: 1, saturation: 1, shadow: 0, highlight: 0, red: 0, green: 0, blue: 0, grain: 0, vignette: 0, halation: 75 }),
  // A separately named wide, optically soft red/orange diffusion treatment.
  // The original narrow halation's pixel recipe remains exactly unchanged.
  "film-halation-diffusion": Object.freeze({ family: "film", contrast: 1, saturation: 1, shadow: 0, highlight: 0, red: 0, green: 0, blue: 0, grain: 0, vignette: 0, halation: 85 }),
  "camera-natural": Object.freeze({ family: "camera", contrast: 1.055, saturation: 1.045, shadow: 0.012, highlight: 0.06, red: 0, green: 0, blue: 0, grain: 2, vignette: 2 }),
  "camera-hdr": Object.freeze({ family: "camera", contrast: 1.11, saturation: 1.12, shadow: 0.055, highlight: 0.095, red: 2e-3, green: 3e-3, blue: 2e-3, grain: 1, vignette: 0 }),
  "camera-dslr-optics": Object.freeze({ family: "camera", contrast: 1.06, saturation: 1.025, shadow: 0, highlight: 0.045, red: 0, green: 0, blue: 0, grain: 1, vignette: 10 }),
  "camera-webcam": Object.freeze({ family: "camera", contrast: 1.08, saturation: 0.78, shadow: 0.015, highlight: 0.02, red: 0.015, green: -3e-3, blue: 5e-3, grain: 22, vignette: 5 }),
  "camera-webcam-signal": Object.freeze({ family: "camera", contrast: 1.06, saturation: 0.84, shadow: 0.02, highlight: 0.015, red: 0.012, green: -6e-3, blue: 8e-3, grain: 7, vignette: 4 }),
  "camera-digicam-signal": Object.freeze({ family: "camera", contrast: 1.14, saturation: 1.22, shadow: 0, highlight: -0.025, red: 0.012, green: -4e-3, blue: -9e-3, grain: 13, vignette: 3 }),
  // Opt-in small point-and-shoot flash, entirely separate from existing looks.
  "camera-pocket-flash": Object.freeze({ family: "camera", contrast: 1.13, saturation: 1.11, shadow: 8e-3, highlight: -0.035, red: 0.012, green: 0, blue: -8e-3, grain: 8, vignette: 2 })
});
var PHOTO_PRESET_NAMES = Object.freeze({
  "film-slide": "Slide film inspired",
  "film-negative": "Muted negative print",
  "film-negative-deepblack": "Deep-black negative print (dark backgrounds)",
  "film-mono": "Monochrome print",
  "film-grain-only": "Film grain only (no colour grade)",
  "film-halation-only": "Warm film halation only",
  "film-halation-diffusion": "Wide warm film light diffusion",
  "camera-natural": "Natural digital camera",
  "camera-hdr": "Smartphone HDR inspired",
  "camera-dslr-optics": "Interchangeable-lens digital (simulated)",
  "camera-webcam": "Old webcam colour (early preview)",
  "camera-webcam-signal": "Low-resolution webcam capture (simulated)",
  "camera-digicam-signal": "Early digital compact camera (simulated)",
  "camera-pocket-flash": "Direct-flash point-and-shoot (simulated)"
});
var finite = /* @__PURE__ */ __name((x, fallback, min, max) => {
  const n = Number(x);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}, "finite");
var limits = {
  contrast: [0.5, 1.8],
  saturation: [0, 1.8],
  shadow: [-0.15, 0.2],
  highlight: [-0.15, 0.2],
  red: [-0.15, 0.15],
  green: [-0.15, 0.15],
  blue: [-0.15, 0.15],
  grain: [0, 100],
  vignette: [0, 100]
};
function normalizePhotoLook(value = {}) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const presetId = Object.hasOwn(PHOTO_PRESETS, source.presetId) ? source.presetId : "film-slide";
  const preset = PHOTO_PRESETS[presetId];
  const candidate = source.parameters && typeof source.parameters === "object" ? source.parameters : {};
  const parameters = Object.fromEntries(Object.entries(limits).map(([key, [min, max]]) => [key, finite(candidate[key], preset[key], min, max)]));
  if (presetId === "film-halation-only" || presetId === "film-halation-diffusion")
    parameters.halation = finite(candidate.halation, preset.halation, 0, 100);
  return {
    version: 1,
    enabled: source.enabled === true || source.enabled === "true",
    family: preset.family,
    presetId,
    amount: finite(source.amount, 75, 0, 100),
    parameters
  };
}
__name(normalizePhotoLook, "normalizePhotoLook");
var MAX_PHOTO_READBACK_BYTES = 2 * 1024 * 1024;

// ../../src/embroidery.js
var bounds = /* @__PURE__ */ __name((value, fallback, min, max) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
}, "bounds");
function normalizeSurfaceTreatments(input) {
  if (!Array.isArray(input)) return [];
  const seen = /* @__PURE__ */ new Set(), out = [];
  for (const raw of input.slice(0, 32)) {
    if (!raw || typeof raw !== "object") continue;
    const id = String(raw.id || "").trim().slice(0, 72);
    if (!/^[a-zA-Z0-9_-]{1,72}$/.test(id) || seen.has(id)) continue;
    seen.add(id);
    const src = raw.target && typeof raw.target === "object" ? raw.target : {};
    const scope = ["all", "palette", "object"].includes(src.scope) ? src.scope : "palette";
    const colorSlots = [...new Set((Array.isArray(src.colorSlots) ? src.colorSlots : []).filter((i) => Number.isInteger(i) && i >= 0 && i < 7))].slice(0, 7);
    const ids = [...new Set((Array.isArray(src.ids) ? src.ids : []).filter((i) => typeof i === "string" && /^[a-zA-Z0-9_\/-]{1,84}$/.test(i)))].slice(0, 16);
    out.push({
      id,
      enabled: raw.enabled === true || raw.enabled === "true",
      materialFamily: "embroidery",
      style: ["satin", "satin-soft", "tatami", "running", "chain", "satin-fibre", "tatami-fibre"].includes(raw.style) ? raw.style : "satin",
      target: { scope, role: "fill", colorSlots, ids },
      pitch: bounds(raw.pitch, 5, 2, 16),
      relief: bounds(raw.relief, 65, 0, 100),
      direction: bounds(raw.direction, 38, -180, 180)
    });
    if (out.length === 12) break;
  }
  return out;
}
__name(normalizeSurfaceTreatments, "normalizeSurfaceTreatments");

// ../../src/geometry-asset.js
var GEOMETRY_SNAPSHOT_SCHEMA = "roygbiv.geometry-snapshot";
var MAX_SHAPE_COMPONENTS = 32;
var MAX_SHAPE_RINGS = 64;
var MAX_RING_POINTS = 2048;
var MAX_SHAPE_POINTS = 8192;
var MAX_GEOMETRY_BYTES = 1024 * 1024;
var encoder = new TextEncoder();
var fail = /* @__PURE__ */ __name((message) => {
  throw new TypeError("Invalid geometry: " + message);
}, "fail");
var object2 = /* @__PURE__ */ __name((value) => value !== null && typeof value === "object" && !Array.isArray(value), "object");
var finite2 = /* @__PURE__ */ __name((n) => typeof n === "number" && Number.isFinite(n), "finite");
var round2 = /* @__PURE__ */ __name((n) => {
  const result = Math.round(n * 1e6) / 1e6;
  return Object.is(result, -0) ? 0 : result;
}, "round");
var distance2 = /* @__PURE__ */ __name((a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2, "distance2");
var cross = /* @__PURE__ */ __name((a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]), "cross");
function checkedPoint(value) {
  if (!Array.isArray(value) || value.length !== 2 || !finite2(value[0]) || !finite2(value[1]) || Math.abs(value[0]) > 1e6 || Math.abs(value[1]) > 1e6) fail("point is not a finite coordinate pair");
  return [round2(value[0]), round2(value[1])];
}
__name(checkedPoint, "checkedPoint");
function checkedByteLimit(value) {
  if (encoder.encode(JSON.stringify(value)).length > MAX_GEOMETRY_BYTES)
    fail("serialized geometry exceeds the 1 MiB limit");
  return value;
}
__name(checkedByteLimit, "checkedByteLimit");
function area(ring) {
  let sum = 0;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length];
    sum += a[0] * b[1] - a[1] * b[0];
  }
  return sum / 2;
}
__name(area, "area");
function onSegment(a, b, c) {
  return Math.min(a[0], b[0]) - 1e-9 <= c[0] && c[0] <= Math.max(a[0], b[0]) + 1e-9 && Math.min(a[1], b[1]) - 1e-9 <= c[1] && c[1] <= Math.max(a[1], b[1]) + 1e-9;
}
__name(onSegment, "onSegment");
function intersects(a, b, c, d) {
  const abC = cross(a, b, c), abD = cross(a, b, d), cdA = cross(c, d, a), cdB = cross(c, d, b);
  if ((abC > 1e-9 && abD < -1e-9 || abC < -1e-9 && abD > 1e-9) && (cdA > 1e-9 && cdB < -1e-9 || cdA < -1e-9 && cdB > 1e-9)) return true;
  return Math.abs(abC) <= 1e-9 && onSegment(a, b, c) || Math.abs(abD) <= 1e-9 && onSegment(a, b, d) || Math.abs(cdA) <= 1e-9 && onSegment(c, d, a) || Math.abs(cdB) <= 1e-9 && onSegment(c, d, b);
}
__name(intersects, "intersects");
function ringEdgesCross(first, second) {
  for (let i = 0; i < first.length; i++) for (let j = 0; j < second.length; j++)
    if (intersects(first[i], first[(i + 1) % first.length], second[j], second[(j + 1) % second.length]))
      return true;
  return false;
}
__name(ringEdgesCross, "ringEdgesCross");
function pointInRing(p, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i], b = ring[j];
    if (a[1] > p[1] !== b[1] > p[1] && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}
__name(pointInRing, "pointInRing");
function normalizeRing(input, clockwise) {
  if (!Array.isArray(input) || input.length < 3 || input.length > MAX_RING_POINTS + 1)
    fail("outline must contain 3..2048 vertices");
  const points = [];
  for (const raw of input) {
    const p = checkedPoint(raw);
    if (!points.length || distance2(points.at(-1), p) > 1e-12) points.push(p);
  }
  if (points.length > 1 && distance2(points[0], points.at(-1)) <= 1e-12) points.pop();
  if (points.length < 3 || points.length > MAX_RING_POINTS) fail("outline has too few or too many distinct vertices");
  const signed = area(points);
  if (Math.abs(signed) < 1e-7) fail("outline has zero area");
  for (let i = 0; i < points.length; i++) for (let j = i + 2; j < points.length; j++) {
    if (i === 0 && j === points.length - 1) continue;
    if (intersects(
      points[i],
      points[(i + 1) % points.length],
      points[j],
      points[(j + 1) % points.length]
    )) fail("outline crosses itself");
  }
  if (signed < 0 !== clockwise) points.reverse();
  let first = 0;
  for (let i = 1; i < points.length; i++) {
    if (points[i][0] < points[first][0] || points[i][0] === points[first][0] && points[i][1] < points[first][1])
      first = i;
  }
  return first ? [...points.slice(first), ...points.slice(0, first)] : points;
}
__name(normalizeRing, "normalizeRing");
function checkedViewBox(value) {
  if (!Array.isArray(value) || value.length !== 4 || !value.every(finite2))
    fail("viewBox must have four finite numbers");
  const [x, y, w, h] = value.map(round2);
  if (w <= 0 || h <= 0 || [x, y, w, h].some((n) => Math.abs(n) > 1e6))
    fail("viewBox must have positive bounded dimensions");
  return [x, y, w, h];
}
__name(checkedViewBox, "checkedViewBox");
function withinBox(p, b) {
  return p[0] >= b[0] - 1e-6 && p[1] >= b[1] - 1e-6 && p[0] <= b[0] + b[2] + 1e-6 && p[1] <= b[1] + b[3] + 1e-6;
}
__name(withinBox, "withinBox");
function normalizeCompoundRegion(input) {
  if (!object2(input) || input.type !== "compound-region") fail("expected a compound-region");
  if (input.space !== "asset-local" || input.fillRule !== "evenodd") fail("unsupported shape space/fill rule");
  const viewBox = checkedViewBox(input.viewBox);
  if (!Array.isArray(input.components) || !input.components.length || input.components.length > MAX_SHAPE_COMPONENTS) fail("invalid component count");
  let count = 0, ringCount = 0;
  const components = input.components.map((component) => {
    if (!object2(component) || !Array.isArray(component.holes)) fail("invalid component");
    const outer = normalizeRing(component.outer, false);
    count += outer.length;
    ringCount++;
    const holes = component.holes.map((raw) => {
      const hole = normalizeRing(raw, true);
      count += hole.length;
      ringCount++;
      if (!pointInRing(hole[0], outer) || ringEdgesCross(outer, hole))
        fail("hole must be entirely inside its outer outline");
      return hole;
    });
    for (let i = 0; i < holes.length; i++) for (let j = i + 1; j < holes.length; j++)
      if (ringEdgesCross(holes[i], holes[j]) || pointInRing(holes[i][0], holes[j]) || pointInRing(holes[j][0], holes[i]))
        fail("holes may not overlap or nest");
    if (count > MAX_SHAPE_POINTS || ringCount > MAX_SHAPE_RINGS) fail("shape is too complex");
    if (![...outer, ...holes.flat()].every((p) => withinBox(p, viewBox)))
      fail("shape extends beyond its declared viewBox");
    return { outer, holes };
  });
  return checkedByteLimit({
    type: "compound-region",
    space: "asset-local",
    viewBox,
    components,
    fillRule: "evenodd"
  });
}
__name(normalizeCompoundRegion, "normalizeCompoundRegion");

// ../../src/scattered-object-edits.js
var clamp2 = /* @__PURE__ */ __name((v, a, b) => Math.min(b, Math.max(a, v)), "clamp");
var finite3 = /* @__PURE__ */ __name((v) => typeof v === "number" && Number.isFinite(v), "finite");
var round3 = /* @__PURE__ */ __name((v) => Math.round(v * 1e6) / 1e6, "round");
function normalizeScatteredOverrides(value) {
  if (!Array.isArray(value)) return [];
  const found = /* @__PURE__ */ new Map();
  for (const raw of value.slice(0, 70)) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const { index, x, y, radius } = raw;
    if (!Number.isInteger(index) || index < 0 || index >= 70 || !finite3(x) || !finite3(y) || !finite3(radius)) continue;
    found.set(index, {
      index,
      x: round3(clamp2(x, -0.5, 1.5)),
      y: round3(clamp2(y, -0.5, 1.5)),
      radius: round3(clamp2(radius, 0.01, 1.2))
    });
  }
  return [...found.values()].sort((a, b) => a.index - b.index);
}
__name(normalizeScatteredOverrides, "normalizeScatteredOverrides");
function normalizeScatteredLayerOrder(value) {
  if (!Array.isArray(value)) return [];
  const seen = /* @__PURE__ */ new Set(), order = [];
  for (const index of value.slice(0, 70)) {
    if (!Number.isInteger(index) || index < 0 || index >= 70 || seen.has(index)) continue;
    seen.add(index);
    order.push(index);
  }
  return order;
}
__name(normalizeScatteredLayerOrder, "normalizeScatteredLayerOrder");
function effectiveScatteredLayerOrder(value, indices) {
  const available = [...new Set(indices.filter((i) => Number.isInteger(i) && i >= 0 && i < 70))].sort((a, b) => a - b);
  const exists = new Set(available);
  const explicit = normalizeScatteredLayerOrder(value).filter((i) => exists.has(i));
  const listed = new Set(explicit);
  return [...explicit, ...available.filter((i) => !listed.has(i))];
}
__name(effectiveScatteredLayerOrder, "effectiveScatteredLayerOrder");

// ../../src/scattered-shape-overrides.js
var PER_HUE_SHAPE_LIMIT = 7;
var PER_HUE_TOTAL_BYTES = 192 * 1024;
var PER_HUE_VERTICES_PER_SHAPE = 1200;
var bytes = new TextEncoder();
function normalizeScatteredShapeOverrides(value) {
  if (!Array.isArray(value)) return [];
  const seen = /* @__PURE__ */ new Set(), output = [];
  let size = 0;
  for (const item of value.slice(0, 70)) {
    if (!item || typeof item !== "object" || Array.isArray(item) || !Number.isInteger(item.index) || item.index < 0 || item.index >= PER_HUE_SHAPE_LIMIT || seen.has(item.index)) continue;
    const input = item.shape;
    if (input?.schema !== GEOMETRY_SNAPSHOT_SCHEMA || input?.version !== 1 || !input.geometry || !Array.isArray(input.geometry.components)) continue;
    const groups = input.geometry.components;
    if (groups.length < 1 || groups.length > 32) continue;
    let vertices = 0, valid = true;
    for (const group of groups) {
      if (!Array.isArray(group?.outer) || !Array.isArray(group?.holes) || group.holes.length > 64) {
        valid = false;
        break;
      }
      vertices += group.outer.length;
      for (const ring of group.holes) {
        if (!Array.isArray(ring)) {
          valid = false;
          break;
        }
        vertices += ring.length;
      }
      if (vertices > PER_HUE_VERTICES_PER_SHAPE) {
        valid = false;
        break;
      }
    }
    if (!valid) continue;
    try {
      const geometry = normalizeCompoundRegion(input.geometry);
      const shape = { schema: GEOMETRY_SNAPSHOT_SCHEMA, version: 1, geometry };
      const cost = bytes.encode(JSON.stringify(shape)).length;
      if (cost > PER_HUE_TOTAL_BYTES || size + cost > PER_HUE_TOTAL_BYTES)
        continue;
      output.push({ index: item.index, shape });
      seen.add(item.index);
      size += cost;
    } catch {
    }
  }
  return output.sort((a, b) => a.index - b.index);
}
__name(normalizeScatteredShapeOverrides, "normalizeScatteredShapeOverrides");

// ../../src/nested-shape-contours.js
var clamp3 = /* @__PURE__ */ __name((n, min, max) => Math.max(min, Math.min(max, n)), "clamp");
var finite4 = /* @__PURE__ */ __name((v, fallback, min, max) => Number.isFinite(Number(v)) ? clamp3(Number(v), min, max) : fallback, "finite");
var DEFAULT_NESTED_CONTOURS = Object.freeze({
  enabled: true,
  objectId: "region-0",
  count: 7,
  strokeWidth: 2,
  gap: 5,
  firstInset: 3,
  colourOrder: "forward",
  fit: "exact"
});
function normalizeNestedShapeContours(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const objectId = typeof raw.objectId === "string" && /^region-(?:[0-9]|[1-6][0-9])$/.test(raw.objectId) ? raw.objectId : "region-0";
  return {
    enabled: raw.enabled !== false,
    objectId,
    count: Math.round(finite4(raw.count, 7, 1, 7)),
    strokeWidth: finite4(raw.strokeWidth, 2, 0.5, 12),
    gap: finite4(raw.gap, 5, 0.5, 30),
    firstInset: finite4(raw.firstInset, 3, 0, 50),
    colourOrder: raw.colourOrder === "reverse" ? "reverse" : "forward",
    // Automatic fitting must never silently invent contours or change geometry.
    // Explicit fit currently draws every physically existing requested level.
    fit: "exact"
  };
}
__name(normalizeNestedShapeContours, "normalizeNestedShapeContours");

// ../../src/contour-decoration.js
var TAU3 = Math.PI * 2;

// ../../src/interior-elements.js
var ELEMENT_TYPES = Object.freeze(["line", "band"]);
var ELEMENT_SHAPES = Object.freeze(["straight", "wave", "zigzag", "loop"]);
var ELEMENT_STROKES = Object.freeze(["solid", "dashed", "dotted"]);
var clamp4 = /* @__PURE__ */ __name((x, a, b) => Math.max(a, Math.min(b, x)), "clamp");
var number4 = /* @__PURE__ */ __name((x, f, a, b) => clamp4(Number.isFinite(+x) ? +x : f, a, b), "number");
var COLOURS = ["white", "black", "lighter", "darker", "custom"];
var RAINBOW_NAMES = Object.freeze(["Red", "Orange", "Yellow", "Green", "Blue", "Indigo", "Violet"]);
var INTERIOR_LIMITS = Object.freeze({
  fieldFrequency: Object.freeze({ min: 0.1, max: 100, step: 0.1 }),
  contourFrequency: Object.freeze({ min: 1, max: 30, step: 1 }),
  phase: Object.freeze({ min: -360, max: 360, step: 1 })
});
function normalizeInteriorElements(input) {
  if (!Array.isArray(input)) return [];
  const seen = /* @__PURE__ */ new Set();
  return input.slice(0, 8).map((raw, i) => {
    const e = raw && typeof raw === "object" ? raw : {};
    let id = String(e.id ?? "element-" + i).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48) || "element-" + i;
    if (seen.has(id)) {
      const base = "element-" + i;
      id = base;
      let suffix = 2;
      while (seen.has(id)) id = base + "-" + suffix++;
    }
    seen.add(id);
    return {
      id,
      enabled: e.enabled !== false,
      type: ELEMENT_TYPES.includes(e.type) ? e.type : "line",
      shape: ELEMENT_SHAPES.includes(e.shape) ? e.shape : "straight",
      stroke: ELEMENT_STROKES.includes(e.stroke) ? e.stroke : "solid",
      color: COLOURS.includes(e.color) ? e.color : "white",
      customColor: /^#[0-9a-f]{6}$/i.test(e.customColor) ? e.customColor.toLowerCase() : "#ffffff",
      colorSlots: Array.isArray(e.colorSlots) ? [...new Set(e.colorSlots.filter((x) => Number.isInteger(x) && x >= 0 && x < 7))] : [],
      objectIds: Array.isArray(e.objectIds) ? [...new Set(e.objectIds.filter((x) => typeof x === "string" && x.length < 100))].slice(0, 200) : [],
      // Lines use logical design pixels; tonal bands use percent of local shape width.
      width: number4(e.width, e.type === "band" ? 22 : 1.5, 0.15, 50),
      position: number4(e.position, 0, -0.48, 0.48),
      amplitude: number4(e.amplitude, 0.12, 0, 0.45),
      // Closed contours use whole cycles to meet cleanly at their seams.
      frequency: e.placement === "contour" ? Math.round(number4(
        e.frequency,
        6,
        INTERIOR_LIMITS.contourFrequency.min,
        INTERIOR_LIMITS.contourFrequency.max
      )) : number4(e.frequency, 6, INTERIOR_LIMITS.fieldFrequency.min, INTERIOR_LIMITS.fieldFrequency.max),
      phase: number4(e.phase, 0, INTERIOR_LIMITS.phase.min, INTERIOR_LIMITS.phase.max),
      opacity: number4(e.opacity, 1, 0, 1),
      placement: ["local", "field", "contour"].includes(e.placement) ? e.placement : "local"
    };
  });
}
__name(normalizeInteriorElements, "normalizeInteriorElements");

// ../../src/text-rainbow-shaping.js
var trailingGraphemePart = /[\p{Mark}\p{Emoji_Modifier}]/u;
var regionalIndicator = /\p{Regional_Indicator}/u;
var emojiTag = /[\u{e0020}-\u{e007f}]/u;
function* fallbackTextGraphemes(value) {
  let cluster = "", regionalCount = 0;
  for (const char of value) {
    const regional = regionalIndicator.test(char);
    const join = cluster && (trailingGraphemePart.test(char) || emojiTag.test(char) || char === "\u200D" || cluster.endsWith("\u200D") || regional && regionalCount === 1);
    if (join) {
      cluster += char;
      if (regional) regionalCount++;
    } else {
      if (cluster) yield cluster;
      cluster = char;
      regionalCount = regional ? 1 : 0;
    }
  }
  if (cluster) yield cluster;
}
__name(fallbackTextGraphemes, "fallbackTextGraphemes");

// ../../src/local-fonts.js
var LOCAL_FONT_LIMIT_BYTES = 5 * 1024 * 1024;
var LOCAL_FONT_ID_PATTERN = /^user-[a-f0-9]{64}$/;
var isLocalFontId = /* @__PURE__ */ __name((id) => typeof id === "string" && LOCAL_FONT_ID_PATTERN.test(id), "isLocalFontId");

// ../../src/bundled-fonts.js
var choices = [
  ["bangers", "Bangers", "Poster"],
  ["abrilfatface", "Abril Fatface", "Editorial"],
  ["pacifico", "Pacifico", "Hand-lettered"],
  ["lobster", "Lobster", "Hand-lettered"],
  ["bebasneue", "Bebas Neue", "Poster"],
  ["righteous", "Righteous", "Retro"],
  ["pressstart2p", "Press Start 2P", "Arcade"],
  ["monoton", "Monoton", "Neon & display"],
  ["cinzel", "Cinzel", "Editorial"],
  ["audiowide", "Audiowide", "Futuristic"],
  ["lilitaone", "Lilita One", "Friendly"],
  ["bungee", "Bungee", "Poster"],
  ["bungeeshade", "Bungee Shade", "3D & outline"],
  ["shrikhand", "Shrikhand", "Retro"],
  ["rubikwetpaint", "Rubik Wet Paint", "Expressive"],
  ["sacramento", "Sacramento", "Script"],
  ["fugazone", "Fugaz One", "Poster"],
  ["rubikglitch", "Rubik Glitch", "Experimental"],
  ["blackopsone", "Black Ops One", "Stencil"],
  ["notable", "Notable", "Stencil"],
  ["orbitron", "Orbitron", "Futuristic"],
  ["nosifer", "Nosifer", "Horror"],
  ["fascinateinline", "Fascinate Inline", "Outline"],
  ["limelight", "Limelight", "Art Deco"],
  ["courgette", "Courgette", "Script"],
  ["changaone", "Changa One", "Friendly"],
  ["creepster", "Creepster", "Horror"]
];
var BUNDLED_FONTS = Object.freeze(Object.fromEntries(choices.map(
  ([slug, label, group]) => ["pack-" + slug, Object.freeze({ slug, label, group })]
)));
var isBundledFontId = /* @__PURE__ */ __name((id) => typeof id === "string" && Object.hasOwn(BUNDLED_FONTS, id), "isBundledFontId");

// ../../src/text-overlays.js
var TEXT_FONTS = Object.freeze({
  bold: "Impact, 'Arial Narrow', sans-serif",
  rounded: "'Trebuchet MS', Arial, sans-serif",
  modern: "Arial, Helvetica, sans-serif",
  editorial: "Georgia, 'Times New Roman', serif",
  typewriter: "'Courier New', monospace",
  playful: "'Comic Sans MS', cursive"
});
var TEXT_COLOURS = Object.freeze([
  "black",
  "white",
  "rainbow-letter",
  "rainbow-word",
  "rainbow-gradient"
]);
var TEXT_OUTLINES = Object.freeze(["none", "black", "white", "black-white", "white-black"]);
var TEXT_PATHS = Object.freeze(["none", "wave", "arc", "circle", "hairpin", "loop", "drawn"]);
var TEXT_SHADOWS = Object.freeze(["none", "black", "white"]);
var MAX_TEXT_OVERLAYS = 8;
var num = /* @__PURE__ */ __name((value, fallback, min, max) => {
  const n = Number(value);
  const valid = Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
  return Object.is(valid, -0) ? 0 : valid;
}, "num");
function boundedRawTextPrefix(value) {
  if (value.length <= 4096) return value;
  const sample = value.slice(0, 4098);
  const clusters = typeof Intl !== "undefined" && typeof Intl.Segmenter === "function" ? new Intl.Segmenter(void 0, { granularity: "grapheme" }).segment(sample) : fallbackTextGraphemes(sample);
  let end = 0;
  for (const unit of clusters) {
    const length = (typeof unit === "string" ? unit : unit.segment).length;
    if (end + length > 4096) break;
    end += length;
  }
  return sample.slice(0, end);
}
__name(boundedRawTextPrefix, "boundedRawTextPrefix");
function boundTextContent(value) {
  if (typeof value !== "string") return "";
  const cleaned = boundedRawTextPrefix(value).replace(/[\uD800-\uDFFF]/gu, "\uFFFD").replace(/\r\n?|[\u0085\u2028\u2029]/gu, "\n").replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "").replace(/\t/g, " ");
  let remaining = 160, lines = 1, result = "";
  const segmentation = typeof Intl !== "undefined" && typeof Intl.Segmenter === "function" ? new Intl.Segmenter(void 0, { granularity: "grapheme" }).segment(cleaned) : fallbackTextGraphemes(cleaned);
  for (const unit of segmentation) {
    const cluster = typeof unit === "string" ? unit : unit.segment;
    const cost = Array.from(cluster).length;
    if (cost > remaining) break;
    const newLines = (cluster.match(/\n/g) || []).length;
    if (lines + newLines > 4) break;
    result += cluster;
    remaining -= cost;
    lines += newLines;
    if (!remaining) break;
  }
  return result;
}
__name(boundTextContent, "boundTextContent");
function normalizeTextOverlays(input) {
  if (!Array.isArray(input)) return [];
  const used = /* @__PURE__ */ new Set();
  return input.slice(0, MAX_TEXT_OVERLAYS).map((value, index) => {
    const v = value && typeof value === "object" && !Array.isArray(value) ? value : {};
    const text = boundTextContent(v.text);
    let id = typeof v.id === "string" && /^[A-Za-z0-9_-]{1,48}$/.test(v.id) ? v.id : "text-" + (index + 1);
    if (used.has(id)) id = "text-" + (index + 1);
    while (used.has(id)) id += "-copy";
    used.add(id);
    return {
      id,
      text,
      enabled: v.enabled !== false,
      x: num(v.x, 50, 0, 100),
      y: num(v.y, 50, 0, 100),
      size: num(v.size, 64, 12, 180),
      rotation: num(v.rotation, 0, -180, 180),
      opacity: num(v.opacity, 1, 0, 1),
      font: isLocalFontId(v.font) || isBundledFontId(v.font) ? v.font : Object.hasOwn(TEXT_FONTS, v.font) ? v.font : "bold",
      colour: TEXT_COLOURS.includes(v.colour) ? v.colour : "rainbow-letter",
      outline: TEXT_OUTLINES.includes(v.outline) ? v.outline : "black",
      outlineWidth: num(v.outlineWidth, 5, 0, 20),
      // Expressive treatment is opt-in; absent keys retain exact legacy ink.
      ...v.letterSpacing !== void 0 ? { letterSpacing: num(v.letterSpacing, 0, -3, 18) } : {},
      ...v.lineSpacing !== void 0 ? { lineSpacing: num(v.lineSpacing, 0, -20, 100) } : {},
      ...v.rainbowOffset !== void 0 ? { rainbowOffset: Math.round(num(v.rainbowOffset, 0, 0, 6)) } : {},
      ...v.rainbowReverse === true ? { rainbowReverse: true } : {},
      ...TEXT_SHADOWS.includes(v.shadow) && v.shadow !== "none" ? {
        shadow: v.shadow,
        shadowBlur: num(v.shadowBlur, 6, 0, 16),
        shadowDistance: num(v.shadowDistance, 7, 0, 16),
        ...v.shadowAngle !== void 0 ? { shadowAngle: Math.round(num(v.shadowAngle, 45, 0, 359)) } : {}
      } : {},
      // Curved baselines are strictly opt-in. Old lettering is unchanged.
      ...TEXT_PATHS.includes(v.path) && v.path !== "none" ? {
        path: v.path,
        pathHeight: num(v.pathHeight, 90, 20, 240)
      } : {},
      locked: v.locked === true
    };
  }).filter((item) => item.text.length > 0);
}
__name(normalizeTextOverlays, "normalizeTextOverlays");

// ../../src/scattered-composition.js
var W = 600;
var H = 1300;
var TAU4 = 2 * Math.PI;
var clamp5 = /* @__PURE__ */ __name((x, a, b) => Math.max(a, Math.min(b, x)), "clamp");
var hash = /* @__PURE__ */ __name((s) => {
  let h = 2166136261;
  for (const c of String(s)) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}, "hash");
var randomStream = /* @__PURE__ */ __name((seed) => {
  let x = hash(seed);
  return () => {
    x = x + 1831565813 >>> 0;
    let z = Math.imul(x ^ x >>> 15, 1 | x);
    z ^= z + Math.imul(z ^ z >>> 7, 61 | z);
    return ((z ^ z >>> 14) >>> 0) / 4294967296;
  };
}, "randomStream");
var between = /* @__PURE__ */ __name((r, a, b) => a + (b - a) * r(), "between");
var point = /* @__PURE__ */ __name((x, y) => ({ x, y }), "point");
var POLY_SAMPLES = 144;
var rim = /* @__PURE__ */ __name((cx, cy, r) => Array.from({ length: POLY_SAMPLES }, (_, i) => {
  const t = TAU4 * i / POLY_SAMPLES;
  return point(cx + r * Math.cos(t), cy + r * Math.sin(t));
}), "rim");
var intersects2 = /* @__PURE__ */ __name((a, b, gap) => Math.hypot(a.cx - b.cx, a.cy - b.cy) < a.r + b.r + gap - 1e-6, "intersects");
var visibleFraction = /* @__PURE__ */ __name(({ cx, cy, r }) => {
  const distance3 = Math.hypot(Math.max(0, -cx, cx - W), Math.max(0, -cy, cy - H));
  return distance3 < r * 0.92;
}, "visibleFraction");
var cropped = /* @__PURE__ */ __name(({ cx, cy, r }) => cx - r < 0 || cx + r > W || cy - r < 0 || cy + r > H, "cropped");
var within = /* @__PURE__ */ __name(({ cx, cy, r }) => cx - r >= 0 && cx + r <= W && cy - r >= 0 && cy + r <= H, "within");
var RAINBOW_ORBITS = Object.freeze({
  seed: "orbits-209",
  structure: "regions",
  regionMode: "scattered",
  scatteredShapeKind: "circle",
  scatteredCount: 7,
  scatteredMinSize: 10,
  scatteredMaxSize: 83,
  scatteredVariation: 92,
  scatteredSpacing: 28,
  scatteredEdgeCrop: 75,
  scatteredOverlap: "separate",
  palette: "classic",
  background: "black",
  material: "none",
  outline: "none",
  dividerColor: "none",
  dividerWidth: 0,
  lightingMood: "off",
  glow: 0
});
function scatteredRadiusRange(recipe) {
  const count = clamp5(Math.round(Number(recipe.scatteredCount) || 7), 1, 70);
  const minPercent = clamp5(Number(recipe.scatteredMinSize) || 0, 0, 100);
  const maxPercent = clamp5(Number(recipe.scatteredMaxSize) || 0, 0, 100);
  const minRadius = 8 + minPercent * 0.65;
  const requestedMax = 20 + maxPercent * 3.4;
  const countCap = count <= 10 ? Infinity : 170 * Math.sqrt(10 / count);
  const maxRadius = Math.max(minRadius, Math.min(requestedMax, countCap));
  return {
    count,
    minRadius,
    maxRadius,
    collapsed: Math.abs(maxRadius - minRadius) < 1e-9,
    countCapped: count > 10 && requestedMax > countCap
  };
}
__name(scatteredRadiusRange, "scatteredRadiusRange");
function buildScatteredCircles(recipe) {
  const { count, minRadius, maxRadius } = scatteredRadiusRange(recipe);
  const variation = clamp5(Number(recipe.scatteredVariation) || 0, 0, 100) / 100;
  const crop = clamp5(Number(recipe.scatteredEdgeCrop) || 0, 0, 100) / 100;
  const clearance = clamp5(Number(recipe.scatteredSpacing) || 0, 0, 100) * 0.65;
  const overlap = recipe.scatteredOverlap === "overlap";
  const sizeRng = randomStream(recipe.seed + ":scattered-sizes:v1");
  const placementRng = randomStream(recipe.seed + ":scattered-positions:v1");
  const ranks = Array.from({ length: count }, (_, i) => i);
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(sizeRng() * (i + 1));
    [ranks[i], ranks[j]] = [ranks[j], ranks[i]];
  }
  const requested = Array.from({ length: count }, (_, i) => {
    const sample = (ranks[i] + 0.15 + 0.7 * sizeRng()) / count;
    const t = (1 - variation) * 0.5 + variation * Math.pow(sample, 1.1);
    return { index: i, r: minRadius + (maxRadius - minRadius) * t, tie: sizeRng() };
  }).sort((a, b) => b.r - a.r || a.tie - b.tie);
  const objects = [];
  const mandatoryCrop = Math.min(
    count,
    Math.round(count * crop * 0.55),
    Math.max(1, Math.ceil(Math.sqrt(count)))
  );
  let croppedCount = 0;
  const gap = clearance;
  for (const item of requested) {
    const radiusStops = [1, 0.88, 0.76, 0.65, 0.54, 0.44, 0.36, 0.28];
    let chosen = null;
    for (const fraction of radiusStops) {
      const radius = Math.max(minRadius, item.r * fraction);
      if (chosen) break;
      const mustCrop = croppedCount < mandatoryCrop;
      let best = null, bestScore = -Infinity;
      for (let tryIndex = 0; tryIndex < 280; tryIndex++) {
        const edgeTarget = mustCrop;
        let cx, cy;
        if (edgeTarget) {
          const edge = Math.floor(placementRng() * 4);
          const penetration = between(placementRng, 0.13, 0.82);
          if (edge === 0) {
            cx = radius * penetration;
            cy = between(placementRng, radius, H - radius);
          } else if (edge === 1) {
            cx = W - radius * penetration;
            cy = between(placementRng, radius, H - radius);
          } else if (edge === 2) {
            cy = radius * penetration;
            cx = between(placementRng, radius, W - radius);
          } else {
            cy = H - radius * penetration;
            cx = between(placementRng, radius, W - radius);
          }
        } else {
          const x0 = radius, x1 = W - radius, y0 = radius, y1 = H - radius;
          cx = x0 <= x1 ? between(placementRng, x0, x1) : W / 2;
          cy = y0 <= y1 ? between(placementRng, y0, y1) : H / 2;
        }
        const trial = { cx, cy, r: radius };
        if (!visibleFraction(trial)) continue;
        if (mustCrop && !cropped(trial)) continue;
        if (!edgeTarget && !within(trial)) continue;
        if (!overlap && objects.some((obj) => intersects2(trial, obj.circle, gap))) continue;
        const nearest = objects.length ? Math.min(...objects.map((o) => Math.hypot(cx - o.circle.cx, cy - o.circle.cy) - radius - o.circle.r)) : 220;
        const balance = Math.min(cx, W - cx) / W + Math.min(cy, H - cy) / H;
        const score = nearest * 0.6 + balance * 28 + placementRng() * 55;
        if (score > bestScore) {
          best = trial;
          bestScore = score;
        }
      }
      if (best) chosen = best;
      if (radius === minRadius) break;
    }
    if (!chosen) continue;
    if (cropped(chosen)) croppedCount++;
    objects.push({
      kind: "region",
      id: "region-" + item.index,
      colorIndex: item.index % 7,
      circle: chosen,
      vertices: rim(chosen.cx, chosen.cy, chosen.r),
      origin: point(chosen.cx, chosen.cy)
    });
  }
  objects.sort((a, b) => a.colorIndex - b.colorIndex || Number(a.id.slice(7)) - Number(b.id.slice(7)));
  const manual = new Map(normalizeScatteredOverrides(recipe.scatteredOverrides).map((entry) => [entry.index, entry]));
  for (const object3 of objects) {
    const edit = manual.get(Number(object3.id.slice(7)));
    if (!edit) continue;
    const cx = edit.x * W, cy = edit.y * H, r = edit.radius * W;
    object3.circle = { cx, cy, r };
    object3.origin = point(cx, cy);
    object3.vertices = rim(cx, cy, r);
  }
  if (recipe.scatteredLayerOrder?.length) {
    const paintOrder = effectiveScatteredLayerOrder(
      recipe.scatteredLayerOrder,
      objects.map((o) => Number(o.id.slice(7)))
    );
    const layers = new Map(paintOrder.map((id, i) => [id, i]));
    objects.sort((a, b) => layers.get(Number(a.id.slice(7))) - layers.get(Number(b.id.slice(7))));
  }
  const placed = objects.length;
  return {
    objects,
    requested: count,
    placed,
    diagnostic: placed < count ? "Only " + placed + " of " + count + " circles fit with the selected minimum size and spacing. Reduce size, spacing, or count." : null,
    cropped: objects.filter((object3) => cropped(object3.circle)).length
  };
}
__name(buildScatteredCircles, "buildScatteredCircles");
function buildScatteredObjects(recipe) {
  const placed = buildScatteredCircles(recipe);
  if (recipe.scatteredShapeKind !== "imported") return placed;
  const shared = recipe.scatteredShape?.geometry;
  const overrideBySlot = new Map(normalizeScatteredShapeOverrides(
    recipe.scatteredShapeOverrides
  ).map((item) => [item.index, item.shape.geometry]));
  if (shared?.type !== "compound-region" && !overrideBySlot.size)
    return {
      ...placed,
      objects: [],
      placed: 0,
      cropped: 0,
      diagnostic: "Choose an imported shape from your library."
    };
  let absent = 0;
  const objects = placed.objects.map((source) => {
    const index = Number(source.id.slice(7));
    const geometry = overrideBySlot.get(index) ?? shared;
    if (geometry?.type !== "compound-region" || !geometry.components?.length) {
      absent++;
      return null;
    }
    const [vx, vy, vw, vh] = geometry.viewBox;
    const ox = vx + vw / 2, oy = vy + vh / 2;
    const all = geometry.components.flatMap((component) => [component.outer, ...component.holes].flat());
    const bound = Math.max(1e-9, ...all.map((p) => Math.hypot(p[0] - ox, p[1] - oy)));
    const { cx, cy, r } = source.circle, scale = r / bound;
    const transform2 = /* @__PURE__ */ __name((ring) => ring.map(([x, y]) => point(
      cx + (x - ox) * scale,
      cy + (y - oy) * scale
    )), "transform");
    const rings = geometry.components.flatMap((c) => [transform2(c.outer), ...c.holes.map(transform2)]);
    return {
      kind: "region",
      id: source.id,
      colorIndex: source.colorIndex,
      origin: point(cx, cy),
      vertices: rings[0],
      rings,
      editCircle: { cx, cy, r }
      // same per-object reposition/resize gestures
      // Compound rings retain subtractive holes and detached islands.
      // No bitmap or private library ID enters the renderer.
    };
  }).filter(Boolean);
  return {
    ...placed,
    objects,
    placed: objects.length,
    ...absent ? { diagnostic: "Missing " + absent + " portable imported pigment shape(s); no circles were substituted." } : {}
  };
}
__name(buildScatteredObjects, "buildScatteredObjects");

// ../../src/composition-geometry.js
var STRUCTURES = Object.freeze(["paths", "radial", "regions"]);
var RADIAL_MODES = Object.freeze(["sunburst", "starburst", "pinwheel", "spokes", "concentric"]);
var REGION_MODES = Object.freeze(["voronoi", "organic", "facets", "blocks", "nested", "scattered"]);
var DIVIDER_MODES = Object.freeze(["none", "background", "black", "white"]);
var W2 = 600;
var H2 = 1300;
var TAU5 = 2 * Math.PI;
var clamp6 = /* @__PURE__ */ __name((n, a, b) => Math.min(b, Math.max(a, n)), "clamp");
var lerp = /* @__PURE__ */ __name((a, b, t) => a + (b - a) * t, "lerp");
var point2 = /* @__PURE__ */ __name((x, y) => ({ x, y }), "point");
var hexHash = /* @__PURE__ */ __name((n) => {
  let x = n | 0;
  x = Math.imul(x ^ x >>> 16, 2146121005);
  x = Math.imul(x ^ x >>> 15, 2221713035);
  return ((x ^ x >>> 16) >>> 0) / 4294967296;
}, "hexHash");
var hashString = /* @__PURE__ */ __name((s) => {
  let n = 2166136261;
  for (const c of String(s)) {
    n ^= c.charCodeAt(0);
    n = Math.imul(n, 16777619);
  }
  return n >>> 0;
}, "hashString");
var stream = /* @__PURE__ */ __name((seed) => {
  let n = hashString(seed);
  return () => hexHash(n++);
}, "stream");
var region = /* @__PURE__ */ __name((vertices, index) => ({ kind: "region", vertices, colorIndex: index % 7 }), "region");
var perimeter = /* @__PURE__ */ __name((cx, cy, rx, ry, sides, rotation = 0) => {
  const count = sides >= 3 ? sides : 144;
  return Array.from({ length: count }, (_, i) => {
    const a = TAU5 * i / count + rotation - Math.PI / 2;
    return point2(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry);
  });
}, "perimeter");
var center = /* @__PURE__ */ __name((r) => point2(W2 * (r.fieldCenterX / 100), H2 * (r.fieldCenterY / 100)), "center");
function radialWedges(r) {
  const result = [], origin = center(r), count = r.rayCount;
  const outer = 4200, inner = r.rayCore * 2.8;
  const coverage = clamp6(r.rayCoverage / 100, 0.03, 1);
  const twist = r.rayTwist * Math.PI / 180;
  const base = r.rayRotation * Math.PI / 180;
  const sweep = TAU5 / count;
  for (let i = 0; i < count; i++) {
    const sequence = [...Array.from({ length: 33 }, (_, j) => lerp(inner, outer, j / 32))];
    const vertices = [];
    const angle = /* @__PURE__ */ __name((radius, side) => {
      const u = clamp6(radius / Math.hypot(W2, H2), 0, 1);
      const spiral = (r.radialMode === "pinwheel" ? 1 : r.radialMode === "starburst" ? 0.28 : 0) * twist * u;
      const jag = r.radialMode === "starburst" ? Math.sin(u * Math.PI * 3 + i * 2.39996) * sweep * 0.1 * u : 0;
      return base + (i + 0.5 + side * coverage * 0.5) * sweep + spiral + jag;
    }, "angle");
    for (const radius of sequence) {
      const a = angle(radius, -1);
      vertices.push(point2(origin.x + radius * Math.cos(a), origin.y + radius * Math.sin(a)));
    }
    for (let j = sequence.length - 1; j >= 0; j--) {
      const radius = sequence[j], a = angle(radius, 1);
      vertices.push(point2(origin.x + radius * Math.cos(a), origin.y + radius * Math.sin(a)));
    }
    result.push(region(vertices, i));
  }
  return result;
}
__name(radialWedges, "radialWedges");
function nested(r, radial = false) {
  const count = radial ? r.rayCount : r.regionCount;
  const p = center(r), sides = radial ? 0 : r.regionSides;
  const rotation = (radial ? r.rayRotation : 0) * Math.PI / 180;
  const result = [];
  for (let i = 0; i < count; i++) {
    const size = (count - i) / (count + 0.3);
    const radius = 780;
    result.push(region(
      perimeter(p.x, p.y, radius * size, radius * size, sides, rotation),
      radial ? i : i
    ));
  }
  return result;
}
__name(nested, "nested");
function spokes(r) {
  const p = center(r), result = [];
  for (let i = 0; i < r.rayCount; i++) {
    const a = r.rayRotation * Math.PI / 180 + (i + 0.5) * TAU5 / r.rayCount;
    const vx = Math.cos(a), vy = Math.sin(a), nx = -vy, ny = vx;
    const start = r.rayCore * 2.8, end = 4e3;
    const width = 3 + r.rayCoverage / 100 * Math.max(12, 95 * 7 / r.rayCount);
    const b = width / 2;
    result.push(region([
      point2(p.x + vx * start + nx * b * 0.35, p.y + vy * start + ny * b * 0.35),
      point2(p.x + vx * end + nx * b, p.y + vy * end + ny * b),
      point2(p.x + vx * end - nx * b, p.y + vy * end - ny * b),
      point2(p.x + vx * start - nx * b * 0.35, p.y + vy * start - ny * b * 0.35)
    ], i));
  }
  return result;
}
__name(spokes, "spokes");
function clipHalfPlane(poly, mx, my, dx, dy) {
  if (!poly.length) return [];
  const signed = /* @__PURE__ */ __name((p) => (p.x - mx) * dx + (p.y - my) * dy, "signed");
  const result = [];
  for (let j = 0; j < poly.length; j++) {
    const a = poly[j], b = poly[(j + 1) % poly.length];
    const va = signed(a), vb = signed(b), ina = va <= 1e-7, inb = vb <= 1e-7;
    if (ina) result.push(a);
    if (ina !== inb) {
      const t = clamp6(va / (va - vb), 0, 1);
      result.push(point2(lerp(a.x, b.x, t), lerp(a.y, b.y, t)));
    }
  }
  return result;
}
__name(clipHalfPlane, "clipHalfPlane");
function voronoi(r, organic = false) {
  const random = stream(r.seed + ":cells"), n = r.regionCount;
  const cols = Math.max(2, Math.round(Math.sqrt(n * W2 / H2)));
  const rows = Math.ceil(n / cols), sites = [];
  for (let i = 0; i < n; i++) {
    const col = i % cols, row = Math.floor(i / cols);
    const jitter = r.regionJitter / 100;
    sites.push(point2(
      W2 * (col + 0.5 + (random() - 0.5) * 0.85 * jitter) / cols,
      H2 * (row + 0.5 + (random() - 0.5) * 0.85 * jitter) / rows
    ));
  }
  const domain = [point2(-1400, -2e3), point2(2e3, -2e3), point2(2e3, 3300), point2(-1400, 3300)];
  const distort = r.regionJitter / 100 * (organic ? 72 : 0);
  const warp = /* @__PURE__ */ __name((p) => point2(
    p.x + distort * (Math.sin(p.y * 68e-4 + 1.1) * 0.65 + Math.sin(p.x * 0.011 + p.y * 3e-3) * 0.35),
    p.y + distort * (Math.cos(p.x * 9e-3 + 2.1) * 0.6 + Math.sin(p.y * 0.013 - p.x * 4e-3) * 0.4)
  ), "warp");
  const shapes = [];
  for (let i = 0; i < n; i++) {
    let poly = domain;
    for (let j = 0; j < n && poly.length; j++) if (i !== j) {
      const a = sites[i], b = sites[j];
      poly = clipHalfPlane(poly, (a.x + b.x) / 2, (a.y + b.y) / 2, b.x - a.x, b.y - a.y);
    }
    if (poly.length < 3) continue;
    if (organic) {
      const curved = [];
      for (let j = 0; j < poly.length; j++) {
        const a = poly[j], b = poly[(j + 1) % poly.length];
        const count = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 24));
        for (let k = 0; k < count; k++) curved.push(warp(point2(lerp(a.x, b.x, k / count), lerp(a.y, b.y, k / count))));
      }
      poly = curved;
    }
    shapes.push(region(poly, i));
  }
  return shapes;
}
__name(voronoi, "voronoi");
function facets(r) {
  const random = stream(r.seed + ":facets");
  const nx = Math.max(2, Math.round(Math.sqrt(r.regionCount * W2 / H2)));
  const ny = Math.max(3, Math.ceil(r.regionCount / nx));
  const x0 = -90, y0 = -190, w = 780, h = 1680;
  const grid = Array.from({ length: ny + 1 }, (_, row) => Array.from({ length: nx + 1 }, (_2, col) => {
    const jitter = r.regionJitter / 100 * 0.4;
    return point2(
      x0 + (col + (random() - 0.5) * jitter) * (w / nx),
      y0 + (row + (random() - 0.5) * jitter) * (h / ny)
    );
  }));
  const result = [];
  let index = 0;
  for (let row = 0; row < ny; row++) for (let col = 0; col < nx; col++) {
    const a = grid[row][col], b = grid[row][col + 1], c = grid[row + 1][col], d = grid[row + 1][col + 1];
    result.push(region([a, b, d], index++), region([a, d, c], index++));
  }
  return result;
}
__name(facets, "facets");
function blocks(r) {
  const random = stream(r.seed + ":blocks");
  const rects = [{ x: -45, y: -100, w: 690, h: 1500 }];
  while (rects.length < r.regionCount) {
    const eligible = rects.map((v2, i2) => ({ v: v2, i: i2, area: v2.w * v2.h })).filter((x) => x.v.w > 60 && x.v.h > 60).sort((a2, b2) => b2.area - a2.area);
    if (!eligible.length) break;
    const chosen = eligible[Math.floor(random() * Math.min(eligible.length, 4))];
    const { v, i } = chosen;
    const vertical = v.w / v.h > W2 / H2 * (0.65 + random() * 0.75);
    const fraction = 0.5 + (random() - 0.5) * 0.68 * (r.regionJitter / 100);
    const a = vertical ? { ...v, w: v.w * fraction } : { ...v, h: v.h * fraction };
    const b = vertical ? { ...v, x: v.x + a.w, w: v.w - a.w } : { ...v, y: v.y + a.h, h: v.h - a.h };
    rects.splice(i, 1, a, b);
  }
  return rects.map((v, i) => region([
    point2(v.x, v.y),
    point2(v.x + v.w, v.y),
    point2(v.x + v.w, v.y + v.h),
    point2(v.x, v.y + v.h)
  ], i));
}
__name(blocks, "blocks");
function buildCompositionObjects(recipe, colors, stripes, bundleOffsets) {
  if (recipe.structure === "paths")
    return bundleOffsets.map((offset, i) => ({ kind: "path-group", id: "bundle-" + i, offset, stripes }));
  let shapes = [];
  if (recipe.structure === "radial") {
    shapes = recipe.radialMode === "concentric" ? nested(recipe, true) : recipe.radialMode === "spokes" ? spokes(recipe) : radialWedges(recipe);
  } else {
    switch (recipe.regionMode) {
      case "organic":
        shapes = voronoi(recipe, true);
        break;
      case "facets":
        shapes = facets(recipe);
        break;
      case "blocks":
        shapes = blocks(recipe);
        break;
      case "nested":
        shapes = nested(recipe, false);
        break;
      case "scattered":
        shapes = buildScatteredObjects(recipe).objects;
        break;
      default:
        shapes = voronoi(recipe, false);
    }
  }
  return shapes.map((shape, i) => ({
    ...shape,
    id: recipe.structure === "regions" && recipe.regionMode === "scattered" ? shape.id : "region-" + i,
    origin: center(recipe),
    color: colors[shape.colorIndex]
  }));
}
__name(buildCompositionObjects, "buildCompositionObjects");

// ../../src/model.js
var DESIGN_WIDTH = 600;
var DESIGN_HEIGHT = 1300;
var HUES = [0, 29, 52, 136, 212, 244, 278];
var NAMES = ["Red", "Orange", "Yellow", "Green", "Blue", "Indigo", "Violet"];
var FAMILIES = ["studio", "currents", "fracture", "confetti", "deco", "tapestry", "signal", "contour"];
var GEOMETRIES = SHAPES;
var COMPOSITIONS = ["single", "repeat", "floating"];
var CONSTRUCTIONS = ["ribbon", "stroke", "tonal", "woven"];
var LINE_STYLES = ["continuous", "dotted", "dashed"];
var CROSSING_MODES = ["over", "under", "weave"];
var MOTIFS = ["solid", "dots", "stars", "dashes", "diamonds", "chevrons", "hatch", "checker"];
var MATERIALS = ["none", "grain", "watercolor", "construction", "handmade", "linen", "linen-soft", "linen-organic", "canvas", "denim", "knit", "felt", "corduroy", "corrugated", "concrete", "stucco", "stone", "drywall", "wood-grain", "vinyl-sheet", "foil", "glossy-paper", "adobe"];
var BLEND_MODES = ["normal", "multiply", "screen", "overlay", "soft-light", "difference"];
var LIGHTING_MOODS = ["off", "daylight", "golden", "moonlight"];
var LIGHT_DIRECTIONS = ["top-left", "top-right", "bottom-left", "bottom-right"];
var LOCKABLE_SETTINGS = [
  "seed",
  "family",
  "orientation",
  "geometry",
  "motif",
  "palette",
  "paletteToneEnabled",
  "paletteSaturation",
  "paletteLightness",
  "outline",
  "background",
  "lightingMood",
  "lightDirection",
  "lightStrength",
  "shadowStrength",
  "stripeShadowStrength",
  "stripeShadowSoftness",
  "stripeShadowDirection",
  "material",
  "textureCoverage",
  "textureStrength",
  "textureScale",
  "textureRotation",
  "textureBlend",
  "material2",
  "textureCoverage2",
  "textureStrength2",
  "textureScale2",
  "textureRotation2",
  "textureBlend2",
  "material3",
  "textureCoverage3",
  "textureStrength3",
  "textureScale3",
  "textureRotation3",
  "textureBlend3",
  "textureDisplacement",
  "patternHomogeneity",
  "chaos",
  "stripeWidth",
  "spread",
  "shapeFrequency",
  "shapeDepth",
  "motifSize",
  "motifFrequency",
  "lineStyle",
  "individuality",
  "overridePatternHomogeneity",
  "gap",
  "outlineBuffer",
  "glow",
  "reverseStripes",
  "diagonalRotation",
  "mirrorHorizontal",
  "mirrorVertical",
  "position",
  "structure",
  "radialMode",
  "rayCount",
  "rayRotation",
  "rayTwist",
  "rayCoverage",
  "rayCore",
  "fieldCenterX",
  "fieldCenterY",
  "regionMode",
  "regionCount",
  "regionJitter",
  "regionSides",
  "scatteredCount",
  "scatteredMinSize",
  "scatteredMaxSize",
  "scatteredVariation",
  "scatteredSpacing",
  "scatteredEdgeCrop",
  "scatteredOverlap",
  "scatteredShapeKind",
  "scatteredShapeOverrides",
  "dividerColor",
  "dividerWidth",
  "composition",
  "repeatCount",
  "repeatSpacing",
  "construction",
  "crossingMode",
  "turnRadius",
  "hairpinAngle",
  "loopRadius",
  "loopSweep",
  "geometrySafety",
  "extendDrawnPath",
  "stepCount",
  "chevronSharpness",
  "loopAspect",
  "pathLength",
  "endTaper",
  "tonalContrast",
  "brushRoughness",
  "dotSize",
  "dotSpacing",
  "interiorElements"
];
var PALETTES = ["classic", "electric", "pastel", "jewel", "muted", "sunset", "candy", "arctic", "earth", "twilight", "citrus"];
var TEXTURE_COVERAGES = ["both", "stripes", "background"];
var OUTLINES = ["none", "hairline", "white", "double", "broken", "one-side", "black", "black-hairline", "black-double", "black-broken", "black-one-side"];
function hashString2(input) {
  let h = 2166136261;
  for (const char of String(input)) {
    h ^= char.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
__name(hashString2, "hashString");
function rng(seed) {
  let a = hashString2(seed);
  return () => {
    a = a + 1831565813 >>> 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
__name(rng, "rng");
var pick2 = /* @__PURE__ */ __name((random, choices2) => choices2[Math.floor(random() * choices2.length)], "pick");
var between2 = /* @__PURE__ */ __name((random, min, max) => min + random() * (max - min), "between");
var clamp7 = /* @__PURE__ */ __name((n, min, max) => Math.max(min, Math.min(max, n)), "clamp");
var canonicalZero = /* @__PURE__ */ __name((n) => n === 0 ? 0 : n, "canonicalZero");
var finiteRange = /* @__PURE__ */ __name((value, fallback, min, max) => canonicalZero(clamp7(Number.isFinite(+value) ? +value : fallback, min, max)), "finiteRange");
var normalizeRotation = /* @__PURE__ */ __name((value, fallback = 0) => {
  const number5 = Number(value);
  if (!Number.isFinite(number5)) return fallback;
  return (Math.round(number5 * 10) / 10 % 360 + 360) % 360;
}, "normalizeRotation");
var materialChoice = /* @__PURE__ */ __name((value, fallback = "none") => value === "courduroy" ? "corduroy" : MATERIALS.includes(value) ? value : fallback, "materialChoice");
var coverageChoice = /* @__PURE__ */ __name((value) => TEXTURE_COVERAGES.includes(value) ? value : "both", "coverageChoice");
var blendChoice = /* @__PURE__ */ __name((value) => BLEND_MODES.includes(value) ? value : "normal", "blendChoice");
function normalizeShapeSnapshot(input) {
  if (!input || input.schema !== GEOMETRY_SNAPSHOT_SCHEMA || input.version !== 1) return null;
  try {
    return {
      schema: GEOMETRY_SNAPSHOT_SCHEMA,
      version: 1,
      geometry: normalizeCompoundRegion(input.geometry)
    };
  } catch {
    return null;
  }
}
__name(normalizeShapeSnapshot, "normalizeShapeSnapshot");
var AUTO_CHOICES = {
  family: FAMILIES,
  orientation: ["vertical", "horizontal", "diagonal"],
  geometry: GEOMETRIES.filter((x) => x !== "drawn"),
  motif: MOTIFS,
  palette: PALETTES,
  material: MATERIALS,
  outline: OUTLINES
};
function normalizeReconstructionOrigin(input) {
  if (!input || typeof input !== "object" || Array.isArray(input) || input.origin !== "inferred-image" || input.method !== "current-render-fit-v1") return null;
  const width = input.sourceWidth, height = input.sourceHeight, error2 = input.initialFitError;
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 12 || height < 12 || width > 1e4 || height > 1e4 || width * height > 4e7 || typeof error2 !== "number" || !Number.isFinite(error2) || error2 < 0 || error2 > 1) return null;
  const kind = [
    "regions",
    "shape",
    "shape-repeats",
    "path",
    "straight",
    "loop",
    "radial-rays",
    "radial-rings",
    "nested-rings",
    "wave",
    "jagged",
    "hairpin",
    "hue-visible-shapes"
  ].includes(input.candidateKind) ? input.candidateKind : "path";
  return {
    origin: "inferred-image",
    method: "current-render-fit-v1",
    candidateKind: kind,
    sourceWidth: width,
    sourceHeight: height,
    initialFitError: Math.round(error2 * 1e6) / 1e6
  };
}
__name(normalizeReconstructionOrigin, "normalizeReconstructionOrigin");
function normalizeRecipe(input = {}) {
  const readChoice = /* @__PURE__ */ __name((key, allowed) => allowed.includes(input[key]) ? input[key] : "auto", "readChoice");
  const seed = String(input.seed ?? "rainbow-001").trim().slice(0, 90) || "rainbow-001";
  const drawnPath = normalizeDrawnPathWithIndexMap(input.customPath);
  for (const point3 of drawnPath.points) {
    point3[0] = canonicalZero(point3[0]);
    point3[1] = canonicalZero(point3[1]);
  }
  const normalizedInteriors = normalizeInteriorElements(input.interiorElements);
  const textOverlays = normalizeTextOverlays(input.textOverlays);
  const scatteredOverrides = normalizeScatteredOverrides(input.scatteredOverrides);
  const scatteredShapeOverrides = normalizeScatteredShapeOverrides(input.scatteredShapeOverrides);
  const reconstructionOrigin = normalizeReconstructionOrigin(input.reconstructionOrigin);
  const scatteredLayerOrder = normalizeScatteredLayerOrder(input.scatteredLayerOrder);
  for (const element of normalizedInteriors)
    for (const key of ["width", "position", "amplitude", "frequency", "phase", "opacity"])
      element[key] = canonicalZero(element[key]);
  const mappedPathIndices = /* @__PURE__ */ __name((raw) => [...new Set((Array.isArray(raw) ? raw : []).filter((i) => Number.isInteger(i) && i >= 0).map((i) => drawnPath.indexMap[i]).filter((i) => Number.isInteger(i) && i >= 0 && i < drawnPath.points.length))].sort((a, b) => a - b).slice(0, 96), "mappedPathIndices");
  return {
    version: 2,
    interiorElements: normalizedInteriors,
    ...input.nestedShapeContours ? { nestedShapeContours: normalizeNestedShapeContours(input.nestedShapeContours) } : {},
    ...textOverlays.length ? { textOverlays } : {},
    ...reconstructionOrigin ? { reconstructionOrigin } : {},
    // Old recipes have no Photo key, leaving their saved representation and pixels intact.
    ...input.photoLook ? { photoLook: normalizePhotoLook(input.photoLook) } : {},
    ...Array.isArray(input.surfaceTreatments) ? { surfaceTreatments: normalizeSurfaceTreatments(input.surfaceTreatments) } : {},
    seed,
    primesOnly: input.primesOnly === true || input.primesOnly === "true",
    lockedSettings: LOCKABLE_SETTINGS.filter((key) => Array.isArray(input.lockedSettings) && input.lockedSettings.includes(key)),
    lockedResolved: Object.fromEntries(Object.entries(AUTO_CHOICES).filter(([key, choices2]) => Array.isArray(input.lockedSettings) && input.lockedSettings.includes(key) && choices2.includes(input.lockedResolved?.[key])).map(([key]) => [key, input.lockedResolved[key]])),
    family: readChoice("family", FAMILIES),
    structure: STRUCTURES.includes(input.structure) ? input.structure : "paths",
    radialMode: RADIAL_MODES.includes(input.radialMode) ? input.radialMode : "sunburst",
    rayCount: Math.round(finiteRange(input.rayCount, 14, 7, 70) / 7) * 7,
    rayRotation: finiteRange(input.rayRotation, 0, -180, 180),
    rayTwist: finiteRange(input.rayTwist, 45, -180, 180),
    rayCoverage: finiteRange(input.rayCoverage, 100, 0, 100),
    rayCore: finiteRange(input.rayCore, 0, 0, 100),
    fieldCenterX: finiteRange(input.fieldCenterX, 50, -50, 150),
    fieldCenterY: finiteRange(input.fieldCenterY, 50, -50, 150),
    regionMode: REGION_MODES.includes(input.regionMode) ? input.regionMode : "voronoi",
    regionCount: Math.round(finiteRange(input.regionCount, 14, 7, 70) / 7) * 7,
    regionJitter: finiteRange(input.regionJitter, 45, 0, 100),
    regionSides: Math.round(finiteRange(input.regionSides, 0, 0, 12)),
    scatteredCount: Math.round(finiteRange(input.scatteredCount, 7, 1, 70)),
    scatteredMinSize: finiteRange(input.scatteredMinSize, 10, 0, 100),
    scatteredMaxSize: finiteRange(input.scatteredMaxSize, 83, 0, 100),
    scatteredVariation: finiteRange(input.scatteredVariation, 92, 0, 100),
    scatteredSpacing: finiteRange(input.scatteredSpacing, 28, 0, 100),
    scatteredEdgeCrop: finiteRange(input.scatteredEdgeCrop, 75, 0, 100),
    scatteredOverlap: ["separate", "overlap"].includes(input.scatteredOverlap) ? input.scatteredOverlap : "separate",
    scatteredShapeKind: ["circle", "imported"].includes(input.scatteredShapeKind) ? input.scatteredShapeKind : "circle",
    scatteredShape: normalizeShapeSnapshot(input.scatteredShape),
    // Per-hue snapshots are strictly opt-in and absent from legacy recipes.
    ...scatteredShapeOverrides.length ? { scatteredShapeOverrides } : {},
    // Preserve legacy recipe serialization exactly when no individual edits exist.
    ...scatteredOverrides.length ? { scatteredOverrides } : {},
    ...scatteredLayerOrder.length ? { scatteredLayerOrder } : {},
    dividerColor: DIVIDER_MODES.includes(input.dividerColor) ? input.dividerColor : "background",
    dividerWidth: finiteRange(input.dividerWidth, 12, 0, 100),
    orientation: readChoice("orientation", ["vertical", "horizontal", "diagonal"]),
    reverseStripes: input.reverseStripes === true || input.reverseStripes === "true",
    // Relative degrees: 0 retains legacy seed-selected diagonal angle exactly.
    diagonalRotation: finiteRange(input.diagonalRotation, 0, -180, 180),
    mirrorHorizontal: input.mirrorHorizontal === true || input.mirrorHorizontal === "true",
    mirrorVertical: input.mirrorVertical === true || input.mirrorVertical === "true",
    geometry: readChoice("geometry", GEOMETRIES),
    customPath: drawnPath.points,
    extendDrawnPath: input.extendDrawnPath === true || input.extendDrawnPath === "true",
    // User-protected anchors/corners follow the original stroke station
    // through duplicate removal and legacy >96-point resampling.
    drawnAnchors: mappedPathIndices(input.drawnAnchors),
    drawnCorners: mappedPathIndices(input.drawnCorners),
    motif: readChoice("motif", MOTIFS),
    lineStyle: LINE_STYLES.includes(input.lineStyle) ? input.lineStyle : "continuous",
    composition: COMPOSITIONS.includes(input.composition) ? input.composition : "single",
    construction: CONSTRUCTIONS.includes(input.construction) ? input.construction : "ribbon",
    crossingMode: CROSSING_MODES.includes(input.crossingMode) ? input.crossingMode : "over",
    repeatCount: Math.round(finiteRange(input.repeatCount, 3, 2, 6)),
    repeatSpacing: finiteRange(input.repeatSpacing, 50, 0, 100),
    turnRadius: finiteRange(input.turnRadius, 50, 0, 100),
    geometrySafety: !(input.geometrySafety === false || input.geometrySafety === "false"),
    hairpinAngle: finiteRange(input.hairpinAngle, 180, 60, 180),
    loopRadius: finiteRange(input.loopRadius, 50, 0, 100),
    loopSweep: finiteRange(input.loopSweep, 360, 240, 450),
    stepCount: Math.round(finiteRange(input.stepCount, 4, 1, 16)),
    chevronSharpness: finiteRange(input.chevronSharpness, 50, 0, 100),
    loopAspect: finiteRange(input.loopAspect, 50, 0, 100),
    endTaper: finiteRange(input.endTaper, 0, 0, 100),
    pathLength: finiteRange(input.pathLength, 65, 0, 100),
    tonalContrast: finiteRange(input.tonalContrast, 50, 0, 100),
    brushRoughness: finiteRange(input.brushRoughness, 0, 0, 100),
    dotSize: finiteRange(input.dotSize, 50, 0, 100),
    dotSpacing: finiteRange(input.dotSpacing, 50, 0, 100),
    shapeFrequency: finiteRange(input.shapeFrequency, 50, 0, 100),
    motifSize: finiteRange(input.motifSize, 50, 0, 100),
    motifFrequency: finiteRange(input.motifFrequency, 50, 0, 100),
    shapeDepth: finiteRange(input.shapeDepth, 50, 0, 100),
    palette: readChoice("palette", PALETTES),
    // Custom tone is opt-in; ordinary fixed palettes stay pixel-identical.
    paletteToneEnabled: input.paletteToneEnabled === true || input.paletteToneEnabled === "true",
    paletteSaturation: finiteRange(input.paletteSaturation, 92, 0, 100),
    paletteLightness: finiteRange(input.paletteLightness, 58, 0, 100),
    material: readChoice("material", MATERIALS),
    textureCoverage: TEXTURE_COVERAGES.includes(input.textureCoverage) ? input.textureCoverage : "both",
    outline: readChoice("outline", OUTLINES),
    background: input.background === "white" ? "white" : "black",
    lightingMood: LIGHTING_MOODS.includes(input.lightingMood) ? input.lightingMood : "off",
    lightDirection: LIGHT_DIRECTIONS.includes(input.lightDirection) ? input.lightDirection : "top-left",
    lightStrength: finiteRange(input.lightStrength, 45, 0, 100),
    shadowStrength: finiteRange(input.shadowStrength, 28, 0, 100),
    // Separate opt-in silhouette shadow, independent of ambient canvas lighting.
    stripeShadowStrength: finiteRange(input.stripeShadowStrength, 0, 0, 100),
    stripeShadowSoftness: finiteRange(input.stripeShadowSoftness, 55, 0, 100),
    stripeShadowDirection: LIGHT_DIRECTIONS.includes(input.stripeShadowDirection) ? input.stripeShadowDirection : "top-left",
    chaos: finiteRange(input.chaos, 36, 0, 100),
    stripeWidth: finiteRange(input.stripeWidth, 52, 0, 100),
    textureDisplacement: finiteRange(input.textureDisplacement, 0, 0, 100),
    spread: finiteRange(input.spread, 56, 0, 100),
    textureStrength: finiteRange(input.textureStrength, 52, 0, 100),
    textureScale: finiteRange(input.textureScale, 50, 0, 100),
    textureRotation: normalizeRotation(input.textureRotation),
    textureBlend: blendChoice(input.textureBlend),
    textureLayer2Enabled: input.textureLayer2Enabled === true || input.textureLayer2Enabled === "true",
    material2: materialChoice(input.material2, "none"),
    textureStrength2: finiteRange(input.textureStrength2, 40, 0, 100),
    textureScale2: finiteRange(input.textureScale2, 50, 0, 100),
    textureRotation2: normalizeRotation(input.textureRotation2),
    textureCoverage2: coverageChoice(input.textureCoverage2),
    textureBlend2: blendChoice(input.textureBlend2),
    textureLayer3Enabled: input.textureLayer3Enabled === true || input.textureLayer3Enabled === "true",
    material3: materialChoice(input.material3, "none"),
    textureStrength3: finiteRange(input.textureStrength3, 30, 0, 100),
    textureScale3: finiteRange(input.textureScale3, 50, 0, 100),
    textureRotation3: normalizeRotation(input.textureRotation3),
    textureCoverage3: coverageChoice(input.textureCoverage3),
    textureBlend3: blendChoice(input.textureBlend3),
    individuality: finiteRange(input.individuality, 34, 0, 100),
    patternHomogeneity: finiteRange(input.patternHomogeneity, 100, 0, 100),
    overridePatternHomogeneity: input.overridePatternHomogeneity === true || input.overridePatternHomogeneity === "true",
    gap: finiteRange(input.gap, 28, 0, 100),
    outlineBuffer: finiteRange(input.outlineBuffer, 0, 0, 100),
    glow: finiteRange(input.glow, 0, 0, 100),
    // Camera framing is part of the artwork and therefore of every saved PNG.
    viewZoom: Math.round(finiteRange(input.viewZoom, 1, 0.5, 2.5) * 100) / 100,
    // Camera-only frame pan in percent of the original 600×1300 world.
    // Distinct from positionX/Y, which translate the finished rainbow ink.
    viewPanX: canonicalZero(Math.round(finiteRange(input.viewPanX, 0, -50, 50) * 10) / 10),
    viewPanY: canonicalZero(Math.round(finiteRange(input.viewPanY, 0, -50, 50) * 10) / 10),
    positionX: finiteRange(input.positionX, 0, -30, 30),
    positionY: finiteRange(input.positionY, 0, -30, 30)
  };
}
__name(normalizeRecipe, "normalizeRecipe");
var PROFILES = {
  studio: { geometry: "straight", motif: "solid", palette: "classic", outline: "white", material: "none", width: 0.9 },
  currents: { geometry: "wave", motif: "solid", palette: "electric", outline: "hairline", material: "none", width: 0.38 },
  fracture: { geometry: "jagged", motif: "solid", palette: "electric", outline: "white", material: "grain", width: 0.65 },
  confetti: { geometry: "wave", motif: "dots", palette: "classic", outline: "none", material: "none", width: 0.68 },
  deco: { geometry: "arc", motif: "solid", palette: "jewel", outline: "double", material: "none", width: 0.64 },
  tapestry: { geometry: "wave", motif: "chevrons", palette: "muted", outline: "hairline", material: "linen", width: 0.84 },
  signal: { geometry: "stepped", motif: "dashes", palette: "electric", outline: "one-side", material: "none", width: 0.6 },
  contour: { geometry: "contour", motif: "hatch", palette: "pastel", outline: "hairline", material: "handmade", width: 0.5 }
};
var COLOR_STORIES = Object.freeze({
  classic: { sat: 92, light: 58 },
  electric: { sat: 100, light: 62 },
  pastel: { sat: 75, light: 79 },
  jewel: { sat: 84, light: 39 },
  muted: { sat: 51, light: 58 },
  sunset: { sat: 82, light: 59, hue: [-4, -6, -7, -9, -11, -7, -5], lights: [-3, 3, 7, -6, -7, -7, 1] },
  candy: { sat: 90, light: 69, hue: [-8, -9, -4, -3, -6, -5, 12], lights: [3, 2, 5, -2, -1, 0, 4] },
  arctic: { sat: 70, light: 72, hue: [-3, -7, -4, 8, -12, -9, -11], lights: [2, 0, 7, -1, 3, -3, 1] },
  earth: { sat: 55, light: 49, hue: [7, 5, -3, -23, -28, -12, -9], lights: [3, 6, 8, -6, -3, -4, 1] },
  twilight: { sat: 77, light: 49, hue: [-9, -4, -2, 6, 12, 9, 8], lights: [1, 1, 9, -4, -2, -1, 7] },
  citrus: { sat: 90, light: 61, hue: [-2, -3, -9, -13, -3, -7, -5], lights: [-1, 3, 12, 1, -3, -4, 0] }
});
function paletteHsl(hue, palette, r, tone = null) {
  const story = COLOR_STORIES[palette] ?? COLOR_STORIES.classic;
  const i = HUES.indexOf(hue);
  const h = ((hue + (story.hue?.[i] ?? 0) + between2(r, -3, 3)) % 360 + 360) % 360;
  const custom = tone?.enabled === true;
  const sat = custom ? clamp7(tone.saturation, 0, 100) : story.sat;
  const light = custom ? clamp7(tone.lightness + (story.lights?.[i] ?? 0), 1, 99) : clamp7(story.light + (story.lights?.[i] ?? 0), 10, 90);
  return `hsl(${h.toFixed(1)} ${sat}% ${light}%)`;
}
__name(paletteHsl, "paletteHsl");
function resolveScene(recipeInput) {
  const recipe = normalizeRecipe(recipeInput);
  const random = rng(recipe.seed);
  const keepAuto = /* @__PURE__ */ __name((key, value) => recipe.lockedSettings.includes(key) && recipe[key] === "auto" && AUTO_CHOICES[key]?.includes(recipe.lockedResolved[key]) ? recipe.lockedResolved[key] : value, "keepAuto");
  const family = keepAuto("family", recipe.family === "auto" ? pick2(random, FAMILIES) : recipe.family);
  const profile = PROFILES[family];
  const orientation = keepAuto("orientation", recipe.orientation === "auto" ? pick2(random, ["vertical", "vertical", "diagonal", "horizontal"]) : recipe.orientation);
  const selectedGeometry = keepAuto("geometry", recipe.geometry === "auto" ? profile.geometry : recipe.geometry);
  const geometry = selectedGeometry === "drawn" && recipe.customPath.length < 2 ? "straight" : selectedGeometry;
  const drawnPath = geometry === "drawn" ? prepareDrawnPath(recipe.customPath) : null;
  const motif = keepAuto("motif", recipe.motif === "auto" ? profile.motif : recipe.motif);
  const palette = keepAuto("palette", recipe.palette === "auto" ? profile.palette : recipe.palette);
  const material = keepAuto("material", recipe.material === "auto" ? profile.material : recipe.material);
  const outline = keepAuto("outline", recipe.outline === "auto" ? profile.outline : recipe.outline);
  const chaos = recipe.chaos / 100;
  const repeats = recipe.composition === "repeat" ? recipe.repeatCount : 1;
  const individuality = recipe.individuality / 100;
  let angle = orientation === "vertical" ? Math.PI / 2 : orientation === "horizontal" ? 0 : pick2(random, [-1, 1]) * between2(random, 0.3, 1.08);
  angle += between2(random, -0.18, 0.18) * chaos;
  if (["hairpin", "loop"].includes(geometry)) angle = orientation === "horizontal" ? Math.PI / 2 : orientation === "diagonal" ? Math.PI / 4 : 0;
  if (geometry === "loops") angle = orientation === "vertical" ? Math.PI / 2 : orientation === "diagonal" ? Math.PI / 4 : 0;
  if (geometry === "drawn") angle = 0;
  if (orientation === "diagonal" && geometry !== "drawn") angle += recipe.diagonalRotation * Math.PI / 180;
  const span = ["hairpin", "loop", "loops", "drawn"].includes(geometry) ? DESIGN_WIDTH : DESIGN_WIDTH * Math.abs(Math.sin(angle)) + DESIGN_HEIGHT * Math.abs(Math.cos(angle));
  const spreadFactor = /* @__PURE__ */ __name((value) => 0.1 + 0.335 * Math.pow(value / 50, 1.5), "spreadFactor");
  const requestedSpread = span * spreadFactor(recipe.spread) / repeats;
  const loopFrameRadius = DESIGN_WIDTH * 0.43;
  const loopInnerClearance = 28;
  const spread = recipe.geometrySafety && geometry === "hairpin" ? Math.min(requestedSpread, DESIGN_WIDTH * 0.38) : recipe.geometrySafety && geometry === "loop" ? Math.min(requestedSpread, loopFrameRadius - 2 * loopInnerClearance) : geometry === "drawn" && recipe.geometrySafety ? Math.min(requestedSpread, safeDrawnBandSpan(drawnPath)) : requestedSpread;
  const center2 = geometry === "drawn" ? 0 : between2(random, -1, 1) * span * 0.09;
  const commonPhase = between2(random, 0, Math.PI * 2);
  const commonPeriod = 1400 * Math.pow(0.04, recipe.shapeFrequency / 100) * between2(random, 0.85, 1.15);
  const depthFactor = Math.pow(recipe.shapeDepth / 50, 1.3);
  const commonEdgePhase = between2(random, 0, Math.PI * 2);
  const commonTaper = between2(random, 0, 0.28) * chaos;
  const weights = Array.from({ length: 6 }, () => between2(random, 1 - chaos * 0.46, 1 + chaos * 0.46));
  const sum = weights.reduce((a, b) => a + b, 0);
  const positions = [-spread / 2];
  for (const weight of weights) positions.push(positions.at(-1) + spread * weight / sum);
  const avg = spread / 6;
  const minimumLoopRadius = Math.max(28, -positions[0] - center2 + loopInnerClearance);
  const maximumLoopRadius = Math.max(
    minimumLoopRadius,
    loopFrameRadius - positions[6] - center2
  );
  const referenceSpread = geometry === "drawn" ? spread : span * spreadFactor(56) / repeats;
  const referenceAvg = referenceSpread / 6;
  const commonDisplacement = referenceAvg * 0.22 * (0.3 + 0.7 * chaos) * depthFactor;
  const widthFactor = 0.12 + 0.395 * Math.pow(recipe.stripeWidth / 50, 1.85);
  const stripes = positions.map((position, i) => {
    const r = rng(`${recipe.seed}:stripe:${i}`);
    const leftGap = i ? referenceSpread * weights[i - 1] / sum : referenceAvg;
    const rightGap = i < 6 ? referenceSpread * weights[i] / sum : referenceAvg;
    let width = Math.min(leftGap, rightGap) * widthFactor * between2(r, 1 - chaos * 0.35, 1 + chaos * 0.35);
    if (recipe.construction === "stroke") width = Math.max(0.35, width * 0.12);
    const individualGeometry = geometry;
    const displacement = Math.min(referenceAvg * 0.32, width * 0.7 + referenceAvg * 0.08) * (0.3 + 0.7 * chaos) * depthFactor;
    const phase = between2(r, 0, Math.PI * 2);
    const period = commonPeriod * between2(r, 0.8, 1.2);
    return {
      // Reverse the colour assignment, not the geometry. It keeps all seven
      // ribbon centres sorted and preserves the historic scene on default.
      name: NAMES[recipe.reverseStripes ? 6 - i : i],
      index: i,
      color: paletteHsl(
        HUES[recipe.reverseStripes ? 6 - i : i],
        palette,
        r,
        recipe.paletteToneEnabled ? {
          enabled: true,
          saturation: recipe.paletteSaturation,
          lightness: recipe.paletteLightness
        } : null
      ),
      center: position + center2,
      width: Math.max(width, recipe.construction === "stroke" ? 0.8 : 1.5),
      geometry: individualGeometry,
      motif,
      lineStyle: recipe.lineStyle,
      endTaper: recipe.endTaper,
      dotSize: recipe.dotSize,
      dotSpacing: recipe.dotSpacing,
      // These are shared across the seven colours: a dotted rainbow can form
      // real aligned columns instead of seven independently spaced chains.
      dotPitch: Math.max(18, referenceAvg * (1.3 + recipe.dotSpacing / 100 * 1.15)),
      dotRadius: Math.max(2, referenceAvg * (0.23 + 0.45 * recipe.dotSize / 100) * widthFactor * 0.95),
      drawnPath,
      shapeFrequency: recipe.shapeFrequency,
      stepCount: recipe.stepCount,
      chevronSharpness: recipe.chevronSharpness,
      loopAspect: recipe.loopAspect,
      turnRadius: recipe.geometrySafety ? Math.min(
        Math.max(90 + recipe.turnRadius * 1.35, spread * 0.56),
        DESIGN_WIDTH * 0.44 - spread / 2
      ) : 30 + recipe.turnRadius * 3.6,
      hairpinAngle: recipe.hairpinAngle,
      // Unlike the repeated 'loops' pattern, this is one continuous circular
      // turn with an approach and a tangent-continuous departure.
      // In coherent mode every radius setting remains active between the
      // smallest nested turn and the largest frame-fitting turn.
      loopRadius: recipe.geometrySafety ? minimumLoopRadius + (maximumLoopRadius - minimumLoopRadius) * (recipe.loopRadius / 100) : 24 + 280 * Math.pow(recipe.loopRadius / 100, 1.2),
      loopSweep: recipe.loopSweep,
      loopPeriod: 200 * Math.pow(8 / 200, recipe.shapeFrequency / 100),
      // The safe limit is normalized to the available lane width so the
      // entire slider, rather than its first few percent, remains useful.
      loopAmplitude: recipe.geometrySafety ? 0.15 + (Math.max(0.6, avg * 0.66) - 0.15) * Math.pow(recipe.shapeDepth / 100, 1.25) : 0.15 + 110 * recipe.shapeDepth / 100,
      phase,
      period,
      displacement,
      sharedGeometry: geometry,
      sharedPhase: commonPhase,
      sharedPeriod: commonPeriod,
      sharedDisplacement: commonDisplacement,
      // Safe mode scales stripe-to-stripe phase drift continuously across
      // the *entire* slider instead of cutting it off at an invisible limit.
      parallelMix: individuality * (recipe.geometrySafety ? 0.45 : 1),
      tilt: between2(r, -referenceAvg * 0.8, referenceAvg * 0.8) * individuality * (recipe.geometrySafety ? 0.32 : 1) * (0.25 + 0.75 * chaos),
      edgePhase: commonEdgePhase + (phase - commonEdgePhase) * individuality,
      taper: commonTaper + (between2(r, 0.04, 0.36) * (0.25 + 0.75 * chaos) - commonTaper) * individuality,
      segments: 10 + Math.floor(r() * 17),
      patternScale: between2(r, 0.7, 1.25),
      patternPhase: r() * 120,
      jitterSeed: `${recipe.seed}-noise-${i}`
    };
  });
  const textureLayers = [
    {
      material,
      strength: recipe.textureStrength,
      scale: recipe.textureScale,
      rotation: recipe.textureRotation,
      coverage: recipe.textureCoverage,
      blend: recipe.textureBlend,
      seed: recipe.seed + ":texture:1",
      heightSeed: hashString2(recipe.seed + ":texture:1")
    },
    ...recipe.textureLayer2Enabled ? [{
      material: recipe.material2,
      strength: recipe.textureStrength2,
      scale: recipe.textureScale2,
      rotation: recipe.textureRotation2,
      coverage: recipe.textureCoverage2,
      blend: recipe.textureBlend2,
      seed: recipe.seed + ":texture:2",
      heightSeed: hashString2(recipe.seed + ":texture:2")
    }] : [],
    ...recipe.textureLayer3Enabled ? [{
      material: recipe.material3,
      strength: recipe.textureStrength3,
      scale: recipe.textureScale3,
      rotation: recipe.textureRotation3,
      coverage: recipe.textureCoverage3,
      blend: recipe.textureBlend3,
      seed: recipe.seed + ":texture:3",
      heightSeed: hashString2(recipe.seed + ":texture:3")
    }] : []
  ].filter((layer) => layer.material !== "none" && layer.strength > 0);
  for (const layer of textureLayers) {
    const radians = layer.rotation * Math.PI / 180;
    layer.heightCos = Math.cos(radians);
    layer.heightSin = Math.sin(radians);
  }
  const materialSummary = textureLayers.length ? textureLayers.map((layer) => layer.material).join(" + ") : "none";
  const bundleOffsets = Array.from({ length: repeats }, (_, i) => (i - (repeats - 1) / 2) * (spread + (12 + recipe.repeatSpacing * 1.1)));
  const objects = buildCompositionObjects(recipe, stripes.map((stripe) => stripe.color), stripes, bundleOffsets);
  return {
    ...recipe,
    family,
    orientation,
    geometry,
    motif,
    palette,
    material,
    materialSummary,
    textureLayers,
    outline,
    background: recipe.background,
    angle,
    span,
    // Reflect the entire diagonal ink layer, not its textures or background.
    mirrorHorizontal: orientation === "diagonal" && recipe.mirrorHorizontal,
    mirrorVertical: orientation === "diagonal" && recipe.mirrorVertical,
    stripes,
    intensity: chaos,
    width: avg,
    bundleOffsets,
    objects,
    extent: Math.hypot(DESIGN_WIDTH, DESIGN_HEIGHT) * 1.35,
    reliefFallbackSeed: hashString2(recipe.seed + ":relief:fine-grain"),
    // These positions are the canonical, unnudged geometry. Pan is applied only
    // when compositing the finished stripe ink, never while solving/capping it.
    centerX: geometry === "drawn" ? DESIGN_WIDTH / 2 : DESIGN_WIDTH / 2 + between2(random, -1, 1) * DESIGN_WIDTH * 0.055,
    centerY: geometry === "drawn" ? DESIGN_HEIGHT / 2 : DESIGN_HEIGHT / 2 + between2(random, -1, 1) * DESIGN_HEIGHT * 0.065
  };
}
__name(resolveScene, "resolveScene");
function newSeed() {
  const data = new Uint32Array(2);
  crypto.getRandomValues(data);
  return Array.from(data, (n) => n.toString(36)).join("-");
}
__name(newSeed, "newSeed");
var PRIME_PERCENTAGES = Object.freeze(Array.from({ length: 101 }, (_, i) => i).filter(isPrime));
var PRIME_ROTATIONS = Object.freeze(Array.from({ length: 360 }, (_, i) => i).filter(isPrime));
function isPrime(n) {
  if (!Number.isInteger(n) || n < 2) return false;
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
  return true;
}
__name(isPrime, "isPrime");
function randomizeAllRecipe({ primesOnly = false, seed: requestedSeed } = {}) {
  const seed = requestedSeed === void 0 ? newSeed() : String(requestedSeed);
  const r = rng(seed + ":randomize-all");
  const any2 = /* @__PURE__ */ __name((choices2) => pick2(r, choices2), "any");
  const percent = /* @__PURE__ */ __name(() => primesOnly ? any2(PRIME_PERCENTAGES) : Math.floor(r() * 101), "percent");
  const degrees = /* @__PURE__ */ __name(() => primesOnly ? any2(PRIME_ROTATIONS) : Math.floor(r() * 360), "degrees");
  return normalizeRecipe({
    seed,
    primesOnly,
    family: any2(FAMILIES),
    orientation: any2(["vertical", "horizontal", "diagonal"]),
    interiorElements: r() < 0.32 ? Array.from({ length: r() < 0.32 ? 2 : 1 }, (_, i) => {
      const type = r() < 0.24 ? "band" : "line";
      return {
        id: "generated-" + i,
        type,
        shape: any2(["straight", "wave", "zigzag", "loop"]),
        stroke: any2(["solid", "solid", "dashed", "dotted"]),
        color: any2(["white", "black", "lighter", "darker"]),
        width: type === "band" ? 10 + percent() * 0.35 : Math.max(0.5, percent() / 12),
        amplitude: percent() * 35e-4,
        frequency: 2 + Math.floor(r() * 14),
        phase: Math.floor(r() * 361) - 180,
        position: (percent() - 50) * 7e-3,
        opacity: 0.4 + r() * 0.6
      };
    }) : [],
    structure: any2(["paths", "paths", "radial", "regions"]),
    radialMode: any2(RADIAL_MODES),
    rayCount: 7 * (1 + Math.floor(r() * 10)),
    rayRotation: Math.floor(r() * 361) - 180,
    rayTwist: Math.floor(r() * 361) - 180,
    rayCoverage: percent(),
    rayCore: percent(),
    fieldCenterX: percent(),
    fieldCenterY: percent(),
    regionMode: any2(REGION_MODES),
    regionCount: 7 * (1 + Math.floor(r() * 10)),
    regionJitter: percent(),
    regionSides: Math.floor(r() * 13),
    scatteredCount: 1 + Math.floor(r() * 70),
    scatteredMinSize: percent(),
    scatteredMaxSize: percent(),
    scatteredVariation: percent(),
    scatteredSpacing: percent(),
    scatteredEdgeCrop: percent(),
    scatteredOverlap: any2(["separate", "overlap"]),
    scatteredShapeKind: "circle",
    dividerColor: any2(DIVIDER_MODES),
    dividerWidth: percent(),
    geometry: any2(GEOMETRIES.filter((x) => x !== "drawn")),
    motif: any2(MOTIFS),
    palette: any2(PALETTES),
    reverseStripes: r() > 0.5,
    diagonalRotation: Math.floor(r() * 361) - 180,
    mirrorHorizontal: r() > 0.5,
    mirrorVertical: r() > 0.5,
    material: any2(MATERIALS),
    textureCoverage: any2(TEXTURE_COVERAGES),
    textureRotation: degrees(),
    textureBlend: any2(BLEND_MODES),
    // Random generation always starts with one texture layer. Players may
    // explicitly opt in to layers 2 and 3 through the existing controls.
    textureLayer2Enabled: false,
    material2: "none",
    textureStrength2: percent(),
    textureScale2: percent(),
    textureRotation2: degrees(),
    textureCoverage2: any2(TEXTURE_COVERAGES),
    textureBlend2: any2(BLEND_MODES),
    textureLayer3Enabled: false,
    material3: "none",
    textureStrength3: percent(),
    textureScale3: percent(),
    textureRotation3: degrees(),
    textureCoverage3: any2(TEXTURE_COVERAGES),
    textureBlend3: any2(BLEND_MODES),
    outline: any2(OUTLINES),
    background: any2(["black", "white"]),
    lightingMood: any2(LIGHTING_MOODS),
    lightDirection: any2(LIGHT_DIRECTIONS),
    lightStrength: percent(),
    shadowStrength: percent(),
    stripeShadowDirection: any2(LIGHT_DIRECTIONS),
    stripeShadowStrength: percent(),
    stripeShadowSoftness: percent(),
    chaos: percent(),
    stripeWidth: percent(),
    spread: percent(),
    shapeFrequency: percent(),
    shapeDepth: percent(),
    motifSize: percent(),
    motifFrequency: percent(),
    lineStyle: any2(LINE_STYLES),
    composition: any2(COMPOSITIONS),
    construction: any2(CONSTRUCTIONS.filter((x) => x !== "tonal")),
    crossingMode: any2(CROSSING_MODES),
    repeatCount: 2 + Math.floor(r() * 5),
    repeatSpacing: percent(),
    turnRadius: percent(),
    loopRadius: percent(),
    loopSweep: 240 + Math.floor(r() * 211),
    stepCount: 1 + Math.floor(r() * 16),
    chevronSharpness: percent(),
    loopAspect: percent(),
    pathLength: percent(),
    endTaper: percent(),
    tonalContrast: percent(),
    brushRoughness: percent(),
    dotSize: percent(),
    dotSpacing: percent(),
    textureStrength: percent(),
    textureScale: percent(),
    textureDisplacement: percent(),
    individuality: percent(),
    patternHomogeneity: percent(),
    overridePatternHomogeneity: r() > 0.5,
    gap: percent(),
    outlineBuffer: percent(),
    glow: percent(),
    positionX: 0,
    positionY: 0
  });
}
__name(randomizeAllRecipe, "randomizeAllRecipe");

// ../../src/editor-schema.js
var EDITOR_CATEGORIES = [
  { id: "layout", label: "Layout", icon: "layout", tools: [
    { id: "structure-mode", name: "Structure", settings: ["structure"] },
    { id: "arrange", name: "Arrangement", settings: ["composition", "repeatCount", "repeatSpacing"] },
    { id: "direction", name: "Direction", settings: ["orientation", "diagonalRotation", "mirrorHorizontal", "mirrorVertical"] },
    { id: "variability", name: "Irregularity", settings: ["chaos"] }
  ] },
  { id: "path", label: "Path", icon: "path", tools: [
    { id: "geometry", name: "Geometry", settings: ["geometry", "shapeFrequency", "shapeDepth"] },
    { id: "rays", name: "Radial rays", settings: ["radialMode", "rayCount", "rayRotation"] },
    { id: "ray-shape", name: "Ray detail", settings: ["rayTwist", "rayCoverage", "rayCore"] },
    { id: "origin", name: "Origin", settings: ["fieldCenterX", "fieldCenterY"] },
    { id: "regions", name: "Regions", settings: ["regionMode", "regionCount", "scatteredShapeKind"] },
    { id: "region-detail", name: "Region detail", settings: ["regionJitter", "regionSides"] },
    { id: "scattered-size", name: "Objects", settings: ["scatteredCount", "scatteredMinSize", "scatteredMaxSize"] },
    { id: "scattered-distribution", name: "Distribution", settings: ["scatteredVariation", "scatteredSpacing"] },
    { id: "scattered-edges", name: "Edges & overlap", settings: ["scatteredEdgeCrop", "scatteredOverlap"] },
    { id: "safety", name: "Constraints", settings: ["geometrySafety", "crossingMode"] },
    { id: "turn", name: "Turns", settings: ["turnRadius", "hairpinAngle"] },
    { id: "single-loop", name: "Loop", settings: ["loopRadius", "loopSweep"] },
    { id: "shape-details", name: "Shape detail", settings: ["stepCount", "chevronSharpness", "loopAspect"] },
    { id: "ends", name: "Endpoints", settings: ["pathLength", "endTaper", "extendDrawnPath"] }
  ] },
  { id: "stripes", label: "Stripes", icon: "stripes", tools: [
    { id: "structure", name: "Structure", settings: ["construction", "stripeWidth", "spread"] },
    { id: "patterns", name: "Patterns", settings: ["motif", "lineStyle", "patternHomogeneity"] },
    { id: "marks", name: "Dots", settings: ["dotSize", "dotSpacing"] },
    { id: "motif-scale", name: "Motif scale", settings: ["motifSize", "motifFrequency"] },
    { id: "tone", name: "Band tones", settings: ["tonalContrast"] },
    { id: "character", name: "Stripe differences", settings: ["individuality", "overridePatternHomogeneity"] }
  ] },
  { id: "details", label: "Details", icon: "interior-elements", tools: [
    { id: "interior", name: "Elements", settings: [] },
    { id: "typography", name: "Text", settings: [] },
    { id: "interior-style", name: "Style", settings: [] },
    { id: "interior-motion", name: "Wave", settings: [] },
    { id: "interior-placement", name: "Placement", settings: [] },
    { id: "interior-targets", name: "Ink & targets", settings: [] },
    { id: "outlines", name: "Outlines", settings: ["outline", "gap", "outlineBuffer"] },
    { id: "dividers", name: "Dividers", settings: ["dividerColor", "dividerWidth"] },
    { id: "shadows", name: "Shadows", settings: ["stripeShadowStrength", "stripeShadowSoftness", "stripeShadowDirection"] },
    { id: "glow", name: "Glow", settings: ["glow"] }
  ] },
  { id: "colour", label: "Colour", icon: "colour", tools: [
    { id: "rainbow", name: "Rainbow", settings: ["palette", "reverseStripes"] },
    { id: "palette-tone", name: "Tone", settings: ["paletteToneEnabled", "paletteSaturation", "paletteLightness"] },
    { id: "canvas", name: "Background", settings: ["background"] }
  ] },
  { id: "material", label: "Texture", icon: "material", tools: [
    // Each material is one artistic object. Its compact Material/Finish views
    // present the SAME canonical inputs rather than two competing tool homes.
    { id: "layer1", name: "Layer 1", settings: ["material", "textureCoverage", "textureBlend", "textureStrength", "textureScale", "textureRotation", "textureLayer2Enabled"] },
    { id: "layer2", name: "Layer 2", settings: ["material2", "textureCoverage2", "textureBlend2", "textureStrength2", "textureScale2", "textureRotation2", "textureLayer3Enabled"] },
    { id: "layer3", name: "Layer 3", settings: ["material3", "textureCoverage3", "textureBlend3", "textureStrength3", "textureScale3", "textureRotation3"] },
    { id: "surface", name: "Surface", settings: ["textureDisplacement", "brushRoughness"] }
  ] },
  { id: "effects", label: "Light", icon: "effects", tools: [
    { id: "lighting", name: "Lighting", settings: ["lightingMood", "lightDirection", "lightStrength", "shadowStrength"] }
  ] }
];
var TOOL_LIST = EDITOR_CATEGORIES.flatMap((category) => category.tools.map((tool) => ({ ...tool, category: category.id, categoryLabel: category.label })));
var SETTING_TOOL = Object.fromEntries(TOOL_LIST.flatMap((t) => t.settings.map((setting) => [setting, { category: t.category, tool: t.id }])));
var STYLE_PRESETS = {
  studio: { geometry: "straight", motif: "solid", palette: "classic", outline: "white", material: "none", stripeWidth: 72 },
  currents: { geometry: "wave", motif: "solid", palette: "electric", outline: "hairline", material: "none", stripeWidth: 31 },
  fracture: { geometry: "jagged", motif: "solid", palette: "electric", outline: "white", material: "grain", stripeWidth: 52 },
  confetti: { geometry: "wave", motif: "dots", palette: "classic", outline: "none", material: "none", stripeWidth: 55 },
  deco: { geometry: "arc", motif: "solid", palette: "jewel", outline: "double", material: "none", stripeWidth: 51 },
  tapestry: { geometry: "wave", motif: "chevrons", palette: "muted", outline: "hairline", material: "linen", stripeWidth: 67 },
  signal: { geometry: "stepped", motif: "dashes", palette: "electric", outline: "one-side", material: "none", stripeWidth: 48 },
  contour: { geometry: "contour", motif: "hatch", palette: "pastel", outline: "hairline", material: "handmade", stripeWidth: 40 }
};

// ../../src/scoped-random.js
var PERCENT_PRIMES = Array.from({ length: 99 }, (_, i) => i + 2).filter((n) => {
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
  return true;
});
var ANGLE_PRIMES = Array.from({ length: 358 }, (_, i) => i + 2).filter((n) => {
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
  return true;
});
var clamp8 = /* @__PURE__ */ __name((v, min, max) => Math.max(min, Math.min(max, v)), "clamp");
function scopedKeys(scope, name) {
  if (scope === "setting") return SETTING_TOOL[name] ? [name] : [];
  if (scope === "tool") return TOOL_LIST.find((t) => t.id === name)?.settings ?? [];
  if (scope === "category") return EDITOR_CATEGORIES.find((c) => c.id === name)?.tools.flatMap((t) => t.settings) ?? [];
  return [];
}
__name(scopedKeys, "scopedKeys");
var stepSize = { gentle: 0.06, moderate: 0.22, wild: 0.5 };
function nearestPrime(value, source) {
  return source.reduce((best, n) => Math.abs(n - value) < Math.abs(best - value) ? n : best, source[0]);
}
__name(nearestPrime, "nearestPrime");
function chooseAlternative(items, current, r) {
  const others = items.filter((x) => x !== current);
  return others.length ? others[Math.floor(r() * others.length)] : current;
}
__name(chooseAlternative, "chooseAlternative");
function randomizeScope(currentInput, { scope, name, mode = "reroll", strength = "moderate", seed, control }) {
  const current = normalizeRecipe(currentInput);
  const candidate = randomizeAllRecipe({ seed: seed || newSeed(), primesOnly: current.primesOnly });
  const next = { ...current };
  const selected = scopedKeys(scope, name);
  const weight = stepSize[strength] ?? stepSize.moderate;
  let state = 0;
  const salt = String(seed || candidate.seed) + ":" + scope + ":" + name;
  for (let i = 0; i < salt.length; i++) state = Math.imul(state, 31) + salt.charCodeAt(i) >>> 0;
  const random = /* @__PURE__ */ __name(() => {
    state = Math.imul(state, 1664525) + 1013904223 >>> 0;
    return state / 4294967296;
  }, "random");
  const modified = [];
  const decorationScope = scope === "category" && name === "details" || scope === "tool" && name.startsWith("interior");
  if (decorationScope && !current.lockedSettings.includes("interiorElements")) {
    const all = scope === "category";
    const active = current.interiorElements.length ? current.interiorElements.map((e) => ({ ...e })) : [{
      id: "generated-0",
      type: "line",
      shape: "wave",
      stroke: "solid",
      color: "white",
      width: 1.5,
      position: 0,
      amplitude: 0.12,
      frequency: 6,
      phase: 0,
      opacity: 1,
      placement: "local",
      colorSlots: [],
      objectIds: [],
      enabled: true
    }];
    const pick3 = /* @__PURE__ */ __name((options) => options[Math.floor(random() * options.length)], "pick");
    const alternative = /* @__PURE__ */ __name((choices2, currentValue) => {
      const others = choices2.filter((x) => x !== currentValue);
      return pick3(others.length ? others : choices2);
    }, "alternative");
    const varyNumber = /* @__PURE__ */ __name((value, min, max) => clamp8(value + (random() * 2 - 1) * weight * (max - min), min, max), "varyNumber");
    for (const e of active) {
      if (all || name === "interior-style" || name === "interior") {
        if (mode === "reroll" || random() < weight) {
          e.shape = alternative(["straight", "wave", "zigzag", "loop"], e.shape);
          e.stroke = alternative(["solid", "dashed", "dotted"], e.stroke);
          const priorType = e.type;
          e.type = alternative(["line", "band"], e.type);
          if (e.type !== priorType) e.width = e.type === "band" ? 22 : 1.5;
        }
      }
      if (all || name === "interior-motion") {
        e.amplitude = mode === "reroll" ? random() * 0.4 : varyNumber(e.amplitude, 0, 0.45);
        e.frequency = mode === "reroll" ? 1 + random() * 20 : varyNumber(e.frequency, 1, 30);
        e.phase = mode === "reroll" ? -180 + random() * 360 : varyNumber(e.phase, -180, 180);
      }
      if (all || name === "interior-placement") {
        e.position = mode === "reroll" ? (random() - 0.5) * 0.7 : varyNumber(e.position, -0.48, 0.48);
        e.width = mode === "reroll" ? e.type === "band" ? 8 + random() * 38 : 0.6 + random() * 5 : varyNumber(e.width, 0.15, e.type === "band" ? 50 : 10);
        e.opacity = mode === "reroll" ? 0.35 + random() * 0.65 : varyNumber(e.opacity, 0, 1);
      }
      if (all || name === "interior-targets") {
        e.color = alternative(["white", "black", "lighter", "darker"], e.color);
        if (mode === "reroll") e.colorSlots = random() < 0.65 ? [] : [Math.floor(random() * 7)];
      }
    }
    if (name === "interior" && mode === "reroll" && active.length < 8 && random() < 0.25)
      active.push({ ...active[0], id: "generated-" + active.length });
    next.interiorElements = active;
    if (JSON.stringify(active) !== JSON.stringify(current.interiorElements))
      modified.push("interiorElements");
  }
  if (scope === "tool" && name === "typography" || scope === "category" && name === "details") {
    const pick3 = /* @__PURE__ */ __name((list) => list[Math.floor(random() * list.length)], "pick");
    const vary = /* @__PURE__ */ __name((v, min, max) => clamp8(v + (random() * 2 - 1) * weight * (max - min), min, max), "vary");
    const items = (current.textOverlays || []).map((item) => {
      if (item.locked) return item;
      const nextItem = {
        ...item,
        font: chooseAlternative([...Object.keys(TEXT_FONTS), ...Object.keys(BUNDLED_FONTS)], item.font, random),
        colour: chooseAlternative(TEXT_COLOURS, item.colour, random),
        outline: chooseAlternative(TEXT_OUTLINES, item.outline, random),
        size: mode === "reroll" ? 20 + Math.round(random() * 130) : Math.round(vary(item.size, 12, 180)),
        rotation: mode === "reroll" ? Math.round(random() * 91) - 45 : Math.round(vary(item.rotation, -180, 180)),
        outlineWidth: mode === "reroll" ? Math.round(random() * 12) : Math.round(vary(item.outlineWidth, 0, 20))
      };
      if (mode === "reroll" && strength === "wild") {
        nextItem.x = 10 + Math.round(random() * 80);
        nextItem.y = 10 + Math.round(random() * 80);
      }
      return nextItem;
    });
    if (JSON.stringify(items) !== JSON.stringify(current.textOverlays || [])) {
      next.textOverlays = items;
      modified.push("textOverlays");
    }
  }
  for (const key of selected) {
    if (current.lockedSettings.includes(key)) continue;
    if (key === "paletteToneEnabled" || (key === "paletteSaturation" || key === "paletteLightness") && !current.paletteToneEnabled) continue;
    if (key === "textureLayer2Enabled" || key === "textureLayer3Enabled" || key === "geometrySafety") continue;
    if (key === "geometry" && current.geometry === "drawn") continue;
    const el = control?.(key);
    if (el?.dataset.inactive === "true") continue;
    const v = current[key];
    const sourceChoices = el?.tagName === "SELECT" ? [...el.options].filter((o) => !o.disabled).map((o) => o.value) : null;
    const choices2 = sourceChoices && typeof v === "number" && sourceChoices.every((x) => x.trim() !== "" && Number.isFinite(Number(x))) ? sourceChoices.map(Number) : sourceChoices;
    let target = candidate[key];
    if (mode === "reroll" && (key === "paletteSaturation" || key === "paletteLightness")) {
      target = Math.floor(random() * 101);
      if (current.primesOnly) target = nearestPrime(target, PERCENT_PRIMES);
    }
    if (mode === "vary") {
      if (typeof v === "number") {
        const min = el && el.min !== "" && Number.isFinite(Number(el.min)) ? Number(el.min) : 0;
        const max = el && el.max !== "" && Number.isFinite(Number(el.max)) ? Number(el.max) : 100;
        target = clamp8(v + (random() * 2 - 1) * weight * (max - min), min, max);
        const step = el && el.step && el.step !== "any" ? Number(el.step) : 1;
        if (step > 0) target = clamp8(min + Math.round((target - min) / step) * step, min, max);
        if (current.primesOnly && min === 0 && max === 100)
          target = nearestPrime(target, PERCENT_PRIMES);
        else if (current.primesOnly && key.startsWith("textureRotation"))
          target = nearestPrime(target, ANGLE_PRIMES);
      } else if (typeof v === "boolean") {
        target = strength === "wild" && random() > 0.6 ? !v : v;
      } else if (choices2?.length) target = random() < weight * 0.55 ? chooseAlternative(choices2, v, random) : v;
      else target = v;
    } else if (choices2?.length) {
      target = choices2.includes(target) ? target : chooseAlternative(choices2, v, random);
    }
    if (mode === "reroll" && target === v) {
      if (typeof v === "boolean") target = !v;
      else if (choices2?.length) target = chooseAlternative(choices2, v, random);
      else if (typeof v === "number") {
        const min = el?.min !== void 0 && el.min !== "" ? Number(el.min) : 0;
        const max = el?.max !== void 0 && el.max !== "" ? Number(el.max) : 100;
        const increment = Math.max(1, Math.round((max - min) / 3));
        target = v + increment > max ? min : v + increment;
        if (current.primesOnly && min === 0 && max === 100)
          target = nearestPrime(target, PERCENT_PRIMES);
      }
    }
    if (target !== v) {
      next[key] = target;
      modified.push(key);
      if (key === "material2" || key === "material3") {
        const enabledKey = key === "material2" ? "textureLayer2Enabled" : "textureLayer3Enabled";
        const enabled = target !== "none";
        if (next[enabledKey] !== enabled) {
          next[enabledKey] = enabled;
          modified.push(enabledKey);
        }
      }
    }
  }
  const recipe = normalizeRecipe(next);
  const actualModified = [...new Set(modified)].filter((key) => JSON.stringify(recipe[key]) !== JSON.stringify(current[key]));
  return { recipe, modified: actualModified, scope, name, mode };
}
__name(randomizeScope, "randomizeScope");

// ../../src/agent-api.js
var OPTIONAL_KEYS = [
  "textOverlays",
  "photoLook",
  "surfaceTreatments",
  "nestedShapeContours",
  "scatteredOverrides",
  "scatteredShapeOverrides",
  "scatteredLayerOrder"
];
var UNWRITABLE = /* @__PURE__ */ new Set(["version", "lockedResolved", "reconstructionOrigin"]);
var BASE = normalizeRecipe({});
var SETTINGS = new Set([...Object.keys(BASE), ...OPTIONAL_KEYS].filter(
  (key) => key !== "seed" && key !== "lockedSettings" && !UNWRITABLE.has(key)
));
var CATEGORIES = new Set(EDITOR_CATEGORIES.map((category) => category.id));
var ENUMS = {
  family: ["auto", ...FAMILIES],
  structure: STRUCTURES,
  radialMode: RADIAL_MODES,
  regionMode: REGION_MODES,
  scatteredOverlap: ["separate", "overlap"],
  scatteredShapeKind: ["circle", "imported"],
  dividerColor: DIVIDER_MODES,
  orientation: ["auto", "vertical", "horizontal", "diagonal"],
  geometry: ["auto", ...GEOMETRIES],
  motif: ["auto", ...MOTIFS],
  palette: ["auto", ...PALETTES],
  material: ["auto", ...MATERIALS],
  material2: MATERIALS,
  material3: MATERIALS,
  outline: ["auto", ...OUTLINES],
  background: ["black", "white"],
  composition: COMPOSITIONS,
  construction: CONSTRUCTIONS,
  crossingMode: CROSSING_MODES,
  lightingMood: LIGHTING_MOODS,
  lightDirection: LIGHT_DIRECTIONS,
  stripeShadowDirection: LIGHT_DIRECTIONS,
  lineStyle: LINE_STYLES,
  textureCoverage: TEXTURE_COVERAGES,
  textureCoverage2: TEXTURE_COVERAGES,
  textureCoverage3: TEXTURE_COVERAGES,
  textureBlend: BLEND_MODES,
  textureBlend2: BLEND_MODES,
  textureBlend3: BLEND_MODES
};
var STRENGTHS = /* @__PURE__ */ new Set(["gentle", "moderate", "wild"]);
var MODES = /* @__PURE__ */ new Set(["vary", "reroll"]);
var MAX_INPUT_BYTES = 128 * 1024;
function boundedObject(object3, label) {
  if (!object3 || typeof object3 !== "object" || Array.isArray(object3))
    throw new TypeError(label + " must be an object");
  if (JSON.stringify(object3).length > MAX_INPUT_BYTES)
    throw new RangeError(label + " exceeds 128 KiB");
  return object3;
}
__name(boundedObject, "boundedObject");
function validatedSettings(settings = {}, base = BASE) {
  boundedObject(settings, "settings");
  for (const [key, value] of Object.entries(settings)) {
    if (!SETTINGS.has(key)) throw new RangeError("Unknown or protected setting: " + key);
    if (value === null || typeof value === "function")
      throw new TypeError("Unsupported value for " + key);
    const candidate = normalizeRecipe({ ...base, [key]: value });
    const normalized = candidate[key];
    if (normalized === void 0)
      throw new RangeError("Unsupported setting or value: " + key);
    if (typeof value === "number" && (!Number.isFinite(value) || normalized !== value))
      throw new RangeError("Out-of-range or non-canonical numeric value for " + key + ": " + value);
    if (typeof value === "boolean" && normalized !== value)
      throw new RangeError("Unsupported boolean value for " + key);
    if (typeof value === "string" && normalized !== value)
      throw new RangeError("Unsupported choice for " + key + ": " + value);
  }
  return settings;
}
__name(validatedSettings, "validatedSettings");
function checkedLocks(locks) {
  if (!Array.isArray(locks)) throw new TypeError("locks must be an array");
  for (const key of locks) {
    if (!LOCKABLE_SETTINGS.includes(key)) throw new RangeError("Cannot lock setting: " + key);
  }
  return [...new Set(locks)];
}
__name(checkedLocks, "checkedLocks");
function describeAgentCapabilities() {
  const keys = [...SETTINGS].sort();
  const numeric = Object.fromEntries(keys.filter((key) => typeof BASE[key] === "number").map((key) => {
    const min = normalizeRecipe({ [key]: -1e9 })[key];
    const max = normalizeRecipe({ [key]: 1e9 })[key];
    return [key, { min, max, default: BASE[key] }];
  }));
  return {
    name: "ROYGBIV",
    recipeVersion: BASE.version,
    canvas: { design: [600, 1300], native: [3024, 6552] },
    styles: Object.keys(STYLE_PRESETS),
    categories: EDITOR_CATEGORIES.map(({ id, label, tools }) => ({
      id,
      label,
      tools: tools.map(({ id: id2, name, settings }) => ({ id: id2, name, settings }))
    })),
    choices: ENUMS,
    numeric,
    booleans: keys.filter((key) => typeof BASE[key] === "boolean"),
    complexSettings: keys.filter((key) => {
      const v = BASE[key];
      return v !== null && typeof v === "object";
    }).concat(OPTIONAL_KEYS.filter((key) => !(key in BASE))),
    otherSettings: keys.filter((key) => !(key in numeric) && !(key in ENUMS)),
    lockable: LOCKABLE_SETTINGS,
    notes: [
      "The agent interprets artistic language into canonical controls; no separate prompt-to-image model is run.",
      "All renders use production ROYGBIV pixels; previews are not final-resolution exports.",
      "Exact selected tool and category IDs are discoverable above.",
      "Unknown, protected or invalid primitive setting values fail explicitly.",
      "Locked settings are never changed by exploration."
    ]
  };
}
__name(describeAgentCapabilities, "describeAgentCapabilities");
function composeAgentRecipe({ style = "studio", seed = "agent-001", settings = {}, locks = [] } = {}) {
  if (!Object.hasOwn(STYLE_PRESETS, style)) throw new RangeError("Unknown style: " + style);
  if (typeof seed !== "string" || seed.trim().length < 1 || seed.length > 90)
    throw new RangeError("seed must be 1\u201390 characters");
  const merged = { ...STYLE_PRESETS[style], family: style, seed };
  validatedSettings(settings, normalizeRecipe(merged));
  const checked = checkedLocks(locks);
  return normalizeRecipe({ ...merged, ...settings, lockedSettings: checked });
}
__name(composeAgentRecipe, "composeAgentRecipe");
function importAgentRecipe(input) {
  boundedObject(input, "recipe");
  if (input.version !== BASE.version)
    throw new RangeError("Only current canonical recipe version " + BASE.version + " is supported");
  if (typeof input.seed !== "string" || !input.seed.trim() || input.seed.length > 90)
    throw new RangeError("Imported recipe requires its original valid seed");
  if (!Array.isArray(input.lockedSettings))
    throw new TypeError("Imported recipe needs a lockedSettings array");
  checkedLocks(input.lockedSettings);
  const allowed = /* @__PURE__ */ new Set([
    ...SETTINGS,
    ...Object.keys(BASE),
    "version",
    "seed",
    "lockedSettings",
    "lockedResolved",
    "reconstructionOrigin"
  ]);
  for (const key of Object.keys(input))
    if (!allowed.has(key)) throw new RangeError("Unknown imported recipe key: " + key);
  const recipe = normalizeRecipe(input);
  for (const [key, value] of Object.entries(input)) {
    if (key === "version" || key === "lockedResolved") continue;
    const actual = recipe[key];
    if (["string", "boolean", "number"].includes(typeof value) && value !== actual)
      throw new RangeError("Imported recipe normalized away " + key);
    if (Array.isArray(value) && value.length && !Array.isArray(actual))
      throw new RangeError("Imported recipe lost array " + key);
    if (value && typeof value === "object" && !Array.isArray(value) && !actual)
      throw new RangeError("Imported recipe lost object " + key);
  }
  return recipe;
}
__name(importAgentRecipe, "importAgentRecipe");
function editAgentRecipe(recipeInput, { settings = {}, lock = [], unlock = [] } = {}) {
  const current = normalizeRecipe(boundedObject(recipeInput, "recipe"));
  const unlocking = checkedLocks(unlock);
  const locking = checkedLocks(lock);
  validatedSettings(settings, current);
  const stillLocked = current.lockedSettings.filter((key) => !unlocking.includes(key));
  for (const key of Object.keys(settings))
    if (stillLocked.includes(key))
      throw new RangeError(key + " is locked. Explicitly unlock it to edit.");
  const lockedSettings = [.../* @__PURE__ */ new Set([...stillLocked, ...locking])];
  return normalizeRecipe({ ...current, ...settings, lockedSettings });
}
__name(editAgentRecipe, "editAgentRecipe");
function varyAgentRecipe(recipeInput, {
  category = "path",
  tool,
  setting,
  mode = "vary",
  strength = "moderate",
  seed = "agent-variation"
} = {}) {
  const current = normalizeRecipe(boundedObject(recipeInput, "recipe"));
  if (!MODES.has(mode) || !STRENGTHS.has(strength))
    throw new RangeError("Invalid variation mode or strength");
  if (typeof seed !== "string" || !seed || seed.length > 90)
    throw new RangeError("Invalid variation seed");
  let scope, name;
  if (setting !== void 0) {
    if (!SETTING_TOOL[setting]) throw new RangeError("Unknown scoped setting: " + setting);
    scope = "setting";
    name = setting;
  } else if (tool !== void 0) {
    if (!TOOL_LIST.some((item) => item.id === tool))
      throw new RangeError("Unknown tool: " + tool);
    scope = "tool";
    name = tool;
  } else {
    if (!CATEGORIES.has(category)) throw new RangeError("Unknown category: " + category);
    scope = "category";
    name = category;
  }
  const { recipe, modified } = randomizeScope(current, { scope, name, mode, strength, seed });
  return { recipe, modified, scope, name };
}
__name(varyAgentRecipe, "varyAgentRecipe");
function exploreAgentRecipes(recipeInput, {
  count = 4,
  seed = "agent-exploration",
  categories = ["path", "stripes", "colour"],
  strength = "moderate"
} = {}) {
  if (!Number.isInteger(count) || count < 1 || count > 12)
    throw new RangeError("count must be 1\u201312");
  if (typeof seed !== "string" || !seed || seed.length > 90)
    throw new RangeError("Invalid exploration seed");
  if (!Array.isArray(categories) || !categories.length || categories.length > 7 || categories.some((c) => !CATEGORIES.has(c)))
    throw new RangeError("categories must be a nonempty list of category IDs");
  if (!STRENGTHS.has(strength)) throw new RangeError("Unknown strength");
  const base = normalizeRecipe(boundedObject(recipeInput, "recipe"));
  const random = rng(seed + ":agent-explore");
  return Array.from({ length: count }, (_, i) => {
    let recipe = base;
    const modified = /* @__PURE__ */ new Set();
    const variationSeed = seed + ":" + i;
    if (!base.lockedSettings.includes("seed"))
      recipe = normalizeRecipe({
        ...recipe,
        seed: variationSeed.slice(0, 90)
      });
    for (const category of categories) {
      const result = varyAgentRecipe(recipe, {
        category,
        mode: "vary",
        strength,
        seed: (variationSeed + ":" + category).slice(0, 90)
      });
      recipe = result.recipe;
      for (const key of result.modified) modified.add(key);
    }
    return { recipe, modified: [...modified], randomSignature: random() };
  });
}
__name(exploreAgentRecipes, "exploreAgentRecipes");
function inspectAgentRecipe(recipeInput) {
  const recipe = normalizeRecipe(boundedObject(recipeInput, "recipe"));
  const scene = resolveScene(recipe);
  return {
    recipeVersion: recipe.version,
    seed: recipe.seed,
    structure: scene.structure,
    geometry: scene.geometry,
    palette: scene.palette,
    numberOfStripes: scene.stripes?.length ?? 0,
    stripeNames: scene.stripes?.map((item) => item.name) ?? [],
    lockedSettings: recipe.lockedSettings,
    materials: scene.textureLayers?.map((layer) => layer.material) ?? [],
    hasText: Boolean(recipe.textOverlays?.length),
    hasImportedShape: Boolean(recipe.scatteredShape),
    hasInferredImageOrigin: Boolean(recipe.reconstructionOrigin),
    caveat: "Recipe/scene inspection is structural, not a pixel-level colour, crop or aesthetic audit."
  };
}
__name(inspectAgentRecipe, "inspectAgentRecipe");

// src/storage.js
var MAX_RECIPE_BYTES = 131072;
var encoder2 = new TextEncoder();
function ownerKey(userId) {
  if (typeof userId !== "string" || userId.length < 1 || userId.length > 256)
    throw new Error("Authenticated user identity required");
  return Array.from(new Uint8Array(encoder2.encode(userId))).map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(ownerKey, "ownerKey");
function safeId(id) {
  if (!/^design-[a-f0-9]{16}$/.test(id)) throw new Error("Invalid candidate ID");
  return id;
}
__name(safeId, "safeId");
async function digest(recipe) {
  const bytes2 = encoder2.encode(JSON.stringify(recipe));
  const hash2 = await crypto.subtle.digest("SHA-256", bytes2);
  return "design-" + Array.from(new Uint8Array(hash2)).slice(0, 8).map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(digest, "digest");
function boundedRecipe(value) {
  const raw = JSON.stringify(value);
  if (typeof raw !== "string" || encoder2.encode(raw).byteLength > MAX_RECIPE_BYTES)
    throw new Error("Recipe exceeds 128 KiB or is invalid");
  return importAgentRecipe(value);
}
__name(boundedRecipe, "boundedRecipe");
async function saveRecipe(env, userId, recipe) {
  const current = boundedRecipe(recipe);
  const id = await digest(current);
  const owner = ownerKey(userId);
  const key = "users/" + owner + "/recipes/" + id + ".json";
  await env.PRIVATE_ARTIFACTS.put(key, JSON.stringify(current), {
    httpMetadata: { contentType: "application/json" },
    customMetadata: { type: "recipe", owner }
  });
  await env.RECIPES.prepare("INSERT INTO designs (owner, id, object_key, created_at) VALUES (?, ?, ?, ?) ON CONFLICT(owner,id) DO UPDATE SET object_key=excluded.object_key").bind(owner, id, key, Date.now()).run();
  return { id, recipe: current };
}
__name(saveRecipe, "saveRecipe");
async function loadRecipe(env, userId, id) {
  safeId(id);
  const owner = ownerKey(userId);
  const row = await env.RECIPES.prepare("SELECT object_key FROM designs WHERE owner = ? AND id = ?").bind(owner, id).first();
  if (!row) throw new Error("Candidate not found");
  if (row.object_key !== "users/" + owner + "/recipes/" + id + ".json") throw new Error("Invalid candidate storage path");
  const object3 = await env.PRIVATE_ARTIFACTS.get(row.object_key);
  if (!object3) throw new Error("Candidate expired or unavailable");
  return boundedRecipe(await object3.json());
}
__name(loadRecipe, "loadRecipe");
async function editStored(env, userId, id, options) {
  const recipe = editAgentRecipe(await loadRecipe(env, userId, id), options);
  return saveRecipe(env, userId, recipe);
}
__name(editStored, "editStored");
async function varyStored(env, userId, id, options) {
  const result = varyAgentRecipe(await loadRecipe(env, userId, id), options);
  return { ...await saveRecipe(env, userId, result.recipe), modified: result.modified };
}
__name(varyStored, "varyStored");
async function exploreStored(env, userId, id, options) {
  const variants = exploreAgentRecipes(await loadRecipe(env, userId, id), options);
  const outputs = [];
  for (const variant of variants) {
    const stored = await saveRecipe(env, userId, variant.recipe);
    outputs.push({ id: stored.id, modified: variant.modified, inspect: inspectAgentRecipe(stored.recipe) });
  }
  return outputs;
}
__name(exploreStored, "exploreStored");
async function purgeExpiredRecipes(env, { now = Date.now(), ttlDays = 30, limit = 100 } = {}) {
  if (!Number.isFinite(now) || ttlDays < 1 || ttlDays > 365 || !Number.isInteger(limit) || limit < 1 || limit > 500)
    throw new RangeError("Invalid retention policy");
  const cutoff = now - ttlDays * 864e5;
  const { results = [] } = await env.RECIPES.prepare(
    "SELECT owner,id,object_key FROM designs WHERE created_at < ? ORDER BY created_at ASC LIMIT ?"
  ).bind(cutoff, limit).all();
  let deleted = 0;
  for (const row of results) {
    if (typeof row.owner !== "string" || !/^design-[a-f0-9]{16}$/.test(row.id) || row.object_key !== "users/" + row.owner + "/recipes/" + row.id + ".json") continue;
    const out = await env.RECIPES.prepare(
      "DELETE FROM designs WHERE owner = ? AND id = ? AND object_key = ? AND created_at < ?"
    ).bind(row.owner, row.id, row.object_key, cutoff).run();
    if ((out.meta?.changes ?? 0) === 1) {
      await env.PRIVATE_ARTIFACTS.delete(row.object_key);
      deleted++;
    }
  }
  return { deleted, cutoff };
}
__name(purgeExpiredRecipes, "purgeExpiredRecipes");

// src/index.js
var asResult = /* @__PURE__ */ __name((value) => ({ content: [{ type: "text", text: JSON.stringify(value) }] }), "asResult");
var guarded = /* @__PURE__ */ __name((fn) => async (args) => {
  try {
    return asResult(await fn(args));
  } catch (err) {
    return { isError: true, content: [{ type: "text", text: err.message || "Request failed" }] };
  }
}, "guarded");
var requireIdentity = /* @__PURE__ */ __name((props) => {
  if (!props?.userId || typeof props.userId !== "string") throw Error("Verified identity required");
  return props.userId;
}, "requireIdentity");
function createServer(env, props, scopes) {
  const userId = requireIdentity(props);
  const mcp = new McpServer({ name: "roygbiv-hosted", version: "0.1.0" });
  const id = string2().regex(/^design-[a-f0-9]{16}$/);
  const settings = record(string2(), unknown()).optional();
  const check = /* @__PURE__ */ __name((scope, fn) => guarded(async (args) => {
    if (!scopes.includes(scope)) throw Error("Insufficient scope: " + scope);
    return fn(args);
  }), "check");
  mcp.registerTool("roygbiv_describe", { description: "Discover supported ROYGBIV canonical wallpaper controls", inputSchema: object({}) }, check("wallpaper:read", () => describeAgentCapabilities()));
  mcp.registerTool("roygbiv_compose", { description: "Create a private canonical ROYGBIV design", inputSchema: object({
    style: string2().default("studio"),
    seed: string2().max(90).default("agent-001"),
    settings,
    locks: array(string2()).optional()
  }) }, check("wallpaper:create", async (args) => {
    const result = await saveRecipe(env, userId, composeAgentRecipe(args));
    return { id: result.id, inspect: inspectAgentRecipe(result.recipe) };
  }));
  mcp.registerTool("roygbiv_import", { description: "Import a complete canonical v2 recipe into your private storage", inputSchema: object({
    recipe: record(string2(), unknown())
  }) }, check("wallpaper:create", async ({ recipe }) => {
    const saved = await saveRecipe(env, userId, recipe);
    return { id: saved.id, inspect: inspectAgentRecipe(saved.recipe) };
  }));
  mcp.registerTool("roygbiv_inspect", { description: "Retrieve your own editable design and scene summary", inputSchema: object({ id }) }, check("wallpaper:read", async ({ id: id2 }) => {
    const recipe = await loadRecipe(env, userId, id2);
    return { id: id2, recipe, inspect: inspectAgentRecipe(recipe) };
  }));
  mcp.registerTool("roygbiv_edit", { description: "Change canonical controls on a privately owned design", inputSchema: object({
    id,
    settings,
    lock: array(string2()).optional(),
    unlock: array(string2()).optional()
  }) }, check("wallpaper:create", async ({ id: id2, ...options }) => {
    const saved = await editStored(env, userId, id2, options);
    return { id: saved.id, inspect: inspectAgentRecipe(saved.recipe) };
  }));
  mcp.registerTool("roygbiv_vary", { description: "Scoped deterministic design variation", inputSchema: object({
    id,
    category: string2().optional(),
    tool: string2().optional(),
    setting: string2().optional(),
    mode: _enum(["vary", "reroll"]).optional(),
    strength: _enum(["gentle", "moderate", "wild"]).optional(),
    seed: string2().max(90).optional()
  }) }, check("wallpaper:create", async ({ id: id2, ...options }) => varyStored(env, userId, id2, options)));
  mcp.registerTool("roygbiv_explore", { description: "Create up to twelve privately stored design alternatives", inputSchema: object({
    id,
    count: number2().int().min(1).max(12).optional(),
    seed: string2().max(90).optional(),
    categories: array(string2()).max(7).optional(),
    strength: _enum(["gentle", "moderate", "wild"]).optional()
  }) }, check("wallpaper:create", async ({ id: id2, ...options }) => ({ candidates: await exploreStored(env, userId, id2, options) })));
  return mcp;
}
__name(createServer, "createServer");
function createResourceHandler(env, props, scopes) {
  return createMcpHandler(() => createServer(env, props, scopes), { responseMode: "json" });
}
__name(createResourceHandler, "createResourceHandler");
var app = {
  async fetch(request, env, ctx) {
    const url2 = new URL(request.url);
    if (url2.pathname === "/health") return Response.json({ service: "roygbiv-mcp", status: "auth-required", rendering: "not-configured" });
    return new Response("Not found", { status: 404 });
  }
};
var oauthResource = new OAuthResourceServer({
  resourceMetadata: {
    resource: workerEnv.MCP_SERVER_URL || "https://invalid.example/mcp",
    authorization_servers: [workerEnv.AUTH_SERVER_URL || "https://invalid.example"]
  },
  requiredScopes: ["wallpaper:read"],
  validateToken: /* @__PURE__ */ __name((env) => env.AUTH_SERVER.validateToken, "validateToken"),
  handler: {
    async fetch(request, env, ctx) {
      if (new URL(request.url).pathname !== "/mcp") return app.fetch(request, env, ctx);
      const scopes = ctx.auth?.scope || [];
      if (!scopes.includes("wallpaper:read")) return insufficientScope(ctx.auth, ["wallpaper:read"]);
      if (request.method === "POST" && !scopes.includes("wallpaper:create")) {
        const body = await request.clone().json().catch(() => null);
        const writeTools = /* @__PURE__ */ new Set([
          "roygbiv_compose",
          "roygbiv_import",
          "roygbiv_edit",
          "roygbiv_vary",
          "roygbiv_explore"
        ]);
        if (body?.method === "tools/call" && writeTools.has(body.params?.name))
          return insufficientScope(ctx.auth, ["wallpaper:read", "wallpaper:create"]);
      }
      const url2 = new URL(request.url);
      if (request.headers.get("origin") && request.headers.get("origin") !== url2.origin)
        return new Response("Forbidden origin", { status: 403 });
      const handler = createResourceHandler(env, ctx.props, scopes);
      return handler.fetch(request);
    }
  }
});
var index_default = {
  fetch(request, env, ctx) {
    return oauthResource.fetch(request, env, ctx);
  },
  async scheduled(event, env, ctx) {
    ctx.waitUntil(purgeExpiredRecipes(env, { ttlDays: 30, limit: 100 }));
  }
};
export {
  createResourceHandler,
  createServer,
  index_default as default
};
/*! Bundled license information:

@modelcontextprotocol/server/dist/src-DdvbAHrR.mjs:
  (*!
  * content-type
  * Copyright(c) 2015 Douglas Christopher Wilson
  * MIT Licensed
  *)
*/
//# sourceMappingURL=index.js.map
