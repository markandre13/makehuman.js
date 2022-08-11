var makehuman = (function (exports) {
    'use strict';

    class Reference {
        constructor(object, attribute) {
            this.object = object;
            this.attribute = attribute.toString();
        }
        get() {
            return this.object[this.attribute];
        }
        set(value) {
            Object.defineProperty(this.object, this.attribute, { value: value });
        }
        toString() {
            return `${this.object[this.attribute]}`;
        }
        fromString(value) {
            const type = typeof this.object[this.attribute];
            let outValue;
            switch (type) {
                case "string":
                    outValue = value;
                    break;
                case "number":
                    outValue = Number.parseFloat(value);
                    break;
                default:
                    throw Error(`Reference.fromString() isn't yet supported for type ${type}`);
            }
            Object.defineProperty(this.object, this.attribute, { value: outValue });
        }
    }
    function ref(object, attribute) {
        return new Reference(object, attribute);
    }
    class Fragment extends Array {
        constructor(props) {
            super(...props?.children);
            for (let i = 0; i < this.length; ++i) {
                const e = this[i];
                if (typeof e === "string") {
                    this[i] = document.createTextNode(e);
                }
            }
        }
        replaceIn(element) {
            while (element.childNodes.length > 0) {
                element.removeChild(element.childNodes[element.childNodes.length - 1]);
            }
            this.appendTo(element);
        }
        appendTo(element) {
            for (let child of this) {
                element.appendChild(child);
            }
        }
    }
    function jsx$1(nameOrConstructor, props, key) {
        if (props !== undefined && props.children !== undefined) {
            props.children = [props.children];
        }
        return jsxs$1(nameOrConstructor, props);
    }
    function jsxs$1(nameOrConstructor, props, key) {
        let namespace;
        if (typeof nameOrConstructor !== 'string') {
            return new nameOrConstructor(props);
        }
        const name = nameOrConstructor;
        switch (name) {
            case "svg":
            case "line":
            case "rect":
            case "circle":
            case "path":
            case "text":
                namespace = "http://www.w3.org/2000/svg";
                break;
            default:
                namespace = "http://www.w3.org/1999/xhtml";
        }
        const tag = document.createElementNS(namespace, name);
        setInitialProperties$1(tag, props, namespace);
        return tag;
    }
    function setInitialProperties$1(element, props, namespace) {
        if (props === null || props === undefined)
            return;
        for (let [key, value] of Object.entries(props)) {
            switch (key) {
                case 'children':
                    break;
                case 'action':
                    element.setAction(value);
                    break;
                case 'model':
                    element.setModel(value);
                    break;
                case 'class':
                    element.classList.add(value);
                    break;
                case 'style':
                    for (let [skey, svalue] of Object.entries(value)) {
                        const regex = /[A-Z]/g;
                        skey = skey.replace(regex, (upperCase) => "-" + upperCase.toLowerCase());
                        element.style.setProperty(skey, svalue);
                    }
                    break;
                case 'set':
                    Object.defineProperty(props.set.object, props.set.attribute, { value: element });
                    break;
                default:
                    if (key.substring(0, 2) === "on") {
                        element.addEventListener(key.substr(2), value);
                    }
                    else {
                        if (typeof value !== "object") {
                            if (namespace === "http://www.w3.org/2000/svg") {
                                const regex = /[A-Z]/g;
                                key = key.replace(regex, (upperCase) => "-" + upperCase.toLowerCase());
                            }
                            element.setAttributeNS(null, key, `${value}`);
                        }
                    }
            }
        }
        if (props.children !== undefined) {
            for (let child of props.children) {
                if (typeof child === "string") {
                    element.appendChild(document.createTextNode(child));
                }
                else {
                    element.appendChild(child);
                }
            }
        }
    }

    class SignalLink {
        constructor(callback, id) {
            this.callback = callback;
            this.id = id;
        }
    }
    class Signal {
        add(callback, id) {
            if (!this.callbacks)
                this.callbacks = new Array();
            this.callbacks.push(new SignalLink(callback, id));
        }
        remove(id) {
            if (!this.callbacks)
                return;
            for (let i = this.callbacks.length - 1; i >= 0; --i) {
                if (this.callbacks[i].id === id)
                    this.callbacks.splice(i, 1);
            }
        }
        count() {
            if (!this.callbacks)
                return 0;
            return this.callbacks.length;
        }
        lock() {
            this.locked = true;
        }
        unlock() {
            this.locked = undefined;
            if (this.triggered) {
                let data = this.triggered.data;
                this.triggered = undefined;
                this.trigger(data);
            }
        }
        trigger(data) {
            if (this.locked) {
                this.triggered = { data: data };
                return;
            }
            if (!this.callbacks)
                return;
            for (let i = 0; i < this.callbacks.length; ++i)
                this.callbacks[i].callback(data);
        }
    }

    class Model {
        constructor() {
            this._enabled = true;
            this.modified = new Signal();
        }
        set enabled(enabled) {
            if (this._enabled == enabled)
                return;
            this._enabled = enabled;
            this.modified.trigger(undefined);
        }
        get enabled() {
            return this._enabled;
        }
    }

    class GenericModel extends Model {
        constructor(value) {
            super();
            this._value = value;
        }
        set value(value) {
            if (this._value == value)
                return;
            this._value = value;
            this.modified.trigger();
        }
        get value() {
            return this._value;
        }
    }

    class NumberModel extends GenericModel {
        constructor(value, options) {
            super(value);
            if (options) {
                this.min = options.min;
                this.max = options.max;
                this.step = options.step;
            }
        }
    }

    // apps/human.py class Human
    class Human {
        constructor() {
            this.modified = new Signal();
            // values to be edited by the macro/ethnic modifiers
            this.age = new NumberModel(0.5, { min: 0, max: 1 });
            this.gender = new NumberModel(0.5, { min: 0, max: 1 });
            this.weight = new NumberModel(0.5, { min: 0, max: 1 });
            this.muscle = new NumberModel(0.5, { min: 0, max: 1 });
            this.height = new NumberModel(0.5, { min: 0, max: 1 });
            this.breastSize = new NumberModel(0.5, { min: 0, max: 1 });
            this.breastFirmness = new NumberModel(0.5, { min: 0, max: 1 });
            this.bodyProportions = new NumberModel(0.5, { min: 0, max: 1 });
            // all variables suffixed with 'Val' will be read by ManagedTargetModifier.getFactors()
            this.caucasianVal = new NumberModel(1 / 3, { min: 0, max: 1 });
            this.asianVal = new NumberModel(1 / 3, { min: 0, max: 1 });
            this.africanVal = new NumberModel(1 / 3, { min: 0, max: 1 });
            // the above values are transformed into the values below,
            // which are then used by the modifiers
            this.maleVal = new NumberModel(0);
            this.femaleVal = new NumberModel(0);
            this.oldVal = new NumberModel(0);
            this.babyVal = new NumberModel(0);
            this.youngVal = new NumberModel(0);
            this.childVal = new NumberModel(0);
            this.maxweightVal = new NumberModel(0);
            this.minweightVal = new NumberModel(0);
            this.averageweightVal = new NumberModel(0);
            this.maxmuscleVal = new NumberModel(0);
            this.minmuscleVal = new NumberModel(0);
            this.averagemuscleVal = new NumberModel(0);
            this.maxheightVal = new NumberModel(0);
            this.minheightVal = new NumberModel(0);
            this.averageheightVal = new NumberModel(0);
            this.maxcupVal = new NumberModel(0);
            this.mincupVal = new NumberModel(0);
            this.averagecupVal = new NumberModel(0);
            this.maxfirmnessVal = new NumberModel(0);
            this.minfirmnessVal = new NumberModel(0);
            this.averagefirmnessVal = new NumberModel(0);
            this.idealproportionsVal = new NumberModel(0);
            this.uncommonproportionsVal = new NumberModel(0);
            this.regularproportionsVal = new NumberModel(0);
            this.flag = false;
            this._setDependendValues();
            this.gender.modified.add(() => this._setGenderVals());
            this.age.modified.add(() => this._setAgeVals());
            this.muscle.modified.add(() => this._setMuscleVals());
            this.weight.modified.add(() => this._setWeightVals());
            this.height.modified.add(() => this._setHeightVals());
            this.breastSize.modified.add(() => this._setBreastSizeVals());
            this.breastFirmness.modified.add(() => this._setBreastFirmnessVals());
            this.bodyProportions.modified.add(() => this._setBodyProportionVals());
            this.africanVal.modified.add(() => this._setEthnicVals("African"));
            this.asianVal.modified.add(() => this._setEthnicVals("Asian"));
            this.caucasianVal.modified.add(() => this._setEthnicVals("Caucasian"));
            this.modifiers = new Map();
            this.modifierGroups = new Map();
            this.targetsDetailStack = new Map();
        }
        static getInstance() {
            if (Human.instance === undefined)
                Human.instance = new Human();
            return Human.instance;
        }
        getModifier(name) {
            return this.modifiers.get(name);
        }
        getModifiersByGroup(groupName) {
            const group = this.modifierGroups.get(groupName);
            if (group === undefined) {
                console.log(`Modifier group ${groupName} does not exist.`);
                return [];
            }
            return group;
        }
        addModifier(modifier) {
            // console.log(`Human.addModifier(${modifier.fullName})`)
            //         if modifier.fullName in self._modifiers:
            if (this.modifiers.has(modifier.fullName)) {
                //             log.error("Modifier with name %s is already attached to human.", modifier.fullName)
                //             raise RuntimeError("Modifier with name %s is already attached to human." % modifier.fullName)
                throw Error(`Modifier with name ${modifier.fullName} is already attached to human.`);
            }
            //         self._modifier_type_cache = dict()
            //         self._modifiers[modifier.fullName] = modifier
            this.modifiers.set(modifier.fullName, modifier);
            //         if modifier.groupName not in self._modifier_groups:
            if (!this.modifierGroups.has(modifier.groupName)) {
                //             self._modifier_groups[modifier.groupName] = []
                this.modifierGroups.set(modifier.groupName, new Array());
            }
            //         self._modifier_groups[modifier.groupName].append(modifier)
            this.modifierGroups.get(modifier.groupName).push(modifier);
            //         # Update dependency mapping
            //         if modifier.macroVariable and modifier.macroVariable != 'None':
            //             if modifier.macroVariable in self._modifier_varMapping and \
            //                self._modifier_varMapping[modifier.macroVariable] != modifier.groupName:
            //                 log.error("Error, multiple modifier groups setting var %s (%s and %s)", modifier.macroVariable, modifier.groupName, self._modifier_varMapping[modifier.macroVariable])
            //             else:
            //                 self._modifier_varMapping[modifier.macroVariable] = modifier.groupName
            //                 # Update any new backwards references that might be influenced by this change (to make it independent of order of adding modifiers)
            //                 toRemove = set()  # Modifiers to remove again from backwards map because they belogn to the same group as the modifier controlling the var
            //                 dep = modifier.macroVariable
            //                 for affectedModifierGroup in self._modifier_dependencyMapping.get(dep, []):
            //                     if affectedModifierGroup == modifier.groupName:
            //                         toRemove.add(affectedModifierGroup)
            //                         #log.debug('REMOVED from backwards map again %s', affectedModifierGroup)
            //                 if len(toRemove) > 0:
            //                     if len(toRemove) == len(self._modifier_dependencyMapping[dep]):
            //                         del self._modifier_dependencyMapping[dep]
            //                     else:
            //                         for t in toRemove:
            //                             self._modifier_dependencyMapping[dep].remove(t)
            //         for dep in modifier.macroDependencies:
            //             groupName = self._modifier_varMapping.get(dep, None)
            //             if groupName and groupName == modifier.groupName:
            //                 # Do not include dependencies within the same modifier group
            //                 # (this step might be omitted if the mapping is still incomplete (dependency is not yet mapped to a group), and can later be fixed by removing the entry again from the reverse mapping)
            //                 continue
            //             if dep not in self._modifier_dependencyMapping:
            //                 self._modifier_dependencyMapping[dep] = []
            //             if modifier.groupName not in self._modifier_dependencyMapping[dep]:
            //                 self._modifier_dependencyMapping[dep].append(modifier.groupName)
            //             if modifier.isMacro():
            //                 self.updateMacroModifiers()
        }
        setDetail(targetName, value) {
            // NOTE: no 'name=canonicalpath(name)' as the host filesystem is a detail to be ignored in the domain core
            // console.log(`Human.setDetail('${name}', ${value})`)
            if (value !== undefined) { // TODO: check if '&& isZero(value)' is a valid optimization
                this.targetsDetailStack.set(targetName, value);
            }
            else {
                this.targetsDetailStack.delete(targetName);
            }
        }
        getDetail(targetName) {
            // NOTE: no 'name=canonicalpath(name)' as the host filesystem is a detail to be ignored in the domain core
            let value = this.targetsDetailStack.get(targetName);
            if (value === undefined)
                value = 0;
            // console.log(`Human.getDetail('${name}') -> ${value}`)
            return value;
        }
        setDefaultValues() {
            this.age.value = 0.5;
            this.gender.value = 0.5;
            this.weight.value = 0.5;
            this.muscle.value = 0.5;
            this.height.value = 0.5;
            this.breastSize.value = 0.5;
            this.breastFirmness.value = 0.5;
            this.bodyProportions.value = 0.5;
            this.caucasianVal.value = 1 / 3;
            this.asianVal.value = 1 / 3;
            this.africanVal.value = 1 / 3;
            this._setDependendValues();
        }
        _setDependendValues() {
            this._setGenderVals();
            this._setAgeVals();
            this._setWeightVals();
            this._setMuscleVals();
            this._setHeightVals();
            this._setBreastSizeVals();
            this._setBreastFirmnessVals();
            this._setBodyProportionVals();
        }
        _setGenderVals() {
            this.maleVal.value = this.gender.value;
            this.femaleVal.value = 1 - this.gender.value;
        }
        _setAgeVals() {
            // New system (A8):
            // ----------------
            //
            // 1y       10y       25y            90y
            // baby    child     young           old
            // |---------|---------|--------------|
            // 0      0.1875      0.5             1  = age [0, 1]
            //
            // val ^     child young     old
            //   1 |baby\ / \ /   \    /
            //     |     \   \      /
            //     |    / \ / \  /    \ young
            //   0 ______________________________> age
            //        0  0.1875 0.5      1
            if (this.age.value < 0.5) {
                this.oldVal.value = 0.0;
                this.babyVal.value = Math.max(0.0, 1 - this.age.value * 5.333); // 1/0.1875 = 5.333
                this.youngVal.value = Math.max(0.0, (this.age.value - 0.1875) * 3.2); // 1/(0.5-0.1875) = 3.2
                this.childVal.value = Math.max(0.0, Math.min(1.0, 5.333 * this.age.value) - this.youngVal.value);
            }
            else {
                this.childVal.value = 0.0;
                this.babyVal.value = 0.0;
                this.oldVal.value = Math.max(0.0, this.age.value * 2 - 1);
                this.youngVal.value = 1 - this.oldVal.value;
            }
        }
        _setWeightVals() {
            this.maxweightVal.value = Math.max(0.0, this.weight.value * 2 - 1);
            this.minweightVal.value = Math.max(0.0, 1 - this.weight.value * 2);
            this.averageweightVal.value = 1 - (this.maxweightVal.value + this.minweightVal.value);
        }
        _setMuscleVals() {
            this.maxmuscleVal.value = Math.max(0.0, this.muscle.value * 2 - 1);
            this.minmuscleVal.value = Math.max(0.0, 1 - this.muscle.value * 2);
            this.averagemuscleVal.value = 1 - (this.maxmuscleVal.value + this.minmuscleVal.value);
        }
        _setHeightVals() {
            this.maxheightVal.value = Math.max(0.0, this.height.value * 2 - 1);
            this.minheightVal.value = Math.max(0.0, 1 - this.height.value * 2);
            if (this.maxheightVal.value > this.minheightVal.value) {
                this.averageheightVal.value = 1 - this.maxheightVal.value;
            }
            else {
                this.averageheightVal.value = 1 - this.minheightVal.value;
            }
        }
        _setBreastSizeVals() {
            this.maxcupVal.value = Math.max(0.0, this.breastSize.value * 2 - 1);
            this.mincupVal.value = Math.max(0.0, 1 - this.breastSize.value * 2);
            if (this.maxcupVal.value > this.mincupVal.value) {
                this.averagecupVal.value = 1 - this.maxcupVal.value;
            }
            else {
                this.averagecupVal.value = 1 - this.mincupVal.value;
            }
        }
        _setBreastFirmnessVals() {
            this.maxfirmnessVal.value = Math.max(0.0, this.breastFirmness.value * 2 - 1);
            this.minfirmnessVal.value = Math.max(0.0, 1 - this.breastFirmness.value * 2);
            if (this.maxfirmnessVal.value > this.minfirmnessVal.value) {
                this.averagefirmnessVal.value = 1 - this.maxfirmnessVal.value;
            }
            else {
                this.averagefirmnessVal.value = 1 - this.minfirmnessVal.value;
            }
        }
        _setBodyProportionVals() {
            this.idealproportionsVal.value = Math.max(0.0, this.bodyProportions.value * 2 - 1);
            this.uncommonproportionsVal.value = Math.max(0.0, 1 - this.bodyProportions.value * 2);
            if (this.idealproportionsVal > this.uncommonproportionsVal) {
                this.regularproportionsVal.value = 1 - this.idealproportionsVal.value;
            }
            else {
                this.regularproportionsVal.value = 1 - this.uncommonproportionsVal.value;
            }
        }
        _setEthnicVals(exclude) {
            if (this.flag)
                return;
            this.flag = true;
            this.africanVal.modified.lock();
            this.asianVal.modified.lock();
            this.caucasianVal.modified.lock();
            this._setEthnicValsCore(exclude);
            this.africanVal.modified.unlock();
            this.asianVal.modified.unlock();
            this.caucasianVal.modified.unlock();
            this.flag = false;
        }
        _setEthnicValsCore(exclude) {
            let remaining = 1;
            let otherTotal = 0;
            if (exclude !== "African") {
                otherTotal += this.africanVal.value;
            }
            else {
                remaining -= this.africanVal.value;
            }
            if (exclude !== "Asian") {
                otherTotal += this.asianVal.value;
            }
            else {
                remaining -= this.asianVal.value;
            }
            if (exclude !== "Caucasian") {
                otherTotal += this.caucasianVal.value;
            }
            else {
                remaining -= this.caucasianVal.value;
            }
            if (otherTotal === 0) {
                if (exclude === undefined) {
                    // All values 0, this cannot be. Reset to default values.
                    this.caucasianVal.value = 1 / 3;
                    this.asianVal.value = 1 / 3;
                    this.africanVal.value = 1 / 3;
                }
                else if (Math.abs(remaining) < 0.001) {
                    // One ethnicity is 1, the rest is 0
                    if (exclude !== "African") {
                        this.africanVal.value = 1;
                    }
                    else {
                        this.africanVal.value = 0;
                    }
                    if (exclude !== "Asian") {
                        this.asianVal.value = 1;
                    }
                    else {
                        this.asianVal.value = 0;
                    }
                    if (exclude !== "Caucasian") {
                        this.caucasianVal.value = 1;
                    }
                    else {
                        this.caucasianVal.value = 0;
                    }
                }
                else {
                    // Increase values of other ethnicities (that were 0) to hit total sum of 1
                    if (exclude !== "African") {
                        this.africanVal.value = 0.01;
                    }
                    if (exclude !== "Asian") {
                        this.asianVal.value = 0.01;
                    }
                    if (exclude !== "Caucasian") {
                        this.caucasianVal.value = 0.01;
                    }
                    this._setEthnicValsCore(exclude);
                }
            }
            else {
                if (exclude !== "African") {
                    this.africanVal.value = remaining * this.africanVal.value / otherTotal;
                }
                if (exclude !== "Asian") {
                    this.asianVal.value = remaining * this.asianVal.value / otherTotal;
                }
                if (exclude !== "Caucasian") {
                    this.caucasianVal.value = remaining * this.caucasianVal.value / otherTotal;
                }
            }
        }
        updateProxyMesh(fitToPosed = false) {
            // console.log("Human.updateProxyMesh with:")
            this.modified.trigger();
            // this.targetsDetailStack.forEach( (value, targetName) => console.log(`${targetName}=${value}`) )
            // if self.proxy and self.__proxyMesh:
            //     self.proxy.update(self.__proxyMesh, fit_to_posed)
            //     self.__proxyMesh.update()
        }
    }

    class StringToLineIterator {
        constructor(data) {
            this.data = data;
            this.index = 0;
        }
        next() {
            if (this.data.length === 0 || this.index === -1)
                return { value: undefined, done: true };
            const nextIndex = this.data.indexOf('\n', this.index);
            let length;
            if (nextIndex === -1) {
                length = undefined;
            }
            else {
                length = nextIndex - this.index;
            }
            const result = this.data.substr(this.index, length);
            if (nextIndex === -1) {
                this.index = -1;
            }
            else {
                this.index = nextIndex + 1;
            }
            return { value: result, done: false };
        }
    }

    class StringToLine {
        constructor(data) {
            this.data = data;
        }
        [Symbol.iterator]() {
            return new StringToLineIterator(this.data);
        }
    }

    class FileSystemAdapter {
        static setInstance(instance) {
            FileSystemAdapter.instance = instance;
        }
        static getInstance() {
            if (FileSystemAdapter.instance === undefined)
                throw Error('Missing call to FileSystemAdapter.setInstance(instance: AbstractFilesystemAdapter).');
            return FileSystemAdapter.instance;
        }
    }

    // import { vec3 } from 'gl-matrix'
    // lib/targets.py
    // getTargets()
    // FILE: data/modifiers/modeling_modifiers.json
    // points to the files in the data/targets/ directory: data/targets/<group>/<target>-(<min>|<max>).target
    //
    // [
    // {
    //    "group": "<group>"
    //    "modifiers": [
    //       { "macrovar": "<name>" [, "modifierType": "EthnicModifier"]
    //       { "target": "<target>", "min": "<min>", "max": "<max>" },
    //    ]
    // }
    // ]
    //
    // 
    // data/targets/macrodetails/(african|asian|caucasian)-(male|female)-(baby|child|young|old).target
    // data/targets/macrodetails/universal-(male|female)-(baby|child|young|old)-(minweight|averageweight|maxweight).target
    // data/targets/macrodetails/height/(male|female)-(minmuscle|averagemuscle|maxmuscle)-(minweight|averageweight|maxweight)-(minheight|maxheight).target
    // data/targets/macrodetails/proportions/(male|female)-(minmuscle|averagemuscle|maxmuscle)-(minweight|averageweight|maxweight)-(idealproportions|uncommonproportions).target
    // FILE: data/modifiers/modeling_modifiers_desc.json
    // additional description for the UI
    //
    // FILE: data/modifiers/modeling_sliders.json
    //
    // ./compile_targets.py: create a binary representation of the target files?
    // ./lib/targets.py    : load target files?
    // apps/human.py
    // apps/compat.py
    // apps/devtests.py
    // apps/humanmodifier.py
    // apps/warpmodifier.py
    // core/algos3d.py: class Target!
    // number: 64bit double float
    // should use these instead to save memory and to improve performance:
    // Int8Array, Uint8Array, Uint8ClampedArray, Int16Array, Uint16Array, Int32Array, Uint32Array
    // Float32Array, Float64Array
    // BigInt64Array, BigUint64Array
    // morph target
    class Target {
        constructor() {
            this.verts = new Array();
            this.data = new Array();
        }
        load(filename) {
            const data = FileSystemAdapter.getInstance().readFile(filename);
            // index x y, z
            const reader = new StringToLine(data);
            for (let line of reader) {
                // console.log(line)
                line = line.trim();
                if (line.length === 0)
                    continue;
                if (line[0] === '#')
                    continue;
                const tokens = line.split(/\s+/);
                this.data.push(parseInt(tokens[0], 10));
                this.verts.push(parseFloat(tokens[1]));
                this.verts.push(parseFloat(tokens[2]));
                this.verts.push(parseFloat(tokens[3]));
            }
        }
        apply(verts, scale) {
            // console.log(`morphing ${this.data.length} vertices by ${scale}`)
            let dataIndex = 0, vertexIndex = 0;
            while (dataIndex < this.data.length) {
                let index = this.data[dataIndex++] * 3;
                verts[index++] += this.verts[vertexIndex++] * scale;
                verts[index++] += this.verts[vertexIndex++] * scale;
                verts[index++] += this.verts[vertexIndex++] * scale;
            }
        }
    }

    // _cat_data
    const categoryData = {
        // category        values
        'gender': ['male', 'female'],
        'age': ['baby', 'child', 'young', 'old'],
        'race': ['caucasian', 'asian', 'african'],
        'muscle': ['maxmuscle', 'averagemuscle', 'minmuscle'],
        'weight': ['minweight', 'averageweight', 'maxweight'],
        'height': ['minheight', 'averageheight', 'maxheight'],
        'breastsize': ['mincup', 'averagecup', 'maxcup'],
        'breastfirmness': ['minfirmness', 'averagefirmness', 'maxfirmness'],
        'bodyproportions': ['uncommonproportions', 'regularproportions', 'idealproportions']
    };
    // _categories
    const validCategories = new Array();
    // _value_cat
    const valueToCategory = new Map();
    for (const category in categoryData) {
        if (!categoryData.hasOwnProperty(category))
            continue;
        validCategories.push(category);
        // tslint:disable-next-line: forin
        for (const value of categoryData[category]) {
            valueToCategory.set(value, category);
        }
    }
    class Component {
        constructor(parent) {
            this.parent = parent;
            if (parent === undefined) {
                this.key = new Array();
                this.data = new Map();
            }
            else {
                this.key = parent.key.slice();
                this.data = new Map(parent.data);
            }
        }
        isRoot() {
            return this.parent === undefined;
        }
        createChild() {
            return new Component(this);
        }
        update(value) {
            const category = valueToCategory.get(value);
            if (category !== undefined) {
                this.setData(category, value);
            }
            else if (value !== 'target') {
                this.addKey(value);
            }
        }
        tuple() {
            let s = '';
            for (const key of this.key) {
                if (s.length !== 0)
                    s += '-';
                s += key;
            }
            return s;
        }
        getVariables() {
            // return [value for key,value in list(self.data.items()) if value != None]
            const result = [];
            for (const [key, value] of this.data.entries()) {
                if (value !== undefined)
                    result.push(value);
            }
            return result;
        }
        addKey(key) {
            this.key.push(key);
        }
        setData(category, value) {
            this.data = new Map(this.data);
            const orig = this.data.get(category);
            if (orig !== undefined) {
                if (orig !== value)
                    throw Error(`Component category ${category} can not be set to ${value} as it is already been set to ${orig}`);
                return;
            }
            this.data.set(category, value);
        }
        finish(pathname) {
            this.path = pathname;
            for (const category of validCategories) {
                if (!this.data.has(category))
                    this.data.set(category, undefined);
            }
        }
    }

    // what's inside TargetFactory:
    //   groups: Map<target name, Component>
    //      "buttocks-buttocks-volume-decr"
    ///       parent: key: ["buttocks"]
    //        key: the name splitted at '-'
    //        data: gender, age, race, muscle, weight, height, breastsize, breastfirmness, bodypropotions: all undefined
    //        path: "/targets/buttocks/buttocks-volume-decr.target"
    //   images: Map<target name, image filename>
    //   index: (superset of groups?)
    //     "buttocks" -> ["buttocks-buttocks-volume-decr", "buttocks-buttocks-volume-incr"]
    //     "buttocks-buttocks-volume-decr" -> Component
    //     "buttocks-buttocks-volume-incr" -> Component
    //   targets:
    //     list of all Components
    class TargetFactory {
        constructor() {
            this.rootComponent = new Component();
            this.images = new Map();
            this.targets = new Array();
            this.groups = new Map();
            this.index = new Map(); // Component key names to ...
            this.loadTargetDirectory();
            console.log(`Loaded target directory: ${this.targets.length} targets, ${this.groups.size} groups, ${this.index.size} indizes, ${this.images.size} images`);
        }
        static getInstance() {
            if (TargetFactory.instance === undefined)
                TargetFactory.instance = new TargetFactory();
            return TargetFactory.instance;
        }
        loadTargetDirectory() {
            this.walkTargets('', this.rootComponent);
            this.buildIndex();
        }
        findTargets(partialGroup) {
            // if isinstance(partialGroup, str):
            //     partialGroup = tuple(partialGroup.split('-'))
            // elif not isinstance(partialGroup, tuple):
            //     partialGroup = tuple(partialGroup)
            // if partialGroup not in self.index:
            if (!this.index.has(partialGroup))
                //     return []
                return [];
            // result = []
            const result = new Array();
            // for entry in self.index[partialGroup]:
            for (const entry of this.index.get(partialGroup)) {
                //     if isinstance(entry, Component):
                if (entry instanceof Component)
                    //         result.append(entry)
                    result.push(entry);
                //     else:
                else
                    //         result.extend(self.findTargets(entry))
                    result.concat(this.findTargets(entry));
            }
            // return result
            return result;
        }
        getTargetsByGroup(group) {
            return this.groups.get(group);
        }
        walkTargets(root, base) {
            const fs = FileSystemAdapter.getInstance();
            const directoryPath = fs.realPath(root);
            const dir = fs.listDir(directoryPath).sort();
            // console.log(`dir=${dir}`)
            for (const name of dir) {
                // console.log(`directoryPath='${directoryPath}', dir=${dir}, name='${name}'`)
                const p = fs.joinPath(directoryPath, name);
                if (fs.isFile(p) && !p.toLowerCase().endsWith('.target')) {
                    if (p.toLowerCase().endsWith('.png')) {
                        this.images.set(name.toLowerCase(), p);
                    }
                }
                else {
                    const item = base.createChild();
                    const parts = name.replace('_', '-').replace('.', '-').split('-');
                    for (const part of parts.entries()) {
                        if (part[0] === 0 && part[1] === 'targets')
                            continue;
                        item.update(part[1]);
                    }
                    if (fs.isDir(p)) {
                        const nextRoot = fs.joinPath(root, name);
                        this.walkTargets(nextRoot, item);
                    }
                    else {
                        item.finish(`data/${root}/${name}`);
                        this.targets.push(item);
                        const key = item.tuple();
                        let a = this.groups.get(key);
                        if (a === undefined) {
                            a = new Array();
                            this.groups.set(key, a);
                        }
                        a.push(item);
                    }
                }
            }
        }
        buildIndex() {
            for (const target of this.targets) {
                if (!this.index.has(target.tuple())) {
                    this.index.set(target.tuple(), []);
                }
                this.index.get(target.tuple()).push(target);
                let component = target;
                while (component.parent !== undefined) {
                    const parent = component.parent;
                    if (!this.index.has(parent.tuple())) {
                        this.index.set(parent.tuple(), new Array());
                    }
                    if (component.tuple() !== parent.tuple() &&
                        !this.index.get(parent.tuple()).includes(component.tuple())) {
                        this.index.get(parent.tuple()).push(component.tuple());
                    }
                    component = parent;
                }
            }
        }
    }
    // class FaceGroup // a group of faces with a unique name
    // class Object3D
    // FROM: core/algos3d.py
    // filename to target?
    const targetBuffer = new Map();
    function getTarget(filename) {
        let target = targetBuffer.get(filename);
        if (target !== undefined)
            return target;
        target = new Target(); // Target(3DObject, filename)
        target.load(filename);
        targetBuffer.set(filename, target);
        return target;
    }

    function loadSkeleton(filename) {
        const root = parseSkeleton(FileSystemAdapter.getInstance().readFile(filename), filename);
        console.log(`Loaded skeleton with ${root.bones.size} bones from file ${filename}`);
        return root;
    }
    function parseSkeleton(data, filename = 'memory') {
        let json;
        try {
            json = JSON.parse(data);
        }
        catch (error) {
            console.log(`Failed to parse JSON in ${filename}:\n${data.substring(0, 256)}`);
            throw error;
        }
        return new Skeleton(filename, json);
    }
    // makehuman/shared/skeleton.py
    // General skeleton, rig or armature class.
    // A skeleton is a hierarchic structure of bones, defined between a head and tail
    // joint position. Bones can be detached from each other (their head joint doesn't
    // necessarily need to be at the same position as the tail joint of their parent
    // bone).
    // A pose can be applied to the skeleton by setting a pose matrix for each of the
    // bones, allowing static posing or animation playback.
    // The skeleton supports skinning of a mesh using a list of vertex-to-bone
    // assignments.
    // skeleton file
    //   data: bones, joints, planes, weights_file, plane_map_strategy
    //   info: name, version, tags, description, copyright, license
    // weights files
    //   data: weights
    //   info: name, version, description, copyright, license
    class Skeleton {
        constructor(filename, data) {
            this.bones = new Map(); // Bone lookup list by name
            this.roots = new Array(); // bones with not parents (aka root bones) of this skeleton, a skeleton can have multiple root bones.
            this.joint_pos_idxs = new Map(); // Lookup by joint name referencing vertex indices on the human, to determine joint position
            this.planes = new Map(); // Named planes defined between joints, used for calculating bone roll angle
            this.plane_map_strategy = 3; // The remapping strategy used by addReferencePlanes() for remapping orientation planes from a reference skeleton
            this.has_custom_weights = false; // True if this skeleton has its own .mhw file
            this.info = {
                name: data.name,
                version: data.version,
                tags: data.tags,
                description: data.description,
                copyright: data.copyright,
                license: data.license,
            };
            this.plane_map_strategy = data.plane_map_strategy;
            //
            // JOINTS
            //
            // for joint_name, v_idxs in list(skelData.get("joints", dict()).items()):
            // if isinstance(v_idxs, list) and len(v_idxs) > 0:
            //     self.joint_pos_idxs[joint_name] = v_idxs
            for (let joint_name in Object.getOwnPropertyNames(data.joints)) {
                const v_idxs = data.joints[joint_name];
                if (v_idxs && v_idxs.length > 0) {
                    this.joint_pos_idxs.set(joint_name, v_idxs);
                }
            }
            //
            // PLANES
            //
            // self.planes = skelData.get("planes", dict())
            for (let plane in Object.getOwnPropertyNames(data.planes)) {
                this.planes.set(plane, data.planes[plane]);
            }
            // Order bones breadth-first (parents preceed children)
            const breadthfirst_bones_set = new Set();
            const breadthfirst_bones = new Array();
            let prev_len = -1; // anti-deadlock
            // while(len(breadthfirst_bones) != len(skelData["bones"]) and prev_len != len(breadthfirst_bones)):
            while (breadthfirst_bones_set.size != data.bones.length && prev_len != breadthfirst_bones_set.size) {
                //     prev_len = len(breadthfirst_bones)
                prev_len = breadthfirst_bones_set.size;
                //     for bone_name, bone_defs in list(skelData["bones"].items()):
                for (let bone_name of Object.getOwnPropertyNames(data.bones)) {
                    const bone_defs = data.bones[bone_name];
                    //         if bone_name not in breadthfirst_bones:
                    if (!breadthfirst_bones_set.has(bone_name)) {
                        //             if not bone_defs.get("parent", None):
                        //                 breadthfirst_bones.append(bone_name)
                        //             elif bone_defs["parent"] in breadthfirst_bones:
                        //                 breadthfirst_bones.append(bone_name)
                        const parent = bone_defs["parent"];
                        if (parent !== null && typeof parent !== "string") {
                            console.log(`Bone '${bone_name}' has invalid parent '${parent}'`);
                            continue;
                        }
                        if (parent === null) { // root bone
                            breadthfirst_bones_set.add(bone_name);
                            breadthfirst_bones.push(bone_name);
                        }
                        else if (breadthfirst_bones_set.has(parent)) { // parent has already been added
                            breadthfirst_bones_set.add(bone_name);
                            breadthfirst_bones.push(bone_name);
                        }
                    }
                }
            }
            // if len(breadthfirst_bones) != len(skelData["bones"]):
            //     missing = [bname for bname in list(skelData["bones"].keys()) if bname not in breadthfirst_bones]
            //     log.warning("Some bones defined in file %s could not be added to skeleton %s, because they have an invalid parent bone (%s)", filepath, self.name, ', '.join(missing))
            if (breadthfirst_bones_set.size !== Object.getOwnPropertyNames(data.bones).length) {
                let missing = [];
                for (let bname in data.bones) {
                    if (!breadthfirst_bones_set.has(bname)) {
                        missing.push(bname);
                    }
                }
                console.log(`Some bones defined in file '${filename}' could not be added to skeleton '${this.info.name}', because they have an invalid parent bone (${missing})`);
            }
            // for bone_name in breadthfirst_bones:
            //     bone_defs = skelData["bones"][bone_name]
            //     rotation_plane = bone_defs.get("rotation_plane", 0) // is 0 the default?
            //     if rotation_plane == [None, None, None]:
            //         log.warning("Invalid rotation plane specified for bone %s. Please make sure that you edited the .mhskel file by hand to include roll plane joints." % bone_name)
            //         rotation_plane = 0
            //     self.addBone(bone_name, bone_defs.get("parent", None), bone_defs["head"], bone_defs["tail"], rotation_plane, bone_defs.get("reference",None), bone_defs.get("weights_reference",None))
            for (let bone_name of breadthfirst_bones) {
                const bone_defs = data.bones[bone_name];
                let rotation_plane = bone_defs.rotation_plane;
                // This data was intended to be filled by hand in file exported with 
                //   https://github.com/makehumancommunity/makehuman-utils/blob/master/io_mhrigging_mhskel/export_mh_rigging.py
                // from Blender
                // if rotation_plane == [None, None, None]
                if (typeof rotation_plane !== "string") {
                    console.log(`Invalid rotation plane '${JSON.stringify(rotation_plane)}' specified for bone ${bone_name}. Please make sure that you edited the .mhskel file by hand to include roll plane joints."`);
                    rotation_plane = null;
                }
                this.addBone(bone_name, bone_defs.parent, bone_defs.head, bone_defs.tail, rotation_plane, bone_defs.reference, bone_defs.weights_reference);
            }
            this.build();
            // if "weights_file" in skelData and skelData["weights_file"]:
            //     weights_file = skelData["weights_file"]
            //     weights_file = getpath.thoroughFindFile(weights_file, os.path.dirname(getpath.canonicalPath(filepath)), True)
            //     self.vertexWeights = VertexBoneWeights.fromFile(weights_file, mesh.getVertexCount() if mesh else None, rootBone=self.roots[0].name)
            //     self.has_custom_weights = True
            // }
        }
        addBone(name, parentName, headJoint, tailJoint, roll = 0, reference_bones, weight_reference_bones) {
            // if name in list(self.bones.keys()):
            //     raise RuntimeError("The skeleton %s already contains a bone named %s." % (self.__repr__(), name))
            // bone = Bone(self, name, parentName, headJoint, tailJoint, roll, reference_bones, weight_reference_bones)
            // self.bones[name] = bone
            // if not parentName:
            //     self.roots.append(bone)
            // return bone
            if (name in this.bones) {
                throw Error(`The skeleton ${this.info.name} already contains a bone named ${name}.`);
            }
            const bone = new Bone(this, name, parentName, headJoint, tailJoint, roll, reference_bones, weight_reference_bones);
            this.bones.set(name, bone);
            if (!parentName) {
                this.roots.push(bone);
            }
            return bone;
        }
        getBone(name) {
            const bone = this.bones.get(name);
            if (bone === undefined) {
                console.trace(`Skeleton.getBone(${name}): no such bone`);
                throw Error(`Skeleton.getBone(${name}): no such bone`);
            }
            return bone;
        }
        // Rebuild bone rest matrices and determine local bone orientation
        // (roll or bone normal). Pass a ref_skel to copy the bone orientation from
        // the reference skeleton to the bones of this skeleton.
        build(ref_skel) {
            //     self.__cacheGetBones()
            //     for bone in self.getBones():
            //         bone.build(ref_skel)
        }
        // Returns linear list of all bones in breadth-first order.
        getBones() {
            if (this.boneslist === undefined) {
                this.__cacheGetBones();
            }
            return this.boneslist;
        }
        __cacheGetBones() {
            // ??? didn't we create that one earlier?
        }
    }
    class Bone {
        // matPose
        constructor(skel, name, parentName, headJoint, tailJoint, roll = 0, reference_bones, weight_reference_bones) {
            this.headPos = [0, 0, 0];
            this.tailPos = [0, 0, 0];
            this.length = 0;
            this.yvector4 = undefined; // direction vector of this bone
            this.children = [];
            this.reference_bones = [];
            this.skeleton = skel;
            this.name = name;
            this.headJoint = headJoint;
            this.tailJoint = tailJoint;
            this.roll = roll;
            // this.updateJointPosition()
            if (parentName !== null) {
                this.parent = this.skeleton.getBone(parentName);
                this.parent.children.push(this);
            }
            if (this.parent) {
                this.level = this.parent.level + 1;
            }
            else {
                this.level = 0;
            }
            // ... MORE ...
        }
    }

    // {'data/targets/buttocks/buttocks-volume-decr.target': -0.0, 'data/targets/buttocks/buttocks-volume-incr.target': 0.5}
    function getTargetWeights(targets, factors, value = 1.0, ignoreNotfound = false) {
        // console.log(`getTargetWeights(..,..,${value}, ${ignoreNotfound})"`)
        const result = new Map();
        if (ignoreNotfound) {
            targets.forEach((e) => {
                // console.log([1, 2, 5].reduce( (a, v) => a*v))
                // for factors in tfactors
                let mul = 1;
                e.factorDependencies.forEach(factor => {
                    const f = factors.get(factor);
                    if (f !== undefined) {
                        mul *= f;
                    }
                    else {
                        console.log(`no factor for '${factor}'`);
                    }
                });
                result.set(e.targetPath, value * mul);
            });
            //     for (tpath, tfactors) in targets:
            //         result[tpath] = value * reduce(operator.mul, [factors.get(factor, 1.0) for factor in tfactors])
        }
        else {
            targets.forEach((e) => {
                // console.log([1, 2, 5].reduce( (a, v) => a*v))
                // for factors in tfactors
                let mul = 1;
                e.factorDependencies.forEach(factor => {
                    let f = factors.get(factor);
                    if (f === undefined) {
                        console.log(`no factor for ${factor}`);
                        f = 1 / 3;
                    }
                    mul *= f || 0;
                });
                result.set(e.targetPath, value * mul);
            });
        }
        // console.log(result)
        return result;
    }

    function jsx(nameOrConstructor, props, key) {
        if (props !== undefined && props.children !== undefined) {
            props.children = [props.children];
        }
        return jsxs(nameOrConstructor, props);
    }
    function jsxs(nameOrConstructor, props, key) {
        let namespace;
        if (typeof nameOrConstructor !== 'string') {
            return new nameOrConstructor(props);
        }
        const name = nameOrConstructor;
        switch (name) {
            case "svg":
            case "line":
            case "rect":
            case "circle":
            case "path":
            case "text":
                namespace = "http://www.w3.org/2000/svg";
                break;
            default:
                namespace = "http://www.w3.org/1999/xhtml";
        }
        const tag = document.createElementNS(namespace, name);
        setInitialProperties(tag, props, namespace);
        return tag;
    }
    function setInitialProperties(element, props, namespace) {
        if (props === null || props === undefined)
            return;
        for (let [key, value] of Object.entries(props)) {
            switch (key) {
                case 'children':
                    break;
                case 'action':
                    element.setAction(value);
                    break;
                case 'model':
                    element.setModel(value);
                    break;
                case 'class':
                    element.classList.add(value);
                    break;
                case 'style':
                    for (let [skey, svalue] of Object.entries(value)) {
                        const regex = /[A-Z]/g;
                        skey = skey.replace(regex, (upperCase) => "-" + upperCase.toLowerCase());
                        element.style.setProperty(skey, svalue);
                    }
                    break;
                case 'set':
                    Object.defineProperty(props.set.object, props.set.attribute, { value: element });
                    break;
                default:
                    if (key.substring(0, 2) === "on") {
                        element.addEventListener(key.substr(2), value);
                    }
                    else {
                        if (typeof value !== "object") {
                            if (namespace === "http://www.w3.org/2000/svg") {
                                const regex = /[A-Z]/g;
                                key = key.replace(regex, (upperCase) => "-" + upperCase.toLowerCase());
                            }
                            element.setAttributeNS(null, key, `${value}`);
                        }
                    }
            }
        }
        if (props.children !== undefined) {
            for (let child of props.children) {
                if (typeof child === "string") {
                    element.appendChild(document.createTextNode(child));
                }
                else {
                    element.appendChild(child);
                }
            }
        }
    }

    function css(strings, ...values) {
        let str = strings[0];
        values.forEach((s, i) => {
            str = str.concat(s).concat(strings[i + 1]);
        });
        return str;
    }
    function element(type, children) {
        const element = document.createElement(type);
        for (let i = 0; i < children.length; ++i) {
            let child = children[i];
            if (child instanceof Array) {
                children.splice(i, 1, ...child);
                child = children[i];
            }
            if (typeof child === "string") {
                element.appendChild(document.createTextNode(child));
                continue;
            }
            element.appendChild(child);
        }
        return element;
    }
    function array(times, create) {
        let a = [];
        for (let i = 0; i < times; ++i) {
            const c = create(i);
            if (c instanceof Array) {
                a.push(...c);
            }
            else {
                a.push(c);
            }
        }
        return a;
    }
    function text(text) { return document.createTextNode(text); }
    const div = (...children) => element("div", children);
    const span = (...children) => element("span", children);
    const slot = (...children) => element("slot", children);
    const form = (...children) => element("form", children);
    const input = (...children) => element("input", children);
    const button = (...children) => element("button", children);
    const ul = (...children) => element("ul", children);
    const li = (...children) => element("li", children);
    const ns = "http://www.w3.org/2000/svg";
    function svg(child) {
        const s = document.createElementNS(ns, "svg");
        if (child !== undefined) {
            s.appendChild(child);
        }
        return s;
    }
    function path(d) {
        const p = document.createElementNS(ns, "path");
        if (d !== undefined) {
            p.setAttributeNS(null, "d", d);
        }
        return p;
    }
    function rect(x, y, width, height, stroke, fill) {
        const r = document.createElementNS(ns, "rect");
        r.setAttributeNS(null, "x", `${x}`);
        r.setAttributeNS(null, "y", `${y}`);
        r.setAttributeNS(null, "width", `${width}`);
        r.setAttributeNS(null, "height", `${height}`);
        if (stroke !== undefined) {
            r.setAttributeNS(null, "stroke", stroke);
        }
        if (fill !== undefined) {
            r.setAttributeNS(null, "fill", fill);
        }
        return r;
    }
    function line(x1, y1, x2, y2, stroke, fill) {
        const l = document.createElementNS(ns, "line");
        l.setAttributeNS(null, "x1", `${x1}`);
        l.setAttributeNS(null, "y1", `${y1}`);
        l.setAttributeNS(null, "x2", `${x2}`);
        l.setAttributeNS(null, "y2", `${y2}`);
        if (stroke !== undefined) {
            l.setAttributeNS(null, "stroke", stroke);
        }
        if (fill !== undefined) {
            l.setAttributeNS(null, "fill", fill);
        }
        return l;
    }

    class BooleanModel extends GenericModel {
        constructor(value) {
            super(value);
        }
    }

    class TextModel extends Model {
        constructor(value = "") {
            super();
            this._value = value;
        }
        set promise(promise) {
            this._value = promise;
            this.modified.trigger();
        }
        get promise() {
            if (typeof this._value === "string") {
                return () => {
                    return this._value;
                };
            }
            return this._value;
        }
        set value(value) {
            if (this._value === value)
                return;
            if (typeof value !== "string") {
                console.trace(`TextModel.set value(value: string): ${typeof value} is not type string`);
                return;
            }
            this._value = value;
            this.modified.trigger();
        }
        get value() {
            switch (typeof this._value) {
                case "number":
                case "string":
                    this._value = `${this._value}`;
                    break;
                case "function":
                    this._value = this._value();
                    break;
            }
            return this._value;
        }
    }

    class HtmlModel extends TextModel {
        constructor(value) {
            super(value);
        }
    }

    class Action extends Model {
        constructor(parent, title) {
            super();
            this.signal = new Signal();
            this.title = title;
            this._enabled = true;
        }
        set value(placeHolder) {
            throw Error("Action.value can not be assigned a value");
        }
        get value() {
            throw Error("Action.value can not return a value");
        }
        trigger(data) {
            if (!this._enabled)
                return;
            this.signal.trigger(data);
        }
    }

    class Controller {
        constructor() {
            this.modelId2Models = new Map();
            this.modelId2Views = new Map();
            this.view2ModelIds = new Map();
            this.sigChanged = new Signal();
        }
        registerAction(actionId, callback) {
            let action = new Action(undefined, actionId);
            action.signal.add(callback);
            this._registerModel("A:" + actionId, action);
            return action;
        }
        registerModel(modelId, model) {
            this._registerModel("M:" + modelId, model);
        }
        _registerModel(modelId, model) {
            let modelsForModelId = this.modelId2Models.get(modelId);
            if (!modelsForModelId) {
                modelsForModelId = new Set();
                this.modelId2Models.set(modelId, modelsForModelId);
            }
            modelsForModelId.add(model);
            let viewsForModelId = this.modelId2Views.get(modelId);
            if (!viewsForModelId)
                return;
            for (let view of viewsForModelId) {
                view.setModel(model);
            }
        }
        registerView(modelId, view) {
            if (view.controller && view.controller !== this) {
                console.log("error: attempt to register view more than once at different controllers");
                return;
            }
            view.controller = this;
            let modelIdsForView = this.view2ModelIds.get(view);
            if (!modelIdsForView) {
                modelIdsForView = new Set();
                this.view2ModelIds.set(view, modelIdsForView);
            }
            modelIdsForView.add(modelId);
            let viewsForModelId = this.modelId2Views.get(modelId);
            if (!viewsForModelId) {
                viewsForModelId = new Set();
                this.modelId2Views.set(modelId, viewsForModelId);
            }
            viewsForModelId.add(view);
            let modelsForView = this.modelId2Models.get(modelId);
            if (!modelsForView)
                return;
            for (let model of modelsForView) {
                view.setModel(model);
            }
        }
        unregisterView(view) {
            if (!view.controller)
                return;
            if (view.controller !== this)
                throw Error("attempt to unregister view from wrong controller");
            let modelIds = this.view2ModelIds.get(view);
            if (!modelIds)
                return;
            for (let modelId of modelIds) {
                let views = this.modelId2Views.get(modelId);
                if (!views)
                    continue;
                views.delete(view);
                if (views.size === 0) {
                    this.modelId2Views.delete(modelId);
                }
                view.setModel(undefined);
            }
        }
        clear() {
            for (let entry of this.view2ModelIds) {
                entry[0].setModel(undefined);
            }
            this.modelId2Models.clear();
            this.modelId2Views.clear();
            this.view2ModelIds.clear();
        }
        bind(modelId, model) {
            this.registerModel(modelId, model);
        }
        action(actionId, callback) {
            return this.registerAction(actionId, callback);
        }
        text(modelId, value) {
            let model = new TextModel(value);
            this.bind(modelId, model);
            return model;
        }
        html(modelId, value) {
            let model = new HtmlModel(value);
            this.bind(modelId, model);
            return model;
        }
        boolean(modelId, value) {
            let model = new BooleanModel(value);
            this.bind(modelId, model);
            return model;
        }
        number(modelId, value, options) {
            let model = new NumberModel(value, options);
            this.bind(modelId, model);
            return model;
        }
    }

    function attribute(element, name) {
        let attribute = element.getAttribute(name);
        if (attribute === null) {
            console.log("missing attribute '" + name + "' in ", element);
            throw Error("missing attribute '" + name + "' in " + element.nodeName);
        }
        return attribute;
    }
    function attributeOrUndefined(element, name) {
        let attribute = element.getAttribute(name);
        return attribute === null ? undefined : attribute;
    }

    let globalController = new Controller();

    class AnimationBase {
        constructor() {
            this._stop = false;
            this._firstFrame = this._firstFrame.bind(this);
            this._animationFrame = this._animationFrame.bind(this);
        }
        start() {
            this.prepare();
            if (this._stop === true)
                return;
            this.requestAnimationFrame(this._firstFrame);
        }
        stop() {
            this._stop = true;
            if (this.animator?.current === this)
                this.animator.current = undefined;
        }
        replace(animation) {
            this.next = animation;
            this.animationFrame(1);
            this.lastFrame();
            animation.prepare();
        }
        prepare() { }
        firstFrame() { }
        animationFrame(value) { }
        lastFrame() { }
        requestAnimationFrame(callback) {
            window.requestAnimationFrame(callback);
        }
        _firstFrame(time) {
            this.startTime = time;
            this.firstFrame();
            if (this._stop)
                return;
            this.animationFrame(0);
            this.requestAnimationFrame(this._animationFrame);
        }
        _animationFrame(time) {
            if (this.next) {
                this.next._firstFrame(time);
                return;
            }
            let elapsed = AnimationBase.animationFrameCount > 0 ? (time - this.startTime) / AnimationBase.animationFrameCount : 1;
            elapsed = elapsed > 1 ? 1 : elapsed;
            const value = this.ease(elapsed);
            this.animationFrame(value);
            if (this._stop) {
                return;
            }
            if (value < 1.0) {
                this.requestAnimationFrame(this._animationFrame.bind(this));
            }
            else {
                this.lastFrame();
                if (this.animator?.current === this)
                    this.animator.current = undefined;
            }
        }
        ease(k) {
            return 0.5 * (1 - Math.cos(Math.PI * k));
        }
    }
    AnimationBase.animationFrameCount = 468;
    class AnimationWrapper extends AnimationBase {
        constructor(animation) {
            super();
            this.animation = animation;
        }
        prepare() {
            this.animation.prepare();
        }
        firstFrame() {
            this.animation.firstFrame();
        }
        animationFrame(value) {
            this.animation.animationFrame(value);
        }
        lastFrame() {
            this.animation.lastFrame();
        }
    }
    class Animator {
        run(animation) {
            let animationBase;
            if (!(animation instanceof AnimationBase)) {
                animationBase = new AnimationWrapper(animation);
            }
            else {
                animationBase = animation;
            }
            const current = this.current;
            this.current = animationBase;
            animationBase.animator = this;
            if (current) {
                current.animator = undefined;
                current.replace(animationBase);
            }
            else {
                if (Animator.halt) {
                    return;
                }
                animationBase.start();
            }
        }
    }
    Animator.halt = false;

    class OptionModelBase extends Model {
        constructor() {
            super();
            this._stringValue = "";
        }
        set stringValue(v) {
            if (this._stringValue === v)
                return;
            this._stringValue = v;
            this.modified.trigger();
        }
        get stringValue() {
            return this._stringValue;
        }
        isValidStringValue(stringValue) {
            return false;
        }
    }

    class EnumModel extends OptionModelBase {
        constructor(enumClass, value) {
            super();
            this.enumClass = enumClass;
            if (value !== undefined) {
                this._value = value;
            }
        }
        get value() {
            return this._value;
        }
        set value(value) {
            this.setValue(value);
        }
        get stringValue() {
            return this.toString();
        }
        set stringValue(value) {
            this.fromString(value);
        }
        getValue() {
            return this._value;
        }
        setValue(value) {
            if (this._value === value) {
                return;
            }
            this._value = value;
            this.modified.trigger();
        }
        toString() {
            return this.enumClass[this._value];
        }
        fromString(value) {
            const x = this.enumClass[value];
            if (x === undefined || typeof this.enumClass[x] !== "string") {
                let allValidValues = "";
                Object.keys(this.enumClass).forEach(key => {
                    const validValue = this.enumClass[key];
                    if (typeof validValue === "string") {
                        if (allValidValues.length !== 0) {
                            allValidValues = `${allValidValues}, ${validValue}`;
                        }
                        else {
                            allValidValues = validValue;
                        }
                    }
                });
                console.trace(`EnumModel<T>.fromString('${value}'): invalid value, must be one of ${allValidValues}`);
                return;
            }
            if (this._value === x) {
                return;
            }
            this._value = x;
            this.modified.trigger();
        }
        isValidStringValue(value) {
            const x = this.enumClass[value];
            return x !== undefined && typeof this.enumClass[x] === "string";
        }
    }

    class View extends HTMLElement {
        constructor(props) {
            super();
            setInitialProperties(this, props);
        }
        static define(name, view, options) {
            const element = window.customElements.get(name);
            if (element === undefined) {
                window.customElements.define(name, view, options);
            }
            else {
                if (element !== view) {
                    console.trace(`View::define(${name}, ...): attempt to redefine view with different constructor`);
                }
            }
        }
        attachStyle(style) {
            this.shadowRoot.appendChild(document.importNode(style, true));
        }
        setModel(model) {
            console.trace(`Please note that View.setModel(model) has no implementation.`);
        }
        getModelId() {
            if (!this.hasAttribute("model"))
                throw Error("no 'model' attribute");
            let modelId = this.getAttribute("model");
            if (!modelId)
                throw Error("no model id");
            return "M:" + modelId;
        }
        getActionId() {
            if (!this.hasAttribute("action"))
                throw Error("no 'action' attribute");
            let actionId = this.getAttribute("action");
            if (!actionId)
                throw Error("no action id");
            return "A:" + actionId;
        }
        connectedCallback() {
            if (this.controller)
                return;
            let modelId = "";
            try {
                modelId = this.getModelId();
            }
            catch (error) {
            }
            if (modelId != "")
                globalController.registerView(modelId, this);
        }
        disconnectedCallback() {
            if (this.controller)
                this.controller.unregisterView(this);
        }
    }

    class ModelView extends View {
        constructor(init) {
            super(init);
            if (init?.model !== undefined) {
                this.setModel(init.model);
            }
        }
        updateModel() { }
        updateView(data) { }
        setModel(model) {
            if (model === this.model)
                return;
            const view = this;
            if (this.model)
                this.model.modified.remove(view);
            if (model)
                model.modified.add((data) => view.updateView(data), view);
            this.model = model;
            if (this.isConnected)
                this.updateView(undefined);
        }
        connectedCallback() {
            super.connectedCallback();
            if (this.model)
                this.updateView(undefined);
        }
    }

    class ActionView extends ModelView {
        constructor(init) {
            super(init);
        }
        connectedCallback() {
            if (this.controller) {
                this.updateView();
                return;
            }
            try {
                globalController.registerView(this.getActionId(), this);
            }
            catch (e) {
            }
            try {
                globalController.registerView(this.getModelId(), this);
            }
            catch (e) {
            }
            this.updateView();
        }
        disconnectedCallback() {
            super.disconnectedCallback();
            if (this.controller)
                this.controller.unregisterView(this);
        }
        setModel(model) {
            if (!model) {
                if (this.model)
                    this.model.modified.remove(this);
                if (this.action)
                    this.action.modified.remove(this);
                this.model = undefined;
                this.action = undefined;
                this.updateView();
                return;
            }
            if (model instanceof Action) {
                this.action = model;
                this.action.modified.add(() => {
                    this.updateView();
                }, this);
            }
            else if (model instanceof TextModel) {
                this.model = model;
                this.model.modified.add(() => {
                    this.updateView();
                }, this);
            }
            else {
                throw Error("unexpected model of type " + model.constructor.name);
            }
            this.updateView();
        }
        setAction(value) {
            if (value instanceof Function) {
                const action = new Action(undefined, "");
                action.signal.add(value);
                this.setModel(action);
            }
            else {
                this.setModel(value);
            }
        }
        isEnabled() {
            return this.action !== undefined && this.action.enabled;
        }
    }

    const style$a = document.createElement("style");
    style$a.textContent = css `
:host {
    display: inline-block;
}

.tx-text {
    width: 100%;
    box-shadow: none;
    box-sizing: border-box;
    color: var(--tx-edit-fg-color);
    background-color: var(--tx-edit-bg-color);

    /* we'll use the border instead of an outline to indicate the focus */
    outline: none;
    border-width: var(--tx-border-width);
    border-style: solid;
    border-color: var(--tx-border-color);
    border-radius: var(--tx-border-radius);

    font-weight: var(--tx-edit-font-weight);
    font-size: var(--tx-edit-font-size);
    line-height: 18px;

    padding: 4px 8px 4px 8px;
    text-indent: 0;
    vertical-align: top;
    margin: 0;
    overflow: visible;
    text-overflow: ellipsis;
}
.tx-text:hover {
    border-color: var(--tx-border-color-hover);
}
.tx-text:disabled {
    color: var(--tx-fg-color-disabled);
    background-color: var(--tx-bg-color-disabled);
    border-color: var(--tx-bg-color-disabled);
}
.tx-text::placeholder {
    color: var(--tx-placeholder-fg-color);
    font-style: italic;
    font-weight: 300;
}
.tx-text:hover::placeholder {
    color: var(--tx-placeholder-fg-color-hover);
}
.tx-text:focus {
    border-color: var(--tx-outline-color);
}
`;

    class Text extends ModelView {
        constructor(init) {
            super(init);
            this.input = document.createElement("input");
            this.input.classList.add("tx-text");
            this.input.oninput = () => { this.updateModel(); };
            this.attachShadow({ mode: 'open' });
            this.attachStyle(style$a);
            this.shadowRoot.appendChild(this.input);
        }
        focus() {
            this.input.focus();
        }
        blur() {
            this.input.blur();
        }
        static get observedAttributes() { return ['value']; }
        attributeChangedCallback(name, oldValue, newValue) {
            switch (name) {
                case "value":
                    if (this.model && newValue !== undefined) {
                        this.model.value = newValue;
                    }
                    break;
            }
        }
        updateModel() {
            if (this.model) {
                this.model.value = this.input.value;
            }
            this.setAttribute("value", this.input.value);
        }
        updateView() {
            if (!this.model)
                return;
            const strValue = `${this.model.value}`;
            if (this.input.value !== strValue) {
                this.input.value = strValue;
                this.setAttribute("value", this.input.value);
            }
        }
        get value() {
            return this.input.value;
        }
        set value(value) {
            this.input.value = value;
            this.updateModel();
        }
    }
    Text.define("tx-text", Text);

    let textAreaStyle = document.createElement("style");
    textAreaStyle.textContent = `

/* try to follow material ui: when active render button labels in black, otherwise in gray */
svg .fill {
  fill: var(--tx-gray-700);
  stroke: var(--tx-gray-700);
}
svg .stroke {
  fill: none;
  stroke: var(--tx-gray-700);
}
svg .strokeFill {
  fill: var(--tx-gray-200);
  stroke: var(--tx-gray-700);
}

/*
these don't seem to be in use anymore
.toolbar.active svg .fill {
  fill: #000;
  stroke: #000;
}
.toolbar.active svg .stroke {
  fill: none;
  stroke: #000;
}
.toolbar.active svg .strokeFill {
  fill: #fff;
  stroke: #000;
}
*/

.toolbar button {
    background: var(--tx-gray-75);
    color: var(--tx-gray-800);
    border: 1px var(--tx-gray-400);
    border-style: solid solid solid none;
    padding: 5;
    margin: 0;
    vertical-align: middle;
    height: 22px;
}

.toolbar button:active:hover {
    background: linear-gradient(to bottom, var(--tx-gray-600) 0%,var(--tx-gray-50) 100%,var(--tx-gray-500) 100%);
}

.toolbar button.left {
    border-style: solid;
    border-radius: 3px 0 0 3px;
}

.toolbar button.right {
    border: 1px var(--tx-gray-400);
    border-style: solid solid solid none;
    border-radius: 0 3px 3px 0;
}

.toolbar button.active {
    background: linear-gradient(to bottom, var(--tx-gray-600) 0%,var(--tx-gray-50) 100%,var(--tx-gray-500) 100%);
    border: 1px var(--tx-global-blue-500) solid;
    color: var(--tx-gray-900);
}

div.textarea {
  font-family: var(--tx-font-family);
  font-size: var(--tx-font-size);
  border: 1px var(--tx-gray-400) solid;
  border-radius: 3px;
  margin: 2px;
  padding: 4px 5px;
  outline-offset: -2px;
}

div.textarea h1 {
  font-size: 22px;
  margin: 0;
  padding: 4px 0 4px 0;
}

div.textarea h2 {
  font-size: 18px;
  margin: 0;
  padding: 4px 0 4px 0;
}

div.textarea h3 {
  font-size: 16px;
  margin: 0;
  padding: 4px 0 4px 0;
}

div.textarea h4 {
  font-size: 14px;
  margin: 0;
  padding: 4px 0 4px 0;
}

div.textarea div {
  padding: 2px 0 2px 0;
}
`;

    class TextTool extends ModelView {
        constructor() {
            super();
            TextTool.texttool = this;
            let toolbar = jsx("div", { class: "toolbar" });
            this.buttonH1 = jsx("button", { class: "left", children: "H1" });
            this.buttonH1.onclick = () => {
                document.execCommand("formatBlock", false, "<h1>");
                this.update();
            };
            toolbar.appendChild(this.buttonH1);
            this.buttonH2 = jsx("button", { children: "H2" });
            this.buttonH2.onclick = () => {
                document.execCommand("formatBlock", false, "<h2>");
                this.update();
            };
            toolbar.appendChild(this.buttonH2);
            this.buttonH3 = jsx("button", { children: "H3" });
            this.buttonH3.onclick = () => {
                document.execCommand("formatBlock", false, "<h3>");
                this.update();
            };
            toolbar.appendChild(this.buttonH3);
            this.buttonH4 = jsx("button", { class: "right", children: "H4" });
            this.buttonH4.onclick = () => {
                document.execCommand("formatBlock", false, "<h4>");
                this.update();
            };
            toolbar.appendChild(this.buttonH4);
            toolbar.appendChild(document.createTextNode(" "));
            this.buttonBold = jsx("button", { class: "left", children: jsx("b", { children: "B" }) });
            this.buttonBold.onclick = () => {
                document.execCommand("bold", false);
                this.update();
            };
            toolbar.appendChild(this.buttonBold);
            this.buttonItalic = jsx("button", { children: jsx("i", { children: "I" }) });
            this.buttonItalic.onclick = () => {
                document.execCommand("italic", false);
                this.update();
            };
            toolbar.appendChild(this.buttonItalic);
            this.buttonUnderline = jsx("button", { children: jsx("u", { children: "U" }) });
            this.buttonUnderline.onclick = () => {
                document.execCommand("underline", false);
                this.update();
            };
            toolbar.appendChild(this.buttonUnderline);
            this.buttonStrikeThrough = jsx("button", { children: jsx("strike", { children: "S" }) });
            this.buttonStrikeThrough.onclick = () => {
                document.execCommand("strikeThrough", false);
                this.update();
            };
            toolbar.appendChild(this.buttonStrikeThrough);
            this.buttonSubscript = jsx("button", { children: "x\u2082" });
            this.buttonSubscript.onclick = () => {
                document.execCommand("subscript", false);
                this.update();
            };
            toolbar.appendChild(this.buttonSubscript);
            this.buttonSuperscript = jsx("button", { class: "right", children: "x\u00B2" });
            this.buttonSuperscript.onclick = () => {
                document.execCommand("superscript", false);
                this.update();
            };
            toolbar.appendChild(this.buttonSuperscript);
            toolbar.appendChild(document.createTextNode(" "));
            this.buttonJustifyLeft = jsx("button", { class: "left", children: jsxs("svg", { viewBox: "0 0 10 9", width: "10", height: "9", children: [jsx("line", { x1: "0", y1: "0.5", x2: "10", y2: "0.5", class: "stroke" }), jsx("line", { x1: "0", y1: "2.5", x2: "6", y2: "2.5", class: "stroke" }), jsx("line", { x1: "0", y1: "4.5", x2: "10", y2: "4.5", class: "stroke" }), jsx("line", { x1: "0", y1: "6.5", x2: "6", y2: "6.5", class: "stroke" }), jsx("line", { x1: "0", y1: "8.5", x2: "10", y2: "8.5", class: "stroke" })] }) });
            this.buttonJustifyLeft.onclick = () => {
                document.execCommand("justifyLeft", false);
                this.update();
            };
            toolbar.appendChild(this.buttonJustifyLeft);
            this.buttonJustifyCenter = jsx("button", { children: jsxs("svg", { viewBox: "0 0 10 9", width: "10", height: "9", children: [jsx("line", { x1: "0", y1: "0.5", x2: "10", y2: "0.5", class: "stroke" }), jsx("line", { x1: "2", y1: "2.5", x2: "8", y2: "2.5", class: "stroke" }), jsx("line", { x1: "0", y1: "4.5", x2: "10", y2: "4.5", class: "stroke" }), jsx("line", { x1: "2", y1: "6.5", x2: "8", y2: "6.5", class: "stroke" }), jsx("line", { x1: "0", y1: "8.5", x2: "10", y2: "8.5", class: "stroke" })] }) });
            this.buttonJustifyCenter.onclick = () => {
                document.execCommand("justifyCenter", false);
                this.update();
            };
            toolbar.appendChild(this.buttonJustifyCenter);
            this.buttonJustifyRight = jsx("button", { class: "right", children: jsxs("svg", { viewBox: "0 0 10 9", width: "10", height: "9", children: [jsx("line", { x1: "0", y1: "0.5", x2: "10", y2: "0.5", class: "stroke" }), jsx("line", { x1: "4", y1: "2.5", x2: "10", y2: "2.5", class: "stroke" }), jsx("line", { x1: "0", y1: "4.5", x2: "10", y2: "4.5", class: "stroke" }), jsx("line", { x1: "4", y1: "6.5", x2: "10", y2: "6.5", class: "stroke" }), jsx("line", { x1: "0", y1: "8.5", x2: "10", y2: "8.5", class: "stroke" })] }) });
            this.buttonJustifyRight.onclick = () => {
                document.execCommand("justifyRight", false);
                this.update();
            };
            toolbar.appendChild(this.buttonJustifyRight);
            this.attachShadow({ mode: 'open' });
            this.shadowRoot.appendChild(document.importNode(textAreaStyle, true));
            this.shadowRoot.appendChild(toolbar);
        }
        update() {
            this.buttonH1.classList.toggle("active", document.queryCommandValue("formatBlock") === "h1");
            this.buttonH2.classList.toggle("active", document.queryCommandValue("formatBlock") === "h2");
            this.buttonH3.classList.toggle("active", document.queryCommandValue("formatBlock") === "h3");
            this.buttonH4.classList.toggle("active", document.queryCommandValue("formatBlock") === "h4");
            this.buttonBold.classList.toggle("active", document.queryCommandState("bold"));
            this.buttonItalic.classList.toggle("active", document.queryCommandState("italic"));
            this.buttonUnderline.classList.toggle("active", document.queryCommandState("underline"));
            this.buttonStrikeThrough.classList.toggle("active", document.queryCommandState("strikeThrough"));
            this.buttonSubscript.classList.toggle("active", document.queryCommandState("subscript"));
            this.buttonSuperscript.classList.toggle("active", document.queryCommandState("superscript"));
            this.buttonJustifyLeft.classList.toggle("active", document.queryCommandState("justifyLeft"));
            this.buttonJustifyCenter.classList.toggle("active", document.queryCommandState("justifyCenter"));
            this.buttonJustifyRight.classList.toggle("active", document.queryCommandState("justifyRight"));
        }
    }
    TextTool.define("tx-texttool", TextTool);

    class TextArea extends ModelView {
        constructor() {
            super();
            let content = document.createElement("div");
            this.content = content;
            content.classList.add("tx-text");
            content.contentEditable = "true";
            content.oninput = (event) => {
                if (this.model instanceof HtmlModel) {
                    let firstChild = event.target.firstChild;
                    if (firstChild && firstChild.nodeType === 3) {
                        document.execCommand("formatBlock", false, `<div>`);
                    }
                    else if (content.innerHTML === "<br>") {
                        content.innerHTML = "";
                    }
                }
                this.updateModel();
            };
            content.onkeydown = (event) => {
                if (!(this.model instanceof HtmlModel)) {
                    return;
                }
                if (event.metaKey === true && event.key === "b") {
                    event.preventDefault();
                    document.execCommand("bold", false);
                    this.updateTextTool();
                }
                else if (event.metaKey === true && event.key === "i") {
                    event.preventDefault();
                    document.execCommand("italic", false);
                    this.updateTextTool();
                }
                else if (event.metaKey === true && event.key === "u") {
                    event.preventDefault();
                    document.execCommand("underline", false);
                    this.updateTextTool();
                }
                else if (event.key === "Tab") {
                    event.preventDefault();
                }
                else if (event.key === "Enter" &&
                    event.shiftKey !== true &&
                    document.queryCommandValue("formatBlock") === "blockquote") {
                    document.execCommand("formatBlock", false, "<p>");
                }
            };
            content.onkeyup = () => {
                this.updateTextTool();
            };
            content.onmouseup = () => {
                this.updateTextTool();
            };
            this.attachShadow({ mode: 'open' });
            this.attachStyle(style$a);
            this.shadowRoot.appendChild(content);
        }
        updateTextTool() {
            if (TextTool.texttool !== undefined)
                TextTool.texttool.update();
        }
        updateModel() {
            if (this.model) {
                this.model.promise = () => {
                    if (this.model instanceof HtmlModel) {
                        return this.content.innerHTML;
                    }
                    else {
                        return this.content.innerText;
                    }
                };
            }
        }
        updateView() {
            if (!this.model) {
                return;
            }
            if (this.model instanceof HtmlModel) {
                if (this.content.innerHTML !== this.model.value) {
                    this.content.innerHTML = this.model.value;
                }
            }
            else {
                if (this.content.innerText !== this.model.value) {
                    this.content.innerText = this.model.value;
                }
            }
        }
    }
    TextArea.define("tx-textarea", TextArea);

    class Display extends ModelView {
        constructor(init) {
            super(init);
        }
        updateView() {
            if (this.model === undefined) {
                this.innerText = "";
                return;
            }
            if (this.model instanceof TextModel) {
                this.innerText = this.model.value;
                return;
            }
            if (this.model instanceof HtmlModel) {
                this.innerHTML = this.model.value;
                return;
            }
            if (this.model instanceof NumberModel) {
                this.innerText = `${this.model.value}`;
                return;
            }
        }
    }
    Display.define("tx-display", Display);

    const style$9 = document.createElement("style");
    style$9.textContent = css `
.tx-button {
    padding: 2px 14px 2px 14px;
    margin: 0;
    color: var(--tx-gray-800);
    transition: background-color 130ms ease-in-out;
    background-color: var(--tx-gray-300);
    border: 0 none;
    height: 28px;
    border-radius: 16px;
    box-shadow: none;
}

:host(.tx-default) > .tx-button {
    color: var(--tx-gray-50);
    background-color: var(--tx-gray-800);
}

/* accent */

:host(.tx-accent) > .tx-button {
    color: var(--tx-static-white);
    background-color: var(--tx-static-blue-600);
}

:host(.tx-accent) > .tx-button:hover, :host(.tx-accent) > .tx-button:active {
    color: var(--tx-static-white);
    background-color: var(--tx-static-blue-700);
}
:host(.tx-accent) > .tx-button:hover:active {
    color: var(--tx-static-white);
    background-color: var(--tx-static-blue-500);
}

/* negative */

:host(.tx-negative) > .tx-button {
    color: var(--tx-static-white);
    background-color: var(--tx-static-red-600);
}
:host(.tx-negative) > :hover, :host(.tx-negative) > :active {
    color: var(--tx-static-white);
    background-color: var(--tx-static-red-700);
}
:host(.tx-negative) > :hover:active {
    color: var(--tx-static-white);
    background-color: var(--tx-static-red-500);
}

.tx-button:hover, .tx-button:active {
    color: var(--tx-gray-900);
    background-color: var(--tx-gray-400);
}
:host(.tx-default) > .tx-button:hover, :host(.tx-default) > .tx-button:hover:active {
    color: var(--tx-gray-50);
    background-color: var(--tx-gray-900);
}

.tx-button:hover:active {
    color: var(--tx-gray-900);
    background-color: var(--tx-gray-500);
}

.tx-button:hover:active > span {
    transition: transform 130ms ease-in-out;
    transform: translate(1px, 1px);
}

:host(.tx-default) > .tx-button:active {
    color: var(--tx-gray-50);
    background-color: var(--tx-gray-900);
}

.tx-label {
    font-weight: bold;
    padding: 4px 0 6px 0;
    /* override parent flex/grid's align-items property to align in the center */
    align-self: center;
    /* adjust sides in container to look centered...? */
    justify-self: center;
    /* align children in the center */
    text-align: center;
}
`;

    class Button extends ActionView {
        constructor(init) {
            super(init);
            this.button = button(this.label = span());
            this.button.classList.add("tx-button");
            this.label.classList.add("tx-label");
            this.button.onclick = () => {
                if (this.action)
                    this.action.trigger();
            };
            this.button.disabled = true;
            this.attachShadow({ mode: 'open' });
            this.attachStyle(style$9);
            this.shadowRoot.appendChild(this.button);
        }
        connectedCallback() {
            super.connectedCallback();
            if (this.children.length !== 0) {
                return;
            }
            this._observer = new MutationObserver((record, observer) => {
                if (this._timer !== undefined)
                    clearTimeout(this._timer);
                this._timer = window.setTimeout(() => {
                    this._timer = undefined;
                    this.updateView();
                }, 100);
            });
            this._observer.observe(this, {
                childList: true,
                subtree: true,
                characterData: true
            });
        }
        updateView() {
            if (!this.isConnected)
                return;
            if (this.model && this.model.value) {
                if (this.model instanceof HtmlModel)
                    this.label.innerHTML = this.model.value;
                else
                    this.label.innerText = this.model.value;
            }
            else {
                this.label.innerHTML = this.innerHTML;
            }
            this.button.disabled = !this.isEnabled();
        }
    }
    Button.define("tx-button", Button);

    class BooleanView extends ModelView {
        setModel(model) {
            if (model !== undefined && !(model instanceof BooleanModel)) {
                throw Error(`BooleanView.setModel(): model is not of type BooleanModel`);
            }
            super.setModel(model);
        }
        updateModel() {
            if (this.model) {
                this.model.value = this.input.checked;
            }
        }
        updateView() {
            if (!this.model || !this.model.enabled) {
                this.input.setAttribute("disabled", "");
            }
            else {
                this.input.removeAttribute("disabled");
            }
            if (this.model) {
                this.input.checked = this.model.value;
            }
        }
    }

    const style$8 = document.createElement("style");
    style$8.textContent = css `
:host(.tx-checkbox) {
    display: inline-block;
    position: relative;
    box-shadow: none;
    box-sizing: border-box;
    padding: 0;
    margin: 2px; /* leave space for the focus ring */
    border: none 0;
    height: 14px;
    width: 14px;
}

:host(.tx-checkbox) > input {
    box-sizing: border-box;
    width: 14px;
    height: 14px;
    outline: none;
    padding: 0;
    margin: 0;
    border: 2px solid;
    border-radius: 2px;
    border-color: var(--tx-gray-700);
    /* border-radius: var(--tx-border-radius); */
    color: var(--tx-edit-fg-color);
    background-color: var(--tx-edit-bg-color);
    -webkit-appearance: none;
}

/* this is a svg 2 feature, works with firefox, chrome and edge, but not safari */
/* :host(.tx-checkbox) > svg > path {
    d: path("M3.5 9.5a.999.999 0 01-.774-.368l-2.45-3a1 1 0 111.548-1.264l1.657 2.028 4.68-6.01A1 1 0 019.74 2.114l-5.45 7a1 1 0 01-.777.386z");
} */

/* focus ring */
:host(.tx-checkbox) > input:focus-visible {
    outline: 2px solid;
    outline-color: var(--tx-outline-color);
    outline-offset: 2px;
}

:host(.tx-checkbox) > svg {
    position: absolute;
    left: 2px;
    top: 2px;
    stroke: none;
    fill: var(--tx-edit-bg-color);
    width: 10px;
    height: 10px;
    pointer-events: none;
}

:host(.tx-checkbox) > input:hover {
    border-color: var(--tx-gray-800);
}
.tx-checkbox > input:focus {
    border-color: var(--tx-outline-color);
}

:host(.tx-checkbox) > input:checked {
    background-color: var(--tx-gray-700);
}
:host(.tx-checkbox) > input:hover:checked {
    background-color: var(--tx-gray-800);
}

:host(.tx-checkbox) > input:disabled {
    color: var(--tx-gray-400);
    border-color: var(--tx-gray-400);
}
:host(.tx-checkbox) > input:checked:disabled {
    background-color: var(--tx-gray-400);
}
`;

    class Checkbox extends BooleanView {
        constructor() {
            super();
            this.classList.add("tx-checkbox");
            this.input = input();
            this.input.type = "checkbox";
            this.input.onchange = () => {
                this.updateModel();
            };
            const checkmark = svg(path("M3.5 9.5a.999.999 0 01-.774-.368l-2.45-3a1 1 0 111.548-1.264l1.657 2.028 4.68-6.01A1 1 0 019.74 2.114l-5.45 7a1 1 0 01-.777.386z"));
            this.attachShadow({ mode: 'open' });
            this.attachStyle(style$8);
            this.shadowRoot.appendChild(this.input);
            this.shadowRoot.appendChild(checkmark);
        }
    }
    Checkbox.define("tx-checkbox", Checkbox);

    const style$7 = document.createElement("style");
    style$7.textContent = css `
.tx-search {
    display: inline-block;
    position: relative;
}
.tx-search > div {
    display: inline-flex;
    position: relative;
}
.tx-search > div > svg {
    display: block;
    position: absolute;
    height: 18px;
    width: 18px;
    top: 7px;
    left: 10px;
    pointer-events: none;
    overflow: hidden;
    fill: var(--tx-gray-700);
}
.tx-search > div > input {
    box-sizing: border-box;
    padding: 3px 12px 5px 35px;
    margin: 0;
    border: 1px solid var(--tx-gray-400);
    border-radius: 4px;
    -webkit-appearance: none;
    outline-offset: -2px;
    outline: none;
    width: 100%;
    height: 32px;
    overflow: visible;
    background: var(--tx-gray-50);

    color: var(--tx-gray-900);  
    font-weight: var(--tx-edit-font-weight);
    font-size: var(--tx-edit-font-size);
    line-height: 18px;
}
/* the button is transparent so that the border of the input field remains visible */
.tx-search > button {
    display: inline-flex;
    position: absolute;
    box-sizing: border-box;
    right: 0;
    top: 0;
    bottom: 0;
    width: 32px;
    padding: 0;
    margin: 1px;
    border: none;
    align-items: center;
    justify-content: center;
    overflow: visible;
    vertical-align: top;
    cursor: pointer;
    border-radius: 0 4px 4px 0;
    text-align: center;
    outline: none;

    background-color: var(--tx-gray-50);
    border-radius: 0 4px 4px 0;

}
.tx-search > button > svg {
    display: inline-block;
    pointer-events: none;
    height: 10px;
    width: 10px;
    padding: 0;
    margin: 0;
    border: none;
    fill: var(--tx-gray-700);
}
.tx-search > div > input:hover {
    border-color: var(--tx-gray-500);
}

.tx-search > div > input:focus {
    border-color: var(--tx-outline-color);
}
.tx-search > button:focus > svg {
    fill: var(--tx-outline-color);
}

.tx-search > div > input:disabled {
    color: var(--tx-gray-700);
    background-color: var(--tx-gray-200);
    border-color: var(--tx-gray-200);
}
.tx-search > button:disabled {
    background-color: var(--tx-gray-200);
}
.tx-search > button:disabled > svg {
    fill: var(--tx-gray-400);
}`;

    class Search extends ModelView {
        constructor() {
            super();
            let s0, s1, i, p;
            const f = form(div(s0 = svg(p = path("M33.173 30.215L25.4 22.443a12.826 12.826 0 10-2.957 2.957l7.772 7.772a2.1 2.1 0 002.958-2.958zM6 15a9 9 0 119 9 9 9 0 01-9-9z")), i = input()), button(s1 = svg(path("M6.548 5L9.63 1.917A1.094 1.094 0 008.084.371L5.001 3.454 1.917.37A1.094 1.094 0 00.371 1.917L3.454 5 .37 8.085A1.094 1.094 0 101.917 9.63l3.084-3.083L8.084 9.63a1.094 1.094 0 101.547-1.546z"))));
            s0.setAttributeNS(null, "width", "100%");
            s0.setAttributeNS(null, "height", "100%");
            p.setAttributeNS(null, "transform", "scale(0.5, 0.5)");
            s1.setAttributeNS(null, "width", "100%");
            s1.setAttributeNS(null, "height", "100%");
            i.type = "search";
            i.placeholder = "Search";
            i.autocomplete = "off";
            f.classList.add("tx-search");
            this.attachShadow({ mode: 'open' });
            this.attachStyle(style$7);
            this.shadowRoot.appendChild(f);
        }
    }
    Search.define("tx-search", Search);

    const style$6 = document.createElement("style");
    style$6.textContent = css `
/* a div on top serves as the container for elements used for the switch*/
:host(.tx-switch) {
    display: inline-flex;
    align-items: flex-start;
    position: relative;
    vertical-align: top;
}
/* an invisible checkbox will overlay everything, handling input and state */
:host(.tx-switch) > input {
    display: inline-block;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    box-sizing: absolute;
    margin: 0;
    padding: 0;
    opacity: 0;
    z-index: 1;
}
/* the span provides the visual appearance */
:host(.tx-switch) > span {
    display: block;
    position: relative;
    left: 0;
    top: 0;
    box-sizing: border-box;
    flex-grow: 0;
    flex-shrink: 0;

    border: 0px none;
    border-radius: 7px;

    width: 26px;
    height: 14px;
    background: var(--tx-gray-300);
}

/* focus ring */
:host(.tx-switch) > input:focus-visible + span {
    outline: 2px solid;
    outline-color: var(--tx-outline-color);
    outline-offset: 2px;
}

/* this is the knob on the switch */
:host(.tx-switch) > span:before {
    display: block;
    position: absolute;
    left: 0;
    top: 0;
    width: 14px;
    height: 14px;
    background: var(--tx-gray-75);
    border: 2px solid var(--tx-gray-700);
    border-radius: 7px;
    content: "";
    box-sizing: border-box;

    /* 'transform' usually can be GPU acclerated while 'left' can not */
    transition: transform 130ms ease-in-out;
}
:host(.tx-switch) > input:hover + span:before {
    border-color: var(--tx-gray-900);
}

:host(.tx-switch) > input:checked + span:before {
    /* border-color: var(--tx-gray-700); */
    transform: translateX(calc(100% - 2px));
}

:host(.tx-switch) > input:checked + span {
    background: var(--tx-gray-700);
}
:host(.tx-switch) > input:checked:hover + span {
    background: var(--tx-gray-900);
}
:host(.tx-switch) > input:hover + span + label {
    color: var(--tx-gray-900);
}

:host(.tx-switch) > input:checked:disabled + span {
    background: var(--tx-gray-400);
}
:host(.tx-switch) > input:disabled + span:before {
    border-color: var(--tx-gray-400);
}
:host(.tx-switch) > input:disabled + span + label {
    color: var(--tx-gray-400);
}`;

    class Switch extends BooleanView {
        constructor() {
            super();
            this.classList.add("tx-switch");
            this.input = input();
            this.input.type = "checkbox";
            this.input.onchange = () => {
                this.updateModel();
            };
            this.attachShadow({ mode: 'open' });
            this.attachStyle(style$6);
            this.shadowRoot.appendChild(this.input);
            this.shadowRoot.appendChild(span());
        }
    }
    Switch.define("tx-switch", Switch);

    const style$5 = document.createElement("style");
    style$5.textContent = css `
:host(.tx-radio) {
    display: inline-flex;
    align-items: flex-start;
    position: relative;
    vertical-align: top;
}
/* an invisible radiobutton will overlay everything, handling input and state */
:host(.tx-radio) > input {
    display: inline-block;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    box-sizing: absolute;
    margin: 0;
    padding: 0;
    opacity: 0;
    z-index: 1;
}

/* the span provides the visual appearance */
:host(.tx-radio) > span {
    display: block;
    position: relative;
    left: 0;
    top: 0;
    box-sizing: border-box;
    flex-grow: 0;
    flex-shrink: 0;

    border: 2px solid var(--tx-gray-700);
    border-radius: 7px;

    width: 14px;
    height: 14px;
    background: none;
}

/* focus ring */
:host(.tx-radio) > input:focus-visible + span {
    outline: 2px solid;
    outline-color: var(--tx-outline-color);
    outline-offset: 2px;
}
/* this is the knob on the switch */
:host(.tx-radio) > span:before {
    display: block;
    position: absolute;
    left: 0px;
    top: 0px;
    width: 10px;
    height: 10px;
    background: var(--tx-gray-75);
    border: 2px solid var(--tx-gray-75);
    border-radius: 7px;
    content: "";
    box-sizing: border-box;

    /* 'transform' usually can be GPU acclerated while 'left' can not */
    transition: opacity 130ms ease-in-out;
}
:host(.tx-radio) > input:checked + span:before {
    background: var(--tx-gray-700);
}
:host(.tx-radio) > input:checked:hover + span:before {
    background: var(--tx-gray-900);
}
:host(.tx-radio) > input:hover + span {
    border-color: var(--tx-gray-900);
}

:host(.tx-radio) > input:checked:disabled + span:before {
    background: var(--tx-gray-500);
}
:host(.tx-radio) > input:disabled + span {
    border-color: var(--tx-gray-500);
}
`;

    class RadioButton extends ModelView {
        constructor(init) {
            super(init);
            this.classList.add("tx-radio");
            this.input = input();
            this.input.type = "radio";
            this.input.value = this.getAttribute("value");
            let view = this;
            this.input.onchange = () => {
                view.updateModel();
            };
            this.attachShadow({ mode: 'open' });
            this.attachStyle(style$5);
            this.shadowRoot.appendChild(this.input);
            this.shadowRoot.appendChild(span());
        }
        updateModel() {
            if (this.model) {
                this.model.stringValue = this.input.value;
            }
        }
        updateView() {
            if (this.model) {
                let radioGroup = RadioButton.radioGroups.get(this.model);
                if (radioGroup === undefined) {
                    radioGroup = ++RadioButton.radioGroupCounter;
                    RadioButton.radioGroups.set(this.model, radioGroup);
                }
                this.input.name = `radioGroup${radioGroup}`;
            }
            else {
                this.input.name = "";
            }
            if (!this.model || !this.model.enabled) {
                this.input.setAttribute("disabled", "");
            }
            else {
                this.input.removeAttribute("disabled");
            }
            if (this.model) {
                this.input.checked = this.model.stringValue === this.input.value;
            }
        }
    }
    RadioButton.radioGroupCounter = 0;
    RadioButton.radioGroups = new WeakMap();
    RadioButton.define("tx-radiobutton", RadioButton);

    var MenuState;
    (function (MenuState) {
        MenuState[MenuState["WAIT"] = 0] = "WAIT";
        MenuState[MenuState["DOWN"] = 1] = "DOWN";
        MenuState[MenuState["UP_N_HOLD"] = 2] = "UP_N_HOLD";
        MenuState[MenuState["DOWN_N_HOLD"] = 3] = "DOWN_N_HOLD";
        MenuState[MenuState["DOWN_N_OUTSIDE"] = 4] = "DOWN_N_OUTSIDE";
        MenuState[MenuState["DOWN_N_INSIDE_AGAIN"] = 5] = "DOWN_N_INSIDE_AGAIN";
    })(MenuState || (MenuState = {}));

    class MenuButtonContainer extends View {
        constructor(props) {
            super(props);
            this.vertical = true;
            this.closeOnClose = false;
            this.state = MenuState.WAIT;
        }
    }

    class PopupMenu extends MenuButtonContainer {
        constructor(root, parent) {
            super();
            this.vertical = true;
            this.root = root;
            this.parentButton = parent;
            this.popup = document.createElement("div");
            this.popup.classList.add("menu-popup");
            let node = root.down;
            while (node) {
                if (node.isAvailable()) {
                    node.createWindowAt(this, this.popup);
                }
                else {
                    node.deleteWindow();
                }
                node = node.next;
            }
            this.appendChild(this.popup);
            this.show();
        }
        show() {
            if (!this.parentButton.master.vertical)
                placePopupVertical(this.parentButton, this.popup);
            else
                placePopupHorizontal(this.parentButton, this.popup);
            this.style.display = "";
        }
        hide() {
            this.style.display = "none";
        }
    }
    function placePopupVertical(parent, popup) {
        let parentBoundary = parent.getBoundingClientRect();
        popup.style.opacity = "0";
        popup.style.left = parentBoundary.left + "px";
        popup.style.top = (parentBoundary.top + parentBoundary.height) + "px";
        setTimeout(function () {
            let popupBoundary = popup.getBoundingClientRect();
            let popupBottom = parentBoundary.top + parentBoundary.height + popupBoundary.height;
            if (popupBottom > window.innerHeight) {
                popup.style.top = (parentBoundary.top - popupBoundary.height) + "px";
            }
            let popupRight = parentBoundary.left + popupBoundary.width;
            if (popupRight > window.innerWidth) {
                popup.style.left = (parentBoundary.left + parentBoundary.width - popupBoundary.width) + "px";
            }
            popup.style.opacity = "1";
        }, 0);
    }
    function placePopupHorizontal(parent, popup) {
        let parentBoundary = parent.getBoundingClientRect();
        popup.style.opacity = "0";
        popup.style.left = (parentBoundary.left + parentBoundary.width) + "px";
        popup.style.top = parentBoundary.top + "px";
        setTimeout(function () {
            let popupBoundary = popup.getBoundingClientRect();
            let popupBottom = parentBoundary.top + popupBoundary.height;
            if (popupBottom > window.innerHeight) {
                popup.style.top = (parentBoundary.top + parentBoundary.height - popupBoundary.height) + "px";
            }
            let popupRight = parentBoundary.left + parentBoundary.width + popupBoundary.width;
            if (popupRight > window.innerWidth) {
                popup.style.left = (parentBoundary.left - popupBoundary.width) + "px";
            }
            popup.style.opacity = "1";
        }, 0);
    }
    View.define("tx-popupmenu", PopupMenu);

    const style$4 = document.createElement("style");
    style$4.textContent = css `
:host(.tx-combobox) {
    display: inline-flex;
    align-items: flex-start;
    position: relative;
    vertical-align: top;
}
:host(.tx-combobox) > input {
    box-sizing: border-box;
    width: 100%;
    height: 32px;
    margin: 0;
    padding: 3px 32px 5px 11px;
    vertical-align: top;
    overflow: visible;
    outline: none;
    display: inline-block;
    border: 1px solid var(--tx-gray-400);
    border-radius: 4px;
    background-color: var(--tx-gray-50);

    color: var(--tx-gray-900);  
    font-weight: var(--tx-edit-font-weight);
    font-size: var(--tx-edit-font-size);
    line-height: 18px;
}
:host(.tx-combobox) > input::placeholder {
    color: var(--tx-placeholder-fg-color);
    font-style: italic;
    font-weight: 300;
}

:host(.tx-combobox) > button {
    position: absolute;
    right: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    border-style: none;
    box-sizing: border-box;
    overflow: visible;
    margin: 0;
    text-transform: none;

    width: 32px;
    height: 32px;
    background-color: var(--tx-gray-75);
    border-radius: 0 4px 4px 0;
    border: 1px solid var(--tx-gray-400);
}
:host(.tx-combobox) > button > svg {
    fill: var(--tx-gray-700);
    transform: rotate(90deg) translate(5px, 8px);
}

:host(.tx-combobox) > input:hover {
    border-color: var(--tx-gray-500);
}
:host(.tx-combobox) > button:hover {
    border-color: var(--tx-gray-500);
    background-color: var(--tx-gray-50);
}
:host(.tx-combobox) > button:hover > svg {
    fill: var(--tx-gray-900);
}

:host(.tx-combobox) > input:focus {
    border-color: var(--tx-outline-color);
}
:host(.tx-combobox) > input:focus + button {
    border-color: var(--tx-outline-color);
}
/* spectrum use a 1px focus ring when the focus was set by mouse
 * and a 2px focus ring when the focus was set by keyboard
 * no clue how to do that with css
 *
/* :host(.tx-combobox) > input:focus-visible {
    outline: 1px solid var(--tx-outline-color);
}
:host(.tx-combobox) > input:focus-visible + button {
    outline: 1px solid var(--tx-outline-color);
    border-left: none;
} */

:host(.tx-combobox) > input:disabled {
    color: var(--tx-gray-700);
    background-color: var(--tx-gray-200);
    border-color: var(--tx-gray-200);
}
:host(.tx-combobox) > input:disabled + button {
    background-color: var(--tx-gray-200);
    border-color: var(--tx-gray-200);
}
:host(.tx-combobox) > input:disabled + button > svg {
    fill: var(--tx-gray-400);
}
`;

    const style$3 = document.createElement("style");
    style$3.textContent = css `
.tx-popover {
    background-color: var(--tx-gray-50);
    border: 1px solid var(--tx-gray-400);
    border-radius: 4px;
    display: inline-flex;
    flex-direction: column;
    filter: drop-shadow(rgba(0, 0, 0, 0.5) 0px 1px 4px);
}
.tx-menu {
    display: inline-block;
    padding: 0;
    margin: 4px 0 4px 0;
}
.tx-menu > li {
    cursor: pointer;
    display: flex;
    border: none;
    border-left: 2px solid var(--tx-gray-50);
    border-right: 2px solid var(--tx-gray-50);
    padding: 7px 11px 7px 10px;
    margin: 0;
    font-weight: 500;
    outline: none;
}
.tx-menu > li:hover {
    background-color: var(--tx-gray-100);
    border-color: var(--tx-gray-100);
}
.tx-menu > li.tx-hover {
    background-color: var(--tx-gray-100);
    border-color: var(--tx-gray-100);
}
.tx-menu > li:focus {
    border-left-color: var(--tx-outline-color);
}
.tx-menu > li[role=separator] {
    display: block;
    box-sizing: content-box;
    overflow: visible;
    cursor: default;
    height: 2px;
    padding: 0px;
    margin: 1.5px 7px 1.5px 7px;
    background-color: var(--tx-gray-100);
    white-space: pre;
    list-style-type: none;
}
.tx-menu > li.tx-disabled {
    color: var(--tx-gray-500);
}
.tx-menu > li.tx-disabled:hover {
    background-color: var(--tx-gray-50);
}`;

    class Select extends ModelView {
        constructor(init) {
            super(init);
            this.input = input();
            this.input.type = "text";
            this.asPopupMenu();
            let view = this;
            this.input.oninput = () => {
                view.updateModel();
            };
            this.input.onblur = (ev) => {
                if (this.hover === undefined) {
                    this.close();
                }
            };
            let s;
            const b = button(s = svg(path("M3 9.95a.875.875 0 01-.615-1.498L5.88 5 2.385 1.547A.875.875 0 013.615.302L7.74 4.377a.876.876 0 010 1.246L3.615 9.698A.872.872 0 013 9.95z")));
            this.button = b;
            b.tabIndex = -1;
            b.style.outline = "none";
            s.style.width = "100%";
            s.style.height = "100%";
            b.onpointerdown = (ev) => {
                if (this.popup) {
                    this.close();
                    return;
                }
                ev.preventDefault();
                this.input.focus();
                this.open();
                b.setPointerCapture(ev.pointerId);
            };
            b.onpointermove = (ev) => {
                if (this.popup === undefined) {
                    return;
                }
                const e = this.shadowRoot.elementFromPoint(ev.clientX, ev.clientY);
                let newHover;
                if (e instanceof HTMLLIElement) {
                    newHover = e;
                }
                else {
                    newHover = undefined;
                }
                if (this.hover !== newHover) {
                    if (this.hover) {
                        this.hover.classList.remove("tx-hover");
                    }
                    this.hover = newHover;
                    if (this.hover) {
                        this.hover.classList.add("tx-hover");
                    }
                }
            };
            b.onpointerup = (ev) => {
                if (this.hover) {
                    const idx = parseInt(this.hover.dataset["idx"]);
                    this.close();
                    this.select(idx);
                    return;
                }
                const e = this.shadowRoot.elementFromPoint(ev.clientX, ev.clientY);
                if (b.contains(e)) {
                    this.input.focus();
                    return;
                }
                this.close();
            };
            this.keydown = this.keydown.bind(this);
            this.input.onkeydown = this.keydown;
            this.wheel = this.wheel.bind(this);
            this.input.onwheel = this.button.onwheel = this.wheel;
            this.classList.add("tx-combobox");
            this.attachShadow({ mode: 'open' });
            this.attachStyle(style$4);
            this.attachStyle(style$3);
            this.shadowRoot.appendChild(this.input);
            this.shadowRoot.appendChild(b);
        }
        connectedCallback() {
            if (this.controller)
                return;
            super.connectedCallback();
            const text = this.getAttribute("text");
            if (text !== null) {
                globalController.registerView(`M:${text}`, this);
                this.asComboBox();
                this.updateModel();
            }
        }
        setModel(model) {
            if (!model) {
                if (this.text) {
                    this.text.modified.remove(this);
                    this.text = undefined;
                }
                super.setModel(model);
                return;
            }
            if (model instanceof OptionModelBase) {
                super.setModel(model);
            }
            if (model instanceof TextModel) {
                this.text = model;
                this.text.modified.add(() => {
                    this.input.value = this.text.value;
                }, this);
            }
        }
        keydown(ev) {
            if (this.input.readOnly) {
                ev.preventDefault();
            }
            switch (ev.key) {
                case "ArrowUp":
                    this.previousItem();
                    break;
                case "ArrowDown":
                    this.nextItem();
                    break;
            }
        }
        wheel(ev) {
            ev.preventDefault();
            this.input.focus();
            if (ev.deltaY > 0) {
                this.nextItem();
            }
            if (ev.deltaY < 0) {
                this.previousItem();
            }
        }
        asPopupMenu() {
            this.input.readOnly = true;
            for (let property of ["user-select", "-webkit-user-select", "-webkit-touch-callout", "-khtml-user-select"]) {
                this.input.style.setProperty(property, "none");
            }
        }
        asComboBox() {
            this.input.readOnly = false;
            for (let property of ["user-select", "-webkit-user-select", "-webkit-touch-callout", "-khtml-user-select"]) {
                this.input.style.removeProperty(property);
            }
        }
        updateModel() {
            if (this.text) {
                this.text.value = this.input.value;
            }
        }
        updateView() {
            if (!this.model || !this.model.enabled) {
                this.input.setAttribute("disabled", "");
            }
            else {
                this.input.removeAttribute("disabled");
            }
            if (this.model !== undefined) {
                this.input.value = this.displayName(this.model.stringValue);
                this.updateModel();
            }
        }
        displayName(value) {
            for (let i = 0; i < this.children.length; ++i) {
                const child = this.children[i];
                if (child.nodeName === "OPTION") {
                    const option = child;
                    if (option.value === value) {
                        return option.text;
                    }
                }
            }
            let all = "";
            for (let i = 0; i < this.children.length; ++i) {
                const child = this.children[i];
                if (child.nodeName === "OPTION") {
                    const option = child;
                    all = `${all} '${option.value}'`;
                }
            }
            if (all.length === 0) {
                all = " empty option list";
            }
            console.log(`'${value}' is not in${all} of <tx-select model="${this.getAttribute("model")}">`);
            console.trace(this);
            return "";
        }
        open() {
            let view = this;
            let u;
            this.popup = div(u = ul(...array(this.children.length, (idx) => {
                const l = li(text(this.children.item(idx).innerText));
                l.tabIndex = 0;
                l.ariaRoleDescription = "option";
                l.dataset["idx"] = `${idx}`;
                l.onpointerdown = (ev) => {
                    this.button.setPointerCapture(ev.pointerId);
                    this.hover = l;
                    ev.preventDefault();
                };
                l.onclick = () => {
                    view.select(idx);
                };
                this.children[idx];
                return l;
            })));
            this.popup.classList.add("tx-popover");
            this.popup.style.position = "fixed";
            this.popup.style.zIndex = "99";
            u.ariaRoleDescription = "listbox";
            u.classList.add("tx-menu");
            this.shadowRoot.appendChild(this.popup);
            placePopupVertical(this, this.popup);
        }
        close() {
            this.hover = undefined;
            if (this.popup !== undefined) {
                this.shadowRoot.removeChild(this.popup);
                this.popup = undefined;
            }
        }
        select(index) {
            if (this.model === undefined) {
                console.log(`<tx-select model='${this.getAttribute("model")}'> has no model`);
                return;
            }
            this.close();
            const option = this.children[index];
            if (!(option instanceof HTMLOptionElement)) {
                console.log(`<tx-select>: unpexected element <${option.nodeName.toLowerCase()}> instead of <option>`);
                return;
            }
            this.model.stringValue = option.value;
        }
        getIndex() {
            const v = this.model?.stringValue;
            for (let i = 0; i < this.children.length; ++i) {
                if (this.children[i].value === v)
                    return i;
            }
            return undefined;
        }
        nextItem() {
            let index = this.getIndex();
            if (index === undefined) {
                index = 0;
            }
            else {
                ++index;
            }
            if (index >= this.children.length) {
                return;
            }
            this.select(index);
        }
        previousItem() {
            let index = this.getIndex();
            if (index === undefined) {
                index = this.children.length - 1;
            }
            else {
                --index;
            }
            if (index < 0) {
                return;
            }
            this.select(index);
        }
    }
    Select.define("tx-select", Select);

    const style$2 = document.createElement("style");
    style$2.textContent = css `

:host(.tx-slider) {
    height: 14px;
    position: relative;
    width: 100%;
    display: inline-block;
}
:host(.tx-slider) > input {
    position: absolute;
    top: 4px;
    -webkit-appearance: none;
    width: 100%;
    height: 2px;
    border: none;
    background: var(--tx-gray-700); /* track */
    outline: none;
}

:host(.tx-slider) > input::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    border: 2px solid var(--tx-gray-700); /* knob border */
    border-radius: 50%;
    background: var(--tx-gray-75); /* inside knob */
    cursor: pointer;
    box-sizing: border-box;
}
:host(.tx-slider) > input::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border: 2px solid var(--tx-gray-700); /* knob border */
    border-radius: 50%;
    background: var(--tx-gray-75); /* inside knob */
    box-sizing: border-box;
}

/* focus ring */
:host(.tx-slider) > input:focus::-webkit-slider-thumb {
    outline: 2px solid;
    outline-color: var(--tx-outline-color);
    outline-offset: 2px;
}
:host(.tx-slider) > input:focus::-moz-range-thumb {
    outline: 2px solid;
    outline-color: var(--tx-outline-color);
    outline-offset: 2px;
}

:host(.tx-slider) > input::-moz-focus-outer {
    border: 0;
}

:host(.tx-slider) > input:hover {
    background: var(--tx-gray-800); /* track */
}
:host(.tx-slider) > input:hover::-webkit-slider-thumb {
    border: 2px solid var(--tx-gray-800); /* knob border */
}
:host(.tx-slider) > input:hover::-moz-range-thumb {
    border: 2px solid var(--tx-gray-800); /* knob border */
}

:host(.tx-slider) > input:disabled {
    background: var(--tx-gray-500); /* track */
}
:host(.tx-slider) > input:disabled::-webkit-slider-thumb {
    border: 2px solid var(--tx-gray-500); /* knob border */
}
:host(.tx-slider) > input:disabled::-moz-range-thumb {
    border: 2px solid var(--tx-gray-500); /* knob border */
}
`;

    class Slider extends ModelView {
        constructor(init) {
            super(init);
            this.input = document.createElement("input");
            this.input.type = "range";
            let view = this;
            this.input.oninput = () => {
                view.updateModel();
            };
            this.classList.add("tx-slider");
            this.attachShadow({ mode: 'open' });
            this.attachStyle(style$2);
            this.shadowRoot.appendChild(this.input);
        }
        updateModel() {
            if (this.model)
                this.model.value = Number.parseFloat(this.input.value);
        }
        updateView() {
            if (!this.model)
                return;
            if (this.model.step === undefined && this.model.min !== undefined && this.model.max !== undefined)
                this.input.step = `${(this.model.max - this.model.min) / 100}`;
            else
                this.input.step = String(this.model.step);
            this.input.min = String(this.model.min);
            this.input.max = String(this.model.max);
            this.input.value = String(this.model.value);
        }
    }
    Slider.define("tx-slider", Slider);

    class GenericTool extends View {
        static focusIn(view) {
            const viewParents = new Map();
            for (let parent = view.parentElement, distance = 0; parent !== null; parent = parent.parentElement, ++distance) {
                viewParents.set(parent, distance);
            }
            let closestToolDistance = Number.MAX_SAFE_INTEGER;
            let closestParent;
            let closestToolList = new Array();
            for (const tool of this.allTools.values()) {
                if (!tool.canHandle(view))
                    continue;
                for (let toolParent = tool.parentElement, depth = 0; toolParent !== null; toolParent = toolParent.parentElement, ++depth) {
                    const toolDistance = viewParents.get(toolParent);
                    if (toolDistance === undefined)
                        continue;
                    if (closestToolDistance < toolDistance)
                        continue;
                    if (closestToolDistance > toolDistance) {
                        closestToolList.length = 0;
                    }
                    closestToolDistance = toolDistance;
                    closestParent = toolParent;
                    closestToolList.push(tool);
                }
            }
            if (!closestParent) {
                return;
            }
            let closestTool;
            const viewIndex = GenericTool.getIndex(view, closestParent);
            let closestNextSiblingIndex = Number.MIN_SAFE_INTEGER;
            for (let tool of closestToolList) {
                const toolIndex = GenericTool.getIndex(tool, closestParent);
                if (toolIndex < viewIndex && toolIndex > closestNextSiblingIndex) {
                    closestNextSiblingIndex = toolIndex;
                    closestTool = tool;
                }
            }
            this.setActive(closestTool, view);
        }
        static getIndex(view, parent) {
            if (parent === undefined) {
                console.trace(`GenericTool.getIndex(${view}, ${parent})`);
            }
            let element = view;
            while (element.parentElement !== parent)
                element = element.parentElement;
            return Array.from(parent.childNodes).indexOf(element);
        }
        static setActive(tool, view) {
            if (this.activeTool)
                this.activeTool.deactivate();
            this.activeTool = tool;
            this.activeView = view;
            if (tool)
                tool.activate();
        }
        static focusOut(view) {
            if (this.activeView === view) {
                this.setActive(undefined, undefined);
            }
        }
        connectedCallback() {
            super.connectedCallback();
            GenericTool.allTools.add(this);
        }
        disconnectedCallback() {
            if (GenericTool.activeTool === this) {
                GenericTool.setActive(undefined, undefined);
            }
            GenericTool.allTools.delete(this);
            super.disconnectedCallback();
        }
    }
    GenericTool.allTools = new Set();
    window.addEventListener("focusin", (event) => {
        if (event.target instanceof GenericTool)
            return;
        if (event.relatedTarget instanceof View) {
            GenericTool.focusOut(event.relatedTarget);
        }
        if (event.target instanceof View) {
            GenericTool.focusIn(event.target);
        }
    });

    let toolbuttonStyle = document.createElement("style");
    toolbuttonStyle.textContent = `
:host {
    display: inline-block;
    overflow: hidden;
    box-sizing: border-box;
    border: 1px solid #e3dbdb;
    border-radius: 3px;
    background: #e3dbdb;
    width: 32px;
    height: 32px;
    margin: 0;
    padding: 0;
}

:host([selected]) {
    background: #ac9393;
}

:host([disabled]) {
    opacity: 0.5;
}

:host([disabled]) img {
    opacity: 0.5;
}

:host([checked][disabled]) {
}
`;
    class ToolButton extends ModelView {
        constructor(init) {
            super(init);
            if (!init) {
                init = {
                    value: this.getAttribute("value"),
                    img: this.getAttribute("img"),
                    disabled: this.hasAttribute("disabled")
                };
            }
            else {
                this.setAttribute("value", init.value);
                this.setAttribute("img", init.img);
                if (init.disabled === true)
                    this.setAttribute("disabled", "disabled");
            }
            this.onmousedown = (event) => {
                if (this.hasAttribute("disabled")) {
                    return;
                }
                this.focus();
                event.preventDefault();
                if (this.model !== undefined) {
                    this.model.stringValue = this.getValue();
                }
            };
            let img = document.createElement("img");
            img.src = init.img;
            this.attachShadow({ mode: 'open' });
            this.shadowRoot.appendChild(document.importNode(toolbuttonStyle, true));
            this.shadowRoot.appendChild(img);
        }
        getValue() {
            let value = this.getAttribute("value");
            if (value === null)
                throw Error("no value");
            return value;
        }
        connectedCallback() {
            super.connectedCallback();
            if (this.model === undefined)
                this.setAttribute("disabled", "");
        }
        updateView() {
            if (this.model === undefined) {
                this.setAttribute("disabled", "");
                this.removeAttribute("selected");
                return;
            }
            let value = this.getValue();
            if (this.model.isValidStringValue(value)) {
                this.removeAttribute("disabled");
            }
            else {
                this.setAttribute("disabled", "");
            }
            if (this.model.stringValue === value) {
                this.setAttribute("selected", "");
            }
            else {
                this.removeAttribute("selected");
            }
        }
    }
    ToolButton.define("tx-toolbutton", ToolButton);

    class SlotView extends ModelView {
        constructor() { super(); }
        updateView() {
            if (!this.model)
                return;
            let value = this.model.value === undefined ? "" : this.model.value;
            if (this.model instanceof HtmlModel)
                this.innerHTML = value;
            else
                this.innerText = value;
        }
    }
    SlotView.define("tx-slot", SlotView);

    class ToadIf extends ModelView {
        updateView() {
            if (this.model) {
                this.style.display = this.model.value ? "" : "none";
            }
        }
    }
    ToadIf.define("tx-if", ToadIf);

    const style$1 = document.createElement("style");
    style$1.textContent = css `
/*
  tabs, line, content
*/
:host(.tx-tabs) {
    position: relative;
    display: flex;
    flex-wrap: nowrap;
    box-sizing: border-box;
}
:host(.tx-tabs:not(.tx-vertical)) {
    flex-direction: column;
}
:host(.tx-tabs.tx-vertical) {
    flex-direction: row;
}

/*
 * tabs
 */
:host(.tx-tabs) > ul {
    display: flex;
    flex-wrap: nowrap;
    list-style: none;
    box-sizing: border-box;
    padding: 0;
    margin: 0;
}
:host(.tx-tabs:not(.tx-vertical)) > ul {
    flex-direction: row;
    border-bottom: 2px solid var(--tx-gray-200);
}
:host(.tx-tabs.tx-vertical) > ul {
    border-left: 2px solid var(--tx-gray-200);
    flex-direction: column;
}
:host(.tx-tabs) > ul > li {
    box-sizing: border-box;
    list-style: none;
}

/*
 * label
 */
:host(.tx-tabs) > ul > li > span {
    display: block;
    list-style: none;
    font-weight: 500;
    margin: 8px 12px 8px 12px;
    color: var(--tx-gray-700);
    cursor: pointer;
}
:host(.tx-tabs.tx-vertical) > ul > li > span {
    margin: 0;
    padding: 12px 8px 12px 8px;
}
:host(.tx-tabs) > ul > li > span.active {
    color: var(--tx-gray-900);
}
:host(.tx-tabs) > ul > li > span:hover {
    color: var(--tx-gray-900);
}

/*
 * line
 */
:host(.tx-tabs) > div.line {
    background-color: var(--tx-gray-900);
    pointer-events: none;
}
:host(.tx-tabs:not(.tx-vertical)) > div.line  {
    transition: left 0.5s ease-in-out, width 0.5s 0.10s;
    position: relative; /* below labels */
    top: 0px;
    height: 2px;
    left: 12px;
    width: 0px;
}
:host(.tx-tabs.tx-vertical) > div.line  {
    transition: top 0.5s ease-in-out, width 0.5s 0.10s;
    position: absolute; left: 0; /* before labels */
    height: 0px;
    width: 2px;
}

.content {
    flex-grow: 1;
}

`;

    class Tabs extends ModelView {
        constructor(init) {
            super(init);
            this.setTab = this.setTab.bind(this);
            this.classList.add("tx-tabs");
            if (this.hasAttribute("vertical")) {
                this.classList.add("tx-vertical");
            }
            this.content = div(slot());
            this.content.classList.add("content");
            const tabContainer = ul();
            for (let i = 0; i < this.children.length; ++i) {
                const child = this.children[i];
                if (child.nodeName !== "TX-TAB") {
                    console.log(`unexpected <${child.nodeName.toLowerCase()}> within <tabs>`);
                    continue;
                }
                const tab = child;
                let tabLabel;
                tabContainer.appendChild(li(tabLabel = span(text(tab.getAttribute("label")))));
                tabLabel.onpointerdown = (ev) => {
                    ev.stopPropagation();
                    ev.preventDefault();
                    ev.cancelBubble = true;
                    this.setTab(tabLabel, tab);
                };
                if (this.activeTab === undefined) {
                    this.activeTab = tabLabel;
                    this.activePanel = tab;
                }
                else {
                    tab.style.display = "none";
                }
            }
            this.attachShadow({ mode: 'open' });
            this.shadowRoot.appendChild(document.importNode(style$1, true));
            this.shadowRoot.appendChild(tabContainer);
            this.shadowRoot.appendChild(this.markerLine = div());
            this.shadowRoot.appendChild(this.content);
            this.markerLine.classList.add("line");
            if (this.activeTab) {
                this.setTab(this.activeTab, this.activePanel);
            }
        }
        setTab(tab, panel) {
            const line = this.markerLine;
            if (this.hasAttribute("vertical")) {
                line.style.top = `${tab.offsetTop}px`;
                line.style.height = `${tab.clientHeight}px`;
            }
            else {
                line.style.top = `-2px`;
                line.style.left = `${tab.offsetLeft}px`;
                line.style.width = `${tab.clientWidth}px`;
            }
            this.activeTab.classList.remove("active");
            this.activeTab = tab;
            this.activeTab.classList.add("active");
            this.activePanel.style.display = "none";
            this.activePanel = panel;
            this.activePanel.style.display = "";
            if (this.model && panel.value) {
                this.model.stringValue = panel.value;
            }
        }
    }
    Tabs.define("tx-tabs", Tabs);
    class Tab extends View {
        constructor(init) {
            super(init);
            this.label = init?.label;
            this.value = init?.value;
        }
    }
    View.define("tx-tab", Tab);

    const menuStyle = document.createElement("style");
    menuStyle.textContent = `
  :host(.menu-button) {
    font-family: var(--tx-font-family);
    font-size: var(--tx-edit-font-size);
    font-weight: var(--tx-edit-font-weight);
    padding: 7px;
    vertical-align: center;
  
    background: var(--tx-gray-200);
    color: var(--tx-gray-900);
    cursor: default;
  }
  :host(.menu-button:hover) {
    background: var(--tx-gray-300);
  }
  :host(.menu-button.active) {
    background: var(--tx-gray-400);
    color: var(--tx-gray-900);
  }
  :host(.menu-button.disabled) {
    color: var(--tx-gray-500);
  }
  :host(.menu-button.active.disabled) {
    color: var(--tx-gray-700);
  }
  :host(.menu-button.menu-down) {
    padding-right: 20px;
    background-image: url("data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" width="15" height="14"><path d="M 0 4 l 10 0 l -5 5 Z" fill="#fff" stroke="none"/></svg>')}");
    background-repeat: no-repeat;
    background-position: right center;
  }
  :host(.menu-button.active.menu-down) {
    background-image: url("data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" width="15" height="14"><path d="M 0 4 l 10 0 l -5 5 Z" fill="#fff" stroke="none"/></svg>')}");
    background-repeat: no-repeat;
    background-position: right center;
  }
  :host(.menu-button.menu-side) {
    padding-right: 20px;
    background-image: url("data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" width="15" height="14"><path d="M 0 2 l 0 10 l 5 -5 Z" fill="#fff" stroke="none"/></svg>')}");
    background-repeat: no-repeat;
    background-position: right center;
  }
  :host(.menu-button.active.menu-side) {
    background-image: url("data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" width="15" height="14"><path d="M 0 2 l 0 10 l 5 -5 Z" fill="#fff" stroke="none"/></svg>')}");
    background-repeat: no-repeat;
    background-position: right center;
  }
  .menu-bar {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    background-color: var(--tx-gray-200);
  }
  .menu-popup {
    position: fixed;
    display: flex;
    flex-direction: column;
    box-shadow: 2px 2px 5px var(--tx-gray-50);
  }
`;

    class MenuButton extends ModelView {
        constructor(master, node) {
            super();
            this.master = master;
            this.node = node;
            let menuButton = this;
            this.classList.add("menu-button");
            if (node.down) {
                if (master.vertical)
                    this.classList.add("menu-side");
                else
                    this.classList.add("menu-down");
            }
            this.updateView();
            this.onmousedown = (event) => {
                event.stopPropagation();
                let documentMouseUp = function (event) {
                    document.removeEventListener("mouseup", documentMouseUp, { capture: true });
                    event.preventDefault();
                    setTimeout(() => {
                        if (MenuButton.buttonDown)
                            menuButton.dispatchEvent(new MouseEvent("mouseup", event));
                    }, 0);
                };
                document.addEventListener("mouseup", documentMouseUp, { capture: true });
                MenuButton.buttonDown = true;
                if (!this.master)
                    throw Error("yikes");
                switch (this.master.state) {
                    case MenuState.WAIT:
                        this.master.state = MenuState.DOWN;
                        this.activate();
                        break;
                    case MenuState.UP_N_HOLD:
                        if (this.master.active !== this) {
                            this.master.state = MenuState.DOWN;
                            this.activate();
                        }
                        else {
                            this.master.state = MenuState.DOWN_N_HOLD;
                        }
                        break;
                    default:
                        throw Error("unexpected state " + this.master.state);
                }
                return false;
            };
            this.onmouseup = (event) => {
                event.stopPropagation();
                if (!MenuButton.buttonDown)
                    return;
                MenuButton.buttonDown = false;
                if (!this.master)
                    throw Error("yikes");
                if (!this.node)
                    throw Error("yikes");
                switch (this.master.state) {
                    case MenuState.DOWN:
                        if (this.node.isEnabled() && !this.node.down) {
                            this.trigger();
                            this.master.state = MenuState.WAIT;
                        }
                        else {
                            this.master.state = MenuState.UP_N_HOLD;
                            if (MenuButton.documentMouseDown) {
                                document.removeEventListener("mousedown", MenuButton.documentMouseDown, { capture: false });
                            }
                            MenuButton.documentMouseDown = function (event) {
                                if (MenuButton.documentMouseDown)
                                    document.removeEventListener("mousedown", MenuButton.documentMouseDown, { capture: false });
                                MenuButton.documentMouseDown = undefined;
                                let tagName = event.target.tagName;
                                if (tagName !== "TOAD-MENUBUTTON") {
                                    menuButton.collapse();
                                }
                            };
                            document.addEventListener("mousedown", MenuButton.documentMouseDown, { capture: false });
                        }
                        break;
                    case MenuState.DOWN_N_HOLD:
                    case MenuState.DOWN_N_OUTSIDE:
                        this.master.state = MenuState.WAIT;
                        this.deactivate();
                        this.collapse();
                        if (this.master.closeOnClose) ;
                        break;
                    case MenuState.DOWN_N_INSIDE_AGAIN:
                        this.trigger();
                        break;
                    default:
                        throw Error("unexpected state " + this.master.state);
                }
                return false;
            };
            this.onmouseout = (event) => {
                event.stopPropagation();
                if (!this.master)
                    throw Error("yikes");
                MenuButton.inside = undefined;
                switch (this.master.state) {
                    case MenuState.WAIT:
                    case MenuState.DOWN_N_OUTSIDE:
                    case MenuState.UP_N_HOLD:
                    case MenuState.DOWN_N_HOLD:
                        break;
                    case MenuState.DOWN:
                    case MenuState.DOWN_N_INSIDE_AGAIN:
                        this.master.state = MenuState.DOWN_N_OUTSIDE;
                        this.updateView();
                        break;
                    default:
                        throw Error("unexpected state");
                }
                return false;
            };
            this.onmouseover = (event) => {
                event.stopPropagation();
                if (!menuButton.master)
                    throw Error("yikes");
                MenuButton.inside = menuButton;
                switch (menuButton.master.state) {
                    case MenuState.WAIT:
                    case MenuState.UP_N_HOLD:
                    case MenuState.DOWN_N_OUTSIDE:
                    case MenuState.DOWN_N_HOLD:
                    case MenuState.DOWN:
                    case MenuState.DOWN_N_INSIDE_AGAIN:
                        if (!MenuButton.buttonDown)
                            break;
                        if (!this.master)
                            throw Error("yikes");
                        if (this.master.active)
                            this.master.active.deactivate();
                        this.master.state = MenuState.DOWN_N_INSIDE_AGAIN;
                        this.activate();
                        break;
                    default:
                        throw Error("unexpected state " + menuButton.master.state);
                }
                return false;
            };
            this.attachShadow({ mode: 'open' });
            if (!this.shadowRoot)
                throw Error("yikes");
            this.shadowRoot.appendChild(document.importNode(menuStyle, true));
            if (!this.node.modelId)
                this.shadowRoot.appendChild(document.createTextNode(node.label));
        }
        connectedCallback() {
            if (this.controller)
                return;
            if (this.node.down === undefined) {
                let actionId = this.node.title;
                for (let node = this.node.parent; node; node = node.parent) {
                    if (!node.title.length)
                        break;
                    actionId = node.title + "|" + actionId;
                }
                actionId = "A:" + actionId;
                globalController.registerView(actionId, this);
            }
            if (this.node.modelId !== undefined) {
                if (typeof this.node.modelId === "string") {
                    let modelId = "M:" + this.node.modelId;
                    globalController.registerView(modelId, this);
                }
                else {
                    this.setModel(this.node.modelId);
                }
            }
        }
        disconnectedCallback() {
            if (this.controller)
                this.controller.unregisterView(this);
        }
        setModel(model) {
            if (!model) {
                if (this.action)
                    this.action.modified.remove(this);
                this.model = undefined;
                this.action = undefined;
                this.updateView();
                return;
            }
            if (model instanceof Action) {
                this.action = model;
                this.action.modified.add(() => {
                    this.updateView();
                }, this);
            }
            else if (model instanceof TextModel) {
                this.model = model;
            }
            else {
                throw Error("unexpected model of type " + model.constructor.name);
            }
            this.updateView();
        }
        updateView() {
            if (this.model && this.model.value) {
                if (!this.shadowRoot)
                    throw Error("yikes");
                let span = document.createElement("span");
                if (this.model instanceof HtmlModel)
                    span.innerHTML = this.model.value;
                else
                    span.innerText = this.model.value;
                if (this.shadowRoot.children.length > 1)
                    this.shadowRoot.removeChild(this.shadowRoot.children[1]);
                if (this.shadowRoot.children.length > 1)
                    this.shadowRoot.insertBefore(span, this.shadowRoot.children[1]);
                else
                    this.shadowRoot.appendChild(span);
            }
            if (!this.master)
                throw Error("yikes");
            let active = false;
            if (this.master.active == this) {
                switch (this.master.state) {
                    case MenuState.DOWN:
                    case MenuState.UP_N_HOLD:
                    case MenuState.DOWN_N_HOLD:
                    case MenuState.DOWN_N_INSIDE_AGAIN:
                        active = true;
                        break;
                    case MenuState.DOWN_N_OUTSIDE:
                        if (!this.node)
                            throw Error("yikes");
                        active = this.node.down !== undefined && this.node.isEnabled();
                        break;
                }
            }
            this.classList.toggle("active", active);
            this.classList.toggle("disabled", !this.isEnabled());
        }
        isEnabled() {
            if (this.node.down !== undefined)
                return true;
            return this.action !== undefined && this.action.enabled;
        }
        trigger() {
            this.collapse();
            if (!this.action)
                return;
            this.action.trigger();
        }
        collapse() {
            if (!this.master)
                throw Error("yikes");
            if (this.master.parentButton)
                this.master.parentButton.collapse();
            else
                this.deactivate();
        }
        openPopup() {
            if (!this.node)
                return;
            if (!this.node.down)
                return;
            if (!this.shadowRoot)
                throw Error("yikes");
            if (!this.popup) {
                this.popup = new PopupMenu(this.node, this);
                this.shadowRoot.appendChild(this.popup);
            }
            else {
                this.popup.show();
            }
        }
        closePopup() {
            if (!this.popup)
                return;
            if (this.popup.active)
                this.popup.active.deactivate();
            this.popup.hide();
        }
        activate() {
            if (!this.master)
                throw Error("yikes");
            if (!this.node)
                throw Error("yikes");
            let oldActive = this.master.active;
            this.master.active = this;
            if (oldActive && oldActive !== this) {
                oldActive.closePopup();
                oldActive.updateView();
            }
            this.updateView();
            this.openPopup();
        }
        deactivate() {
            if (!this.master)
                throw Error("yikes");
            if (this.master.active !== this)
                return;
            this.master.active.closePopup();
            this.master.active = undefined;
            this.master.state = MenuState.WAIT;
            this.updateView();
        }
    }
    MenuButton.define("tx-menubutton", MenuButton);

    class MenuNode {
        constructor(title, label, shortcut, type, modelId) {
            this.title = title;
            this.label = label;
            this.shortcut = shortcut;
            this.type = type ? type : "entry";
            this.modelId = modelId;
        }
        isEnabled() {
            return true;
        }
        isAvailable() {
            return true;
        }
        createWindowAt(parent, parentView) {
            if (this.type == "spacer") {
                let span = document.createElement("span");
                span.style.flexGrow = "1";
                parentView.appendChild(span);
                return;
            }
            this.view = new MenuButton(parent, this);
            parentView.appendChild(this.view);
        }
        deleteWindow() {
        }
    }

    class Menu extends MenuButtonContainer {
        constructor(props) {
            super(props);
            this.config = props?.config;
            this.vertical = false;
            this.root = new MenuNode("", "", undefined, undefined);
        }
        connectedCallback() {
            super.connectedCallback();
            this.tabIndex = 0;
            if (this.config) {
                this.config2nodes(this.config, this.root);
                this.referenceActions();
                this.createShadowDOM();
                return;
            }
            if (this.children.length === 0) {
                this._observer = new MutationObserver((record, observer) => {
                    if (this._timer !== undefined)
                        clearTimeout(this._timer);
                    this._timer = window.setTimeout(() => {
                        this._timer = undefined;
                        this.layout2nodes(this.children, this.root);
                        this.referenceActions();
                        this.createShadowDOM();
                    }, 100);
                });
                this._observer.observe(this, {
                    childList: true,
                    subtree: true
                });
            }
            else {
                this.layout2nodes(this.children, this.root);
                this.referenceActions();
                this.createShadowDOM();
            }
        }
        layout2nodes(children, parent) {
            let node = parent.down;
            for (let child of children) {
                let newnode = undefined;
                switch (child.nodeName) {
                    case "TX-MENUSPACER":
                        newnode = new MenuNode("", "", "", "spacer");
                        break;
                    case "TX-MENUENTRY":
                        newnode = new MenuNode(attribute(child, "name"), attribute(child, "label"), attributeOrUndefined(child, "shortcut"), attributeOrUndefined(child, "type"), attributeOrUndefined(child, "model"));
                        break;
                }
                if (newnode) {
                    newnode.parent = parent;
                    if (!node)
                        parent.down = newnode;
                    else
                        node.next = newnode;
                    node = newnode;
                }
                if (!node)
                    throw Error("yikes");
                this.layout2nodes(child.children, node);
            }
        }
        config2nodes(config, parent) {
            let node = parent.down;
            for (let child of config) {
                let newnode = undefined;
                if (child.space === true) {
                    newnode = new MenuNode("", "", "", "spacer");
                }
                else {
                    newnode = new MenuNode(child.name, child.label, child.shortcut, child.type, child.model);
                }
                if (newnode) {
                    newnode.parent = parent;
                    if (!node)
                        parent.down = newnode;
                    else
                        node.next = newnode;
                    node = newnode;
                }
                if (!node)
                    throw Error("yikes");
                if (child.sub)
                    this.config2nodes(child.sub, node);
            }
        }
        referenceActions() {
        }
        findNode(str, parent) {
            let strpos = str.indexOf("|");
            let left = strpos == -1 ? str : str.substr(0, strpos);
            let right = strpos == -1 ? "" : str.substr(strpos + 1);
            if (!parent)
                parent = this.root;
            for (let n = parent.down; n; n = n.next) {
                if (n.title == left) {
                    if (!n.down) {
                        return n;
                    }
                    return this.findNode(right, n);
                }
            }
            return undefined;
        }
        createShadowDOM() {
            this.view = document.createElement("div");
            this.view.classList.add("menu-bar");
            let node = this.root.down;
            while (node) {
                if (node.isAvailable()) {
                    node.createWindowAt(this, this.view);
                }
                else {
                    node.deleteWindow();
                }
                node = node.next;
            }
            this.attachShadow({ mode: 'open' });
            this.shadowRoot.appendChild(document.importNode(menuStyle, true));
            this.shadowRoot.appendChild(this.view);
        }
    }
    Menu.define("tx-menu", Menu);

    class MenuSpacer extends HTMLElement {
    }
    View.define("tx-menuspacer", MenuSpacer);

    class TableModel extends Model {
        isEmpty() { return this.colCount === 0 && this.rowCount === 0; }
    }

    var TableEditMode;
    (function (TableEditMode) {
        TableEditMode[TableEditMode["EDIT_CELL"] = 0] = "EDIT_CELL";
        TableEditMode[TableEditMode["SELECT_CELL"] = 1] = "SELECT_CELL";
        TableEditMode[TableEditMode["SELECT_ROW"] = 2] = "SELECT_ROW";
    })(TableEditMode || (TableEditMode = {}));

    class TablePos {
        constructor(col, row) {
            this.col = col;
            this.row = row;
        }
        toString() {
            return `TablePos { col:${this.col}, row:${this.row}}`;
        }
    }

    class SelectionModel extends Model {
        constructor(mode = TableEditMode.EDIT_CELL) {
            super();
            this.mode = mode;
            this._value = new TablePos(0, 0);
        }
        set col(col) {
            if (this._value.col === col)
                return;
            this._value.col = col;
            this.modified.trigger();
        }
        get col() {
            return this._value.col;
        }
        set row(row) {
            if (this._value.row === row)
                return;
            this._value.row = row;
            this.modified.trigger();
        }
        get row() {
            return this._value.row;
        }
        set value(value) {
            if (this._value.col === value.col && this._value.row === value.row)
                return;
            this._value = value;
            this.modified.trigger();
        }
        get value() {
            return this._value;
        }
        toString() {
            return `SelectionModel {enabled: ${this._enabled}, mode: ${TableEditMode[this.mode]}, value: ${this._value}}`;
        }
    }

    class TypedTableModel extends TableModel {
        constructor(nodeClass, root) {
            super();
            this.nodeClass = nodeClass;
        }
    }

    var EditMode;
    (function (EditMode) {
        EditMode[EditMode["EDIT_ON_FOCUS"] = 0] = "EDIT_ON_FOCUS";
        EditMode[EditMode["EDIT_ON_ENTER"] = 1] = "EDIT_ON_ENTER";
    })(EditMode || (EditMode = {}));
    class TableAdapterConfig {
        constructor() {
            this.editMode = EditMode.EDIT_ON_FOCUS;
            this.seamless = false;
            this.expandColumn = false;
        }
    }
    class TableAdapter {
        constructor(model) {
            this.config = new TableAdapterConfig();
            this.model = model;
        }
        get colCount() {
            return this.model === undefined ? 0 : this.model.colCount;
        }
        get rowCount() {
            return this.model === undefined ? 0 : this.model.rowCount;
        }
        setModel(model) {
            this.model = model;
        }
        getColumnHead(col) { return undefined; }
        getRowHead(row) { return undefined; }
        showCell(pos, cell) { }
        editCell(pos, cell) { }
        saveCell(pos, cell) { }
        isViewCompact() { return false; }
        static register(adapter, model, data) {
            let typeToModel = TableAdapter.modelToAdapter.get(model);
            if (typeToModel === undefined) {
                typeToModel = new Map();
                TableAdapter.modelToAdapter.set(model, typeToModel);
            }
            if (data !== undefined) {
                if (typeToModel.has(data)) {
                    throw Error(`attempt to redefine existing table adapter`);
                }
                typeToModel.set(data, adapter);
            }
            else {
                if (typeToModel.has(null)) {
                    throw Error(`attempt to redefine existing table adapter`);
                }
                typeToModel.set(null, adapter);
            }
        }
        static unbind() {
            TableAdapter.modelToAdapter.clear();
        }
        static lookup(model) {
            let dataType;
            if (model instanceof TypedTableModel) {
                dataType = model.nodeClass;
            }
            else {
                dataType = null;
            }
            const typeToAdapter = TableAdapter.modelToAdapter.get(Object.getPrototypeOf(model).constructor);
            let adapter = typeToAdapter?.get(dataType);
            if (adapter === undefined) {
                for (let baseClass of TableAdapter.modelToAdapter.keys()) {
                    if (model instanceof baseClass) {
                        adapter = TableAdapter.modelToAdapter.get(baseClass)?.get(dataType);
                        break;
                    }
                }
            }
            if (adapter === undefined) {
                let msg = `TableAdapter.lookup(): Did not find an adapter for model of type ${model.constructor.name}`;
                msg += `\n    Requested adapter: model=${model.constructor.name}, type=${dataType?.name}\n    Available adapters:`;
                if (TableAdapter.modelToAdapter.size === 0) {
                    msg += " none.";
                }
                else {
                    for (const [modelX, typeToAdapterX] of TableAdapter.modelToAdapter) {
                        for (const [typeX, adapterX] of typeToAdapterX) {
                            msg += `\n        model=${modelX.name}`;
                            if (typeX !== undefined && typeX !== null) {
                                msg += `, type=${typeX.name}`;
                            }
                        }
                    }
                }
                throw Error(msg);
            }
            return adapter;
        }
    }
    TableAdapter.modelToAdapter = new Map();

    var TableEventType;
    (function (TableEventType) {
        TableEventType[TableEventType["INSERT_ROW"] = 0] = "INSERT_ROW";
        TableEventType[TableEventType["REMOVE_ROW"] = 1] = "REMOVE_ROW";
        TableEventType[TableEventType["INSERT_COL"] = 2] = "INSERT_COL";
        TableEventType[TableEventType["REMOVE_COL"] = 3] = "REMOVE_COL";
        TableEventType[TableEventType["CELL_CHANGED"] = 4] = "CELL_CHANGED";
        TableEventType[TableEventType["RESIZE_ROW"] = 5] = "RESIZE_ROW";
        TableEventType[TableEventType["RESIZE_COL"] = 6] = "RESIZE_COL";
        TableEventType[TableEventType["CHANGED"] = 7] = "CHANGED";
    })(TableEventType || (TableEventType = {}));

    class TableFriend {
        constructor(table) {
            this.table = table;
        }
        get adapter() {
            return this.table.adapter;
        }
        get measure() {
            return this.table.measure;
        }
        get staging() {
            return this.table.staging;
        }
        get body() {
            return this.table.body;
        }
        get splitBody() {
            return this.table.splitBody;
        }
        get colHeads() {
            return this.table.colHeads;
        }
        get rowHeads() {
            return this.table.rowHeads;
        }
        get colResizeHandles() {
            return this.table.colResizeHandles;
        }
        get rowResizeHandles() {
            return this.table.rowResizeHandles;
        }
        set animationDone(animationDone) {
            this.table.animationDone = animationDone;
        }
        get selection() {
            return this.table.selection;
        }
        get style() {
            return this.table.style;
        }
        clearAnimation() {
            this.table.animation = undefined;
        }
        calculateColumnWidths(withinBody = false) {
            return this.table.calculateColumnWidths(withinBody);
        }
        setColumnWidths(withinBody = false, columnWidths) {
            this.table.setColumnWidths(withinBody, columnWidths);
        }
    }

    class TableAnimation extends TableFriend {
        constructor(table) {
            super(table);
        }
        run() { }
        stop() { }
    }

    class InsertRowAnimation extends TableAnimation {
        constructor(table, event) {
            super(table);
            this.done = false;
            this.event = event;
            this.joinHorizontal = this.joinHorizontal.bind(this);
            this.initialRowCount = this.adapter.rowCount - event.size;
            InsertRowAnimation.current = this;
        }
        prepare() {
            this.prepareCellsToBeMeasured();
        }
        firstFrame() {
            this.arrangeNewRowsInStaging();
            this.splitHorizontal();
        }
        animationFrame(n) {
            const y = this.animationTop + n * this.animationHeight;
            this.splitBody.style.top = `${y}px`;
            this.mask.style.top = `${y}px`;
        }
        lastFrame() {
            const y = this.animationTop + this.animationHeight;
            this.splitBody.style.top = `${y}px`;
            this.mask.style.top = `${y}px`;
            this.joinHorizontal();
        }
        prepareCellsToBeMeasured() {
            for (let row = this.event.index; row < this.event.index + this.event.size; ++row) {
                for (let col = 0; col < this.adapter.colCount; ++col) {
                    const cell = this.table.createCell();
                    this.adapter.showCell({ col, row }, cell);
                    this.measure.appendChild(cell);
                }
            }
        }
        arrangeNewRowsInStaging() {
            const overlap = this.adapter.config.seamless ? 0 : 1;
            const splitRow = this.event.index;
            let idx = splitRow * this.adapter.colCount;
            let top = 0;
            if (this.body.children.length === 0) ;
            else if (idx < this.body.children.length) {
                let cell = this.body.children[idx];
                top = px2float(cell.style.top);
            }
            else {
                let cell = this.body.children[this.body.children.length - 1];
                let b = cell.getBoundingClientRect();
                top = px2float(cell.style.top) + b.height - overlap;
            }
            this.totalHeight = 0;
            let colWidth = new Array(this.adapter.colCount);
            if (this.body.children.length !== 0) {
                for (let col = 0; col < this.adapter.colCount; ++col) {
                    const cell = this.body.children[col];
                    const bounds = cell.getBoundingClientRect();
                    colWidth[col] = bounds.width;
                    if (this.adapter.config.seamless) {
                        colWidth[col] += 2;
                    }
                }
            }
            else {
                colWidth.fill(this.table.minCellWidth);
            }
            let rowHeight = new Array(this.event.size);
            rowHeight.fill(this.table.minCellHeight);
            idx = 0;
            for (let row = 0; row < this.event.size; ++row) {
                for (let col = 0; col < this.adapter.colCount; ++col) {
                    const cell = this.measure.children[idx++];
                    const bounds = cell.getBoundingClientRect();
                    if (this.adapter.config.expandColumn) {
                        colWidth[col] = Math.ceil(Math.max(colWidth[col], bounds.width));
                    }
                    else {
                        if (row === 0 && this.body.children.length === 0) {
                            colWidth[col] = Math.ceil(bounds.width);
                        }
                    }
                    rowHeight[row] = Math.max(rowHeight[row], bounds.height);
                }
                this.totalHeight += rowHeight[row] - overlap;
            }
            if (this.adapter.config.expandColumn) {
                idx = 0;
                let x = 0;
                let col = 0;
                while (idx < this.body.children.length) {
                    const cell = this.body.children[idx];
                    cell.style.left = `${x}px`;
                    cell.style.width = `${colWidth[col] - this.table.WIDTH_ADJUST}px`;
                    x += colWidth[col] - overlap;
                    if (this.adapter.config.seamless) {
                        x -= 2;
                    }
                    ++col;
                    ++idx;
                    if (col >= this.adapter.colCount) {
                        x = 0;
                        col = 0;
                    }
                }
            }
            this.totalHeight += overlap;
            if (this.adapter.config.seamless) {
                this.totalHeight -= 2 * this.event.size;
            }
            let y = top;
            for (let row = 0; row < this.event.size; ++row) {
                let x = 0;
                for (let col = 0; col < this.adapter.colCount; ++col) {
                    const cell = this.measure.children[0];
                    cell.style.left = `${x}px`;
                    cell.style.top = `${y}px`;
                    cell.style.width = `${colWidth[col] - this.table.WIDTH_ADJUST}px`;
                    cell.style.height = `${rowHeight[row] - this.table.HEIGHT_ADJUST}px`;
                    this.staging.appendChild(cell);
                    x += colWidth[col] - overlap;
                    if (this.adapter.config.seamless) {
                        x -= 2;
                    }
                }
                y += rowHeight[row] - overlap;
                if (this.adapter.config.seamless) {
                    y -= 2;
                }
            }
            this.mask = span();
            this.mask.style.boxSizing = `content-box`;
            this.mask.style.left = `0`;
            this.mask.style.right = `0`;
            this.mask.style.top = `${top}px`;
            this.mask.style.border = 'none';
            this.mask.style.transitionProperty = "transform";
            this.mask.style.transitionDuration = Table.transitionDuration;
            this.mask.style.height = `${this.totalHeight}px`;
            this.mask.style.backgroundColor = Table.maskColor;
            this.staging.appendChild(this.mask);
        }
        splitHorizontal() {
            this.table.splitHorizontalNew(this.event.index);
            this.animationHeight = this.totalHeight;
            if (this.initialRowCount !== 0) {
                const overlap = this.adapter.config.seamless ? 0 : 1;
                this.animationHeight -= overlap;
            }
            this.animationTop = px2float(this.splitBody.style.top);
        }
        joinHorizontal() {
            if (!this.done) {
                this.done = true;
                this.staging.removeChild(this.mask);
                this.body.removeChild(this.splitBody);
                while (this.staging.children.length > 0) {
                    this.body.appendChild(this.staging.children[0]);
                }
                if (this.splitBody.children.length > 0) {
                    let top = px2float(this.splitBody.style.top);
                    while (this.splitBody.children.length > 0) {
                        const cell = this.splitBody.children[0];
                        cell.style.top = `${px2float(cell.style.top) + top}px`;
                        this.body.appendChild(cell);
                    }
                }
                if (this.table.animationDone) {
                    this.table.animationDone();
                }
            }
        }
    }

    class RemoveRowAnimation extends TableAnimation {
        constructor(table, event) {
            super(table);
            this.event = event;
            this.joinHorizontal = this.joinHorizontal.bind(this);
            if (this.body.children.length === 0) {
                this.initialHeight = 0;
            }
            else {
                const cell = this.body.children[this.body.children.length - 1];
                const top = px2float(cell.style.top);
                const bounds = cell.getBoundingClientRect();
                this.initialHeight = top + bounds.height;
            }
            this.overlap = this.adapter.config.seamless ? 0 : 1;
            this.removeAll = this.event.index >= this.adapter.rowCount;
            RemoveRowAnimation.current = this;
        }
        prepare() {
            this.arrangeRowsInStaging();
            this.splitHorizontal();
        }
        firstFrame() { }
        animationFrame(n) {
            this.splitBody.style.top = `${this.topSplitBody - n * this.animationHeight}px`;
            this.mask.style.top = `${this.topMask - n * this.animationHeight}px`;
        }
        lastFrame() {
            this.joinHorizontal();
        }
        arrangeRowsInStaging() {
            const idx = this.event.index * this.adapter.colCount;
            const cellCount = this.event.size * this.adapter.colCount;
            const start = px2float(this.body.children[idx].style.top);
            for (let i = 0; i < cellCount; ++i) {
                this.staging.appendChild(this.body.children[idx]);
            }
            let bottomOfStaging;
            if (idx < this.body.children.length) {
                bottomOfStaging = px2float(this.body.children[idx].style.top);
            }
            else {
                const cell = this.staging.children[this.staging.children.length - 1];
                bottomOfStaging = px2float(cell.style.top) + px2float(cell.style.height) + this.table.HEIGHT_ADJUST;
            }
            this.animationHeight = bottomOfStaging - start;
            this.mask = span();
            this.mask.style.boxSizing = `content-box`;
            this.mask.style.left = `0`;
            this.mask.style.right = `0`;
            this.mask.style.top = `${bottomOfStaging}px`;
            this.mask.style.border = 'none';
            this.mask.style.transitionProperty = "transform";
            this.mask.style.transitionDuration = Table.transitionDuration;
            this.mask.style.height = `${this.animationHeight}px`;
            this.mask.style.backgroundColor = Table.maskColor;
            this.staging.appendChild(this.mask);
        }
        splitHorizontal() {
            this.table.splitHorizontalNew(this.event.index);
            const top = px2float(this.splitBody.style.top);
            this.splitBody.style.height = `${this.initialHeight - top}px`;
            this.topSplitBody = top;
            this.topMask = px2float(this.mask.style.top);
        }
        joinHorizontal() {
            this.staging.removeChild(this.mask);
            this.body.removeChild(this.splitBody);
            this.staging.replaceChildren();
            this.moveSplitBodyToBody();
            if (this.table.animationDone) {
                this.table.animationDone();
            }
        }
        moveSplitBodyToBody() {
            if (this.splitBody.children.length === 0) {
                return;
            }
            let top = px2float(this.splitBody.style.top);
            while (this.splitBody.children.length > 0) {
                const cell = this.splitBody.children[0];
                cell.style.top = `${px2float(cell.style.top) + top}px`;
                this.body.appendChild(cell);
            }
        }
    }

    class InsertColumnAnimation extends TableAnimation {
        constructor(table, event) {
            super(table);
            this.done = false;
            this.event = event;
            this.joinVertical = this.joinVertical.bind(this);
            this.colCount = this.adapter.colCount;
            this.rowCount = this.adapter.rowCount;
        }
        prepare() { }
        firstFrame() { }
        animationFrame(value) { }
        lastFrame() { }
        run() {
            this.prepareCells();
            setTimeout(() => {
                this.arrangeMeasuredColumnsInGrid();
                this.splitVertical(this.event.index + this.event.size);
                this.splitBody.style.transitionProperty = "transform";
                this.splitBody.style.transitionDuration = Table.transitionDuration;
                this.splitBody.ontransitionend = this.joinVertical;
                this.splitBody.ontransitioncancel = this.joinVertical;
                setTimeout(() => {
                    this.splitBody.style.transform = `translateX(${this.totalWidth}px)`;
                }, Table.renderDelay);
            });
        }
        stop() {
            this.joinVertical();
            this.clearAnimation();
        }
        splitVertical(splitColumn, extra = 0) {
            this.table.splitVertical(splitColumn, extra);
        }
        joinVertical() {
            if (!this.done) {
                this.done = true;
                this.table.joinVertical(this.event.index + this.event.size, this.totalWidth, 0, this.colCount, this.rowCount);
                if (this.table.animationDone) {
                    this.table.animationDone();
                }
            }
        }
        prepareCells() {
            for (let row = 0; row < this.rowCount; ++row) {
                for (let col = this.event.index; col < this.event.index + this.event.size; ++col) {
                    const cell = span();
                    this.adapter.showCell({ col, row }, cell);
                    this.measure.appendChild(cell);
                }
            }
        }
        arrangeMeasuredColumnsInGrid() {
            let idx = this.event.index;
            let x;
            if (idx < this.colCount - 1) {
                let cell = this.body.children[idx];
                x = px2int(cell.style.left);
            }
            else {
                if (this.body.children.length === 0) {
                    x = 0;
                }
                else {
                    const cell = this.body.children[this.colCount - 2];
                    cell.getBoundingClientRect();
                    x = px2int(cell.style.left) + px2int(cell.style.width) + 6 - 1;
                }
            }
            let totalWidth = 0;
            for (let col = this.event.index; col < this.event.index + this.event.size; ++col) {
                let columnWidth = this.table.minCellHeight;
                for (let row = 0; row < this.rowCount; ++row) {
                    const child = this.measure.children[row];
                    const bounds = child.getBoundingClientRect();
                    columnWidth = Math.max(columnWidth, bounds.width);
                }
                columnWidth = Math.ceil(columnWidth - 2);
                if (this.colHeads) {
                    const newColHead = span(this.adapter.getColumnHead(col));
                    newColHead.className = "head";
                    newColHead.style.left = `${x}px`;
                    newColHead.style.top = "0px";
                    newColHead.style.width = `${columnWidth - 5}px`;
                    newColHead.style.height = `${px2int(this.colHeads.style.height) - 2}px`;
                    this.colHeads.insertBefore(newColHead, this.colHeads.children[col]);
                    const newRowHandle = this.table.createHandle(col, x + columnWidth - 3, 0, 5, px2float(this.colHeads.style.height));
                    this.colResizeHandles.insertBefore(newRowHandle, this.colResizeHandles.children[col]);
                    for (let subsequentCol = col + 1; subsequentCol < this.colCount; ++subsequentCol) {
                        this.colHeads.children[subsequentCol].replaceChildren(this.adapter.getColumnHead(subsequentCol));
                        this.colResizeHandles.children[subsequentCol].dataset["idx"] = `${subsequentCol}`;
                    }
                }
                for (let row = 0; row < this.rowCount; ++row) {
                    const child = this.measure.children[0];
                    child.style.left = `${x}px`;
                    child.style.top = this.body.children[row * this.colCount].style.top;
                    child.style.width = `${columnWidth - 5}px`;
                    child.style.height = this.body.children[row * this.colCount].style.height;
                    let beforeChild;
                    if (idx < this.body.children.length) {
                        beforeChild = this.body.children[idx];
                    }
                    else {
                        beforeChild = null;
                    }
                    this.body.insertBefore(child, beforeChild);
                    idx += this.colCount;
                }
                x += columnWidth;
                totalWidth += columnWidth;
            }
            this.totalWidth = totalWidth;
        }
    }

    class RemoveColumnAnimation extends TableAnimation {
        constructor(table, event) {
            super(table);
            this.done = false;
            this.event = event;
            this.joinVertical = this.joinVertical.bind(this);
            this.colCount = this.adapter.colCount;
            this.rowCount = this.adapter.rowCount;
        }
        prepare() { }
        firstFrame() { }
        animationFrame(value) { }
        lastFrame() { }
        run() {
            let totalWidth = 0;
            for (let col = this.event.index; col < this.event.index + this.event.size; ++col) {
                const cell = this.body.children[col];
                totalWidth += Math.ceil(px2float(cell.style.width) + 5);
            }
            this.totalWidth = totalWidth;
            let allSelected = this.body.querySelectorAll(".selected");
            for (let selected of allSelected) {
                selected.classList.remove("selected");
            }
            this.splitVertical(this.event.index + this.event.size, this.event.size);
            this.splitBody.style.transitionProperty = "transform";
            this.splitBody.style.transitionDuration = Table.transitionDuration;
            this.splitBody.ontransitionend = this.joinVertical;
            this.splitBody.ontransitioncancel = this.joinVertical;
            setTimeout(() => {
                this.splitBody.style.transform = `translateX(${-this.totalWidth}px)`;
            }, Table.renderDelay);
        }
        stop() {
            this.joinVertical();
            this.clearAnimation();
        }
        splitVertical(splitColumn, extra = 0) {
            this.table.splitVertical(splitColumn, extra);
        }
        joinVertical() {
            if (!this.done) {
                this.done = true;
                let idx = this.event.index;
                for (let row = 0; row < this.rowCount; ++row) {
                    for (let col = 0; col < this.event.size; ++col) {
                        this.body.children[idx];
                        this.body.removeChild(this.body.children[idx]);
                    }
                    idx += this.event.index - this.event.size + 1;
                }
                this.table.joinVertical(this.event.index + this.event.size, -this.totalWidth, this.event.size, this.colCount, this.rowCount);
                if (this.colHeads) {
                    for (let col = 0; col < this.event.size; ++col) {
                        this.colHeads.removeChild(this.colHeads.children[this.event.index]);
                        this.colResizeHandles.removeChild(this.colResizeHandles.children[this.event.index]);
                    }
                    for (let subsequentColumn = this.event.index; subsequentColumn < this.colCount; ++subsequentColumn) {
                        this.colHeads.children[subsequentColumn].replaceChildren(this.adapter.getColumnHead(subsequentColumn));
                        this.colResizeHandles.children[subsequentColumn].dataset["idx"] = `${subsequentColumn}`;
                    }
                }
                if (this.table.animationDone) {
                    this.table.animationDone();
                }
            }
        }
    }

    let animationFrameCount = 468;
    function scrollIntoView(element) {
        if (element === undefined)
            return;
        const scrollableParent = findScrollableParent(element);
        if (scrollableParent === undefined)
            return;
        const parentRect = scrollableParent.getBoundingClientRect();
        const clientRect = element.getBoundingClientRect();
        if (scrollableParent !== document.body) {
            const { x, y } = calculateScrollGoal(scrollableParent, parentRect, clientRect);
            smoothScroll(scrollableParent, x, y);
            if (window.getComputedStyle(scrollableParent).position !== 'fixed') {
                window.scrollBy({
                    left: parentRect.left,
                    top: parentRect.top,
                    behavior: 'smooth'
                });
            }
        }
        else {
            window.scrollBy({
                left: clientRect.left,
                top: clientRect.top,
                behavior: 'smooth'
            });
        }
    }
    function calculateScrollGoal(scrollableParent, parentRect, clientRect) {
        const GAP = 16;
        const clientLeft = clientRect.left + scrollableParent.scrollLeft - parentRect.left - GAP;
        const clientRight = clientRect.right + scrollableParent.scrollLeft - parentRect.left + GAP;
        const clientTop = clientRect.top + scrollableParent.scrollTop - parentRect.top - GAP;
        const clientBottom = clientRect.bottom + scrollableParent.scrollTop - parentRect.top + GAP;
        const parentWidth = scrollableParent.clientWidth;
        const parentHeight = scrollableParent.clientHeight;
        var x = scrollableParent.scrollLeft;
        var y = scrollableParent.scrollTop;
        if (clientRight - clientLeft - 2 * GAP > parentWidth)
            x = clientLeft;
        else if (clientRight > scrollableParent.scrollLeft + parentWidth)
            x = clientRight - parentWidth;
        else if (clientLeft < scrollableParent.scrollLeft)
            x = clientLeft;
        if (clientBottom - clientTop - 2 * GAP > parentHeight)
            y = clientTop;
        else if (clientBottom > scrollableParent.scrollTop + parentHeight)
            y = clientBottom - parentHeight;
        else if (clientTop < scrollableParent.scrollTop)
            y = clientTop;
        x = Math.max(0, x);
        y = Math.max(0, y);
        return { x, y };
    }
    const concurrentScroll = new Map();
    function smoothScroll(scrollable, x, y) {
        let activeGoal = concurrentScroll.get(scrollable);
        if (activeGoal === undefined) {
            activeGoal = { x: x, y: y };
            concurrentScroll.set(scrollable, activeGoal);
        }
        else {
            activeGoal.x = x;
            activeGoal.y = y;
        }
        let startX, startY;
        if (scrollable === document.body) {
            startX = window.scrollX || window.pageXOffset;
            startY = window.scrollY || window.pageYOffset;
        }
        else {
            startX = scrollable.scrollLeft;
            startY = scrollable.scrollTop;
        }
        const deltaX = x - startX;
        const deltaY = y - startY;
        if (deltaX === 0 && deltaY === 0) {
            concurrentScroll.delete(scrollable);
            return;
        }
        animate((value) => {
            if (activeGoal.x !== x || activeGoal.y !== y) {
                return false;
            }
            const nx = startX + value * deltaX;
            const ny = startY + value * deltaY;
            if (scrollable === document.body) {
                window.scrollTo(nx, ny);
            }
            else {
                scrollable.scrollLeft = nx;
                scrollable.scrollTop = ny;
            }
            if (value === 1) {
                concurrentScroll.delete(scrollable);
            }
            return true;
        });
    }
    let idSource = 0;
    function animate(callback) {
        setTimeout(() => { window.requestAnimationFrame(animateStep.bind(window, callback, undefined, undefined)); }, 0);
    }
    function animateStep(callback, startTime, id) {
        if (startTime === undefined) {
            startTime = Date.now();
            id = ++idSource;
        }
        const time = Date.now();
        let elapsed = (time - startTime) / animationFrameCount ;
        elapsed = elapsed > 1 ? 1 : elapsed;
        const value = ease(elapsed);
        if (callback(value) === false)
            return;
        if (value < 1.0) {
            window.requestAnimationFrame(animateStep.bind(window, callback, startTime, id));
        }
    }
    function ease(k) {
        return 0.5 * (1 - Math.cos(Math.PI * k));
    }
    var ROUNDING_TOLERANCE = isMicrosoftBrowser(window.navigator.userAgent) ? 1 : 0;
    function isMicrosoftBrowser(userAgent) {
        const userAgentPatterns = ['MSIE ', 'Trident/', 'Edge/'];
        return new RegExp(userAgentPatterns.join('|')).test(userAgent);
    }
    function findScrollableParent(el) {
        while (el !== document.body && isScrollable(el) === false) {
            if (el.parentElement === null)
                return undefined;
            el = el.parentElement;
        }
        return el;
    }
    function isScrollable(el) {
        const isScrollableY = hasScrollableSpace(el, "Y") && canOverflow(el, "Y");
        const isScrollableX = hasScrollableSpace(el, "X") && canOverflow(el, "X");
        return isScrollableY || isScrollableX;
    }
    function hasScrollableSpace(el, axis) {
        if (axis === 'X')
            return el.clientWidth + ROUNDING_TOLERANCE < el.scrollWidth;
        else
            return el.clientHeight + ROUNDING_TOLERANCE < el.scrollHeight;
    }
    function canOverflow(el, axis) {
        const style = window.getComputedStyle(el, null);
        const overflowValue = style['overflow' + axis];
        return overflowValue === 'auto' || overflowValue === 'scroll';
    }

    const style = document.createElement("style");
    style.textContent = css `
:host {
    position: relative;
    display: inline-block;
    border: 1px solid var(--tx-gray-300);
    border-radius: 3px;
    /* outline-offset: -2px; */
    outline: none;
    font-family: var(--tx-font-family);
    font-size: var(--tx-font-size);
    background: #1e1e1e;

    /* not sure about these */
    /*
    width: 100%;
    width: -moz-available;
    width: -webkit-fill-available;
    width: fill-available;
    height: 100%;
    height: -moz-available;
    height: -webkit-fill-available;
    height: fill-available;
    */

    min-height: 50px;
    min-width: 50px;
}

.staging, .body, .splitBody, .cols, .rows {
    position: absolute;
}

.cols {
    right: 0;
    top: 0;
}

.rows {
    left: 0;
    bottom: 0;
}

.staging {
    overflow: hidden;
    inset: 0;
}

.body {
    overflow: auto;
    inset: 0;
}

.cols, .rows {
    overflow: hidden;
}

/*
::-webkit-scrollbar the scrollbar.
::-webkit-scrollbar-button the buttons on the scrollbar (arrows pointing upwards and downwards).
::-webkit-scrollbar-thumb the draggable scrolling handle.
::-webkit-scrollbar-track the track (progress bar) of the scrollbar.
::-webkit-scrollbar-track-piece the track (progress bar) NOT covered by the handle.
::-webkit-scrollbar-corner the bottom corner of the scrollbar, where both horizontal and vertical scrollbars meet.
::-webkit-resizer the draggable resizing handle that appears at the bottom corner of some elements.
*/

/* TODO: this doesn't support all browsers */
.body::-webkit-scrollbar {
    width: 10px;
    height: 10px;
}
.body::-webkit-scrollbar-thumb {
    border-radius: 5px;
}
.body::-webkit-scrollbar-track {
    background: #1e1e1e;
}
.body::-webkit-scrollbar-corner {
    background: #1e1e1e;
}
.body::-webkit-scrollbar-thumb {
    background: var(--tx-gray-500);
}

.body > span,
.splitBody > span,
.cols > span,
.rows > span,
.measure > span,
.staging > span {
    position: absolute;
    box-sizing: content-box;
    white-space: nowrap;
    outline: none;
    border: solid 1px var(--tx-gray-200);
    padding: 0 2px 0 2px;
    margin: 0;
    background-color: #080808; 
    font-weight: 400;
    overflow: hidden;
    cursor: default;
    caret-color: transparent;
}

.seamless > .body > span,
.seamless > .body > .splitBody > span,
.seamless > .cols > span,
.seamless > .rows > span,
.seamless > .measure > span,
.seamless > .staging > span {
    border: none 0px;
}

/* .splitBody {
    transition: transform 5s;
} */

.body > span:hover {
    background: #1a1a1a;
}

.body > span.error, .splitBody > span.error {
    border-color: var(--tx-global-red-600);
    z-index: 1;
}

.body > span:focus, .splitBody > span:focus {
    background: #0e2035;
    border-color: #2680eb;
    z-index: 2;
}

.body > span:focus:hover {
    background: #112d4d;
}

.body > span.error, .splitBody > span.error {
    background-color: #522426;
}

.body > span.error:hover {
    background: #401111;
}

.cols > span.handle, .rows > span.handle {
    padding: 0;
    border: 0 none;
    opacity: 0;
    background-color: #08f;
}

.cols > span.handle {
    cursor: col-resize;
}
.rows > span.handle {
    cursor: row-resize;
}

.cols > span.head, .rows > span.head, .measure > span.head {
    background: #1e1e1e;
    font-weight: 600;
}

.cols > span {
    text-align: center;
}

.measure {
    position: absolute;
    opacity: 0;
}

.body > span.edit, .splitBody > span.edit {
    caret-color: currentcolor;
}
`;

    function px2int(s) {
        return parseInt(s.substring(0, s.length - 2));
    }
    function px2float(s) {
        return parseFloat(s.substring(0, s.length - 2));
    }
    function isVisible(e) {
        if (window.getComputedStyle(e).display === "none") {
            return false;
        }
        if (e.parentElement) {
            return isVisible(e.parentElement);
        }
        return true;
    }
    class Table extends View {
        constructor(props) {
            super();
            this.WIDTH_ADJUST = 6;
            this.HEIGHT_ADJUST = 2;
            this.visible = false;
            this.minCellHeight = 0;
            this.minCellWidth = 80;
            this.animator = new Animator();
            this.arrangeAllMeasuredInGrid = this.arrangeAllMeasuredInGrid.bind(this);
            this.hostKeyDown = this.hostKeyDown.bind(this);
            this.cellKeyDown = this.cellKeyDown.bind(this);
            this.cellFocus = this.cellFocus.bind(this);
            this.focusIn = this.focusIn.bind(this);
            this.focusOut = this.focusOut.bind(this);
            this.pointerDown = this.pointerDown.bind(this);
            this.handleDown = this.handleDown.bind(this);
            this.handleMove = this.handleMove.bind(this);
            this.handleUp = this.handleUp.bind(this);
            this.setHeadingFillerSizeToScrollbarSize = this.setHeadingFillerSizeToScrollbarSize.bind(this);
            this.selectionChanged = this.selectionChanged.bind(this);
            this.modelChanged = this.modelChanged.bind(this);
            this.root = div(this.staging = div(), this.body = div());
            this.root.className = "root";
            this.staging.className = "staging";
            this.body.className = "body";
            this.measure = div();
            this.measure.classList.add("measure");
            this.onkeydown = this.hostKeyDown;
            this.addEventListener("focusin", this.focusIn);
            this.addEventListener("focusout", this.focusOut);
            this.body.onresize = this.setHeadingFillerSizeToScrollbarSize;
            this.body.onscroll = () => {
                this.staging.style.top = `${-this.body.scrollTop}px`;
                this.staging.style.left = `${-this.body.scrollLeft}px`;
                this.setHeadingFillerSizeToScrollbarSize();
                if (this.colHeads) {
                    this.colHeads.scrollLeft = this.body.scrollLeft;
                    this.colResizeHandles.scrollLeft = this.body.scrollLeft;
                }
                if (this.rowHeads) {
                    this.rowHeads.scrollTop = this.body.scrollTop;
                    this.rowResizeHandles.scrollTop = this.body.scrollTop;
                }
            };
            this.body.onpointerdown = this.pointerDown;
            this.attachShadow({ mode: 'open', delegatesFocus: true });
            this.attachStyle(style);
            this.shadowRoot.appendChild(this.root);
            this.shadowRoot.appendChild(this.measure);
            if (props) {
                setInitialProperties(this, props);
                if (props.selectionModel)
                    this.setModel(props.selectionModel);
            }
            if (Table.observer === undefined) {
                Table.observer = new MutationObserver((mutations, observer) => {
                    Table.allTables.forEach(table => {
                        if (table.visible === false) {
                            table.prepareCells();
                        }
                    });
                });
                Table.observer.observe(document.body, {
                    attributes: true,
                    subtree: true
                });
            }
        }
        connectedCallback() {
            Table.allTables.add(this);
            super.connectedCallback();
            if (this.selection === undefined) {
                this.selection = new SelectionModel(TableEditMode.SELECT_CELL);
                this.selection.modified.add(this.selectionChanged, this);
            }
        }
        disconnectedCallback() {
            Table.allTables.delete(this);
        }
        hostKeyDown(ev) {
            if (!this.selection)
                return;
            switch (this.selection.mode) {
                case TableEditMode.SELECT_CELL:
                    {
                        let pos = { col: this.selection.col, row: this.selection.row };
                        switch (ev.key) {
                            case "ArrowRight":
                                if (this.editing === undefined && pos.col + 1 < this.adapter.colCount) {
                                    ++pos.col;
                                    ev.preventDefault();
                                    ev.stopPropagation();
                                }
                                break;
                            case "ArrowLeft":
                                if (this.editing === undefined && pos.col > 0) {
                                    --pos.col;
                                    ev.preventDefault();
                                    ev.stopPropagation();
                                }
                                break;
                            case "ArrowDown":
                                if (pos.row + 1 < this.adapter.rowCount) {
                                    ++pos.row;
                                    ev.preventDefault();
                                    ev.stopPropagation();
                                }
                                break;
                            case "ArrowUp":
                                if (pos.row > 0) {
                                    --pos.row;
                                    ev.preventDefault();
                                    ev.stopPropagation();
                                }
                                break;
                            case "Enter":
                                if (this.adapter?.config.editMode !== EditMode.EDIT_ON_ENTER) {
                                    break;
                                }
                                if (this.editing === undefined) {
                                    this.editCell();
                                }
                                else {
                                    this.saveCell();
                                    if (pos.row + 1 < this.adapter.rowCount) {
                                        ++pos.row;
                                        this.selection.value = pos;
                                        this.editCell();
                                    }
                                }
                                ev.preventDefault();
                                ev.stopPropagation();
                                break;
                        }
                        this.selection.value = pos;
                    }
                    break;
            }
        }
        cellKeyDown(ev) {
            const cell = ev.target;
            if (ev.key === "Enter") {
                this.hostKeyDown(ev);
                ev.preventDefault();
                return;
            }
            if (!cell.classList.contains("edit") && this.editing === undefined) {
                switch (ev.key) {
                    case "ArrowDown":
                    case "ArrowUp":
                    case "ArrowRight":
                    case "ArrowLeft":
                    case "Tab":
                    case "Enter":
                        break;
                    default:
                        ev.preventDefault();
                }
            }
        }
        cellFocus(event) {
            const cell = event.target;
            if (cell instanceof HTMLElement) {
                const b = cell.getBoundingClientRect();
                const p = this.clientPosToTablePos(b.x + b.width / 2, b.y + b.height / 2);
                if (p !== undefined) {
                    this.selection.value = p;
                }
            }
        }
        focusIn(event) {
        }
        focusOut(ev) {
        }
        editCell() {
            const col = this.selection.value.col;
            const row = this.selection.value.row;
            const cell = this.body.children[col + row * this.adapter.colCount];
            this.editing = new TablePos(col, row);
            cell.classList.add("edit");
            this.adapter.editCell(this.editing, cell);
        }
        saveCell() {
            if (this.editing === undefined) {
                return;
            }
            const col = this.editing.col;
            const row = this.editing.row;
            const cell = this.body.children[col + row * this.adapter.colCount];
            cell.classList.remove("edit");
            this.adapter.saveCell(this.editing, cell);
            this.editing = undefined;
            this.focus();
        }
        pointerDown(ev) {
        }
        getModel() {
            return this.model;
        }
        setModel(model) {
            if (model === undefined) {
                if (this.selection) {
                    this.selection.modified.remove(this);
                }
                this.model = undefined;
                this.selection = new SelectionModel();
                this.selection.modified.add(this.selectionChanged, this);
                return;
            }
            if (model instanceof SelectionModel) {
                if (this.selection) {
                    this.selection.modified.remove(this);
                }
                this.selection = model;
                this.selection.modified.add(this.selectionChanged, this);
                return;
            }
            if (model instanceof TableModel) {
                this.model = model;
                this.model.modified.add(this.modelChanged, this);
                const adapter = TableAdapter.lookup(model);
                try {
                    this.adapter = new adapter(model);
                }
                catch (e) {
                    console.log(`Table.setModel(): failed to instantiate table adapter: ${e}`);
                    console.log(`setting TypeScript's target to 'es6' might help`);
                    throw e;
                }
                this.prepareCells();
                return;
            }
            if (model instanceof Object) {
                throw Error("Table.setModel(): unexpected model of type " + model.constructor.name);
            }
        }
        selectionChanged() {
            if (this.selection === undefined) {
                return;
            }
            this.saveCell();
            switch (this.selection.mode) {
                case TableEditMode.EDIT_CELL:
                    {
                        if (document.activeElement === this) {
                            const cell = this.body.children[this.selection.col + this.selection.row * this.adapter.colCount];
                            cell.focus();
                            scrollIntoView(cell);
                        }
                    }
                    break;
                case TableEditMode.SELECT_CELL: {
                    if (document.activeElement === this) {
                        const cell = this.body.children[this.selection.col + this.selection.row * this.adapter.colCount];
                        cell.focus();
                        scrollIntoView(cell);
                    }
                    break;
                }
                case TableEditMode.SELECT_ROW: {
                    break;
                }
            }
        }
        modelChanged(event) {
            switch (event.type) {
                case TableEventType.CELL_CHANGED:
                    {
                        const cell = this.body.children[event.col + event.row * this.adapter.colCount];
                        this.adapter.showCell(event, cell);
                    }
                    break;
                case TableEventType.INSERT_ROW:
                    this.animator.run(new InsertRowAnimation(this, event));
                    break;
                case TableEventType.REMOVE_ROW:
                    this.animator.run(new RemoveRowAnimation(this, event));
                    break;
                case TableEventType.INSERT_COL:
                    if (this.animation) {
                        this.animation.stop();
                    }
                    this.animation = new InsertColumnAnimation(this, event);
                    this.animation.run();
                    break;
                case TableEventType.REMOVE_COL:
                    if (this.animation) {
                        this.animation.stop();
                    }
                    this.animation = new RemoveColumnAnimation(this, event);
                    this.animation.run();
                    break;
                default:
                    console.log(`Table.modelChanged(): ${event} is not implemented`);
            }
        }
        prepareCells() {
            if (!this.adapter) {
                return;
            }
            this.visible = isVisible(this);
            if (!this.visible) {
                return;
            }
            if (this.adapter.config.seamless) {
                this.root.classList.add("seamless");
            }
            const measureLineHeight = span(text("Tg"));
            this.measure.appendChild(measureLineHeight);
            let columnHeaders = new Array(this.adapter.colCount);
            for (let col = 0; col < this.adapter.colCount; ++col) {
                const content = this.adapter.getColumnHead(col);
                if (this.colHeads === undefined && content !== undefined) {
                    this.colHeads = div();
                    this.colHeads.className = "cols";
                    this.root.appendChild(this.colHeads);
                    this.colResizeHandles = div();
                    this.colResizeHandles.className = "cols";
                    this.root.appendChild(this.colResizeHandles);
                }
                columnHeaders[col] = content;
            }
            if (this.colHeads) {
                for (let col = 0; col < this.adapter.colCount; ++col) {
                    const cell = span(columnHeaders[col]);
                    cell.className = "head";
                    this.measure.appendChild(cell);
                }
            }
            let rowHeaders = new Array(this.adapter.rowCount);
            for (let row = 0; row < this.adapter.rowCount; ++row) {
                const content = this.adapter.getRowHead(row);
                if (this.rowHeads === undefined && content !== undefined) {
                    this.rowHeads = div();
                    this.rowHeads.className = "rows";
                    this.root.appendChild(this.rowHeads);
                    this.rowResizeHandles = div();
                    this.rowResizeHandles.className = "rows";
                    this.root.appendChild(this.rowResizeHandles);
                }
                rowHeaders[row] = content;
            }
            if (this.rowHeads) {
                for (let row = 0; row < this.adapter.rowCount; ++row) {
                    const cell = span(rowHeaders[row]);
                    cell.className = "head";
                    this.measure.appendChild(cell);
                }
            }
            for (let row = 0; row < this.adapter.rowCount; ++row) {
                for (let col = 0; col < this.adapter.colCount; ++col) {
                    const cell = this.createCell();
                    this.adapter.showCell({ col, row }, cell);
                    this.measure.appendChild(cell);
                }
            }
            setTimeout(this.arrangeAllMeasuredInGrid, 0);
        }
        createCell() {
            const cell = span();
            cell.onfocus = this.cellFocus;
            cell.onkeydown = this.cellKeyDown;
            cell.tabIndex = 0;
            if (this.adapter?.config.editMode === EditMode.EDIT_ON_ENTER) {
                cell.setAttribute("contenteditable", "");
            }
            return cell;
        }
        arrangeAllMeasuredInGrid() {
            const seam = this.adapter.config.seamless ? 0 : 1;
            const measureLineHeight = this.measure.children[0];
            const b = measureLineHeight.getBoundingClientRect();
            this.minCellHeight = Math.ceil(b.height);
            this.measure.removeChild(this.measure.children[0]);
            const colWidth = this.calculateColumnWidths();
            let colHeadHeight = 0;
            if (this.colHeads) {
                for (let col = 0; col < this.adapter.colCount; ++col) {
                    const child = this.measure.children[col];
                    const bounds = child.getBoundingClientRect();
                    colHeadHeight = Math.max(colHeadHeight, bounds.height);
                }
            }
            colHeadHeight = Math.ceil(colHeadHeight);
            let idx = this.colHeads ? this.adapter.colCount : 0;
            let rowHeadWidth = 0;
            const rowHeight = Array(this.adapter.rowCount);
            if (this.rowHeads) {
                for (let row = 0; row < this.adapter.rowCount; ++row) {
                    const child = this.measure.children[idx++];
                    const bounds = child.getBoundingClientRect();
                    rowHeight[row] = Math.max(bounds.height, this.minCellHeight);
                    rowHeadWidth = Math.max(rowHeadWidth, bounds.width);
                }
            }
            else {
                rowHeight.fill(this.minCellHeight);
            }
            rowHeadWidth = Math.ceil(rowHeadWidth);
            idx = (this.colHeads ? this.adapter.colCount : 0) + (this.rowHeads ? this.adapter.rowCount : 0);
            for (let row = 0; row < this.adapter.rowCount; ++row) {
                let rh = rowHeight[row];
                for (let col = 0; col < this.adapter.colCount; ++col) {
                    const child = this.measure.children[idx + col + row * this.adapter.colCount];
                    const bounds = child.getBoundingClientRect();
                    rh = Math.max(rh, bounds.height);
                }
                rowHeight[row] = Math.ceil(rh);
            }
            let x, y;
            if (this.colHeads) {
                x = 0;
                for (let col = 0; col < this.adapter.colCount; ++col) {
                    const child = this.measure.children[0];
                    child.style.left = `${x}px`;
                    child.style.top = `0px`;
                    child.style.width = `${colWidth[col] - this.WIDTH_ADJUST}px`;
                    child.style.height = `${colHeadHeight - this.HEIGHT_ADJUST}px`;
                    this.colHeads.appendChild(child);
                    x += colWidth[col] - 1 - 1 + seam;
                }
                let filler = span();
                filler.className = "head";
                filler.style.left = `${x}px`;
                filler.style.top = `0`;
                filler.style.width = `256px`;
                filler.style.height = `${colHeadHeight}px`;
                this.colHeads.appendChild(filler);
                this.colHeads.style.left = `${rowHeadWidth - 1}px`;
                this.colHeads.style.height = `${colHeadHeight}px`;
                this.colResizeHandles.style.left = `${rowHeadWidth}px`;
                this.colResizeHandles.style.height = `${colHeadHeight}px`;
                x = -3;
                for (let col = 0; col < this.adapter.colCount; ++col) {
                    x += colWidth[col] - 1;
                    const handle = this.createHandle(col, x, 0, 5, colHeadHeight);
                    this.colResizeHandles.appendChild(handle);
                }
                x += 5;
                filler = span();
                filler.className = "head";
                filler.style.left = `${x}px`;
                filler.style.top = `0`;
                filler.style.width = `256px`;
                filler.style.height = `${colHeadHeight}px`;
                this.colResizeHandles.appendChild(filler);
            }
            if (this.rowHeads) {
                y = 0;
                for (let row = 0; row < this.adapter.rowCount; ++row) {
                    const child = this.measure.children[0];
                    child.style.left = `0px`;
                    child.style.top = `${y}px`;
                    child.style.width = `${rowHeadWidth - this.WIDTH_ADJUST}px`;
                    child.style.height = `${rowHeight[row] - this.HEIGHT_ADJUST}px`;
                    this.rowHeads.appendChild(child);
                    y += rowHeight[row] - 1 - 1 + seam;
                }
                let filler = span();
                filler.className = "head";
                filler.style.left = `0`;
                filler.style.top = `${y}px`;
                filler.style.width = `${rowHeadWidth}px`;
                filler.style.height = `256px`;
                this.rowHeads.appendChild(filler);
                this.rowHeads.style.top = `${colHeadHeight - 1}px`;
                this.rowHeads.style.width = `${rowHeadWidth}px`;
                this.rowResizeHandles.style.top = `${colHeadHeight}px`;
                this.rowResizeHandles.style.width = `${rowHeadWidth}px`;
                y = -3;
                for (let row = 0; row < this.adapter.rowCount; ++row) {
                    y += rowHeight[row] - 1;
                    const rowHandle = this.createHandle(row, 0, y, rowHeadWidth, 5);
                    this.rowResizeHandles.appendChild(rowHandle);
                }
                y += 5;
                filler = span();
                filler.className = "head";
                filler.style.left = `0`;
                filler.style.top = `${y}0px`;
                filler.style.width = `${rowHeadWidth}px`;
                filler.style.height = `256px`;
                this.rowResizeHandles.appendChild(filler);
            }
            y = 0;
            for (let row = 0; row < this.adapter.rowCount; ++row) {
                x = 0;
                for (let col = 0; col < this.adapter.colCount; ++col) {
                    const child = this.measure.children[0];
                    child.style.left = `${x}px`;
                    child.style.top = `${y}px`;
                    child.style.width = `${colWidth[col] - this.WIDTH_ADJUST}px`;
                    child.style.height = `${rowHeight[row] - this.HEIGHT_ADJUST}px`;
                    this.body.appendChild(child);
                    x += colWidth[col] - 2 + seam;
                }
                y += rowHeight[row] - 2 + seam;
            }
            if (rowHeadWidth > 0) {
                --rowHeadWidth;
            }
            if (colHeadHeight > 0) {
                --colHeadHeight;
            }
            this.body.style.left = `${rowHeadWidth}px`;
            this.body.style.top = `${colHeadHeight}px`;
            this.setHeadingFillerSizeToScrollbarSize();
        }
        setColumnWidths(withinBody = false, colWidth) {
            const overlap = this.adapter.config.seamless ? 1 : 0;
            let idx = 0;
            for (let row = 0; row < this.adapter.rowCount; ++row) {
                let x = 0;
                for (let col = 0; col < this.adapter.colCount; ++col) {
                    let child;
                    if (withinBody) {
                        child = this.body.children[idx++];
                    }
                    else {
                        child = this.measure.children[0];
                        this.body.appendChild(child);
                    }
                    child.style.left = `${x}px`;
                    child.style.width = `${colWidth[col] - this.WIDTH_ADJUST}px`;
                    x += colWidth[col] - 4 - overlap;
                }
            }
        }
        calculateColumnWidths(withinBody = false) {
            const colWidth = Array(this.adapter.colCount);
            if (this.colHeads) {
                for (let col = 0; col < this.adapter.colCount; ++col) {
                    const child = this.measure.children[col];
                    const bounds = child.getBoundingClientRect();
                    colWidth[col] = Math.max(bounds.width, this.minCellWidth);
                }
            }
            else {
                colWidth.fill(this.minCellWidth);
            }
            let idxStart;
            if (withinBody) {
                idxStart = 0;
            }
            else {
                idxStart = (this.colHeads ? this.adapter.colCount : 0) + (this.rowHeads ? this.adapter.rowCount : 0);
            }
            for (let col = 0; col < this.adapter.colCount; ++col) {
                let cw = colWidth[col];
                for (let row = 0; row < this.adapter.rowCount; ++row) {
                    let child;
                    let idx = idxStart + col + row * this.adapter.colCount;
                    if (withinBody) {
                        child = this.body.children[idx];
                    }
                    else {
                        child = this.measure.children[idx];
                    }
                    const bounds = child.getBoundingClientRect();
                    cw = Math.max(cw, bounds.width);
                }
                colWidth[col] = Math.ceil(cw);
            }
            return colWidth;
        }
        createHandle(idx, x, y, w, h) {
            const handle = span();
            handle.className = "handle";
            handle.style.left = `${x}px`;
            handle.style.top = `${y}px`;
            handle.style.width = `${w}px`;
            handle.style.height = `${h}px`;
            handle.dataset["idx"] = `${idx}`;
            handle.onpointerdown = this.handleDown;
            handle.onpointermove = this.handleMove;
            handle.onpointerup = this.handleUp;
            return handle;
        }
        handleDown(ev) {
            ev.preventDefault();
            this.handle = ev.target;
            this.handleIndex = parseInt(this.handle.dataset["idx"]) + 1;
            this.handle.setPointerCapture(ev.pointerId);
            const isColumn = this.handle.parentElement === this.colResizeHandles;
            if (isColumn) {
                this.deltaHandle = ev.clientX - px2int(this.handle.style.left);
                this.deltaSplitBody = ev.clientX;
                this.deltaSplitHead = ev.clientX - px2float(this.body.style.left);
                const cell = this.colHeads.children[this.handleIndex - 1];
                this.deltaColumn = ev.clientX - px2float(cell.style.width);
                this.splitVertical(this.handleIndex);
            }
            else {
                this.deltaHandle = ev.clientY - px2float(this.handle.style.top);
                this.deltaSplitBody = ev.clientY;
                this.deltaSplitHead = ev.clientY - px2float(this.body.style.top);
                const cell = this.rowHeads.children[this.handleIndex - 1];
                this.deltaColumn = ev.clientY - px2float(cell.style.height);
                this.splitHorizontal(this.handleIndex);
            }
        }
        handleMove(ev) {
            if (this.handle === undefined) {
                return;
            }
            const isColumn = this.handle.parentElement === this.colResizeHandles;
            if (isColumn) {
                let clientX = ev.clientX;
                const xLimit = this.deltaColumn + 8;
                if (clientX < xLimit) {
                    clientX = xLimit;
                }
                this.handle.style.left = `${clientX - this.deltaHandle}px`;
                this.splitHead.style.left = `${clientX - this.deltaSplitHead}px`;
                this.splitBody.style.left = `${clientX - this.deltaSplitBody}px`;
                const h = this.handleIndex;
                this.colHeads.children[h - 1].style.width = `${clientX - this.deltaColumn}px`;
                for (let row = 0; row < this.adapter.rowCount; ++row) {
                    this.body.children[h - 1 + row * h].style.width = `${clientX - this.deltaColumn}px`;
                }
            }
            else {
                let clientY = ev.clientY;
                const yLimit = this.deltaColumn + 8;
                if (clientY < yLimit) {
                    clientY = yLimit;
                }
                this.handle.style.top = `${clientY - this.deltaHandle}px`;
                this.splitHead.style.top = `${clientY - this.deltaSplitHead}px`;
                this.splitBody.style.top = `${clientY - this.deltaSplitBody}px`;
                const h = this.handleIndex;
                this.rowHeads.children[h - 1].style.height = `${clientY - this.deltaColumn}px`;
                let idx = (h - 1) * this.adapter.colCount;
                for (let col = 0; col < this.adapter.colCount; ++col) {
                    this.body.children[idx + col].style.height = `${clientY - this.deltaColumn}px`;
                }
            }
        }
        handleUp(ev) {
            if (this.handle === undefined) {
                return;
            }
            this.handleMove(ev);
            const isColumn = this.handle.parentElement === this.colResizeHandles;
            if (isColumn) {
                let clientX = ev.clientX;
                const xLimit = this.deltaColumn + 8;
                if (clientX < xLimit) {
                    clientX = xLimit;
                }
                this.joinVertical(this.handleIndex, clientX - this.deltaSplitBody);
            }
            else {
                let clientY = ev.clientY;
                const yLimit = this.deltaColumn + 8;
                if (clientY < yLimit) {
                    clientY = yLimit;
                }
                this.joinHorizontal(this.handleIndex, clientY - this.deltaSplitBody);
            }
            this.handle = undefined;
        }
        splitVertical(splitColumn, extra = 0) {
            if (this.colHeads !== undefined) {
                this.splitHead = div();
                this.splitHead.className = "cols";
                this.splitHead.style.left = this.colHeads.style.left;
                this.splitHead.style.height = this.colHeads.style.height;
                this.root.appendChild(this.splitHead);
                setTimeout(() => {
                    this.splitHead.scrollTop = this.colHeads.scrollTop;
                    this.splitHead.scrollLeft = this.colHeads.scrollLeft;
                }, 0);
            }
            this.splitBody = div();
            this.splitBody.className = "splitBody";
            const b = this.body.getBoundingClientRect();
            this.splitBody.style.width = `${b.width}px`;
            this.splitBody.style.height = `${b.height}px`;
            this.body.appendChild(this.splitBody);
            const bodyWidth = splitColumn;
            const splitBodyColumns = this.adapter.colCount - splitColumn + extra;
            if (this.splitHead !== undefined) {
                for (let i = 0; i < splitBodyColumns; ++i) {
                    this.splitHead.appendChild(this.colHeads.children[splitColumn]);
                }
                this.splitHead.appendChild(this.colHeads.children[this.colHeads.children.length - 1].cloneNode());
            }
            let idx = splitColumn;
            for (let row = 0; row < this.adapter.rowCount; ++row) {
                for (let col = 0; col < splitBodyColumns; ++col) {
                    this.splitBody.appendChild(this.body.children[idx]);
                }
                idx += bodyWidth;
            }
        }
        joinVertical(splitCol, delta, extra = 0, colCount, rowCount) {
            if (colCount === undefined) {
                colCount = this.adapter.colCount;
            }
            if (rowCount === undefined) {
                rowCount = this.adapter.rowCount;
            }
            const splitBodyColumns = colCount - splitCol + extra;
            let idx = splitCol - extra;
            if (this.colHeads !== undefined) {
                const filler = this.colHeads.children[this.colHeads.children.length - 1];
                for (let col = 0; col < splitBodyColumns; ++col) {
                    const cell = this.splitHead.children[0];
                    const left = px2float(cell.style.left);
                    cell.style.left = `${left + delta}px`;
                    this.colHeads.insertBefore(cell, filler);
                }
                const fillerLeft = filler.style.left;
                const left = px2float(fillerLeft);
                filler.style.left = `${left + delta}px`;
                for (let col = idx; col <= colCount; ++col) {
                    const cell = this.colResizeHandles.children[col];
                    const left = px2float(cell.style.left);
                    cell.style.left = `${left + delta}px`;
                }
            }
            for (let row = 0; row < rowCount; ++row) {
                let beforeChild = this.body.children[idx];
                for (let col = 0; col < splitBodyColumns; ++col) {
                    const cell = this.splitBody.children[0];
                    const left = px2float(cell.style.left);
                    cell.style.left = `${left + delta}px`;
                    this.body.insertBefore(cell, beforeChild);
                }
                idx += colCount;
            }
            if (this.colHeads !== undefined) {
                this.root.removeChild(this.splitHead);
                this.splitHead = undefined;
            }
            this.body.removeChild(this.splitBody);
            this.splitBody = undefined;
        }
        splitHorizontalNew(splitRow) {
            const overlap = this.adapter.config.seamless ? 0 : 1;
            this.splitBody = div();
            this.splitBody.style.transitionProperty = "transform";
            this.splitBody.style.transitionDuration = Table.transitionDuration;
            this.splitBody.className = "splitBody";
            this.splitBody.style.left = `0`;
            this.splitBody.style.right = `0`;
            this.splitBody.style.backgroundColor = Table.splitColor;
            const idx = splitRow * this.adapter.colCount;
            if (this.body.children.length === 0) {
                this.splitBody.style.top = `0px`;
                this.splitBody.style.height = `1px`;
            }
            else if (idx < this.body.children.length) {
                let cell = this.body.children[idx];
                let col = this.adapter.colCount;
                let height = 0;
                const top = px2float(cell.style.top);
                while (idx < this.body.children.length) {
                    cell = this.body.children[idx];
                    --col;
                    if (col === 0) {
                        const b = cell.getBoundingClientRect();
                        height += b.height - overlap;
                        col = this.adapter.colCount;
                    }
                    let y = px2float(cell.style.top);
                    cell.style.top = `${y - top}px`;
                    this.splitBody.appendChild(cell);
                }
                height += overlap;
                this.splitBody.style.top = `${top}px`;
                this.splitBody.style.height = `${height}px`;
            }
            else {
                let cell = this.body.children[this.body.children.length - 1];
                let b = cell.getBoundingClientRect();
                let top = px2float(cell.style.top) + b.height - overlap;
                this.splitBody.style.top = `${top}px`;
                this.splitBody.style.height = `1px`;
            }
            this.body.appendChild(this.splitBody);
        }
        splitHorizontal(splitRow, extra = 0, event) {
            if (this.rowHeads !== undefined) {
                this.splitHead = div();
                this.splitHead.className = "rows";
                this.splitHead.style.top = this.rowHeads.style.top;
                this.splitHead.style.width = this.rowHeads.style.width;
                this.root.appendChild(this.splitHead);
                setTimeout(() => {
                    this.splitHead.scrollTop = this.rowHeads.scrollTop;
                    this.splitHead.scrollLeft = this.rowHeads.scrollLeft;
                }, 0);
            }
            this.splitBody = div();
            this.splitBody.className = "splitBody";
            this.splitBody.style.backgroundColor = 'rgba(255,128,0,0.5)';
            const b = this.body.getBoundingClientRect();
            this.splitBody.style.width = `${b.width}px`;
            this.splitBody.style.height = `${b.height}px`;
            this.body.appendChild(this.splitBody);
            const splitBodyRows = this.adapter.rowCount - splitRow + extra;
            if (this.splitHead !== undefined) {
                for (let i = 0; i < splitBodyRows; ++i) {
                    this.splitHead.appendChild(this.rowHeads.children[splitRow]);
                }
                this.splitHead.appendChild(this.rowHeads.children[this.rowHeads.children.length - 1].cloneNode());
            }
            let idx = this.adapter.colCount * splitRow;
            for (let row = 0; row < splitBodyRows; ++row) {
                for (let col = 0; col < this.adapter.colCount; ++col) {
                    this.splitBody.appendChild(this.body.children[idx]);
                }
            }
            if (this.splitBody.children.length > 0) {
                idx = this.splitBody.children.length - 1;
                const last = this.splitBody.children[idx];
                const top = px2int(last.style.top);
                for (let i = 0; i < this.splitBody.children.length; ++i) {
                    const c = this.splitBody.children[i];
                    const y = px2int(c.style.top);
                    c.style.top = `${y - top}px`;
                }
                this.splitBody.style.backgroundColor = '#f80';
                this.splitBody.style.top = `${top}px`;
                this.splitBody.style.height = `${b.height - top}px`;
            }
            else if (event !== undefined && this.body.children.length > 0) {
                idx = event.index * this.adapter.colCount;
                const last = this.body.children[idx];
                const top = px2int(last.style.top);
                this.splitBody.style.top = `${top}px`;
                this.splitBody.style.height = `${b.height - top}px`;
            }
            else if (this.body.children.length > 0) {
                const filler = span();
                idx = this.body.children.length - 2;
                const last = this.body.children[idx];
                const bf = this.body.children[idx].getBoundingClientRect();
                filler.style.border = 'none';
                filler.style.backgroundColor = '#1e1e1e';
                const top = px2int(last.style.top) + bf.height;
                filler.style.top = `${top}px`;
                filler.style.left = `0px`;
                filler.style.width = `${b.width - 2}px`;
                filler.style.height = `${b.height - top}px`;
                this.splitBody.appendChild(filler);
            }
            else ;
        }
        joinHorizontal(splitRow, delta, extra = 0, colCount, rowCount) {
            if (colCount === undefined) {
                colCount = this.adapter.colCount;
            }
            if (rowCount === undefined) {
                rowCount = this.adapter.rowCount;
            }
            const splitBodyRows = rowCount - splitRow + extra;
            if (this.rowHeads !== undefined) {
                const filler = this.rowHeads.children[this.rowHeads.children.length - 1];
                for (let row = 0; row < splitBodyRows; ++row) {
                    const cell = this.splitHead.children[0];
                    const top = px2float(cell.style.top);
                    cell.style.top = `${top + delta}px`;
                    this.rowHeads.insertBefore(cell, filler);
                }
                const fillerTop = filler.style.top;
                const top = px2float(fillerTop);
                filler.style.top = `${top + delta}px`;
                let idx = splitRow;
                for (let row = idx; row <= rowCount; ++row) {
                    const cell = this.rowResizeHandles.children[row];
                    const top = px2float(cell.style.top);
                    cell.style.top = `${top + delta}px`;
                }
            }
            for (let row = 0; row < splitBodyRows; ++row) {
                for (let col = 0; col < colCount; ++col) {
                    const cell = this.splitBody.children[0];
                    const top = px2float(cell.style.top);
                    cell.style.top = `${top + delta}px`;
                    this.body.appendChild(cell);
                }
            }
            if (this.rowHeads !== undefined) {
                this.root.removeChild(this.splitHead);
                this.splitHead = undefined;
            }
            this.body.removeChild(this.splitBody);
            this.splitBody = undefined;
        }
        setHeadingFillerSizeToScrollbarSize() {
            const bounds = this.body.getBoundingClientRect();
            if (this.colHeads !== undefined) {
                const w = Math.ceil(bounds.width - this.body.clientWidth);
                this.colHeads.children[this.colHeads.children.length - 1].style.width = `${w}px`;
                this.colHeads.style.right = `${w}px`;
            }
            if (this.rowHeads !== undefined) {
                const h = Math.ceil(bounds.height - this.body.clientHeight);
                this.rowHeads.children[this.rowHeads.children.length - 1].style.height = `${h}px`;
                this.rowHeads.style.bottom = `${h}px`;
            }
        }
        clientPosToTablePos(x, y) {
            let col, row;
            for (col = 0; col < this.adapter.colCount; ++col) {
                const b = this.body.children[col].getBoundingClientRect();
                if (b.x <= x && x < b.x + b.width)
                    break;
            }
            if (col >= this.adapter.colCount) {
                return undefined;
            }
            let idx = 0;
            for (row = 0; row < this.adapter.rowCount; ++row) {
                const b = this.body.children[idx].getBoundingClientRect();
                if (b.y <= y && y < b.y + b.height)
                    break;
                idx += this.adapter.colCount;
            }
            if (row >= this.adapter.rowCount) {
                return undefined;
            }
            return new TablePos(col, row);
        }
    }
    Table.maskColor = `#1e1e1e`;
    Table.splitColor = `#1e1e1e`;
    Table.allTables = new Set();
    Table.transitionDuration = "500ms";
    Table.renderDelay = 50;
    Table.define("tx-table", Table);

    class TableTool extends GenericTool {
        constructor() {
            super();
            this.toolbar = jsx("div", { class: "toolbar" });
            this.buttonAddRowAbove = jsx("button", { class: "left", title: "add row above", children: jsxs("svg", { style: { display: "block" }, viewBox: "0 0 13 13", width: "13", height: "13", children: [jsx("rect", { x: "0.5", y: "0.5", width: "12", height: "12", class: "strokeFill" }), jsx("line", { x1: "0.5", y1: "8.5", x2: "12.5", y2: "8.5", class: "stroke" }), jsx("line", { x1: "4.5", y1: "8.5", x2: "4.5", y2: "13.5", class: "stroke" }), jsx("line", { x1: "8.5", y1: "8.5", x2: "8.5", y2: "13.5", class: "stroke" }), jsx("line", { x1: "6.5", y1: "2", x2: "6.5", y2: "7", class: "stroke" }), jsx("line", { x1: "4", y1: "4.5", x2: "9", y2: "4.5", class: "stroke" })] }) });
            this.buttonAddRowAbove.onclick = () => {
                this.lastActiveTable?.focus();
                const model = this.lastActiveTable?.model;
                const selection = this.lastActiveTable?.selection;
                if (selection && model && 'insertRow' in model) {
                    model.insertRow(selection.row);
                }
            };
            this.toolbar.appendChild(this.buttonAddRowAbove);
            this.buttonAddRowBelow = jsx("button", { title: "add row below", children: jsxs("svg", { viewBox: "0 0 13 13", width: "13", height: "13", children: [jsx("rect", { x: "0.5", y: "0.5", width: "12", height: "12", class: "strokeFill" }), jsx("line", { x1: "0.5", y1: "4.5", x2: "12.5", y2: "4.5", class: "stroke" }), jsx("line", { x1: "4.5", y1: "0.5", x2: "4.5", y2: "4.5", class: "stroke" }), jsx("line", { x1: "8.5", y1: "0.5", x2: "8.5", y2: "4.5", class: "stroke" }), jsx("line", { x1: "6.5", y1: "6", x2: "6.5", y2: "11", class: "stroke" }), jsx("line", { x1: "4", y1: "8.5", x2: "9", y2: "8.5", class: "stroke" })] }) });
            this.buttonAddRowBelow.onclick = () => {
                this.lastActiveTable?.focus();
                const model = this.lastActiveTable?.model;
                const selection = this.lastActiveTable?.selection;
                if (selection && model && 'insertRow' in model) {
                    model.insertRow(selection.row + 1);
                }
            };
            this.toolbar.appendChild(this.buttonAddRowBelow);
            this.buttonDeleteRow = jsx("button", { class: "right", title: "delete row", children: jsxs("svg", { viewBox: "0 0 13 13", width: "13", height: "13", children: [jsx("rect", { x: "0.5", y: "0.5", width: "12", height: "12", class: "strokeFill" }), jsx("line", { x1: "0.5", y1: "4.5", x2: "12.5", y2: "4.5", class: "stroke" }), jsx("line", { x1: "0.5", y1: "8.5", x2: "12.5", y2: "8.5", class: "stroke" }), jsx("line", { x1: "5.5", y1: "3.5", x2: "11.5", y2: "9.5", class: "stroke", "stroke-width": "1.5" }), jsx("line", { x1: "11.5", y1: "3.5", x2: "5.5", y2: "9.5", class: "stroke", "stroke-width": "1.5" })] }) });
            this.buttonDeleteRow.onclick = () => {
                this.lastActiveTable?.focus();
                const model = this.lastActiveTable?.model;
                const selection = this.lastActiveTable?.selection;
                if (selection && model && 'removeRow' in model) {
                    model.removeRow(selection.row, 1);
                }
            };
            this.toolbar.appendChild(this.buttonDeleteRow);
            this.toolbar.appendChild(document.createTextNode(" "));
            this.buttonAddColumnLeft = jsx("button", { class: "left", title: "add column left", children: jsxs("svg", { viewBox: "0 0 13 13", width: "13", height: "13", children: [jsx("rect", { x: "0.5", y: "0.5", width: "12", height: "12", class: "strokeFill" }), jsx("line", { x1: "8.5", y1: "0.5", x2: "8.5", y2: "12.5", class: "stroke" }), jsx("line", { x1: "8.5", y1: "4.5", x2: "12.5", y2: "4.5", class: "stroke" }), jsx("line", { x1: "8.5", y1: "8.5", x2: "12.5", y2: "8.5", class: "stroke" }), jsx("line", { x1: "2", y1: "6.5", x2: "7", y2: "6.5", class: "stroke" }), jsx("line", { x1: "4.5", y1: "4", x2: "4.5", y2: "9", class: "stroke" })] }) });
            this.buttonAddColumnLeft.onclick = () => {
                this.lastActiveTable?.focus();
                const model = this.lastActiveTable?.model;
                const selection = this.lastActiveTable?.selection;
                if (selection && model && 'insertColumn' in model) {
                    model.insertColumn(selection.col);
                }
            };
            this.toolbar.appendChild(this.buttonAddColumnLeft);
            this.buttonAddColumnRight = jsx("button", { title: "add column right", children: jsxs("svg", { viewBox: "0 0 13 13", width: "13", height: "13", children: [jsx("rect", { x: "0.5", y: "0.5", width: "12", height: "12", class: "strokeFill" }), jsx("line", { x1: "4.5", y1: "0.5", x2: "4.5", y2: "12.5", class: "stroke" }), jsx("line", { x1: "0.5", y1: "4.5", x2: "4.5", y2: "4.5", class: "stroke" }), jsx("line", { x1: "0.5", y1: "8.5", x2: "4.5", y2: "8.5", class: "stroke" }), jsx("line", { x1: "6", y1: "6.5", x2: "11", y2: "6.5", class: "stroke" }), jsx("line", { x1: "8.5", y1: "4", x2: "8.5", y2: "9", class: "stroke" })] }) });
            this.buttonAddColumnRight.onclick = () => {
                this.lastActiveTable?.focus();
                const model = this.lastActiveTable?.model;
                const selection = this.lastActiveTable?.selection;
                if (selection && model && 'insertColumn' in model) {
                    model.insertColumn(selection.col + 1);
                }
            };
            this.toolbar.appendChild(this.buttonAddColumnRight);
            this.buttonDeleteColumn = jsx("button", { class: "right", title: "delete column", children: jsxs("svg", { viewBox: "0 0 13 13", width: "13", height: "13", children: [jsx("rect", { x: "0.5", y: "0.5", width: "12", height: "12", class: "strokeFill" }), jsx("line", { x1: "4.5", y1: "0.5", x2: "4.5", y2: "12.5", class: "stroke" }), jsx("line", { x1: "8.5", y1: "0.5", x2: "8.5", y2: "12.5", class: "stroke" }), jsx("line", { x1: "3.5", y1: "5.5", x2: "9.5", y2: "11.5", class: "stroke", "stroke-width": "1.5" }), jsx("line", { x1: "3.5", y1: "11.5", x2: "9.5", y2: "5.5", class: "stroke", "stroke-width": "1.5" })] }) });
            this.buttonDeleteColumn.onclick = () => {
                this.lastActiveTable?.focus();
                const model = this.lastActiveTable?.model;
                const selection = this.lastActiveTable?.selection;
                if (selection && model && 'removeRow' in model) {
                    model.removeColumn(selection.col, 1);
                }
            };
            this.toolbar.appendChild(this.buttonDeleteColumn);
            this.toolbar.appendChild(document.createTextNode(" "));
            this.buttonAddNodeAbove = jsx("button", { class: "left", title: "add node above", children: jsxs("svg", { style: { display: "block", border: "none" }, viewBox: "0 0 8 17", width: "8", height: "17", children: [jsx("rect", { x: "0.5", y: "1.5", width: "6", height: "6", class: "strokeFill" }), jsx("rect", { x: "0.5", y: "9.5", width: "6", height: "6", class: "fill" }), jsx("line", { x1: "3.5", y1: "3", x2: "3.5", y2: "6", class: "stroke" }), jsx("line", { x1: "2", y1: "4.5", x2: "5", y2: "4.5", class: "stroke" }), jsx("line", { x1: "3.5", y1: "0", x2: "3.5", y2: "1", class: "stroke" }), jsx("line", { x1: "3.5", y1: "8", x2: "3.5", y2: "17", class: "stroke" })] }) });
            this.toolbar.appendChild(this.buttonAddNodeAbove);
            this.buttonAddNodeBelow = jsx("button", { title: "add node below", children: jsxs("svg", { style: { display: "block", border: "none" }, viewBox: "0 0 8 17", width: "8", height: "17", children: [jsx("rect", { x: "0.5", y: "1.5", width: "6", height: "6", class: "fill" }), jsx("rect", { x: "0.5", y: "9.5", width: "6", height: "6", class: "strokeFill" }), jsx("line", { x1: "3.5", y1: "11", x2: "3.5", y2: "14", class: "stroke" }), jsx("line", { x1: "2", y1: "12.5", x2: "5", y2: "12.5", class: "stroke" }), jsx("line", { x1: "3.5", y1: "0", x2: "3.5", y2: "9", class: "stroke" }), jsx("line", { x1: "3.5", y1: "16", x2: "3.5", y2: "17", class: "stroke" })] }) });
            this.toolbar.appendChild(this.buttonAddNodeBelow);
            this.buttonAddNodeParent = jsx("button", { title: "add node parent", children: jsxs("svg", { viewBox: "0 0 13 17", width: "13", height: "17", children: [jsx("rect", { x: "0.5", y: "1.5", width: "6", height: "6", class: "strokeFill" }), jsx("rect", { x: "6.5", y: "9.5", width: "6", height: "6", class: "fill" }), jsx("line", { x1: "7", y1: "4.5", x2: "10", y2: "4.5", class: "stroke" }), jsx("line", { x1: "9.5", y1: "4", x2: "9.5", y2: "9", class: "stroke" }), jsx("line", { x1: "3.5", y1: "3", x2: "3.5", y2: "6", class: "stroke" }), jsx("line", { x1: "2", y1: "4.5", x2: "5", y2: "4.5", class: "stroke" }), jsx("line", { x1: "3.5", y1: "0", x2: "3.5", y2: "1", class: "stroke" }), jsx("line", { x1: "3.5", y1: "8", x2: "3.5", y2: "17", class: "stroke" })] }) });
            this.buttonAddNodeParent.onclick = () => {
            };
            this.toolbar.appendChild(this.buttonAddNodeParent);
            this.buttonAddNodeChild = jsx("button", { title: "add node child", children: jsxs("svg", { viewBox: "0 0 13 17", width: "13", height: "17", children: [jsx("rect", { x: "0.5", y: "1.5", width: "6", height: "6", class: "fill" }), jsx("rect", { x: "6.5", y: "9.5", width: "6", height: "6", class: "strokeFill" }), jsx("line", { x1: "7", y1: "4.5", x2: "10", y2: "4.5", class: "stroke" }), jsx("line", { x1: "9.5", y1: "4", x2: "9.5", y2: "9", class: "stroke" }), jsx("line", { x1: "9.5", y1: "11", x2: "9.5", y2: "14", class: "stroke" }), jsx("line", { x1: "8", y1: "12.5", x2: "11", y2: "12.5", class: "stroke" }), jsx("line", { x1: "3.5", y1: "0", x2: "3.5", y2: "17", class: "stroke" })] }) });
            this.toolbar.appendChild(this.buttonAddNodeChild);
            this.buttonDeleteNode = jsx("button", { class: "right", title: "delete node", children: jsxs("svg", { viewBox: "0 0 10 17", width: "10", height: "17", children: [jsx("rect", { x: "1.5", y: "5.5", width: "6", height: "6", class: "strokeFill" }), jsx("line", { x1: "4.5", y1: "2", x2: "4.5", y2: "5", class: "stroke" }), jsx("line", { x1: "4.5", y1: "12", x2: "4.5", y2: "15", class: "stroke" }), jsx("line", { x1: "0.5", y1: "4.5", x2: "8.5", y2: "12.5", class: "stroke", "stroke-width": "1.5" }), jsx("line", { x1: "8.5", y1: "4.5", x2: "0.5", y2: "12.5", class: "stroke", "stroke-width": "1.5" })] }) });
            this.toolbar.appendChild(this.buttonDeleteNode);
            this.attachShadow({ mode: 'open' });
            this.shadowRoot.appendChild(document.importNode(textAreaStyle, true));
            this.shadowRoot.appendChild(this.toolbar);
        }
        canHandle(view) {
            return view instanceof Table;
        }
        activate() {
            this.lastActiveTable = GenericTool.activeView;
            this.toolbar.classList.add("active");
        }
        deactivate() {
            this.lastActiveTable = undefined;
            this.toolbar.classList.remove("active");
        }
    }
    View.define("tx-tabletool", TableTool);

    class AbstractTypedTableAdapter extends TableAdapter {
    }
    class TypedTableAdapter extends AbstractTypedTableAdapter {
    }

    class TableEvent {
        constructor(type, index, size) {
            this.type = type;
            this.index = index;
            this.size = size;
        }
        get col() {
            return this.index;
        }
        get row() {
            return this.size;
        }
        toString() {
            return `TableEvent {type: ${TableEventType[this.type]}, index: ${this.index}, size: ${this.size}}`;
        }
    }

    class RowInfo {
        constructor(node, depth, open = true) {
            this.node = node;
            this.depth = depth;
            this.open = open;
        }
    }
    class TreeModel extends TypedTableModel {
        constructor(nodeClass, root) {
            super(nodeClass);
            this.rows = new Array();
            if (root !== undefined) {
                this.createRowInfoHelper(this.rows, root, 0);
            }
        }
        get colCount() { return 1; }
        get rowCount() { return this.rows.length; }
        getRow(node) {
            for (let i = 0; i < this.rows.length; ++i) {
                if (this.rows[i].node === node) {
                    return i;
                }
            }
            return undefined;
        }
        addSiblingBefore(row) {
            const nn = this.createNode();
            if (this.rows.length === 0) {
                row = 0;
                this.setRoot(nn);
                this.rows.push(new RowInfo(nn, 0));
            }
            else {
                if (row === 0) {
                    this.setNext(nn, this.getRoot());
                    this.setRoot(nn);
                    this.rows.unshift(new RowInfo(nn, 0));
                }
                else {
                    this.setNext(nn, this.rows[row].node);
                    if (this.getNext(this.rows[row - 1].node) === this.rows[row].node)
                        this.setNext(this.rows[row - 1].node, nn);
                    else
                        this.setDown(this.rows[row - 1].node, nn);
                    this.rows.splice(row, 0, new RowInfo(nn, this.rows[row].depth));
                }
            }
            this.modified.trigger(new TableEvent(TableEventType.INSERT_ROW, row, 1));
            return row;
        }
        addSiblingAfter(row) {
            const nn = this.createNode();
            if (this.rows.length === 0) {
                row = 0;
                this.setRoot(nn);
                this.rows.push(new RowInfo(nn, 0));
            }
            else {
                this.setNext(nn, this.getNext(this.rows[row].node));
                this.setNext(this.rows[row].node, nn);
                const count = this.nodeCount(this.getDown(this.rows[row].node));
                const depth = this.rows[row].depth;
                row += count + 1;
                this.rows.splice(row, 0, new RowInfo(nn, depth));
            }
            this.modified.trigger(new TableEvent(TableEventType.INSERT_ROW, row, 1));
            return row;
        }
        addChildAfter(row) {
            const nn = this.createNode();
            if (this.rows.length === 0) {
                this.setRoot(nn);
                this.rows.push(new RowInfo(nn, 0));
                this.modified.trigger(new TableEvent(TableEventType.INSERT_ROW, 0, 1));
            }
            else {
                const down = this.getDown(this.rows[row].node);
                const subtreeSize = this.nodeCount(down);
                for (let i = 0; i < subtreeSize; ++i)
                    ++this.rows[row + 1 + i].depth;
                this.setDown(nn, down);
                this.setDown(this.rows[row].node, nn);
                this.rows.splice(row + 1, 0, new RowInfo(nn, this.rows[row].depth + 1));
                this.modified.trigger(new TableEvent(TableEventType.INSERT_ROW, row + 1, 1));
            }
            return row;
        }
        addParentBefore(row) {
            const nn = this.createNode();
            if (row === 0) {
                for (let i = 0; i < this.rows.length; ++i)
                    ++this.rows[row + i].depth;
                this.setDown(nn, this.getRoot());
                this.setRoot(nn);
                this.rows.unshift(new RowInfo(nn, 0));
            }
            else {
                const depth = this.rows[row].depth;
                const subtreeSize = this.nodeCount(this.getDown(this.rows[row].node)) + 1;
                for (let i = 0; i < subtreeSize; ++i)
                    ++this.rows[row + i].depth;
                this.setDown(nn, this.rows[row].node);
                this.setNext(nn, this.getNext(this.rows[row].node));
                this.setNext(this.rows[row].node, undefined);
                if (this.getNext(this.rows[row - 1].node) === this.rows[row].node)
                    this.setNext(this.rows[row - 1].node, nn);
                else
                    this.setDown(this.rows[row - 1].node, nn);
                this.rows.splice(row, 0, new RowInfo(nn, depth));
            }
            this.modified.trigger(new TableEvent(TableEventType.INSERT_ROW, row, 1));
            return row;
        }
        deleteAt(row) {
            let down = this.getDown(this.rows[row].node);
            if (down !== undefined) {
                const subtreeSize = this.nodeCount(down) + 1;
                for (let i = 0; i < subtreeSize; ++i)
                    --this.rows[row + i].depth;
                this.append(down, this.getNext(this.rows[row].node));
                this.setNext(this.rows[row].node, undefined);
                if (row === 0) {
                    this.setRoot(down);
                }
                else {
                    this.setNext(this.rows[row - 1].node, down);
                }
            }
            else {
                if (row === 0) {
                    const next = this.getNext(this.rows[row].node);
                    this.setNext(this.rows[row].node, undefined);
                    this.setRoot(next);
                }
                else {
                    const next = this.getNext(this.rows[row].node);
                    this.setNext(this.rows[row].node, undefined);
                    if (this.getNext(this.rows[row - 1].node) === this.rows[row].node)
                        this.setNext(this.rows[row - 1].node, next);
                    else
                        this.setDown(this.rows[row - 1].node, next);
                }
            }
            this.rows.splice(row, 1);
            this.modified.trigger(new TableEvent(TableEventType.REMOVE_ROW, row, 1));
            return row;
        }
        init() { }
        toggleAt(row) {
            if (this.rows[row].open) {
                this.closeAt(row);
            }
            else {
                this.openAt(row);
            }
        }
        isOpen(row) {
            return this.rows[row].open;
        }
        openAt(row) {
            let r = this.rows[row];
            if (r.open || this.getDown(r.node) === undefined)
                return;
            r.open = true;
            const newRows = this.createRowInfo(row);
            this.rows.splice(row + 1, 0, ...newRows);
            this.modified.trigger(new TableEvent(TableEventType.INSERT_ROW, row + 1, newRows.length));
        }
        closeAt(row) {
            let r = this.rows[row];
            if (!r.open || this.getDown(r.node) === undefined)
                return;
            const count = this.getVisibleChildCount(row);
            r.open = false;
            this.rows.splice(row + 1, count);
            this.modified.trigger(new TableEvent(TableEventType.REMOVE_ROW, row + 1, count));
        }
        collapse() {
            let row = 0;
            while (row < this.rowCount) {
                this.closeAt(row);
                ++row;
            }
            for (let rowinfo of this.rows) {
                rowinfo.open = false;
            }
        }
        createRowInfo(row) {
            const newRows = new Array();
            let r = this.rows[row];
            if (r.open && this.getDown(r.node)) {
                this.createRowInfoHelper(newRows, this.getDown(r.node), r.depth + 1);
            }
            return newRows;
        }
        createRowInfoHelper(newRows, node, depth) {
            const rowInfo = new RowInfo(node, depth, false);
            newRows.push(rowInfo);
            if (rowInfo.open && this.getDown(node)) {
                this.createRowInfoHelper(newRows, this.getDown(node), rowInfo.depth + 1);
            }
            if (this.getNext(node)) {
                this.createRowInfoHelper(newRows, this.getNext(node), rowInfo.depth);
            }
        }
        getVisibleChildCount(row) {
            let r = this.rows[row];
            let count = 1;
            if (r.open && this.getDown(r.node)) {
                const rows = this.getVisibleChildCountHelper(row + 1);
                row += rows;
                count += rows;
            }
            return count - 1;
        }
        getVisibleChildCountHelper(row) {
            let r = this.rows[row];
            let count = 1;
            if (r.open && this.getDown(r.node)) {
                const rows = this.getVisibleChildCountHelper(row + 1);
                row += rows;
                count += rows;
            }
            if (this.getNext(r.node)) {
                const rows = this.getVisibleChildCountHelper(row + 1);
                row += rows;
                count += rows;
            }
            return count;
        }
        append(chain, node) {
            if (node === undefined)
                return;
            let p = chain;
            let next;
            while (true) {
                next = this.getNext(p);
                if (next === undefined)
                    break;
                p = next;
            }
            this.setNext(p, node);
        }
        nodeCount(node) {
            if (node === undefined)
                return 0;
            return 1 + this.nodeCount(this.getDown(node)) + this.nodeCount(this.getNext(node));
        }
    }

    class TreeAdapter extends TypedTableAdapter {
        constructor(model) {
            super(model);
            this.config.seamless = true;
        }
        treeCell(pos, cell, label) {
            this._showCell(pos, cell);
            const labelNode = span(text(label));
            labelNode.style.verticalAlign = "middle";
            labelNode.style.padding = "2px";
            cell.appendChild(labelNode);
        }
        showCell(pos, cell) {
            this._showCell(pos, cell);
        }
        _showCell(pos, cell) {
            if (this.model === undefined) {
                console.log("no model");
                return;
            }
            const rowinfo = this.model.rows[pos.row];
            const rs = 8;
            const sx = rs + 4;
            const height = sx;
            const dx = 3.5;
            const dy = Math.round(height / 2 - rs / 2) - 0.5;
            const rx = 3;
            const width = rowinfo.depth * sx + sx + dx;
            const svgNode = svg();
            svgNode.setAttributeNS(null, `width`, `${width}`);
            svgNode.setAttributeNS(null, `height`, `${sx}`);
            svgNode.style.verticalAlign = "middle";
            svgNode.style.background = "none";
            const d = rowinfo.depth;
            if (this.model.getDown(rowinfo.node) !== undefined) {
                const x0 = d * sx + dx;
                const box = rect(x0, dy, rs, rs, "#000", "#fff");
                box.style.cursor = "pointer";
                svgNode.appendChild(box);
                const minus = line(x0 + (rs >> 2), dy + (rs >> 1), x0 + rs - (rs >> 2), dy + (rs >> 1), "#000");
                minus.style.cursor = "pointer";
                svgNode.appendChild(minus);
                const plus = line(x0 + (rs >> 1), dy + (rs >> 2), x0 + (rs >> 1), dy + rs - (rs >> 2), "#000");
                plus.style.cursor = "pointer";
                plus.style.display = rowinfo.open ? "none" : "";
                svgNode.appendChild(plus);
                svgNode.appendChild(line(x0 + rs, dy + (rs >> 1), x0 + rs + rx, dy + (rs >> 1), "#f80"));
                svgNode.onpointerdown = (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    const rowNumber = this.model.getRow(rowinfo.node);
                    if (rowNumber === undefined) {
                        console.log("  ==> couldn't find row number for node");
                        return;
                    }
                    const bounds = svgNode.getBoundingClientRect();
                    const x = event.clientX - bounds.left;
                    const y = event.clientY - bounds.top;
                    if (x0 <= x && x <= x0 + rs && dy <= y && y <= dy + rs) {
                        this.model?.toggleAt(rowNumber);
                        plus.style.display = this.model.isOpen(rowNumber) ? "none" : "";
                    }
                };
            }
            else {
                svgNode.appendChild(line(d * sx + dx + (rs >> 1) - 0.5, 0, d * sx + dx + (rs >> 1), dy + (rs >> 1), "#f80"));
                svgNode.appendChild(line(d * sx + dx + (rs >> 1), dy + (rs >> 1), d * sx + dx + rs + rx, dy + (rs >> 1), "#f80"));
            }
            let lines = "";
            for (let i = 0; i <= d; ++i) {
                const x = i * sx + dx + (rs >> 1) + 2;
                for (let j = pos.row + 1; j < this.model.rowCount; ++j) {
                    if (this.model.rows[j].depth < i)
                        break;
                    if (i === this.model.rows[j].depth) {
                        if (i !== d) {
                            lines += `<line x1='${x}' y1='0' x2='${x}' y2='100%' stroke='%23f80' />`;
                        }
                        else {
                            if (this.model.getNext(rowinfo.node) !== undefined) {
                                lines += `<line x1='${x}' y1='0' x2='${x}' y2='100%' stroke='%23f80' />`;
                            }
                        }
                        break;
                    }
                }
            }
            if (this.model.getDown(rowinfo.node) === undefined || this.model.getNext(rowinfo.node) === undefined) {
                const x = d * sx + dx + (rs >> 1) + 2;
                lines += `<line x1='${x}' y1='0' x2='${x}' y2='${rs >> 1}' stroke='%23f80' />`;
            }
            cell.style.background = `url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' style='background: %23000;'>${lines}</svg>\")`;
            cell.style.backgroundRepeat = "repeat-y";
            cell.replaceChildren(svgNode);
        }
    }

    class TreeNodeModel extends TreeModel {
        constructor(nodeClass, root) {
            super(nodeClass, root);
            this.root = root;
        }
        createNode() { return new this.nodeClass(); }
        deleteNode(node) { }
        getRoot() { return this.root; }
        setRoot(node) { this.root = node; }
        getDown(node) { return node.down; }
        setDown(node, down) { node.down = down; }
        getNext(node) { return node.next; }
        setNext(node, next) { node.next = next; }
    }

    // from apps/humanmodifier.py
    class Modifier {
        constructor(groupName, name) {
            this.groupName = groupName.replace('/', '-');
            this.name = name.replace('/', '-');
            this.description = '';
            this.value = 0;
            this.defaultValue = 0;
            this.targets = [];
        }
        // set/add/link/assign modifier to human
        setHuman(human) {
            this.human = human;
            human.addModifier(this);
        }
        get fullName() {
            return `${this.groupName}/${this.name}`;
        }
        getMin() {
            return 0.0;
        }
        getMax() {
            return 1.0;
        }
        setValue(value, { skipDependencies = false } = {}) {
            console.log(`Modifier.setValue(${value}) // modifier ${this.fullName}`);
            const clampedValue = this.clampValue(value);
            const factors = this.getFactors(clampedValue);
            const tWeights = getTargetWeights(this.targets, factors, clampedValue);
            for (let x of tWeights)
                this.human.setDetail(x[0], x[1]);
            if (skipDependencies)
                return;
            // Update dependent modifiers
            this.propagateUpdate(false);
        }
        resetValue() {
            const oldValue = this.getValue();
            this.setValue(this.getDefaultValue());
            return oldValue;
        }
        propagateUpdate(realtime = false) {
            console.log('please note: Modifier.propagateUpdate is not implemented');
            // let f
            // if (realtime)
            //     f = realtimeDependencyUpdates
            // else
            //     f = None
            // for (const dependentModifierGroup of self.human.getModifiersAffectedBy(this, filter = f)) {
            //     // Only updating one modifier in a group should suffice to update the
            //     // targets affected by the entire group.
            //     const m = this.human.getModifiersByGroup(dependentModifierGroup)[0]
            //     if (realtime)
            //         m.updateValue(m.getValue(), skipUpdate = True)
            //     else
            //         m.setValue(m.getValue(), skipDependencies = True)
            // }
        }
        getValue() {
            // return sum([self.human.getDetail(target[0]) for target in self.targets])
            let sum = 0;
            for (let target of this.targets)
                sum += this.human.getDetail(target.targetPath);
            return sum;
        }
        getDefaultValue() {
            return this.defaultValue;
        }
        buildLists() {
            if (this.verts !== undefined || this.faces !== undefined)
                return;
            for (const target in this.targets) {
            }
        }
        updateValue(value, { updateNormals = 1, skipUpdate = false } = {}) {
            // console.log(`Modifier.updateValue() is not implemented // ${this.fullName}`)
            // if (this.verts === undefined && this.faces === undefined)
            //     this.buildLists()
            //    # Update detail state
            //    old_detail = [self.human.getDetail(target[0]) for target in self.targets]
            this.setValue(value, { skipDependencies: true });
            //    new_detail = [self.human.getDetail(target[0]) for target in self.targets]
            //    # Apply changes
            //    for target, old, new in zip(self.targets, old_detail, new_detail):
            //        if new == old:
            //            continue
            //        if self.human.isPosed():
            //            # Apply target with pose transformation
            //            animatedMesh = self.human
            //        else:
            //            animatedMesh = None
            //        algos3d.loadTranslationTarget(self.human.meshData, target[0], new - old, None, 0, 0, animatedMesh=animatedMesh)
            //    if skipUpdate:
            //        # Used for dependency updates (avoid dependency loops and double updates to human)
            //        return
            //    # Update dependent modifiers
            //    self.propagateUpdate(realtime = True)
            //    # Update vertices
            //    if updateNormals:
            //        self.human.meshData.calcNormals(1, 1, self.verts, self.faces)
            //    self.human.meshData.update()
            //    event = events3d.HumanEvent(self.human, self.eventType)
            //    event.modifier = self.fullName
            //    self.human.callEvent('onChanging', event)
        }
        getSymmetrySide() {
            throw Error('Not implemented');
        }
        getSymmetricOpposite() {
            throw Error('Not implemented');
        }
        getSimilar() {
            throw Error('Not implemented');
        }
        isMacro() {
            return this.macroVariable !== undefined;
        }
        getModel() {
            if (this.model === undefined) {
                this.model = new NumberModel(this.getDefaultValue(), { min: this.getMin(), max: this.getMax() });
            }
            return this.model;
        }
    }

    // 2 targets from the TargetFactory, value in [0, 1] or [-1, 1]
    class ManagedTargetModifier extends Modifier {
        constructor(groupName, name) {
            super(groupName, name);
        }
        clampValue(value) {
            value = Math.min(value);
            if (this.left !== undefined)
                value = Math.max(-1.0, value);
            else
                value = Math.max(0.0, value);
            return value;
        }
        setValue(value, { skipDependencies = false } = {}) {
            // console.log(`ManagedTargetModifier.setValue(${value})`)
            value = this.clampValue(value);
            const factors = this.getFactors(value);
            // console.log(factors)
            const targetWeights = getTargetWeights(this.targets, factors);
            // console.log(targetWeights)
            for (const weight of targetWeights) {
                // console.log(`ManagedTargetModifier.setValue(${value}) -> human.setDetail(${weight[0]}, ${weight[1]})`)
                this.human.setDetail(weight[0], weight[1]);
            }
            if (skipDependencies)
                return;
            // Update dependent modifiers
            this.propagateUpdate(false);
        }
        // ADD A UNIT TEST FOR THIS ONE
        getValue() {
            // console.log(`ManagedTargetModifier.getValue() '${this.fullName}'`)
            if (this.rTargets) {
                let sum = 0;
                for (let target of this.rTargets)
                    sum += this.human.getDetail(target.targetPath); // FIXME: this is just a guess
                return sum;
            }
            let sum = 0;
            for (let target of this.lTargets)
                sum += this.human.getDetail(target.targetPath); // FIXME: this is just a guess
            return sum;
        }
        // return map of all Human's *Val attributes
        getFactors(value) {
            const result = new Map();
            const desc = Object.getOwnPropertyDescriptors(this.human);
            for (const name in desc) {
                if (!name.endsWith("Val"))
                    continue;
                result.set(name.substring(0, name.length - 3), // name without the 'Val' suffix
                desc[name].value.value); // NumberModel.value
            }
            return result;
        }
    }

    class TargetRef {
        constructor(targetPath, factorDependencies) {
            this.targetPath = targetPath;
            this.factorDependencies = factorDependencies;
        }
    }

    // static method of ManagedTargetModifiers
    // findTargets('buttocks-buttocks-volume-decr') -> [('data/targets/buttocks/buttocks-volume-decr.target', ['buttocks-buttocks-volume-decr'])]
    // findTargets('buttocks-buttocks-volume-incr') -> [('data/targets/buttocks/buttocks-volume-incr.target', ['buttocks-buttocks-volume-incr'])]
    function findTargets(path) {
        if (path === undefined)
            return [];
        const targetsList = TargetFactory.getInstance().getTargetsByGroup(path);
        if (targetsList === undefined)
            throw Error(`findTargets(): failed to get targetsList for ${path}`);
        // console.log(targetsList)
        const result = [];
        for (const component of targetsList) {
            const targetgroup = component.tuple();
            const factordependencies = component.getVariables();
            factordependencies.push(targetgroup);
            result.push(new TargetRef(component.path, factordependencies));
        }
        return result;
    }

    function findMacroDependencies(path) {
        var _a;
        const result = new Set();
        if (path === undefined) {
            return result;
        }
        // most calls will just yield and empty set, e.g.
        //   findMacroDependencies(head-head-age-decr) -> nothin'
        // only the following will deliver results:
        //   findMacroDependencies(breast) -> 'age' 'gender' 'breastfirmness' 'weight' 'breastsize' 'muscle'
        //   findMacroDependencies(macrodetails) -> 'age' 'race' 'gender'
        //   findMacroDependencies(macrodetails-universal) -> 'muscle' 'age' 'gender' 'weight'
        //   findMacroDependencies(macrodetails-height) -> 'age' 'gender' 'weight' 'height' 'muscle' 
        //   findMacroDependencies(macrodetails-proportions) -> 'age' 'gender' 'weight' 'bodyproportions' 'muscle'    
        (_a = TargetFactory.getInstance().groups.get(path)) === null || _a === void 0 ? void 0 : _a.forEach(target => {
            target.data.forEach((value, key) => {
                if (value !== undefined) {
                    result.add(key);
                }
            });
        });
        return result;
    }

    class MacroModifier extends ManagedTargetModifier {
        constructor(groupName, name) {
            // e.g. macrodetails/Gender
            super(groupName, name);
            this.defaultValue = 0.5;
            this.targets = findTargets(groupName);
            this.macroDependencies = findMacroDependencies(groupName);
            this.macroVariable = this.getMacroVariable();
            if (this.macroVariable) {
                // MacroModifier is not dependent on variable it controls itself
                this.macroDependencies.delete(this.macroVariable);
            }
        }
        getMacroVariable() {
            if (this.name) {
                let v = this.name.toLowerCase();
                if (validCategories.indexOf(v) !== -1)
                    return v;
                if (valueToCategory.has(v))
                    return valueToCategory.get(v);
            }
            return undefined;
        }
        getValue() {
            return this.getModel().value;
        }
        setValue(value, { skipDependencies = false } = {}) {
            // console.log(`MacroModifier(${this.fullName}).setValue(${value})`)
            value = this.clampValue(value);
            this.getModel().value = value;
            super.setValue(value, { skipDependencies });
        }
        clampValue(value) {
            return Math.max(0.0, Math.min(1.0, value));
        }
        getFactors(value) {
            const factors = super.getFactors(value);
            factors.set(this.groupName, 1.0);
            return factors;
        }
        buildLists() {
        }
        getModel() {
            if (this.model !== undefined) {
                return this.model;
            }
            if (this.human === undefined) {
                throw Error(`MacroModifier.getModel(): can only be called after human has been set`);
            }
            switch (this.name) {
                case "Gender":
                    this.model = this.human.gender;
                    break;
                case "Age":
                    this.model = this.human.age;
                    break;
                case "Muscle":
                    this.model = this.human.muscle;
                    break;
                case "Weight":
                    this.model = this.human.weight;
                    break;
                case "Height":
                    this.model = this.human.height;
                    break;
                case "BodyProportions":
                    this.model = this.human.bodyProportions;
                    break;
                case "BreastSize":
                    this.model = this.human.breastSize;
                    break;
                case "BreastFirmness":
                    this.model = this.human.breastFirmness;
                    break;
                case "African":
                    this.model = this.human.africanVal;
                    break;
                case "Asian":
                    this.model = this.human.asianVal;
                    break;
                case "Caucasian":
                    this.model = this.human.caucasianVal;
                    break;
                default:
                    throw Error(`MacroModifier.getModel(): not implemented for name '${this.name}'`);
            }
            return this.model;
        }
    }

    class EthnicModifier extends MacroModifier {
        constructor(groupName, name) {
            super(groupName, name);
            this.defaultValue = 1 / 3;
        }
    }

    // 1 to 3 targets from the TargetFactory, value in [0, 1] or [-1, 1]
    class UniversalModifier extends ManagedTargetModifier {
        constructor(groupName, targetName, leftExt, rightExt, centerExt) {
            // console.log(`UniversalModifier('${groupName}', '${targetName}', '${leftExt}', '${rightExt}', '${centerExt}')`)
            let fullTargetName = `${groupName}-${targetName}`;
            let name;
            let left;
            let center;
            let right;
            if (leftExt !== undefined && rightExt !== undefined) {
                left = `${fullTargetName}-${leftExt}`;
                right = `${fullTargetName}-${rightExt}`;
                if (centerExt !== undefined) {
                    center = `${fullTargetName}-${centerExt}`;
                    fullTargetName = `${fullTargetName}-${leftExt}|${centerExt}|${rightExt}`;
                    name = `${targetName}-${leftExt}|${centerExt}|${rightExt}`;
                }
                else {
                    center = undefined;
                    fullTargetName = `${fullTargetName}-${leftExt}|${rightExt}`;
                    name = `${targetName}-${leftExt}|${rightExt}`;
                }
            }
            else {
                left = undefined;
                right = fullTargetName;
                center = undefined;
                name = targetName;
            }
            super(groupName, name);
            this.targetName = fullTargetName;
            this.left = left;
            this.center = center;
            this.right = right;
            // this load's the target's from the target factory
            this.lTargets = findTargets(this.left);
            this.rTargets = findTargets(this.right);
            this.cTargets = findTargets(this.center);
            // self.macroDependencies = self.findMacroDependencies(self.left)
            // self.macroDependencies.update(self.findMacroDependencies(self.right))
            // self.macroDependencies.update(self.findMacroDependencies(self.center))
            // self.macroDependencies = list(self.macroDependencies)
            // self.targets = self.l_targets + self.r_targets + self.c_targets
            for (const targets of [this.lTargets, this.rTargets, this.cTargets])
                if (targets !== undefined)
                    for (const target of targets)
                        this.targets.push(target);
        }
        getMin() {
            if (this.left !== undefined)
                return -1.0;
            else
                return 0.0;
        }
        getFactors(value) {
            const factors = super.getFactors(value);
            if (this.left !== undefined)
                factors.set(this.left, -Math.min(value, 0));
            if (this.center !== undefined)
                factors.set(this.center, 1.0 - Math.abs(value));
            factors.set(this.right, Math.max(0, value));
            return factors;
        }
    }

    // {
    //     "group": "<groupname>",
    //     "modifiers": [
    //         { "target": ... } |
    //         { "target": ..., "min": ..., "max": ... } |
    //         { "macrovar": ...} |
    //         { "macrovar": ..., "modifierType": ...}, ...
    //     ]
    // }, ...
    // from apps/humanmodifier.py
    function loadModifiers(filename, human) {
        return parseModifiers(FileSystemAdapter.getInstance().readFile(filename), human, filename);
    }
    function parseModifiers(data, human, filename = 'memory') {
        const classesMapping = new Map([
            // ['Modifier', Modifier],
            // ['SimpleModifier', SimpleModifier],
            // ['ManagedTargetModifier', ManagedTargetModifier],
            // ['UniversalModifier', UniversalModifier],
            // ['MacroModifier', MacroModifier],
            ['EthnicModifier', EthnicModifier]
        ]);
        const json = JSON.parse(data);
        const modifiers = new Array();
        const lookup = new Map();
        for (const modifierGroup of json) {
            const groupName = modifierGroup.group;
            for (const modifierDef of modifierGroup.modifiers) {
                let modifierClass;
                let modifier;
                if ('modifierType' in modifierDef) {
                    modifierClass = classesMapping.get(modifierDef.modifierType);
                    if (modifierClass === undefined) {
                        throw Error(`failed to instantiate modifer ${modifierDef.modifierType}`);
                    }
                }
                else if ('macrovar' in modifierDef) {
                    modifierClass = MacroModifier;
                }
                else {
                    modifierClass = UniversalModifier;
                }
                if ('macrovar' in modifierDef) {
                    modifier = new modifierClass(groupName, modifierDef.macrovar);
                    if (!modifier.isMacro()) {
                        console.log(`Expected modifier ${modifierClass.name} to be a macro modifier, but identifies as a regular one. Please check variable category definitions in class Component.`);
                    }
                }
                else {
                    //             modifier = modifierClass(groupName, mDef['target'], mDef.get('min',None), mDef.get('max',None), mDef.get('mid',None))
                    if (modifierClass !== UniversalModifier)
                        throw Error();
                    modifier = new modifierClass(groupName, modifierDef.target, modifierDef.min, modifierDef.max, modifierDef.mid);
                }
                if ('defaultValue' in modifierDef) {
                    modifier.defaultValue = modifierDef.defaultValue;
                }
                if (modifier.fullName === undefined) {
                    console.log(`ERROR: modifier has no fullName`);
                    console.log(modifier);
                }
                modifiers.push(modifier);
                lookup.set(modifier.fullName, modifier);
                // console.log(modifier.fullName)
            }
        }
        if (human !== undefined) {
            for (const modifier of modifiers) {
                modifier.setHuman(human);
            }
        }
        console.log(`Loaded ${modifiers.length} modifiers from file ${filename}`);
        // # Attempt to load modifier descriptions
        // _tmp = os.path.splitext(filename)
        // descFile = _tmp[0]+'_desc'+_tmp[1]
        // hasDesc = OrderedDict([(key,False) for key in lookup.keys()])
        // if os.path.isfile(descFile):
        //     data = json.load(io.open(descFile, 'r', encoding='utf-8'), object_pairs_hook=OrderedDict)
        //     dCount = 0
        //     for mName, mDesc in data.items():
        //         try:
        //             mod = lookup[mName]
        //             mod.description = mDesc
        //             dCount += 1
        //             hasDesc[mName] = True
        //         except:
        //             log.warning("Loaded description for %s but modifier does not exist!", mName)
        //     log.message("Loaded %s modifier descriptions from file %s", dCount, descFile)
        // for mName, mHasDesc in hasDesc.items():
        //     if not mHasDesc:
        //         log.warning("No description defined for modifier %s!", mName)
        return modifiers;
    }

    class SliderNode {
        constructor(label, modifierSpec) {
            SliderNode.count++;
            this.label = label || '';
            this.modifierSpec = modifierSpec;
            if (modifierSpec) {
                // modifier.mod can have values like
                //   buttocks/buttocks-buttocks-volume-decr|incr-decr|incr
                //   stomach/stomach-pregnant-decr|incr
                // human.getModifier(modifier.mod) locates the Modifier for that name
                // for this to work, modifiers need to have been added with human.addModifier(...)
                // in apps/gui/guimodifier.py loadModifierTaskViews
                // class Modifier has getMin() & getMax() to get the range
                const human = Human.getInstance();
                const modifier = human.getModifier(modifierSpec.mod);
                if (modifier !== undefined) {
                    this.model = modifier.getModel();
                    this.model.modified.add(() => {
                        // modifier.setValue(this.model!.value)
                        modifier.updateValue(this.model.value);
                        // self.modifier.updateValue(value, G.app.getSetting('realtimeNormalUpdates'))
                        human.updateProxyMesh(true);
                    });
                    // } else {
                    //     console.log(`SliderNode(): no modifier '${modifierSpec.mod}' found for slider`)
                }
            }
        }
    }
    SliderNode.count = 0;
    function capitalize(s) {
        return s[0].toUpperCase() + s.slice(1);
    }
    function labelFromModifier(groupName, name) {
        const tlabel = name.split('-');
        if (tlabel[tlabel.length - 1].indexOf('|') !== -1)
            tlabel.pop();
        if (tlabel.length > 1 && tlabel[0] === groupName)
            tlabel.shift();
        tlabel[0] = capitalize(tlabel[0]);
        return tlabel.join(' ');
    }
    /*
     * loadSliders() loads data/modifiers/modeling_sliders.json, which contains the ui tree
     * listing containing the "Main", "Gender", "Face", "Torso", "Arms and legs" tabs, containing
     * a slider for each modifier.
     *
     * (the original is located in apps/gui/guimodifier.py)
     */
    function loadSliders(filename) {
        const root = parseSliders(FileSystemAdapter.getInstance().readFile(filename), filename);
        console.log(`Loaded ${SliderNode.count} slider nodes from file ${filename}`);
        return root;
    }
    function parseSliders(data, filename = 'memory') {
        const json = JSON.parse(data);
        let rootNode;
        let lastTabNode;
        for (const [tabKey, tabValue] of Object.entries(json).sort((a, b) => a[1].sortOrder - b[1].sortOrder)) {
            const tab = tabValue;
            let label = tabKey;
            if (tab.label !== undefined)
                label = tab.label;
            const tabNode = new SliderNode(label);
            tabNode.category = tab;
            if (lastTabNode)
                lastTabNode.next = tabNode;
            else
                rootNode = tabNode;
            lastTabNode = tabNode;
            let lastCategoryNode;
            for (const [categoryKey, categoryValue] of Object.entries(tab.modifiers)) {
                const categoryNode = new SliderNode(capitalize(categoryKey));
                if (lastCategoryNode)
                    lastCategoryNode.next = categoryNode;
                else
                    lastTabNode.down = categoryNode;
                lastCategoryNode = categoryNode;
                let lastSliderNode;
                for (const modifier of categoryValue) {
                    let label = modifier.label;
                    if (label === undefined) {
                        const name = modifier.mod.split('/');
                        label = labelFromModifier(name[0], name[1]);
                    }
                    const sliderNode = new SliderNode(label, modifier);
                    if (lastSliderNode)
                        lastSliderNode.next = sliderNode;
                    else
                        lastCategoryNode.down = sliderNode;
                    lastSliderNode = sliderNode;
                }
            }
        }
        if (rootNode === undefined)
            throw Error('No sliders found.');
        return rootNode;
    }

    /******************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    class Group {
        constructor(name, start) {
            this.name = name;
            this.startIndex = start;
            this.length = 0;
        }
    }

    class WavefrontObj {
        constructor() {
            this.vertex = new Array();
            this.indices = new Array();
            this.groups = new Array();
        }
        load(filename) {
            return __awaiter(this, void 0, void 0, function* () {
                const data = FileSystemAdapter.getInstance().readFile(filename);
                const vertex = new Array();
                const indices = new Array();
                const reader = new StringToLine(data);
                //  const reader = readline.createInterface(input)
                let lineNumber = 0;
                for (let line of reader) {
                    ++lineNumber;
                    // console.log(line)
                    line = line.trim();
                    if (line.length === 0)
                        continue;
                    if (line[0] === '#')
                        continue;
                    const tokens = line.split(/\s+/);
                    switch (tokens[0]) {
                        // vertex data
                        case 'v': // vertex X Y Z [W]
                            if (tokens.length < 4)
                                throw Error(`Too few arguments in ${line}`);
                            if (tokens.length > 5)
                                throw Error(`Too many arguments in ${line}`);
                            vertex.push(parseFloat(tokens[1]));
                            vertex.push(parseFloat(tokens[2]));
                            vertex.push(parseFloat(tokens[3]));
                            if (tokens.length === 5)
                                throw Error('Can\'t handle vertex with weight yet...');
                            //     vertex.push(parseFloat(tokens[4]))
                            // else
                            //     vertex.push(1)
                            break;
                        case 'vt': // vectex texture U V W
                            // ignored for now
                            break;
                        case 'vn': break; // vertex normal I J K
                        case 'vp': break; // vertext parameter space U V W
                        // free-form curve/surface attributes
                        case 'deg': break;
                        case 'bmat': break;
                        case 'step': break;
                        case 'cstype': break;
                        // elements
                        case 'p': break; // point
                        case 'l': break; // line
                        case 'f': // face( vertex[/[texture][/normal]])+
                            if (tokens.length !== 5)
                                throw Error(`can't handle faces which are not quads yet (line ${lineNumber}: '${line}'}`);
                            // CONVERT QUAD INTO TRIANGLE FOR WEBGL
                            // 0   1
                            //
                            // 3   2
                            for (let i = 1; i < tokens.length; ++i) {
                                const split = tokens[i].split('/');
                                indices.push(parseInt(split[0], 10) - 1);
                            }
                            const idx = indices.length - 4;
                            indices.push(indices[idx + 0]);
                            indices.push(indices[idx + 2]);
                            break;
                        case 'curv': break; // curve
                        case 'curv2': break; // 2d curve
                        case 'surf': break; // surface
                        // free-form curve/surface body statements
                        case 'parm': break;
                        case 'trim': break;
                        case 'hole': break;
                        case 'scrv': break;
                        case 'sp': break;
                        case 'end': break;
                        // connectivity between free-form surfaces
                        case 'con': break;
                        // grouping
                        case 'g': // <groupname>+ the following elements belong to that group
                            this.groups.push(new Group(tokens[1], indices.length));
                            break;
                        case 's': break;
                        case 'mg': break;
                        case 'o': break;
                        // display/render attributes
                        case 'bevel': break;
                        case 'c_interp': break;
                        case 'd_interp': break;
                        case 'lod': break;
                        case 'usemtl': // <materialname>
                            break;
                        case 'mtllib': break;
                        case 'shadow_obj': break;
                        case 'trace_obj': break;
                        case 'ctech': break;
                        case 'stech': break;
                        default:
                            throw Error(`Unknown keyword '${tokens[0]}' in Wavefront OBJ file in line '${line}' of length ${line.length}'.`);
                    }
                }
                this.vertex = vertex;
                this.indices = indices;
                for (let i = 0; i < this.groups.length - 1; ++i) {
                    this.groups[i].length = this.groups[i + 1].startIndex - this.groups[i].startIndex;
                }
                this.groups[this.groups.length - 1].length = indices.length - this.groups[this.groups.length - 1].startIndex;
                this.logStatistics(filename);
            });
        }
        logStatistics(filename) {
            let groupNames = "";
            let joints = 0;
            let helpers = 0;
            this.groups.forEach(g => {
                if (g.name.startsWith("joint-")) {
                    ++joints;
                }
                else if (g.name.startsWith("helper-")) {
                    ++helpers;
                }
                else {
                    if (groupNames.length === 0) {
                        groupNames = g.name;
                    }
                    else {
                        groupNames = `${groupNames}, ${g.name}`;
                    }
                }
            });
            console.log(`Loaded ${this.groups.length} groups (${joints} joints, ${helpers} helpers and ${groupNames}), ${this.vertex.length / 3} vertices, ${this.indices.length / 3} triangles from file '${filename}'`);
        }
    }

    let epsilon = 0.000000001;
    function isZero(a) {
        return Math.abs(a) <= epsilon;
    }
    class HumanMesh {
        constructor(human, obj) {
            this.updateRequired = false;
            this.human = human;
            this.obj = obj;
            this.vertex = this.origVertex = obj.vertex;
            this.indices = obj.indices;
            this.groups = obj.groups;
        }
        update() {
            if (!this.updateRequired) {
                return;
            }
            this.updateRequired = false;
            this.vertex = [...this.origVertex];
            this.human.targetsDetailStack.forEach((value, targetName) => {
                if (isNaN(value)) {
                    // console.log(`HumanMesh.update(): ignoring target ${targetName} with value NaN`)
                    return;
                }
                if (isZero(value) || isNaN(value))
                    return;
                // console.log(`HumanMesh.update(): apply target ${targetName} with value ${value}`)
                const target = getTarget(targetName);
                target.apply(this.vertex, value);
            });
            // const stomachPregnantIncr = new Target()
            // stomachPregnantIncr.load('data/targets/stomach/stomach-pregnant-incr.target')
            // stomachPregnantIncr.apply(scene.vertex, 1)
            // const breastVolumeVertUp = new Target()
            // breastVolumeVertUp.load('data/targets/breast/female-young-averagemuscle-averageweight-maxcup-averagefirmness.target')
            // breastVolumeVertUp.apply(scene.vertex, 1)
            // const buttocks = new Target()
            // buttocks.load('data/targets/buttocks/buttocks-volume-incr.target')
            // buttocks.apply(scene.vertex, 1)
        }
    }

    var Mode;
    (function (Mode) {
        Mode[Mode["MORPH"] = 0] = "MORPH";
        Mode[Mode["POSE"] = 1] = "POSE";
    })(Mode || (Mode = {}));

    // DEFLATE is a complex format; to read this code, you should probably check the RFC first:

    // aliases for shorter compressed code (most minifers don't do this)
    var u8 = Uint8Array, u16 = Uint16Array, u32 = Uint32Array;
    // fixed length extra bits
    var fleb = new u8([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, /* unused */ 0, 0, /* impossible */ 0]);
    // fixed distance extra bits
    // see fleb note
    var fdeb = new u8([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, /* unused */ 0, 0]);
    // code length index map
    var clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
    // get base, reverse index map from extra bits
    var freb = function (eb, start) {
        var b = new u16(31);
        for (var i = 0; i < 31; ++i) {
            b[i] = start += 1 << eb[i - 1];
        }
        // numbers here are at max 18 bits
        var r = new u32(b[30]);
        for (var i = 1; i < 30; ++i) {
            for (var j = b[i]; j < b[i + 1]; ++j) {
                r[j] = ((j - b[i]) << 5) | i;
            }
        }
        return [b, r];
    };
    var _a = freb(fleb, 2), fl = _a[0], revfl = _a[1];
    // we can ignore the fact that the other numbers are wrong; they never happen anyway
    fl[28] = 258, revfl[258] = 28;
    var _b = freb(fdeb, 0), fd = _b[0];
    // map of value to reverse (assuming 16 bits)
    var rev = new u16(32768);
    for (var i = 0; i < 32768; ++i) {
        // reverse table algorithm from SO
        var x = ((i & 0xAAAA) >>> 1) | ((i & 0x5555) << 1);
        x = ((x & 0xCCCC) >>> 2) | ((x & 0x3333) << 2);
        x = ((x & 0xF0F0) >>> 4) | ((x & 0x0F0F) << 4);
        rev[i] = (((x & 0xFF00) >>> 8) | ((x & 0x00FF) << 8)) >>> 1;
    }
    // create huffman tree from u8 "map": index -> code length for code index
    // mb (max bits) must be at most 15
    // TODO: optimize/split up?
    var hMap = (function (cd, mb, r) {
        var s = cd.length;
        // index
        var i = 0;
        // u16 "map": index -> # of codes with bit length = index
        var l = new u16(mb);
        // length of cd must be 288 (total # of codes)
        for (; i < s; ++i) {
            if (cd[i])
                ++l[cd[i] - 1];
        }
        // u16 "map": index -> minimum code for bit length = index
        var le = new u16(mb);
        for (i = 0; i < mb; ++i) {
            le[i] = (le[i - 1] + l[i - 1]) << 1;
        }
        var co;
        if (r) {
            // u16 "map": index -> number of actual bits, symbol for code
            co = new u16(1 << mb);
            // bits to remove for reverser
            var rvb = 15 - mb;
            for (i = 0; i < s; ++i) {
                // ignore 0 lengths
                if (cd[i]) {
                    // num encoding both symbol and bits read
                    var sv = (i << 4) | cd[i];
                    // free bits
                    var r_1 = mb - cd[i];
                    // start value
                    var v = le[cd[i] - 1]++ << r_1;
                    // m is end value
                    for (var m = v | ((1 << r_1) - 1); v <= m; ++v) {
                        // every 16 bit value starting with the code yields the same result
                        co[rev[v] >>> rvb] = sv;
                    }
                }
            }
        }
        else {
            co = new u16(s);
            for (i = 0; i < s; ++i) {
                if (cd[i]) {
                    co[i] = rev[le[cd[i] - 1]++] >>> (15 - cd[i]);
                }
            }
        }
        return co;
    });
    // fixed length tree
    var flt = new u8(288);
    for (var i = 0; i < 144; ++i)
        flt[i] = 8;
    for (var i = 144; i < 256; ++i)
        flt[i] = 9;
    for (var i = 256; i < 280; ++i)
        flt[i] = 7;
    for (var i = 280; i < 288; ++i)
        flt[i] = 8;
    // fixed distance tree
    var fdt = new u8(32);
    for (var i = 0; i < 32; ++i)
        fdt[i] = 5;
    // fixed length map
    var flrm = /*#__PURE__*/ hMap(flt, 9, 1);
    // fixed distance map
    var fdrm = /*#__PURE__*/ hMap(fdt, 5, 1);
    // find max of array
    var max = function (a) {
        var m = a[0];
        for (var i = 1; i < a.length; ++i) {
            if (a[i] > m)
                m = a[i];
        }
        return m;
    };
    // read d, starting at bit p and mask with m
    var bits = function (d, p, m) {
        var o = (p / 8) | 0;
        return ((d[o] | (d[o + 1] << 8)) >> (p & 7)) & m;
    };
    // read d, starting at bit p continuing for at least 16 bits
    var bits16 = function (d, p) {
        var o = (p / 8) | 0;
        return ((d[o] | (d[o + 1] << 8) | (d[o + 2] << 16)) >> (p & 7));
    };
    // get end of byte
    var shft = function (p) { return ((p + 7) / 8) | 0; };
    // typed array slice - allows garbage collector to free original reference,
    // while being more compatible than .slice
    var slc = function (v, s, e) {
        if (s == null || s < 0)
            s = 0;
        if (e == null || e > v.length)
            e = v.length;
        // can't use .constructor in case user-supplied
        var n = new (v.BYTES_PER_ELEMENT == 2 ? u16 : v.BYTES_PER_ELEMENT == 4 ? u32 : u8)(e - s);
        n.set(v.subarray(s, e));
        return n;
    };
    // error codes
    var ec = [
        'unexpected EOF',
        'invalid block type',
        'invalid length/literal',
        'invalid distance',
        'stream finished',
        'no stream handler',
        ,
        'no callback',
        'invalid UTF-8 data',
        'extra field too long',
        'date not in range 1980-2099',
        'filename too long',
        'stream finishing',
        'invalid zip data'
        // determined by unknown compression method
    ];
    var err = function (ind, msg, nt) {
        var e = new Error(msg || ec[ind]);
        e.code = ind;
        if (Error.captureStackTrace)
            Error.captureStackTrace(e, err);
        if (!nt)
            throw e;
        return e;
    };
    // expands raw DEFLATE data
    var inflt = function (dat, buf, st) {
        // source length
        var sl = dat.length;
        if (!sl || (st && st.f && !st.l))
            return buf || new u8(0);
        // have to estimate size
        var noBuf = !buf || st;
        // no state
        var noSt = !st || st.i;
        if (!st)
            st = {};
        // Assumes roughly 33% compression ratio average
        if (!buf)
            buf = new u8(sl * 3);
        // ensure buffer can fit at least l elements
        var cbuf = function (l) {
            var bl = buf.length;
            // need to increase size to fit
            if (l > bl) {
                // Double or set to necessary, whichever is greater
                var nbuf = new u8(Math.max(bl * 2, l));
                nbuf.set(buf);
                buf = nbuf;
            }
        };
        //  last chunk         bitpos           bytes
        var final = st.f || 0, pos = st.p || 0, bt = st.b || 0, lm = st.l, dm = st.d, lbt = st.m, dbt = st.n;
        // total bits
        var tbts = sl * 8;
        do {
            if (!lm) {
                // BFINAL - this is only 1 when last chunk is next
                final = bits(dat, pos, 1);
                // type: 0 = no compression, 1 = fixed huffman, 2 = dynamic huffman
                var type = bits(dat, pos + 1, 3);
                pos += 3;
                if (!type) {
                    // go to end of byte boundary
                    var s = shft(pos) + 4, l = dat[s - 4] | (dat[s - 3] << 8), t = s + l;
                    if (t > sl) {
                        if (noSt)
                            err(0);
                        break;
                    }
                    // ensure size
                    if (noBuf)
                        cbuf(bt + l);
                    // Copy over uncompressed data
                    buf.set(dat.subarray(s, t), bt);
                    // Get new bitpos, update byte count
                    st.b = bt += l, st.p = pos = t * 8, st.f = final;
                    continue;
                }
                else if (type == 1)
                    lm = flrm, dm = fdrm, lbt = 9, dbt = 5;
                else if (type == 2) {
                    //  literal                            lengths
                    var hLit = bits(dat, pos, 31) + 257, hcLen = bits(dat, pos + 10, 15) + 4;
                    var tl = hLit + bits(dat, pos + 5, 31) + 1;
                    pos += 14;
                    // length+distance tree
                    var ldt = new u8(tl);
                    // code length tree
                    var clt = new u8(19);
                    for (var i = 0; i < hcLen; ++i) {
                        // use index map to get real code
                        clt[clim[i]] = bits(dat, pos + i * 3, 7);
                    }
                    pos += hcLen * 3;
                    // code lengths bits
                    var clb = max(clt), clbmsk = (1 << clb) - 1;
                    // code lengths map
                    var clm = hMap(clt, clb, 1);
                    for (var i = 0; i < tl;) {
                        var r = clm[bits(dat, pos, clbmsk)];
                        // bits read
                        pos += r & 15;
                        // symbol
                        var s = r >>> 4;
                        // code length to copy
                        if (s < 16) {
                            ldt[i++] = s;
                        }
                        else {
                            //  copy   count
                            var c = 0, n = 0;
                            if (s == 16)
                                n = 3 + bits(dat, pos, 3), pos += 2, c = ldt[i - 1];
                            else if (s == 17)
                                n = 3 + bits(dat, pos, 7), pos += 3;
                            else if (s == 18)
                                n = 11 + bits(dat, pos, 127), pos += 7;
                            while (n--)
                                ldt[i++] = c;
                        }
                    }
                    //    length tree                 distance tree
                    var lt = ldt.subarray(0, hLit), dt = ldt.subarray(hLit);
                    // max length bits
                    lbt = max(lt);
                    // max dist bits
                    dbt = max(dt);
                    lm = hMap(lt, lbt, 1);
                    dm = hMap(dt, dbt, 1);
                }
                else
                    err(1);
                if (pos > tbts) {
                    if (noSt)
                        err(0);
                    break;
                }
            }
            // Make sure the buffer can hold this + the largest possible addition
            // Maximum chunk size (practically, theoretically infinite) is 2^17;
            if (noBuf)
                cbuf(bt + 131072);
            var lms = (1 << lbt) - 1, dms = (1 << dbt) - 1;
            var lpos = pos;
            for (;; lpos = pos) {
                // bits read, code
                var c = lm[bits16(dat, pos) & lms], sym = c >>> 4;
                pos += c & 15;
                if (pos > tbts) {
                    if (noSt)
                        err(0);
                    break;
                }
                if (!c)
                    err(2);
                if (sym < 256)
                    buf[bt++] = sym;
                else if (sym == 256) {
                    lpos = pos, lm = null;
                    break;
                }
                else {
                    var add = sym - 254;
                    // no extra bits needed if less
                    if (sym > 264) {
                        // index
                        var i = sym - 257, b = fleb[i];
                        add = bits(dat, pos, (1 << b) - 1) + fl[i];
                        pos += b;
                    }
                    // dist
                    var d = dm[bits16(dat, pos) & dms], dsym = d >>> 4;
                    if (!d)
                        err(3);
                    pos += d & 15;
                    var dt = fd[dsym];
                    if (dsym > 3) {
                        var b = fdeb[dsym];
                        dt += bits16(dat, pos) & ((1 << b) - 1), pos += b;
                    }
                    if (pos > tbts) {
                        if (noSt)
                            err(0);
                        break;
                    }
                    if (noBuf)
                        cbuf(bt + 131072);
                    var end = bt + add;
                    for (; bt < end; bt += 4) {
                        buf[bt] = buf[bt - dt];
                        buf[bt + 1] = buf[bt + 1 - dt];
                        buf[bt + 2] = buf[bt + 2 - dt];
                        buf[bt + 3] = buf[bt + 3 - dt];
                    }
                    bt = end;
                }
            }
            st.l = lm, st.p = lpos, st.b = bt, st.f = final;
            if (lm)
                final = 1, st.m = lbt, st.d = dm, st.n = dbt;
        } while (!final);
        return bt == buf.length ? buf : slc(buf, 0, bt);
    };
    // empty
    var et = /*#__PURE__*/ new u8(0);
    // zlib valid
    var zlv = function (d) {
        if ((d[0] & 15) != 8 || (d[0] >>> 4) > 7 || ((d[0] << 8 | d[1]) % 31))
            err(6, 'invalid zlib data');
        if (d[1] & 32)
            err(6, 'invalid zlib data: preset dictionaries not supported');
    };
    /**
     * Expands Zlib data
     * @param data The data to decompress
     * @param out Where to write the data. Saves memory if you know the decompressed size and provide an output buffer of that length.
     * @returns The decompressed version of the data
     */
    function unzlibSync(data, out) {
        return inflt((zlv(data), data.subarray(2, -4)), out);
    }
    // text decoder
    var td = typeof TextDecoder != 'undefined' && /*#__PURE__*/ new TextDecoder();
    // text decoder stream
    var tds = 0;
    try {
        td.decode(et, { stream: true });
        tds = 1;
    }
    catch (e) { }

    class HTTPFSAdapter {
        readFile(pathname) {
            // if (HTTPFSAdapter.path2info.has(`${pathname.substring(5)}.z`) || // strip "data/"
            //     HTTPFSAdapter.path2info.has(`${pathname.substring(6)}.z`) // // strip "data//"
            // ) {
            //     return this.readFile(`${pathname}.z`)
            // }
            if (pathname.endsWith(".z")) {
                // console.log(`load compressed file ${pathname}`)
                const req = new XMLHttpRequest();
                req.overrideMimeType('text/plain; charset=x-user-defined');
                req.open('GET', pathname, false);
                req.send(null);
                if (req.status > 400) {
                    throw new Error(`Request failed for '${pathname}': ${req.statusText}`);
                }
                const ab = new ArrayBuffer(req.responseText.length);
                const ua = new Uint8Array(ab);
                for (let i = 0; i < req.responseText.length; ++i) {
                    ua[i] = req.responseText.charCodeAt(i);
                }
                const dec = new TextDecoder("utf-8");
                return dec.decode(unzlibSync(ua));
            }
            else {
                if (pathname.endsWith("/directory.json")) {
                    // console.log(`load uncompressed file ${pathname}`)
                    const req = new XMLHttpRequest();
                    req.open('GET', pathname, false);
                    req.send(null);
                    if (req.status < 400)
                        return req.responseText;
                    throw new Error(`Request failed for '${pathname}': ${req.statusText}`);
                }
                else {
                    return this.readFile(`${pathname}.z`);
                }
            }
        }
        isFile(pathname) {
            // console.log(`HTTPJSFSAdapter.isFile('${pathname}')`)
            let info = HTTPFSAdapter.path2info.get(pathname);
            if (info === undefined) {
                try {
                    this.listDir(pathname);
                }
                catch (e) {
                    console.log(`failed to load directory ${pathname}`);
                    HTTPFSAdapter.path2info.forEach((value, key) => console.log(key, value));
                    throw Error();
                }
                info = HTTPFSAdapter.path2info.get(pathname);
            }
            if (info === undefined) {
                throw Error(`HTTPJSFSAdapter.isFile('${pathname}')`);
            }
            return !info.isDir;
        }
        isDir(pathname) {
            // console.log(`HTTPJSFSAdapter.isDir('${pathname}')`)
            const info = HTTPFSAdapter.path2info.get(pathname);
            if (info === undefined) {
                throw Error(`HTTPJSFSAdapter.isFile('${pathname}')`);
            }
            return info.isDir;
        }
        listDir(pathname) {
            // console.log(`HTTPJSFSAdapter.listDir('${pathname}')`)
            let info = HTTPFSAdapter.path2info.get(pathname);
            if (info !== undefined && info.dir !== undefined) {
                return info.dir;
            }
            if (info === undefined)
                info = { file: '', isDir: true, dir: undefined };
            const d = this.readFile(`data/${pathname}/directory.json`);
            const j = JSON.parse(d);
            info.dir = [];
            for (const x of j) {
                const fullfile = `${pathname}/${x.file}`;
                // console.log(`${pathname}/${x.file}`)
                info.dir.push(x.file);
                if (!x.isDir)
                    HTTPFSAdapter.path2info.set(fullfile, { file: x.file, isDir: false });
            }
            HTTPFSAdapter.path2info.set(pathname, info);
            return info.dir;
        }
        realPath(pathname) {
            // console.log(`HTTPJSFSAdapter.realPath('${pathname}')`)
            // throw Error()
            return pathname;
        }
        joinPath(pathname1, pathname2) {
            // console.log(`HTTPJSFSAdapter.joinPath('${pathname1}', '${pathname2}')`)
            return `${pathname1}/${pathname2}`;
        }
    }
    HTTPFSAdapter.path2info = new Map();

    /**
     * Common utilities
     * @module glMatrix
     */
    // Configuration Constants
    var EPSILON = 0.000001;
    var ARRAY_TYPE = typeof Float32Array !== 'undefined' ? Float32Array : Array;
    if (!Math.hypot) Math.hypot = function () {
      var y = 0,
          i = arguments.length;

      while (i--) {
        y += arguments[i] * arguments[i];
      }

      return Math.sqrt(y);
    };

    /**
     * 3x3 Matrix
     * @module mat3
     */

    /**
     * Creates a new identity mat3
     *
     * @returns {mat3} a new 3x3 matrix
     */

    function create$5() {
      var out = new ARRAY_TYPE(9);

      if (ARRAY_TYPE != Float32Array) {
        out[1] = 0;
        out[2] = 0;
        out[3] = 0;
        out[5] = 0;
        out[6] = 0;
        out[7] = 0;
      }

      out[0] = 1;
      out[4] = 1;
      out[8] = 1;
      return out;
    }

    /**
     * 4x4 Matrix<br>Format: column-major, when typed out it looks like row-major<br>The matrices are being post multiplied.
     * @module mat4
     */

    /**
     * Creates a new identity mat4
     *
     * @returns {mat4} a new 4x4 matrix
     */

    function create$4() {
      var out = new ARRAY_TYPE(16);

      if (ARRAY_TYPE != Float32Array) {
        out[1] = 0;
        out[2] = 0;
        out[3] = 0;
        out[4] = 0;
        out[6] = 0;
        out[7] = 0;
        out[8] = 0;
        out[9] = 0;
        out[11] = 0;
        out[12] = 0;
        out[13] = 0;
        out[14] = 0;
      }

      out[0] = 1;
      out[5] = 1;
      out[10] = 1;
      out[15] = 1;
      return out;
    }
    /**
     * Transpose the values of a mat4
     *
     * @param {mat4} out the receiving matrix
     * @param {ReadonlyMat4} a the source matrix
     * @returns {mat4} out
     */

    function transpose(out, a) {
      // If we are transposing ourselves we can skip a few steps but have to cache some values
      if (out === a) {
        var a01 = a[1],
            a02 = a[2],
            a03 = a[3];
        var a12 = a[6],
            a13 = a[7];
        var a23 = a[11];
        out[1] = a[4];
        out[2] = a[8];
        out[3] = a[12];
        out[4] = a01;
        out[6] = a[9];
        out[7] = a[13];
        out[8] = a02;
        out[9] = a12;
        out[11] = a[14];
        out[12] = a03;
        out[13] = a13;
        out[14] = a23;
      } else {
        out[0] = a[0];
        out[1] = a[4];
        out[2] = a[8];
        out[3] = a[12];
        out[4] = a[1];
        out[5] = a[5];
        out[6] = a[9];
        out[7] = a[13];
        out[8] = a[2];
        out[9] = a[6];
        out[10] = a[10];
        out[11] = a[14];
        out[12] = a[3];
        out[13] = a[7];
        out[14] = a[11];
        out[15] = a[15];
      }

      return out;
    }
    /**
     * Inverts a mat4
     *
     * @param {mat4} out the receiving matrix
     * @param {ReadonlyMat4} a the source matrix
     * @returns {mat4} out
     */

    function invert(out, a) {
      var a00 = a[0],
          a01 = a[1],
          a02 = a[2],
          a03 = a[3];
      var a10 = a[4],
          a11 = a[5],
          a12 = a[6],
          a13 = a[7];
      var a20 = a[8],
          a21 = a[9],
          a22 = a[10],
          a23 = a[11];
      var a30 = a[12],
          a31 = a[13],
          a32 = a[14],
          a33 = a[15];
      var b00 = a00 * a11 - a01 * a10;
      var b01 = a00 * a12 - a02 * a10;
      var b02 = a00 * a13 - a03 * a10;
      var b03 = a01 * a12 - a02 * a11;
      var b04 = a01 * a13 - a03 * a11;
      var b05 = a02 * a13 - a03 * a12;
      var b06 = a20 * a31 - a21 * a30;
      var b07 = a20 * a32 - a22 * a30;
      var b08 = a20 * a33 - a23 * a30;
      var b09 = a21 * a32 - a22 * a31;
      var b10 = a21 * a33 - a23 * a31;
      var b11 = a22 * a33 - a23 * a32; // Calculate the determinant

      var det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

      if (!det) {
        return null;
      }

      det = 1.0 / det;
      out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
      out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
      out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
      out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
      out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
      out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
      out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
      out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
      out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
      out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
      out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
      out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
      out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
      out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
      out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
      out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
      return out;
    }
    /**
     * Translate a mat4 by the given vector
     *
     * @param {mat4} out the receiving matrix
     * @param {ReadonlyMat4} a the matrix to translate
     * @param {ReadonlyVec3} v vector to translate by
     * @returns {mat4} out
     */

    function translate(out, a, v) {
      var x = v[0],
          y = v[1],
          z = v[2];
      var a00, a01, a02, a03;
      var a10, a11, a12, a13;
      var a20, a21, a22, a23;

      if (a === out) {
        out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
        out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
        out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
        out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
      } else {
        a00 = a[0];
        a01 = a[1];
        a02 = a[2];
        a03 = a[3];
        a10 = a[4];
        a11 = a[5];
        a12 = a[6];
        a13 = a[7];
        a20 = a[8];
        a21 = a[9];
        a22 = a[10];
        a23 = a[11];
        out[0] = a00;
        out[1] = a01;
        out[2] = a02;
        out[3] = a03;
        out[4] = a10;
        out[5] = a11;
        out[6] = a12;
        out[7] = a13;
        out[8] = a20;
        out[9] = a21;
        out[10] = a22;
        out[11] = a23;
        out[12] = a00 * x + a10 * y + a20 * z + a[12];
        out[13] = a01 * x + a11 * y + a21 * z + a[13];
        out[14] = a02 * x + a12 * y + a22 * z + a[14];
        out[15] = a03 * x + a13 * y + a23 * z + a[15];
      }

      return out;
    }
    /**
     * Rotates a mat4 by the given angle around the given axis
     *
     * @param {mat4} out the receiving matrix
     * @param {ReadonlyMat4} a the matrix to rotate
     * @param {Number} rad the angle to rotate the matrix by
     * @param {ReadonlyVec3} axis the axis to rotate around
     * @returns {mat4} out
     */

    function rotate(out, a, rad, axis) {
      var x = axis[0],
          y = axis[1],
          z = axis[2];
      var len = Math.hypot(x, y, z);
      var s, c, t;
      var a00, a01, a02, a03;
      var a10, a11, a12, a13;
      var a20, a21, a22, a23;
      var b00, b01, b02;
      var b10, b11, b12;
      var b20, b21, b22;

      if (len < EPSILON) {
        return null;
      }

      len = 1 / len;
      x *= len;
      y *= len;
      z *= len;
      s = Math.sin(rad);
      c = Math.cos(rad);
      t = 1 - c;
      a00 = a[0];
      a01 = a[1];
      a02 = a[2];
      a03 = a[3];
      a10 = a[4];
      a11 = a[5];
      a12 = a[6];
      a13 = a[7];
      a20 = a[8];
      a21 = a[9];
      a22 = a[10];
      a23 = a[11]; // Construct the elements of the rotation matrix

      b00 = x * x * t + c;
      b01 = y * x * t + z * s;
      b02 = z * x * t - y * s;
      b10 = x * y * t - z * s;
      b11 = y * y * t + c;
      b12 = z * y * t + x * s;
      b20 = x * z * t + y * s;
      b21 = y * z * t - x * s;
      b22 = z * z * t + c; // Perform rotation-specific matrix multiplication

      out[0] = a00 * b00 + a10 * b01 + a20 * b02;
      out[1] = a01 * b00 + a11 * b01 + a21 * b02;
      out[2] = a02 * b00 + a12 * b01 + a22 * b02;
      out[3] = a03 * b00 + a13 * b01 + a23 * b02;
      out[4] = a00 * b10 + a10 * b11 + a20 * b12;
      out[5] = a01 * b10 + a11 * b11 + a21 * b12;
      out[6] = a02 * b10 + a12 * b11 + a22 * b12;
      out[7] = a03 * b10 + a13 * b11 + a23 * b12;
      out[8] = a00 * b20 + a10 * b21 + a20 * b22;
      out[9] = a01 * b20 + a11 * b21 + a21 * b22;
      out[10] = a02 * b20 + a12 * b21 + a22 * b22;
      out[11] = a03 * b20 + a13 * b21 + a23 * b22;

      if (a !== out) {
        // If the source and destination differ, copy the unchanged last row
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
      }

      return out;
    }
    /**
     * Generates a perspective projection matrix with the given bounds.
     * The near/far clip planes correspond to a normalized device coordinate Z range of [-1, 1],
     * which matches WebGL/OpenGL's clip volume.
     * Passing null/undefined/no value for far will generate infinite projection matrix.
     *
     * @param {mat4} out mat4 frustum matrix will be written into
     * @param {number} fovy Vertical field of view in radians
     * @param {number} aspect Aspect ratio. typically viewport width/height
     * @param {number} near Near bound of the frustum
     * @param {number} far Far bound of the frustum, can be null or Infinity
     * @returns {mat4} out
     */

    function perspectiveNO(out, fovy, aspect, near, far) {
      var f = 1.0 / Math.tan(fovy / 2),
          nf;
      out[0] = f / aspect;
      out[1] = 0;
      out[2] = 0;
      out[3] = 0;
      out[4] = 0;
      out[5] = f;
      out[6] = 0;
      out[7] = 0;
      out[8] = 0;
      out[9] = 0;
      out[11] = -1;
      out[12] = 0;
      out[13] = 0;
      out[15] = 0;

      if (far != null && far !== Infinity) {
        nf = 1 / (near - far);
        out[10] = (far + near) * nf;
        out[14] = 2 * far * near * nf;
      } else {
        out[10] = -1;
        out[14] = -2 * near;
      }

      return out;
    }
    /**
     * Alias for {@link mat4.perspectiveNO}
     * @function
     */

    var perspective = perspectiveNO;

    /**
     * 3 Dimensional Vector
     * @module vec3
     */

    /**
     * Creates a new, empty vec3
     *
     * @returns {vec3} a new 3D vector
     */

    function create$3() {
      var out = new ARRAY_TYPE(3);

      if (ARRAY_TYPE != Float32Array) {
        out[0] = 0;
        out[1] = 0;
        out[2] = 0;
      }

      return out;
    }
    /**
     * Calculates the length of a vec3
     *
     * @param {ReadonlyVec3} a vector to calculate length of
     * @returns {Number} length of a
     */

    function length(a) {
      var x = a[0];
      var y = a[1];
      var z = a[2];
      return Math.hypot(x, y, z);
    }
    /**
     * Creates a new vec3 initialized with the given values
     *
     * @param {Number} x X component
     * @param {Number} y Y component
     * @param {Number} z Z component
     * @returns {vec3} a new 3D vector
     */

    function fromValues(x, y, z) {
      var out = new ARRAY_TYPE(3);
      out[0] = x;
      out[1] = y;
      out[2] = z;
      return out;
    }
    /**
     * Adds two vec3's
     *
     * @param {vec3} out the receiving vector
     * @param {ReadonlyVec3} a the first operand
     * @param {ReadonlyVec3} b the second operand
     * @returns {vec3} out
     */

    function add(out, a, b) {
      out[0] = a[0] + b[0];
      out[1] = a[1] + b[1];
      out[2] = a[2] + b[2];
      return out;
    }
    /**
     * Subtracts vector b from vector a
     *
     * @param {vec3} out the receiving vector
     * @param {ReadonlyVec3} a the first operand
     * @param {ReadonlyVec3} b the second operand
     * @returns {vec3} out
     */

    function subtract(out, a, b) {
      out[0] = a[0] - b[0];
      out[1] = a[1] - b[1];
      out[2] = a[2] - b[2];
      return out;
    }
    /**
     * Scales a vec3 by a scalar number
     *
     * @param {vec3} out the receiving vector
     * @param {ReadonlyVec3} a the vector to scale
     * @param {Number} b amount to scale the vector by
     * @returns {vec3} out
     */

    function scale(out, a, b) {
      out[0] = a[0] * b;
      out[1] = a[1] * b;
      out[2] = a[2] * b;
      return out;
    }
    /**
     * Normalize a vec3
     *
     * @param {vec3} out the receiving vector
     * @param {ReadonlyVec3} a vector to normalize
     * @returns {vec3} out
     */

    function normalize$2(out, a) {
      var x = a[0];
      var y = a[1];
      var z = a[2];
      var len = x * x + y * y + z * z;

      if (len > 0) {
        //TODO: evaluate use of glm_invsqrt here?
        len = 1 / Math.sqrt(len);
      }

      out[0] = a[0] * len;
      out[1] = a[1] * len;
      out[2] = a[2] * len;
      return out;
    }
    /**
     * Calculates the dot product of two vec3's
     *
     * @param {ReadonlyVec3} a the first operand
     * @param {ReadonlyVec3} b the second operand
     * @returns {Number} dot product of a and b
     */

    function dot(a, b) {
      return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    }
    /**
     * Computes the cross product of two vec3's
     *
     * @param {vec3} out the receiving vector
     * @param {ReadonlyVec3} a the first operand
     * @param {ReadonlyVec3} b the second operand
     * @returns {vec3} out
     */

    function cross(out, a, b) {
      var ax = a[0],
          ay = a[1],
          az = a[2];
      var bx = b[0],
          by = b[1],
          bz = b[2];
      out[0] = ay * bz - az * by;
      out[1] = az * bx - ax * bz;
      out[2] = ax * by - ay * bx;
      return out;
    }
    /**
     * Alias for {@link vec3.length}
     * @function
     */

    var len = length;
    /**
     * Perform some operation over an array of vec3s.
     *
     * @param {Array} a the array of vectors to iterate over
     * @param {Number} stride Number of elements between the start of each vec3. If 0 assumes tightly packed
     * @param {Number} offset Number of elements to skip at the beginning of the array
     * @param {Number} count Number of vec3s to iterate over. If 0 iterates over entire array
     * @param {Function} fn Function to call for each vector in the array
     * @param {Object} [arg] additional argument to pass to fn
     * @returns {Array} a
     * @function
     */

    (function () {
      var vec = create$3();
      return function (a, stride, offset, count, fn, arg) {
        var i, l;

        if (!stride) {
          stride = 3;
        }

        if (!offset) {
          offset = 0;
        }

        if (count) {
          l = Math.min(count * stride + offset, a.length);
        } else {
          l = a.length;
        }

        for (i = offset; i < l; i += stride) {
          vec[0] = a[i];
          vec[1] = a[i + 1];
          vec[2] = a[i + 2];
          fn(vec, vec, arg);
          a[i] = vec[0];
          a[i + 1] = vec[1];
          a[i + 2] = vec[2];
        }

        return a;
      };
    })();

    /**
     * 4 Dimensional Vector
     * @module vec4
     */

    /**
     * Creates a new, empty vec4
     *
     * @returns {vec4} a new 4D vector
     */

    function create$2() {
      var out = new ARRAY_TYPE(4);

      if (ARRAY_TYPE != Float32Array) {
        out[0] = 0;
        out[1] = 0;
        out[2] = 0;
        out[3] = 0;
      }

      return out;
    }
    /**
     * Normalize a vec4
     *
     * @param {vec4} out the receiving vector
     * @param {ReadonlyVec4} a vector to normalize
     * @returns {vec4} out
     */

    function normalize$1(out, a) {
      var x = a[0];
      var y = a[1];
      var z = a[2];
      var w = a[3];
      var len = x * x + y * y + z * z + w * w;

      if (len > 0) {
        len = 1 / Math.sqrt(len);
      }

      out[0] = x * len;
      out[1] = y * len;
      out[2] = z * len;
      out[3] = w * len;
      return out;
    }
    /**
     * Perform some operation over an array of vec4s.
     *
     * @param {Array} a the array of vectors to iterate over
     * @param {Number} stride Number of elements between the start of each vec4. If 0 assumes tightly packed
     * @param {Number} offset Number of elements to skip at the beginning of the array
     * @param {Number} count Number of vec4s to iterate over. If 0 iterates over entire array
     * @param {Function} fn Function to call for each vector in the array
     * @param {Object} [arg] additional argument to pass to fn
     * @returns {Array} a
     * @function
     */

    (function () {
      var vec = create$2();
      return function (a, stride, offset, count, fn, arg) {
        var i, l;

        if (!stride) {
          stride = 4;
        }

        if (!offset) {
          offset = 0;
        }

        if (count) {
          l = Math.min(count * stride + offset, a.length);
        } else {
          l = a.length;
        }

        for (i = offset; i < l; i += stride) {
          vec[0] = a[i];
          vec[1] = a[i + 1];
          vec[2] = a[i + 2];
          vec[3] = a[i + 3];
          fn(vec, vec, arg);
          a[i] = vec[0];
          a[i + 1] = vec[1];
          a[i + 2] = vec[2];
          a[i + 3] = vec[3];
        }

        return a;
      };
    })();

    /**
     * Quaternion
     * @module quat
     */

    /**
     * Creates a new identity quat
     *
     * @returns {quat} a new quaternion
     */

    function create$1() {
      var out = new ARRAY_TYPE(4);

      if (ARRAY_TYPE != Float32Array) {
        out[0] = 0;
        out[1] = 0;
        out[2] = 0;
      }

      out[3] = 1;
      return out;
    }
    /**
     * Sets a quat from the given angle and rotation axis,
     * then returns it.
     *
     * @param {quat} out the receiving quaternion
     * @param {ReadonlyVec3} axis the axis around which to rotate
     * @param {Number} rad the angle in radians
     * @returns {quat} out
     **/

    function setAxisAngle(out, axis, rad) {
      rad = rad * 0.5;
      var s = Math.sin(rad);
      out[0] = s * axis[0];
      out[1] = s * axis[1];
      out[2] = s * axis[2];
      out[3] = Math.cos(rad);
      return out;
    }
    /**
     * Performs a spherical linear interpolation between two quat
     *
     * @param {quat} out the receiving quaternion
     * @param {ReadonlyQuat} a the first operand
     * @param {ReadonlyQuat} b the second operand
     * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
     * @returns {quat} out
     */

    function slerp(out, a, b, t) {
      // benchmarks:
      //    http://jsperf.com/quaternion-slerp-implementations
      var ax = a[0],
          ay = a[1],
          az = a[2],
          aw = a[3];
      var bx = b[0],
          by = b[1],
          bz = b[2],
          bw = b[3];
      var omega, cosom, sinom, scale0, scale1; // calc cosine

      cosom = ax * bx + ay * by + az * bz + aw * bw; // adjust signs (if necessary)

      if (cosom < 0.0) {
        cosom = -cosom;
        bx = -bx;
        by = -by;
        bz = -bz;
        bw = -bw;
      } // calculate coefficients


      if (1.0 - cosom > EPSILON) {
        // standard case (slerp)
        omega = Math.acos(cosom);
        sinom = Math.sin(omega);
        scale0 = Math.sin((1.0 - t) * omega) / sinom;
        scale1 = Math.sin(t * omega) / sinom;
      } else {
        // "from" and "to" quaternions are very close
        //  ... so we can do a linear interpolation
        scale0 = 1.0 - t;
        scale1 = t;
      } // calculate final values


      out[0] = scale0 * ax + scale1 * bx;
      out[1] = scale0 * ay + scale1 * by;
      out[2] = scale0 * az + scale1 * bz;
      out[3] = scale0 * aw + scale1 * bw;
      return out;
    }
    /**
     * Creates a quaternion from the given 3x3 rotation matrix.
     *
     * NOTE: The resultant quaternion is not normalized, so you should be sure
     * to renormalize the quaternion yourself where necessary.
     *
     * @param {quat} out the receiving quaternion
     * @param {ReadonlyMat3} m rotation matrix
     * @returns {quat} out
     * @function
     */

    function fromMat3(out, m) {
      // Algorithm in Ken Shoemake's article in 1987 SIGGRAPH course notes
      // article "Quaternion Calculus and Fast Animation".
      var fTrace = m[0] + m[4] + m[8];
      var fRoot;

      if (fTrace > 0.0) {
        // |w| > 1/2, may as well choose w > 1/2
        fRoot = Math.sqrt(fTrace + 1.0); // 2w

        out[3] = 0.5 * fRoot;
        fRoot = 0.5 / fRoot; // 1/(4w)

        out[0] = (m[5] - m[7]) * fRoot;
        out[1] = (m[6] - m[2]) * fRoot;
        out[2] = (m[1] - m[3]) * fRoot;
      } else {
        // |w| <= 1/2
        var i = 0;
        if (m[4] > m[0]) i = 1;
        if (m[8] > m[i * 3 + i]) i = 2;
        var j = (i + 1) % 3;
        var k = (i + 2) % 3;
        fRoot = Math.sqrt(m[i * 3 + i] - m[j * 3 + j] - m[k * 3 + k] + 1.0);
        out[i] = 0.5 * fRoot;
        fRoot = 0.5 / fRoot;
        out[3] = (m[j * 3 + k] - m[k * 3 + j]) * fRoot;
        out[j] = (m[j * 3 + i] + m[i * 3 + j]) * fRoot;
        out[k] = (m[k * 3 + i] + m[i * 3 + k]) * fRoot;
      }

      return out;
    }
    /**
     * Normalize a quat
     *
     * @param {quat} out the receiving quaternion
     * @param {ReadonlyQuat} a quaternion to normalize
     * @returns {quat} out
     * @function
     */

    var normalize = normalize$1;
    /**
     * Sets a quaternion to represent the shortest rotation from one
     * vector to another.
     *
     * Both vectors are assumed to be unit length.
     *
     * @param {quat} out the receiving quaternion.
     * @param {ReadonlyVec3} a the initial vector
     * @param {ReadonlyVec3} b the destination vector
     * @returns {quat} out
     */

    (function () {
      var tmpvec3 = create$3();
      var xUnitVec3 = fromValues(1, 0, 0);
      var yUnitVec3 = fromValues(0, 1, 0);
      return function (out, a, b) {
        var dot$1 = dot(a, b);

        if (dot$1 < -0.999999) {
          cross(tmpvec3, xUnitVec3, a);
          if (len(tmpvec3) < 0.000001) cross(tmpvec3, yUnitVec3, a);
          normalize$2(tmpvec3, tmpvec3);
          setAxisAngle(out, tmpvec3, Math.PI);
          return out;
        } else if (dot$1 > 0.999999) {
          out[0] = 0;
          out[1] = 0;
          out[2] = 0;
          out[3] = 1;
          return out;
        } else {
          cross(tmpvec3, a, b);
          out[0] = tmpvec3[0];
          out[1] = tmpvec3[1];
          out[2] = tmpvec3[2];
          out[3] = 1 + dot$1;
          return normalize(out, out);
        }
      };
    })();
    /**
     * Performs a spherical linear interpolation with two control points
     *
     * @param {quat} out the receiving quaternion
     * @param {ReadonlyQuat} a the first operand
     * @param {ReadonlyQuat} b the second operand
     * @param {ReadonlyQuat} c the third operand
     * @param {ReadonlyQuat} d the fourth operand
     * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
     * @returns {quat} out
     */

    (function () {
      var temp1 = create$1();
      var temp2 = create$1();
      return function (out, a, b, c, d, t) {
        slerp(temp1, a, d, t);
        slerp(temp2, b, c, t);
        slerp(out, temp1, temp2, 2 * t * (1 - t));
        return out;
      };
    })();
    /**
     * Sets the specified quaternion with values corresponding to the given
     * axes. Each axis is a vec3 and is expected to be unit length and
     * perpendicular to all other specified axes.
     *
     * @param {ReadonlyVec3} view  the vector representing the viewing direction
     * @param {ReadonlyVec3} right the vector representing the local "right" direction
     * @param {ReadonlyVec3} up    the vector representing the local "up" direction
     * @returns {quat} out
     */

    (function () {
      var matr = create$5();
      return function (out, view, right, up) {
        matr[0] = right[0];
        matr[3] = right[1];
        matr[6] = right[2];
        matr[1] = up[0];
        matr[4] = up[1];
        matr[7] = up[2];
        matr[2] = -view[0];
        matr[5] = -view[1];
        matr[8] = -view[2];
        return normalize(out, fromMat3(out, matr));
      };
    })();

    /**
     * 2 Dimensional Vector
     * @module vec2
     */

    /**
     * Creates a new, empty vec2
     *
     * @returns {vec2} a new 2D vector
     */

    function create() {
      var out = new ARRAY_TYPE(2);

      if (ARRAY_TYPE != Float32Array) {
        out[0] = 0;
        out[1] = 0;
      }

      return out;
    }
    /**
     * Perform some operation over an array of vec2s.
     *
     * @param {Array} a the array of vectors to iterate over
     * @param {Number} stride Number of elements between the start of each vec2. If 0 assumes tightly packed
     * @param {Number} offset Number of elements to skip at the beginning of the array
     * @param {Number} count Number of vec2s to iterate over. If 0 iterates over entire array
     * @param {Function} fn Function to call for each vector in the array
     * @param {Object} [arg] additional argument to pass to fn
     * @returns {Array} a
     * @function
     */

    (function () {
      var vec = create();
      return function (a, stride, offset, count, fn, arg) {
        var i, l;

        if (!stride) {
          stride = 2;
        }

        if (!offset) {
          offset = 0;
        }

        if (count) {
          l = Math.min(count * stride + offset, a.length);
        } else {
          l = a.length;
        }

        for (i = offset; i < l; i += stride) {
          vec[0] = a[i];
          vec[1] = a[i + 1];
          fn(vec, vec, arg);
          a[i] = vec[0];
          a[i + 1] = vec[1];
        }

        return a;
      };
    })();

    function calculateNormals(scene) {
        function addNormal(index, normal) {
            const n0 = fromValues(normals[index], normals[index + 1], normals[index + 2]);
            const n1 = create$3();
            add(n1, n0, normal);
            normals[index] = n1[0];
            normals[index + 1] = n1[1];
            normals[index + 2] = n1[2];
            ++counter[index / 3];
        }
        const normals = new Array(scene.vertex.length);
        const counter = new Array(scene.vertex.length / 3);
        normals.fill(0);
        counter.fill(0);
        for (let i = 0; i < scene.indices.length;) {
            const i1 = scene.indices[i++] * 3;
            const i2 = scene.indices[i++] * 3;
            const i3 = scene.indices[i++] * 3;
            const p1 = fromValues(scene.vertex[i1], scene.vertex[i1 + 1], scene.vertex[i1 + 2]);
            const p2 = fromValues(scene.vertex[i2], scene.vertex[i2 + 1], scene.vertex[i2 + 2]);
            const p3 = fromValues(scene.vertex[i3], scene.vertex[i3 + 1], scene.vertex[i3 + 2]);
            const u = create$3();
            subtract(u, p2, p1);
            const v = create$3();
            subtract(v, p3, p1);
            const n = create$3();
            cross(n, u, v);
            normalize$2(n, n);
            addNormal(i1, n);
            addNormal(i2, n);
            addNormal(i3, n);
        }
        let normalIndex = 0, counterIndex = 0;
        while (counterIndex < counter.length) {
            const normal = fromValues(normals[normalIndex], normals[normalIndex + 1], normals[normalIndex + 2]);
            scale(normal, normal, 1.0 / counter[counterIndex]);
            normals[normalIndex] = normal[0];
            normals[normalIndex + 1] = normal[1];
            normals[normalIndex + 2] = normal[2];
            counterIndex += 1;
            normalIndex += 3;
        }
        return normals;
    }

    var Mesh;
    (function (Mesh) {
        Mesh[Mesh["SKIN"] = 0] = "SKIN";
        Mesh[Mesh["PANTS_HELPER"] = 1] = "PANTS_HELPER";
        // 2 to 124 are the joints
        Mesh[Mesh["SKIRT"] = 126] = "SKIRT";
        Mesh[Mesh["HAIR"] = 127] = "HAIR";
        Mesh[Mesh["EYEBALL0"] = 128] = "EYEBALL0";
        Mesh[Mesh["EYEBALL1"] = 129] = "EYEBALL1";
        Mesh[Mesh["PENIS"] = 130] = "PENIS";
        Mesh[Mesh["MOUTH_GUM_TOP"] = 131] = "MOUTH_GUM_TOP";
        Mesh[Mesh["MOUTH_GUM_BOTTOM"] = 132] = "MOUTH_GUM_BOTTOM";
        Mesh[Mesh["TOUNGE"] = 169] = "TOUNGE";
        Mesh[Mesh["CUBE"] = 171] = "CUBE";
    })(Mesh || (Mesh = {}));

    let cubeRotation = 0.0;
    function render(canvas, scene) {
        // for(let i=0; i<10; ++i) {
        //     console.log(`draw group '${scene.groups[i].name}, offset=${scene.groups[i].startIndex}, length=${scene.groups[i].length}'`)
        // }
        const gl = (canvas.getContext('webgl2') || canvas.getContext('experimental-webgl'));
        if (!gl) {
            throw Error('Unable to initialize WebGL. Your browser or machine may not support it.');
        }
        const buffers = createAllBuffers(gl, scene);
        const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSharderSrc);
        const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSrc);
        const programInfo = linkProgram(gl, vertexShader, fragmentShader);
        let then = 0;
        function render(now) {
            now *= 0.001; // convert to seconds
            const deltaTime = now - then;
            then = now;
            if (scene.updateRequired) {
                scene.update();
                buffers.vertex = createBuffer(gl, gl.ARRAY_BUFFER, gl.STATIC_DRAW, Float32Array, scene.vertex),
                    buffers.normal = createBuffer(gl, gl.ARRAY_BUFFER, gl.STATIC_DRAW, Float32Array, calculateNormals(scene));
            }
            drawScene(gl, programInfo, buffers, deltaTime, scene);
            requestAnimationFrame(render);
        }
        requestAnimationFrame(render);
    }
    function drawScene(gl, programInfo, buffers, deltaTime, scene) {
        const canvas = gl.canvas;
        if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;
        }
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        // gl.enable(gl.BLEND)
        // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        const fieldOfView = 45 * Math.PI / 180; // in radians
        const aspect = canvas.width / canvas.height;
        const zNear = 0.1;
        const zFar = 100.0;
        const projectionMatrix = create$4();
        perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
        const modelViewMatrix = create$4();
        translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, -25.0]); // move the model (cube) away
        // mat4.rotate(modelViewMatrix,  modelViewMatrix,  cubeRotation, [0, 0, 1])
        rotate(modelViewMatrix, modelViewMatrix, cubeRotation * .7, [0, 1, 0]);
        const normalMatrix = create$4();
        invert(normalMatrix, modelViewMatrix);
        transpose(normalMatrix, normalMatrix);
        {
            const numComponents = 3;
            const type = gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertex);
            gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, numComponents, type, normalize, stride, offset);
            gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
        }
        {
            const numComponents = 3;
            const type = gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
            gl.vertexAttribPointer(programInfo.attribLocations.vertexNormal, numComponents, type, normalize, stride, offset);
            gl.enableVertexAttribArray(programInfo.attribLocations.vertexNormal);
        }
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
        gl.useProgram(programInfo.program);
        gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
        gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
        gl.uniformMatrix4fv(programInfo.uniformLocations.normalMatrix, false, normalMatrix);
        let skin;
        switch (scene.mode) {
            case Mode.MORPH:
                skin = [Mesh.SKIN, [1.0, 0.8, 0.7, 1], gl.TRIANGLES];
                break;
            case Mode.POSE:
                skin = [Mesh.SKIN, [1.0 / 5, 0.8 / 5, 0.7 / 5, 1], gl.LINES];
                break;
        }
        for (let x of [
            skin,
            [Mesh.EYEBALL0, [0.0, 0.5, 1, 1], gl.TRIANGLES],
            [Mesh.EYEBALL1, [0.0, 0.5, 1, 1], gl.TRIANGLES],
            [Mesh.MOUTH_GUM_TOP, [1.0, 0.0, 0, 1], gl.TRIANGLES],
            [Mesh.MOUTH_GUM_BOTTOM, [1.0, 0.0, 0, 1], gl.TRIANGLES],
            [Mesh.TOUNGE, [1.0, 0.0, 0, 1], gl.TRIANGLES],
            [Mesh.CUBE, [1.0, 0.0, 0.5, 1], gl.LINE_STRIP],
        ]) {
            const idx = x[0];
            const mode = x[2];
            gl.uniform4fv(programInfo.uniformLocations.color, x[1]);
            const type = gl.UNSIGNED_SHORT;
            const offset = scene.groups[idx].startIndex * 2;
            const count = scene.groups[idx].length;
            // console.log(`draw group '${scene.groups[i].name}, offset=${offset}, length=${count}'`)
            gl.drawElements(mode, count, type, offset);
        }
        // all joints
        if (scene.mode === Mode.POSE) {
            gl.uniform4fv(programInfo.uniformLocations.color, [1, 1, 1, 1]);
            const type = gl.UNSIGNED_SHORT;
            const offset = scene.groups[2].startIndex * 2;
            const count = scene.groups[2].length * 124;
            gl.drawElements(gl.TRIANGLES, count, type, offset);
        }
        cubeRotation += deltaTime;
    }
    const vertexSharderSrc = `
// this is our input per vertex
attribute vec4 aVertexPosition;
attribute vec3 aVertexNormal;
// attribute vec4 aVertexColor;

// input for all vertices (uniform for the whole shader program)
uniform mat4 uNormalMatrix;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform vec4 uColor;

// data exchanged with other graphic pipeline stages
varying lowp vec4 vColor;
varying highp vec3 vLighting;

void main(void) {
  gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;

  highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
  highp vec3 directionalLightColor = vec3(1, 1, 1);
  highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));

  highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);

  highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
  vLighting = ambientLight + (directionalLightColor * directional);

  vColor = uColor;
}`;
    // skin color
    const fragmentShaderSrc = `
varying lowp vec4 vColor;
varying highp vec3 vLighting;
void main(void) {
  gl_FragColor = vec4(vec3(vColor[0],vColor[1],vColor[2]) * vLighting, vColor[3]);
    // gl_FragColor = vColor;
}`;
    function compileShader(gl, type, source) {
        const shader = gl.createShader(type);
        if (shader === null)
            throw Error('Unable to create WebGLShader');
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            gl.deleteShader(shader);
            throw Error(`An error occurred compiling the ${type} WebGLShader: ${gl.getShaderInfoLog(shader)}`);
        }
        return shader;
    }
    function linkProgram(gl, vertexShader, fragmentShader) {
        const program = gl.createProgram();
        if (program === null) {
            throw Error('Unable to create WebGLProgram');
        }
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw Error(`Unable to initialize WebGLProgram: ${gl.getProgramInfoLog(program)}`);
        }
        return {
            program: program,
            attribLocations: {
                vertexPosition: gl.getAttribLocation(program, 'aVertexPosition'),
                vertexNormal: gl.getAttribLocation(program, 'aVertexNormal'),
                // vertexColor: gl.getAttribLocation(program, 'aVertexColor'),
            },
            uniformLocations: {
                projectionMatrix: getUniformLocation(gl, program, 'uProjectionMatrix'),
                modelViewMatrix: getUniformLocation(gl, program, 'uModelViewMatrix'),
                normalMatrix: getUniformLocation(gl, program, 'uNormalMatrix'),
                color: getUniformLocation(gl, program, 'uColor')
            }
        };
    }
    function getUniformLocation(gl, program, name) {
        const location = gl.getUniformLocation(program, name);
        if (location === null)
            throw Error(`Internal Error: Failed to get uniform location for ${name}`);
        return location;
    }
    function createAllBuffers(gl, scene) {
        return {
            vertex: createBuffer(gl, gl.ARRAY_BUFFER, gl.STATIC_DRAW, Float32Array, scene.vertex),
            normal: createBuffer(gl, gl.ARRAY_BUFFER, gl.STATIC_DRAW, Float32Array, calculateNormals(scene)),
            indices: createBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW, Uint16Array, scene.indices)
        };
    }
    function createBuffer(gl, target, usage, type, data) {
        const buffer = gl.createBuffer();
        if (buffer === null)
            throw Error('Failed to create new WebGLBuffer');
        gl.bindBuffer(target, buffer);
        gl.bufferData(target, new type(data), usage);
        return buffer;
    }

    window.onload = () => { main(); };
    function main() {
        try {
            run();
        }
        catch (e) {
            console.log(e);
            if (e instanceof Error)
                alert(`${e.name}: ${e.message}`);
            else
                alert(e);
        }
    }
    // core/mhmain.py
    //   class MHApplication
    //     startupSequence()
    function run() {
        console.log('loading assets...');
        FileSystemAdapter.setInstance(new HTTPFSAdapter());
        const human = Human.getInstance();
        const obj = new WavefrontObj();
        obj.load('data/3dobjs/base.obj.z');
        const scene = new HumanMesh(human, obj);
        human.modified.add(() => scene.updateRequired = true);
        loadSkeleton('data/rigs/default.mhskel.z');
        // humanmodifier.loadModifiers(getpath.getSysDataPath('modifiers/modeling_modifiers.json'), app.selectedHuman)
        loadModifiers('data/modifiers/modeling_modifiers.json.z', human);
        loadModifiers('data/modifiers/measurement_modifiers.json.z', human);
        // guimodifier.loadModifierTaskViews(getpath.getSysDataPath('modifiers/modeling_sliders.json'), app.selectedHuman, category)
        const sliderNodes = loadSliders('data/modifiers/modeling_sliders.json.z');
        loadMacroTargets();
        // TargetFactory.getInstance()
        // const vertexCopy = [scene.vertex]
        console.log('everything is loaded...');
        const mode = new EnumModel(Mode);
        mode.modified.add(() => {
            scene.mode = mode.value;
        });
        const tree = new TreeNodeModel(SliderNode, sliderNodes);
        const references = new class {
        };
        const mainScreen = jsxs$1(Fragment, { children: [jsxs$1(Tabs, Object.assign({ model: mode, style: { position: 'absolute', left: 0, width: '500px', top: 0, bottom: 0 } }, { children: [jsx$1(Tab, Object.assign({ label: "Morph", value: "MORPH" }, { children: jsx$1(Table, { model: tree, style: { width: '100%', height: '100%' } }) })), jsx$1(Tab, Object.assign({ label: "Pose", value: "POSE" }, { children: "Work In Progress" }))] })), jsx$1("div", Object.assign({ style: { position: 'absolute', left: '500px', right: 0, top: 0, bottom: 0, overflow: 'hidden' } }, { children: jsx$1("canvas", { set: ref(references, 'canvas'), style: { width: '100%', height: '100%' } }) }))] });
        mainScreen.appendTo(document.body);
        render(references.canvas, scene);
    }
    // this tells <toad-table> how to render TreeNodeModel<SliderNode>
    class SliderTreeAdapter extends TreeAdapter {
        constructor(model) {
            super(model);
            this.config.expandColumn = true;
        }
        get colCount() {
            return 2;
        }
        showCell(pos, cell) {
            if (this.model === undefined) {
                console.log("no model");
                return;
            }
            const node = this.model.rows[pos.row].node;
            switch (pos.col) {
                case 0:
                    this.treeCell(pos, cell, node.label);
                    break;
                case 1:
                    if (node.model) {
                        const x = jsxs$1(Fragment, { children: [jsx$1(Text, { model: node.model, style: { width: '50px' } }), jsx$1(Slider, { model: node.model, style: { width: '200px' } })] });
                        cell.replaceChildren(...x);
                    }
                    break;
            }
        }
    }
    TreeAdapter.register(SliderTreeAdapter, TreeNodeModel, SliderNode);
    //
    // more makehuman stuff i need to figure out:
    //
    function loadMacroTargets() {
        const targetFactory = TargetFactory.getInstance();
        // for target in targets.getTargets().findTargets('macrodetails'):
        for (const target of targetFactory.findTargets('macrodetails')) {
            //         #log.debug('Preloading target %s', getpath.getRelativePath(target.path))
            //         algos3d.getTarget(self.selectedHuman.meshData, target.path)
            // console.log(target.path)
            // target.getTarget()
        }
    }

    exports.main = main;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

})({});
//# sourceMappingURL=makehuman.js.map
