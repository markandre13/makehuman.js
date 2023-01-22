var makehuman=function(t){"use strict";class e{constructor(t,e){this.object=t,this.attribute=e.toString()}get(){return this.object[this.attribute]}set(t){Object.defineProperty(this.object,this.attribute,{value:t})}toString(){return`${this.object[this.attribute]}`}fromString(t){const e=typeof this.object[this.attribute];let i;switch(e){case"string":i=t;break;case"number":i=Number.parseFloat(t);break;default:throw Error(`Reference.fromString() isn't yet supported for type ${e}`)}Object.defineProperty(this.object,this.attribute,{value:i})}}function i(t,i){return new e(t,i)}class s extends Array{constructor(t){super(...t?.children);for(let t=0;t<this.length;++t){const e=this[t];"string"==typeof e&&(this[t]=document.createTextNode(e))}}replaceIn(t){for(;t.childNodes.length>0;)t.removeChild(t.childNodes[t.childNodes.length-1]);this.appendTo(t)}appendTo(t){for(let e of this)t.appendChild(e)}}function o(t,e,i){return void 0!==e&&void 0!==e.children&&(e.children=[e.children]),n(t,e)}function n(t,e,i){let s;if("string"!=typeof t)return new t(e);const o=t;switch(o){case"svg":case"line":case"rect":case"circle":case"path":case"text":s="http://www.w3.org/2000/svg";break;default:s="http://www.w3.org/1999/xhtml"}const n=document.createElementNS(s,o);return function(t,e,i){if(null==e)return;for(let[s,o]of Object.entries(e))switch(s){case"children":break;case"action":t.setAction(o);break;case"model":t.setModel(o);break;case"class":t.classList.add(o);break;case"style":for(let[e,i]of Object.entries(o)){const s=/[A-Z]/g;e=e.replace(s,(t=>"-"+t.toLowerCase())),t.style.setProperty(e,i)}break;case"set":Object.defineProperty(e.set.object,e.set.attribute,{value:t});break;default:if("on"===s.substring(0,2))t.addEventListener(s.substr(2),o);else if("object"!=typeof o){if("http://www.w3.org/2000/svg"===i){const t=/[A-Z]/g;s=s.replace(t,(t=>"-"+t.toLowerCase()))}t.setAttributeNS(null,s,`${o}`)}}if(void 0!==e.children)for(let i of e.children)"string"==typeof i?t.appendChild(document.createTextNode(i)):t.appendChild(i)}(n,e,s),n}class a{constructor(t,e){this.callback=t,this.id=e}}class l{add(t,e){this.callbacks||(this.callbacks=new Array),this.callbacks.push(new a(t,e))}remove(t){if(this.callbacks)for(let e=this.callbacks.length-1;e>=0;--e)this.callbacks[e].id===t&&this.callbacks.splice(e,1)}count(){return this.callbacks?this.callbacks.length:0}lock(){this.locked=!0}unlock(){if(this.locked=void 0,this.triggered){let t=this.triggered.data;this.triggered=void 0,this.trigger(t)}}trigger(t){if(this.locked)this.triggered={data:t};else if(this.callbacks)for(let e=0;e<this.callbacks.length;++e)this.callbacks[e].callback(t)}}class r{constructor(){this._enabled=!0,this.modified=new l}set enabled(t){this._enabled!=t&&(this._enabled=t,this.modified.trigger(void 0))}get enabled(){return this._enabled}}class h extends r{constructor(t){super(),this._value=t}set value(t){this._value!=t&&(this._value=t,this.modified.trigger())}get value(){return this._value}}class d extends h{constructor(t,e){super(t),e&&(this.min=e.min,this.max=e.max,this.step=e.step)}increment(){void 0!==this.step&&(this.value+=this.step)}decrement(){void 0!==this.step&&(this.value-=this.step)}get value(){return super.value}set value(t){void 0!==this.min&&t<this.min&&(t=this.min),void 0!==this.max&&t>this.max&&(t=this.max),super.value=t}}class c{getRestCoordinates(t){if(t!=this.meshData.name)throw Error(`AnimatedMesh.getRestCoordinates('${t}'): no such mesh`);return this.meshData.vertex}setBaseSkeleton(t){this.__skeleton=t}}class u extends c{static getInstance(){return void 0===u.instance&&(u.instance=new u),u.instance}constructor(){super(),this.modified=new l,this.age=new d(.5,{min:0,max:1,step:.05}),this.gender=new d(.5,{min:0,max:1,step:.05}),this.weight=new d(.5,{min:0,max:1,step:.05}),this.muscle=new d(.5,{min:0,max:1,step:.05}),this.height=new d(.5,{min:0,max:1,step:.05}),this.breastSize=new d(.5,{min:0,max:1,step:.05}),this.breastFirmness=new d(.5,{min:0,max:1,step:.05}),this.bodyProportions=new d(.5,{min:0,max:1,step:.05}),this.caucasianVal=new d(1/3,{min:0,max:1,step:.05}),this.asianVal=new d(1/3,{min:0,max:1,step:.05}),this.africanVal=new d(1/3,{min:0,max:1,step:.05}),this.maleVal=new d(0),this.femaleVal=new d(0),this.oldVal=new d(0),this.babyVal=new d(0),this.youngVal=new d(0),this.childVal=new d(0),this.maxweightVal=new d(0),this.minweightVal=new d(0),this.averageweightVal=new d(0),this.maxmuscleVal=new d(0),this.minmuscleVal=new d(0),this.averagemuscleVal=new d(0),this.maxheightVal=new d(0),this.minheightVal=new d(0),this.averageheightVal=new d(0),this.maxcupVal=new d(0),this.mincupVal=new d(0),this.averagecupVal=new d(0),this.maxfirmnessVal=new d(0),this.minfirmnessVal=new d(0),this.averagefirmnessVal=new d(0),this.idealproportionsVal=new d(0),this.uncommonproportionsVal=new d(0),this.regularproportionsVal=new d(0),this.flag=!1,this._setDependendValues(),this.gender.modified.add((()=>this._setGenderVals())),this.age.modified.add((()=>this._setAgeVals())),this.muscle.modified.add((()=>this._setMuscleVals())),this.weight.modified.add((()=>this._setWeightVals())),this.height.modified.add((()=>this._setHeightVals())),this.breastSize.modified.add((()=>this._setBreastSizeVals())),this.breastFirmness.modified.add((()=>this._setBreastFirmnessVals())),this.bodyProportions.modified.add((()=>this._setBodyProportionVals())),this.africanVal.modified.add((()=>this._setEthnicVals("African"))),this.asianVal.modified.add((()=>this._setEthnicVals("Asian"))),this.caucasianVal.modified.add((()=>this._setEthnicVals("Caucasian"))),this.modifiers=new Map,this.modifierGroups=new Map,this.targetsDetailStack=new Map}getModifier(t){return this.modifiers.get(t)}getModifiersByGroup(t){const e=this.modifierGroups.get(t);return void 0===e?(console.log(`Modifier group ${t} does not exist.`),[]):e}addModifier(t){if(this.modifiers.has(t.fullName))throw Error(`Modifier with name ${t.fullName} is already attached to human.`);this.modifiers.set(t.fullName,t),this.modifierGroups.has(t.groupName)||this.modifierGroups.set(t.groupName,new Array),this.modifierGroups.get(t.groupName).push(t)}setDetail(t,e){void 0!==e?this.targetsDetailStack.set(t,e):this.targetsDetailStack.delete(t)}getDetail(t){let e=this.targetsDetailStack.get(t);return void 0===e&&(e=0),e}setDefaultValues(){this.age.value=.5,this.gender.value=.5,this.weight.value=.5,this.muscle.value=.5,this.height.value=.5,this.breastSize.value=.5,this.breastFirmness.value=.5,this.bodyProportions.value=.5,this.caucasianVal.value=1/3,this.asianVal.value=1/3,this.africanVal.value=1/3,this._setDependendValues()}_setDependendValues(){this._setGenderVals(),this._setAgeVals(),this._setWeightVals(),this._setMuscleVals(),this._setHeightVals(),this._setBreastSizeVals(),this._setBreastFirmnessVals(),this._setBodyProportionVals()}_setGenderVals(){this.maleVal.value=this.gender.value,this.femaleVal.value=1-this.gender.value}_setAgeVals(){this.age.value<.5?(this.oldVal.value=0,this.babyVal.value=Math.max(0,1-5.333*this.age.value),this.youngVal.value=Math.max(0,3.2*(this.age.value-.1875)),this.childVal.value=Math.max(0,Math.min(1,5.333*this.age.value)-this.youngVal.value)):(this.childVal.value=0,this.babyVal.value=0,this.oldVal.value=Math.max(0,2*this.age.value-1),this.youngVal.value=1-this.oldVal.value)}_setWeightVals(){this.maxweightVal.value=Math.max(0,2*this.weight.value-1),this.minweightVal.value=Math.max(0,1-2*this.weight.value),this.averageweightVal.value=1-(this.maxweightVal.value+this.minweightVal.value)}_setMuscleVals(){this.maxmuscleVal.value=Math.max(0,2*this.muscle.value-1),this.minmuscleVal.value=Math.max(0,1-2*this.muscle.value),this.averagemuscleVal.value=1-(this.maxmuscleVal.value+this.minmuscleVal.value)}_setHeightVals(){this.maxheightVal.value=Math.max(0,2*this.height.value-1),this.minheightVal.value=Math.max(0,1-2*this.height.value),this.maxheightVal.value>this.minheightVal.value?this.averageheightVal.value=1-this.maxheightVal.value:this.averageheightVal.value=1-this.minheightVal.value}_setBreastSizeVals(){this.maxcupVal.value=Math.max(0,2*this.breastSize.value-1),this.mincupVal.value=Math.max(0,1-2*this.breastSize.value),this.maxcupVal.value>this.mincupVal.value?this.averagecupVal.value=1-this.maxcupVal.value:this.averagecupVal.value=1-this.mincupVal.value}_setBreastFirmnessVals(){this.maxfirmnessVal.value=Math.max(0,2*this.breastFirmness.value-1),this.minfirmnessVal.value=Math.max(0,1-2*this.breastFirmness.value),this.maxfirmnessVal.value>this.minfirmnessVal.value?this.averagefirmnessVal.value=1-this.maxfirmnessVal.value:this.averagefirmnessVal.value=1-this.minfirmnessVal.value}_setBodyProportionVals(){this.idealproportionsVal.value=Math.max(0,2*this.bodyProportions.value-1),this.uncommonproportionsVal.value=Math.max(0,1-2*this.bodyProportions.value),this.idealproportionsVal>this.uncommonproportionsVal?this.regularproportionsVal.value=1-this.idealproportionsVal.value:this.regularproportionsVal.value=1-this.uncommonproportionsVal.value}_setEthnicVals(t){this.flag||(this.flag=!0,this.africanVal.modified.lock(),this.asianVal.modified.lock(),this.caucasianVal.modified.lock(),this._setEthnicValsCore(t),this.africanVal.modified.unlock(),this.asianVal.modified.unlock(),this.caucasianVal.modified.unlock(),this.flag=!1)}_setEthnicValsCore(t){let e=1,i=0;"African"!==t?i+=this.africanVal.value:e-=this.africanVal.value,"Asian"!==t?i+=this.asianVal.value:e-=this.asianVal.value,"Caucasian"!==t?i+=this.caucasianVal.value:e-=this.caucasianVal.value,0===i?void 0===t?(this.caucasianVal.value=1/3,this.asianVal.value=1/3,this.africanVal.value=1/3):Math.abs(e)<.001?(this.africanVal.value="African"!==t?1:0,this.asianVal.value="Asian"!==t?1:0,this.caucasianVal.value="Caucasian"!==t?1:0):("African"!==t&&(this.africanVal.value=.01),"Asian"!==t&&(this.asianVal.value=.01),"Caucasian"!==t&&(this.caucasianVal.value=.01),this._setEthnicValsCore(t)):("African"!==t&&(this.africanVal.value=e*this.africanVal.value/i),"Asian"!==t&&(this.asianVal.value=e*this.asianVal.value/i),"Caucasian"!==t&&(this.caucasianVal.value=e*this.caucasianVal.value/i))}updateProxyMesh(t=!1){this.modified.trigger()}getRestposeCoordinates(){return this.getRestCoordinates(this.meshData.name)}setBaseSkeleton(t){super.setBaseSkeleton(t)}}class p{constructor(t){this.data=t,this.index=0}next(){if(0===this.data.length||-1===this.index)return{value:void 0,done:!0};const t=this.data.indexOf("\n",this.index);let e;e=-1===t?void 0:t-this.index;const i=this.data.substr(this.index,e);return this.index=-1===t?-1:t+1,{value:i,done:!1}}}class g{constructor(t){this.data=t}[Symbol.iterator](){return new p(this.data)}}class m{static setInstance(t){m.instance=t}static getInstance(){if(void 0===m.instance)throw Error("Missing call to FileSystemAdapter.setInstance(instance: AbstractFilesystemAdapter).");return m.instance}}class f{constructor(){this.verts=new Array,this.data=new Array}load(t){const e=m.getInstance().readFile(t),i=new g(e);for(let t of i){if(t=t.trim(),0===t.length)continue;if("#"===t[0])continue;const e=t.split(/\s+/);this.data.push(parseInt(e[0],10)),this.verts.push(parseFloat(e[1])),this.verts.push(parseFloat(e[2])),this.verts.push(parseFloat(e[3]))}}apply(t,e){let i=0,s=0;for(;i<this.data.length;){let o=3*this.data[i++];t[o++]+=this.verts[s++]*e,t[o++]+=this.verts[s++]*e,t[o++]+=this.verts[s++]*e}}}const b={gender:["male","female"],age:["baby","child","young","old"],race:["caucasian","asian","african"],muscle:["maxmuscle","averagemuscle","minmuscle"],weight:["minweight","averageweight","maxweight"],height:["minheight","averageheight","maxheight"],breastsize:["mincup","averagecup","maxcup"],breastfirmness:["minfirmness","averagefirmness","maxfirmness"],bodyproportions:["uncommonproportions","regularproportions","idealproportions"]},x=new Array,v=new Map;for(const t in b)if(b.hasOwnProperty(t)){x.push(t);for(const e of b[t])v.set(e,t)}class w{constructor(t){this.parent=t,void 0===t?(this.key=new Array,this.data=new Map):(this.key=t.key.slice(),this.data=new Map(t.data))}isRoot(){return void 0===this.parent}createChild(){return new w(this)}update(t){const e=v.get(t);void 0!==e?this.setData(e,t):"target"!==t&&this.addKey(t)}tuple(){let t="";for(const e of this.key)0!==t.length&&(t+="-"),t+=e;return t}getVariables(){const t=[];for(const[e,i]of this.data.entries())void 0!==i&&t.push(i);return t}addKey(t){this.key.push(t)}setData(t,e){this.data=new Map(this.data);const i=this.data.get(t);if(void 0===i)this.data.set(t,e);else if(i!==e)throw Error(`Component category ${t} can not be set to ${e} as it is already been set to ${i}`)}finish(t){this.path=t;for(const t of x)this.data.has(t)||this.data.set(t,void 0)}}class y{constructor(){this.rootComponent=new w,this.images=new Map,this.targets=new Array,this.groups=new Map,this.index=new Map,this.loadTargetDirectory(),console.log(`Loaded target directory: ${this.targets.length} targets, ${this.groups.size} groups, ${this.index.size} indizes, ${this.images.size} images`)}static getInstance(){return void 0===y.instance&&(y.instance=new y),y.instance}loadTargetDirectory(){this.walkTargets("",this.rootComponent),this.buildIndex()}findTargets(t){if(!this.index.has(t))return[];const e=new Array;for(const i of this.index.get(t))i instanceof w?e.push(i):e.concat(this.findTargets(i));return e}getTargetsByGroup(t){return this.groups.get(t)}walkTargets(t,e){const i=m.getInstance(),s=i.realPath(t),o=i.listDir(s).sort();for(const n of o){const o=i.joinPath(s,n);if(i.isFile(o)&&!o.toLowerCase().endsWith(".target"))o.toLowerCase().endsWith(".png")&&this.images.set(n.toLowerCase(),o);else{const s=e.createChild(),a=n.replace("_","-").replace(".","-").split("-");for(const t of a.entries())0===t[0]&&"targets"===t[1]||s.update(t[1]);if(i.isDir(o)){const e=i.joinPath(t,n);this.walkTargets(e,s)}else{s.finish(`data/${t}/${n}`),this.targets.push(s);const e=s.tuple();let i=this.groups.get(e);void 0===i&&(i=new Array,this.groups.set(e,i)),i.push(s)}}}}buildIndex(){for(const t of this.targets){this.index.has(t.tuple())||this.index.set(t.tuple(),[]),this.index.get(t.tuple()).push(t);let e=t;for(;void 0!==e.parent;){const t=e.parent;this.index.has(t.tuple())||this.index.set(t.tuple(),new Array),e.tuple()===t.tuple()||this.index.get(t.tuple()).includes(e.tuple())||this.index.get(t.tuple()).push(e.tuple()),e=t}}}}const C=new Map;var k="undefined"!=typeof Float32Array?Float32Array:Array;function H(){var t=new k(16);return k!=Float32Array&&(t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[6]=0,t[7]=0,t[8]=0,t[9]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0),t[0]=1,t[5]=1,t[10]=1,t[15]=1,t}function S(t,e){var i=e[0],s=e[1],o=e[2],n=e[3],a=e[4],l=e[5],r=e[6],h=e[7],d=e[8],c=e[9],u=e[10],p=e[11],g=e[12],m=e[13],f=e[14],b=e[15],x=i*l-s*a,v=i*r-o*a,w=i*h-n*a,y=s*r-o*l,C=s*h-n*l,k=o*h-n*r,H=d*m-c*g,S=d*f-u*g,E=d*b-p*g,A=c*f-u*m,T=c*b-p*m,_=u*b-p*f,M=x*_-v*T+w*A+y*E-C*S+k*H;return M?(M=1/M,t[0]=(l*_-r*T+h*A)*M,t[1]=(o*T-s*_-n*A)*M,t[2]=(m*k-f*C+b*y)*M,t[3]=(u*C-c*k-p*y)*M,t[4]=(r*E-a*_-h*S)*M,t[5]=(i*_-o*E+n*S)*M,t[6]=(f*w-g*k-b*v)*M,t[7]=(d*k-u*w+p*v)*M,t[8]=(a*T-l*E+h*H)*M,t[9]=(s*E-i*T-n*H)*M,t[10]=(g*C-m*w+b*x)*M,t[11]=(c*w-d*C-p*x)*M,t[12]=(l*S-a*A-r*H)*M,t[13]=(i*A-s*S+o*H)*M,t[14]=(m*v-g*y-f*x)*M,t[15]=(d*y-c*v+u*x)*M,t):null}function E(t,e,i){var s=e[0],o=e[1],n=e[2],a=e[3],l=e[4],r=e[5],h=e[6],d=e[7],c=e[8],u=e[9],p=e[10],g=e[11],m=e[12],f=e[13],b=e[14],x=e[15],v=i[0],w=i[1],y=i[2],C=i[3];return t[0]=v*s+w*l+y*c+C*m,t[1]=v*o+w*r+y*u+C*f,t[2]=v*n+w*h+y*p+C*b,t[3]=v*a+w*d+y*g+C*x,v=i[4],w=i[5],y=i[6],C=i[7],t[4]=v*s+w*l+y*c+C*m,t[5]=v*o+w*r+y*u+C*f,t[6]=v*n+w*h+y*p+C*b,t[7]=v*a+w*d+y*g+C*x,v=i[8],w=i[9],y=i[10],C=i[11],t[8]=v*s+w*l+y*c+C*m,t[9]=v*o+w*r+y*u+C*f,t[10]=v*n+w*h+y*p+C*b,t[11]=v*a+w*d+y*g+C*x,v=i[12],w=i[13],y=i[14],C=i[15],t[12]=v*s+w*l+y*c+C*m,t[13]=v*o+w*r+y*u+C*f,t[14]=v*n+w*h+y*p+C*b,t[15]=v*a+w*d+y*g+C*x,t}Math.hypot||(Math.hypot=function(){for(var t=0,e=arguments.length;e--;)t+=arguments[e]*arguments[e];return Math.sqrt(t)});var A=function(t,e,i,s,o){var n,a=1/Math.tan(e/2);return t[0]=a/i,t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[5]=a,t[6]=0,t[7]=0,t[8]=0,t[9]=0,t[11]=-1,t[12]=0,t[13]=0,t[15]=0,null!=o&&o!==1/0?(n=1/(s-o),t[10]=(o+s)*n,t[14]=2*o*s*n):(t[10]=-1,t[14]=-2*s),t},T=E;function _(){var t=new k(3);return k!=Float32Array&&(t[0]=0,t[1]=0,t[2]=0),t}function M(t,e,i){var s=new k(3);return s[0]=t,s[1]=e,s[2]=i,s}function R(t,e,i){return t[0]=e[0]-i[0],t[1]=e[1]-i[1],t[2]=e[2]-i[2],t}function N(t,e,i){return t[0]=e[0]*i,t[1]=e[1]*i,t[2]=e[2]*i,t}function B(t,e){var i=e[0],s=e[1],o=e[2],n=i*i+s*s+o*o;return n>0&&(n=1/Math.sqrt(n)),t[0]=e[0]*n,t[1]=e[1]*n,t[2]=e[2]*n,t}function V(t,e,i){var s=e[0],o=e[1],n=e[2],a=i[0],l=i[1],r=i[2];return t[0]=o*r-n*l,t[1]=n*a-s*r,t[2]=s*l-o*a,t}function D(t,e,i){var s=e[0],o=e[1],n=e[2],a=i[3]*s+i[7]*o+i[11]*n+i[15];return a=a||1,t[0]=(i[0]*s+i[4]*o+i[8]*n+i[12])/a,t[1]=(i[1]*s+i[5]*o+i[9]*n+i[13])/a,t[2]=(i[2]*s+i[6]*o+i[10]*n+i[14])/a,t}function L(){var t=new k(4);return k!=Float32Array&&(t[0]=0,t[1]=0,t[2]=0,t[3]=0),t}function I(t,e,i,s){var o=new k(4);return o[0]=t,o[1]=e,o[2]=i,o[3]=s,o}function $(t,e,i){var s=e[0],o=e[1],n=e[2],a=e[3];return t[0]=i[0]*s+i[4]*o+i[8]*n+i[12]*a,t[1]=i[1]*s+i[5]*o+i[9]*n+i[13]*a,t[2]=i[2]*s+i[6]*o+i[10]*n+i[14]*a,t[3]=i[3]*s+i[7]*o+i[11]*n+i[15]*a,t}_(),function(){var t=L()}();class z{constructor(t,e,i,s,o,n,a,l){var r;this.index=-1,this.headPos=[0,0,0],this.tailPos=[0,0,0],this.length=0,this.children=[],this.reference_bones=[],this.skeleton=t,this.name=e,this.headJoint=s,this.tailJoint=o,this.roll=n,this.updateJointPositions(u.getInstance()),null!==i&&(this.parent=this.skeleton.getBone(i),this.parent.children.push(this)),this.parent?this.level=this.parent.level+1:this.level=0,this.matPose=((r=H())[0]=1,r[1]=0,r[2]=0,r[3]=0,r[4]=0,r[5]=1,r[6]=0,r[7]=0,r[8]=0,r[9]=0,r[10]=1,r[11]=0,r[12]=0,r[13]=0,r[14]=0,r[15]=1,r)}get planes(){return this.skeleton.planes}updateJointPositions(t,e=!0){this.headPos=this.skeleton.getJointPosition(this.headJoint,t,e),this.tailPos=this.skeleton.getJointPosition(this.tailJoint,t,e)}build(t){const e=M(this.headPos[0],this.headPos[1],this.headPos[2]),i=M(this.tailPos[0],this.tailPos[1],this.tailPos[2]);let s;if(t)throw Error("not implemented yet");s=this.get_normal(),this.matRestGlobal=function(t,e,i){let s=R(_(),e,t);B(s,s);const o=B(_(),i),n=B(_(),V(_(),o,s)),a=B(_(),V(_(),s,n));return l=a[0],r=a[1],h=a[2],d=0,c=s[0],u=s[1],p=s[2],g=0,m=n[0],f=n[1],b=n[2],x=0,v=t[0],w=t[1],y=t[2],C=1,H=new k(16),H[0]=l,H[1]=r,H[2]=h,H[3]=d,H[4]=c,H[5]=u,H[6]=p,H[7]=g,H[8]=m,H[9]=f,H[10]=b,H[11]=x,H[12]=v,H[13]=w,H[14]=y,H[15]=C,H;var l,r,h,d,c,u,p,g,m,f,b,x,v,w,y,C,H}(e,i,s),this.length=function(t,e){var i=e[0]-t[0],s=e[1]-t[1],o=e[2]-t[2];return Math.hypot(i,s,o)}(e,i),void 0===this.parent?this.matRestRelative=this.matRestGlobal:this.matRestRelative=T(H(),S(H(),this.parent.matRestGlobal),this.matRestGlobal),this.yvector4=I(0,this.length,0,1)}update(){void 0!==this.parent?this.matPoseGlobal=E(H(),this.parent.matPoseGlobal,E(H(),this.matRestRelative,this.matPose)):this.matPoseGlobal=E(H(),this.matRestRelative,this.matPose),this.matPoseVerts=E(H(),this.matPoseGlobal,S(H(),this.matRestGlobal))}get_normal(){let t;if(this.roll instanceof Array)throw Error("Not implemented yet");if("string"==typeof this.roll){const e=this.roll;t=function(t,e,i,s){i.has(e)||(console.warn(`No plane with name ${e} defined for skeleton.`),M(0,1,0));s||(s=u.getInstance());const o=i.get(e),[n,a,l]=o,r=N(_(),W(t.getJointPosition(n,s)),t.scale),h=N(_(),W(t.getJointPosition(a,s)),t.scale),d=N(_(),W(t.getJointPosition(l,s)),t.scale),c=B(_(),R(_(),h,r)),p=B(_(),R(_(),d,h));return B(_(),V(_(),p,c))}(this.skeleton,e,this.planes)}else t=M(0,1,0);return t}}class O{constructor(t,e){console.log(`VertexBoneWeights: filename='${t}', data=${e}`),this.info={name:e.name,version:e.version,description:e.description,copyright:e.copyright,license:e.license},this._data=this._build_vertex_weights_data(e.weights),this._calculate_num_weights()}_build_vertex_weights_data(t,e,i="root"){let s;if(void 0!==e)s=e;else{s=0;for(let e of Object.getOwnPropertyNames(t)){t[e].forEach((t=>{const e=t[0];s=Math.max(s,e)}))}++s}this._vertexCount=s;const o=new Array(s).fill(0);for(let e of Object.getOwnPropertyNames(t)){t[e].forEach((t=>{const e=t[0],i=t[1];o[e]+=i}))}const n=new Map;for(let e of Object.getOwnPropertyNames(t)){const i=t[e];if(0===i.length)continue;let s=[],a=[],l=new Map;for(let[t,e]of i)if(l.has(t)){const e=l.get(t);s[e],o[t]}else l.set(t,a.length),a.push(t),s.push(e/o[t]);const r=s.map(((t,e)=>t>1e-4?e:void 0)).filter((t=>void 0!==t)).sort(((t,e)=>a[t]-a[e]));a=r.map((t=>a[t])),s=r.map((t=>s[t])),n.set(e,[a,s])}let a,l;n.has(i)?[a,l]=n.get(i):(a=[],l=[]);const r=o.map(((t,e)=>0===t?e:-1)).filter((t=>t>=0));return a=a.concat(r),l=l.concat(new Array(r.length).fill(1)),r.length>0&&(r.length<100?console.log(`Adding trivial bone weights to root bone ${i} for ${r.length} unweighted vertices. [${r}]`):console.log(`Adding trivial bone weights to root bone ${i} for ${r.length} unweighted vertices.`)),a.length>0&&n.set(i,[a,l]),n}_calculate_num_weights(){}}class P{constructor(t,e){this.bones=new Map,this.roots=[],this.joint_pos_idxs=new Map,this.planes=new Map,this.plane_map_strategy=3,this.has_custom_weights=!1,this.scale=1,this.info={name:e.name,version:e.version,tags:e.tags,description:e.description,copyright:e.copyright,license:e.license},this.plane_map_strategy=e.plane_map_strategy;for(let t of Object.getOwnPropertyNames(e.joints)){const i=e.joints[t];i&&i.length>0&&this.joint_pos_idxs.set(t,i)}console.log(`Skeleton.construction(): this.joint_pos_idxs.size = ${this.joint_pos_idxs.size}`);for(let t of Object.getOwnPropertyNames(e.planes))this.planes.set(t,e.planes[t]);const i=new Set,s=new Array;let o=-1;for(;i.size!=e.bones.length&&o!=i.size;){o=i.size;for(let t of Object.getOwnPropertyNames(e.bones)){const o=e.bones[t];if(!i.has(t)){const e=o.parent;if(null!==e&&"string"!=typeof e){console.log(`Bone '${t}' has invalid parent '${e}'`);continue}(null===e||i.has(e))&&(i.add(t),s.push(t))}}}if(i.size!==Object.getOwnPropertyNames(e.bones).length){let s=[];for(let t in e.bones)i.has(t)||s.push(t);console.log(`Some bones defined in file '${t}' could not be added to skeleton '${this.info.name}', because they have an invalid parent bone (${s})`)}console.log(`breadthfirst_bones.length: ${s.length}`);for(let t of s){const i=e.bones[t];let s=i.rotation_plane;"string"!=typeof s&&(console.log(`Invalid rotation plane '${JSON.stringify(s)}' specified for bone ${t}. Please make sure that you edited the .mhskel file by hand to include roll plane joints."`),s=null),this.addBone(t,i.parent,i.head,i.tail,s,i.reference,i.weights_reference)}this.build();const n=e.weights_file;if(void 0!==n){const t=`data/rigs/${n}`,e=m.getInstance().readFile(t);let i;try{i=JSON.parse(e)}catch(i){throw console.log(`Failed to parse JSON in ${t}:\n${e.substring(0,256)}`),i}this.vertexWeights=new O(t,i),this.has_custom_weights=!0,console.log("loaded weights...")}}getJointPosition(t,e,i=!0){if(this.joint_pos_idxs.has(t)){const s=this.joint_pos_idxs.get(t);let o;if(!i)throw Error("NOT IMPLEMENTED YET");{const t=e.getRestposeCoordinates();o=s.map((e=>[t[e*=3],t[e+1],t[e+2]]))}let n=0,a=0,l=0;return o.forEach((t=>{n+=t[0],a+=t[1],l+=t[2]})),n/=o.length,a/=o.length,l/=o.length,[n,a,l]}return console.log(`Skeleton.getJointPosition(joint_name='${t}', human=${e}, rest_coord=${i}) -> from base mesh`),function(t,e,i=!0){throw Error(`NOT IMPLEMENTED: _getHumanJointPosition(..., jointName='${e}', rest_coord=${i})`)}(0,t,i)}build(t){this.boneslist=void 0;for(const e of this.getBones())e.build(t)}update(){for(const t of this.getBones())t.update()}updateJoints(t){for(const e of this.getBones())e.updateJointPositions(t)}getBones(){return void 0===this.boneslist&&(this.boneslist=this.buildBoneList()),this.boneslist}buildBoneList(){const t=[];let e=[...this.roots];for(;e.length>0;){const i=e.shift();i.index=t.length,t.push(i),e=e.concat(...i.children)}return t}addBone(t,e,i,s,o,n,a){if(t in this.bones)throw Error(`The skeleton ${this.info.name} already contains a bone named ${t}.`);const l=new z(this,t,e,i,s,o,n,a);return this.bones.set(t,l),e||this.roots.push(l),l}getBone(t){const e=this.bones.get(t);if(void 0===e)throw console.trace(`Skeleton.getBone(${t}): no such bone`),Error(`Skeleton.getBone(${t}): no such bone`);return e}skinMesh(t,e){const i=new Array(t.length).fill(0);for(let[s,o]of e.entries()){const[e,n]=o,a=this.getBone(s);for(let s=0;s<e.length;++s){const o=3*e[s],l=n[s],r=D(_(),M(t[o],t[o+1],t[o+2]),a.matPoseVerts);i[o]+=r[0]*l,i[o+1]+=r[1]*l,i[o+2]+=r[2]*l}}return i}}function F(t){const e=function(t,e="memory"){let i;try{i=JSON.parse(t)}catch(i){throw console.log(`Failed to parse JSON in ${e}:\n${t.substring(0,256)}`),i}return new P(e,i)}(m.getInstance().readFile(t),t);return console.log(`Loaded skeleton with ${e.bones.size} bones from file ${t}`),e}function W(t){if(void 0===t)throw Error();return M(t[0],t[1],t[2])}function U(t,e,i=1,s=!1){const o=new Map;return s?t.forEach((t=>{let s=1;t.factorDependencies.forEach((t=>{const i=e.get(t);void 0!==i?s*=i:console.log(`no factor for '${t}'`)})),o.set(t.targetPath,i*s)})):t.forEach((t=>{let s=1;t.factorDependencies.forEach((t=>{let i=e.get(t);void 0===i&&(console.log(`no factor for ${t}`),i=1/3),s*=i||0})),o.set(t.targetPath,i*s)})),o}function j(t,e,i){return void 0!==e&&void 0!==e.children&&(e.children=[e.children]),G(t,e)}function G(t,e,i){let s;if("string"!=typeof t)return new t(e);const o=t;switch(o){case"svg":case"line":case"rect":case"circle":case"path":case"text":s="http://www.w3.org/2000/svg";break;default:s="http://www.w3.org/1999/xhtml"}const n=document.createElementNS(s,o);return J(n,e,s),n}function J(t,e,i){if(null!=e){for(let[s,o]of Object.entries(e))switch(s){case"children":break;case"action":t.setAction(o);break;case"model":t.setModel(o);break;case"class":t.classList.add(o);break;case"style":for(let[e,i]of Object.entries(o)){const s=/[A-Z]/g;e=e.replace(s,(t=>"-"+t.toLowerCase())),t.style.setProperty(e,i)}break;case"set":Object.defineProperty(e.set.object,e.set.attribute,{value:t});break;default:if("on"===s.substring(0,2))t.addEventListener(s.substr(2),o);else if("object"!=typeof o){if("http://www.w3.org/2000/svg"===i){const t=/[A-Z]/g;s=s.replace(t,(t=>"-"+t.toLowerCase()))}t.setAttributeNS(null,s,`${o}`)}}if(void 0!==e.children)for(let i of e.children)"string"==typeof i?t.appendChild(document.createTextNode(i)):t.appendChild(i)}}function Y(t,...e){let i=t[0];return e.forEach(((e,s)=>{i=i.concat(e).concat(t[s+1])})),i}function q(t,e){const i=document.createElement(t);for(let t=0;t<e.length;++t){let s=e[t];s instanceof Array&&(e.splice(t,1,...s),s=e[t]),"string"!=typeof s?i.appendChild(s):i.appendChild(document.createTextNode(s))}return i}function K(t){return document.createTextNode(t)}const X=(...t)=>q("div",t),Z=(...t)=>q("span",t),Q=(...t)=>q("input",t),tt=(...t)=>q("button",t),et=(...t)=>q("ul",t),it=(...t)=>q("li",t),st="http://www.w3.org/2000/svg";function ot(t){const e=document.createElementNS(st,"svg");return void 0!==t&&e.appendChild(t),e}function nt(t){const e=document.createElementNS(st,"path");return void 0!==t&&e.setAttributeNS(null,"d",t),e}function at(t,e,i,s,o,n){const a=document.createElementNS(st,"line");return a.setAttributeNS(null,"x1",`${t}`),a.setAttributeNS(null,"y1",`${e}`),a.setAttributeNS(null,"x2",`${i}`),a.setAttributeNS(null,"y2",`${s}`),void 0!==o&&a.setAttributeNS(null,"stroke",o),void 0!==n&&a.setAttributeNS(null,"fill",n),a}class lt extends h{constructor(t){super(t)}}class rt extends r{constructor(t=""){super(),this._value=t}set promise(t){this._value=t,this.modified.trigger()}get promise(){return"string"==typeof this._value?()=>this._value:this._value}set value(t){this._value!==t&&("string"==typeof t?(this._value=t,this.modified.trigger()):console.trace(`TextModel.set value(value: string): ${typeof t} is not type string`))}get value(){switch(typeof this._value){case"number":case"string":this._value=`${this._value}`;break;case"function":this._value=this._value()}return this._value}}class ht extends rt{constructor(t){super(t)}}class dt extends r{constructor(t,e){super(),this.signal=new l,this.title=e,this._enabled=!0}set value(t){throw Error("Action.value can not be assigned a value")}get value(){throw Error("Action.value can not return a value")}trigger(t){this._enabled&&this.signal.trigger(t)}}function ct(t,e){let i=t.getAttribute(e);if(null===i)throw console.log("missing attribute '"+e+"' in ",t),Error("missing attribute '"+e+"' in "+t.nodeName);return i}function ut(t,e){let i=t.getAttribute(e);return null===i?void 0:i}let pt=new class{constructor(){this.modelId2Models=new Map,this.modelId2Views=new Map,this.view2ModelIds=new Map,this.sigChanged=new l}registerAction(t,e){let i=new dt(void 0,t);return i.signal.add(e),this._registerModel("A:"+t,i),i}registerModel(t,e){this._registerModel("M:"+t,e)}_registerModel(t,e){let i=this.modelId2Models.get(t);i||(i=new Set,this.modelId2Models.set(t,i)),i.add(e);let s=this.modelId2Views.get(t);if(s)for(let t of s)t.setModel(e)}registerView(t,e){if(e.controller&&e.controller!==this)return void console.log("error: attempt to register view more than once at different controllers");e.controller=this;let i=this.view2ModelIds.get(e);i||(i=new Set,this.view2ModelIds.set(e,i)),i.add(t);let s=this.modelId2Views.get(t);s||(s=new Set,this.modelId2Views.set(t,s)),s.add(e);let o=this.modelId2Models.get(t);if(o)for(let t of o)e.setModel(t)}unregisterView(t){if(!t.controller)return;if(t.controller!==this)throw Error("attempt to unregister view from wrong controller");let e=this.view2ModelIds.get(t);if(e)for(let i of e){let e=this.modelId2Views.get(i);e&&(e.delete(t),0===e.size&&this.modelId2Views.delete(i),t.setModel(void 0))}}clear(){for(let t of this.view2ModelIds)t[0].setModel(void 0);this.modelId2Models.clear(),this.modelId2Views.clear(),this.view2ModelIds.clear()}bind(t,e){this.registerModel(t,e)}action(t,e){return this.registerAction(t,e)}text(t,e){let i=new rt(e);return this.bind(t,i),i}html(t,e){let i=new ht(e);return this.bind(t,i),i}boolean(t,e){let i=new lt(e);return this.bind(t,i),i}number(t,e,i){let s=new d(e,i);return this.bind(t,s),s}};class gt{constructor(){this._stop=!1,this._firstFrame=this._firstFrame.bind(this),this._animationFrame=this._animationFrame.bind(this)}start(){this.prepare(),!0!==this._stop&&this.requestAnimationFrame(this._firstFrame)}stop(){this._stop=!0,this.animator?.current===this&&this.animator.clearCurrent()}replace(t){this.next=t,this.animationFrame(1),this.lastFrame(),t.prepare()}prepare(){}firstFrame(){}animationFrame(t){}lastFrame(){}requestAnimationFrame(t){window.requestAnimationFrame(t)}_firstFrame(t){this.startTime=t,this.firstFrame(),this._stop||(this.animationFrame(0),this.requestAnimationFrame(this._animationFrame))}_animationFrame(t){if(this.next)return void this.next._firstFrame(t);let e=gt.animationFrameCount>0?(t-this.startTime)/gt.animationFrameCount:1;e=e>1?1:e;const i=this.ease(e);this.animationFrame(i),this._stop||(i<1?this.requestAnimationFrame(this._animationFrame.bind(this)):(this.lastFrame(),this.animator&&this.animator._current===this&&this.animator.clearCurrent()))}ease(t){return.5*(1-Math.cos(Math.PI*t))}}gt.animationFrameCount=468;class mt extends gt{constructor(t){super(),this.animation=t}prepare(){this.animation.prepare()}firstFrame(){this.animation.firstFrame()}animationFrame(t){this.animation.animationFrame(t)}lastFrame(){this.animation.lastFrame()}}class ft{get current(){if(void 0!==this._current)return this._current instanceof mt?this._current.animation:this._current}clearCurrent(){this._current=void 0}run(t){let e;e=t instanceof gt?t:new mt(t);const i=this._current;if(this._current=e,e.animator=this,i)i.animator=void 0,i.replace(e);else{if(ft.halt)return;e.start()}}}ft.halt=!1;class bt extends r{constructor(){super(),this._stringValue=""}set stringValue(t){this._stringValue!==t&&(this._stringValue=t,this.modified.trigger())}get stringValue(){return this._stringValue}isValidStringValue(t){return!1}}class xt extends bt{constructor(t,e){super(),this.enumClass=t,void 0!==e&&(this._value=e)}get value(){return this._value}set value(t){this.setValue(t)}get stringValue(){return this.toString()}set stringValue(t){this.fromString(t)}getValue(){return this._value}setValue(t){this._value!==t&&(this._value=t,this.modified.trigger())}toString(){return this.enumClass[this._value]}fromString(t){const e=this.enumClass[t];if(void 0===e||"string"!=typeof this.enumClass[e]){let e="";return Object.keys(this.enumClass).forEach((t=>{const i=this.enumClass[t];"string"==typeof i&&(e=0!==e.length?`${e}, ${i}`:i)})),void console.trace(`EnumModel<T>.fromString('${t}'): invalid value, must be one of ${e}`)}this._value!==e&&(this._value=e,this.modified.trigger())}isValidStringValue(t){const e=this.enumClass[t];return void 0!==e&&"string"==typeof this.enumClass[e]}}class vt extends HTMLElement{static define(t,e,i){const s=window.customElements.get(t);void 0===s?window.customElements.define(t,e,i):s!==e&&console.trace(`View::define(${t}, ...): attempt to redefine view with different constructor`)}constructor(t){super(),J(this,t)}attachStyle(t){this.shadowRoot.appendChild(document.importNode(t,!0))}setModel(t){console.trace("Please note that View.setModel(model) has no implementation.")}getModelId(){if(!this.hasAttribute("model"))throw Error("no 'model' attribute");let t=this.getAttribute("model");if(!t)throw Error("no model id");return"M:"+t}getActionId(){if(!this.hasAttribute("action"))throw Error("no 'action' attribute");let t=this.getAttribute("action");if(!t)throw Error("no action id");return"A:"+t}connectedCallback(){if(this.controller)return;let t="";try{t=this.getModelId()}catch(t){}""!=t&&pt.registerView(t,this)}disconnectedCallback(){this.controller&&this.controller.unregisterView(this)}}class wt extends vt{constructor(t){super(t),void 0!==t?.model&&this.setModel(t.model)}updateModel(){}updateView(t){}setModel(t){if(t===this.model)return;const e=this;this.model&&this.model.modified.remove(e),t&&t.modified.add((t=>e.updateView(t)),e),this.model=t,this.isConnected&&this.updateView(void 0)}connectedCallback(){super.connectedCallback(),this.model&&this.updateView(void 0)}}class yt extends wt{constructor(t){super(t)}connectedCallback(){if(this.controller)this.updateView();else{try{pt.registerView(this.getActionId(),this)}catch(t){}try{pt.registerView(this.getModelId(),this)}catch(t){}this.updateView()}}disconnectedCallback(){super.disconnectedCallback(),this.controller&&this.controller.unregisterView(this)}setModel(t){if(!t)return this.model&&this.model.modified.remove(this),this.action&&this.action.modified.remove(this),this.model=void 0,this.action=void 0,void this.updateView();if(t instanceof dt)this.action=t,this.action.modified.add((()=>{this.updateView()}),this);else{if(!(t instanceof rt))throw Error("unexpected model of type "+t.constructor.name);this.model=t,this.model.modified.add((()=>{this.updateView()}),this)}this.updateView()}setAction(t){if(t instanceof Function){const e=new dt(void 0,"");e.signal.add(t),this.setModel(e)}else this.setModel(t)}isEnabled(){return void 0!==this.action&&this.action.enabled}}const Ct=document.createElement("style");Ct.textContent=Y`
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
`;class kt extends wt{constructor(t){super(t),this.input=document.createElement("input"),this.input.classList.add("tx-text"),this.input.oninput=()=>{this.updateModel()},this.wheel=this.wheel.bind(this),this.input.onwheel=this.wheel,this.attachShadow({mode:"open"}),this.attachStyle(Ct),this.shadowRoot.appendChild(this.input)}wheel(t){this.model instanceof d&&(t.deltaY>0&&(this.model.decrement(),t.preventDefault()),t.deltaY<0&&(this.model.increment(),t.preventDefault()))}focus(){this.input.focus()}blur(){this.input.blur()}static get observedAttributes(){return["value"]}attributeChangedCallback(t,e,i){if("value"===t)this.model&&void 0!==i&&(this.model.value=i)}updateModel(){this.model&&(this.model.value=this.input.value),this.setAttribute("value",this.input.value)}updateView(){if(!this.model)return;const t=`${this.model.value}`;this.input.value!==t&&(this.input.value=t,this.setAttribute("value",this.input.value))}get value(){return this.input.value}set value(t){this.input.value=t,this.updateModel()}}kt.define("tx-text",kt);let Ht=document.createElement("style");Ht.textContent="\n\n/* try to follow material ui: when active render button labels in black, otherwise in gray */\nsvg .fill {\n  fill: var(--tx-gray-700);\n  stroke: var(--tx-gray-700);\n}\nsvg .stroke {\n  fill: none;\n  stroke: var(--tx-gray-700);\n}\nsvg .strokeFill {\n  fill: var(--tx-gray-200);\n  stroke: var(--tx-gray-700);\n}\n\n/*\nthese don't seem to be in use anymore\n.toolbar.active svg .fill {\n  fill: #000;\n  stroke: #000;\n}\n.toolbar.active svg .stroke {\n  fill: none;\n  stroke: #000;\n}\n.toolbar.active svg .strokeFill {\n  fill: #fff;\n  stroke: #000;\n}\n*/\n\n.toolbar button {\n    background: var(--tx-gray-75);\n    color: var(--tx-gray-800);\n    border: 1px var(--tx-gray-400);\n    border-style: solid solid solid none;\n    padding: 5;\n    margin: 0;\n    vertical-align: middle;\n    height: 22px;\n}\n\n.toolbar button:active:hover {\n    background: linear-gradient(to bottom, var(--tx-gray-600) 0%,var(--tx-gray-50) 100%,var(--tx-gray-500) 100%);\n}\n\n.toolbar button.left {\n    border-style: solid;\n    border-radius: 3px 0 0 3px;\n}\n\n.toolbar button.right {\n    border: 1px var(--tx-gray-400);\n    border-style: solid solid solid none;\n    border-radius: 0 3px 3px 0;\n}\n\n.toolbar button.active {\n    background: linear-gradient(to bottom, var(--tx-gray-600) 0%,var(--tx-gray-50) 100%,var(--tx-gray-500) 100%);\n    border: 1px var(--tx-global-blue-500) solid;\n    color: var(--tx-gray-900);\n}\n\ndiv.textarea {\n  font-family: var(--tx-font-family);\n  font-size: var(--tx-font-size);\n  border: 1px var(--tx-gray-400) solid;\n  border-radius: 3px;\n  margin: 2px;\n  padding: 4px 5px;\n  outline-offset: -2px;\n}\n\ndiv.textarea h1 {\n  font-size: 22px;\n  margin: 0;\n  padding: 4px 0 4px 0;\n}\n\ndiv.textarea h2 {\n  font-size: 18px;\n  margin: 0;\n  padding: 4px 0 4px 0;\n}\n\ndiv.textarea h3 {\n  font-size: 16px;\n  margin: 0;\n  padding: 4px 0 4px 0;\n}\n\ndiv.textarea h4 {\n  font-size: 14px;\n  margin: 0;\n  padding: 4px 0 4px 0;\n}\n\ndiv.textarea div {\n  padding: 2px 0 2px 0;\n}\n";class St extends wt{constructor(){super(),St.texttool=this;let t=j("div",{class:"toolbar"});this.buttonH1=j("button",{class:"left",children:"H1"}),this.buttonH1.onclick=()=>{document.execCommand("formatBlock",!1,"<h1>"),this.update()},t.appendChild(this.buttonH1),this.buttonH2=j("button",{children:"H2"}),this.buttonH2.onclick=()=>{document.execCommand("formatBlock",!1,"<h2>"),this.update()},t.appendChild(this.buttonH2),this.buttonH3=j("button",{children:"H3"}),this.buttonH3.onclick=()=>{document.execCommand("formatBlock",!1,"<h3>"),this.update()},t.appendChild(this.buttonH3),this.buttonH4=j("button",{class:"right",children:"H4"}),this.buttonH4.onclick=()=>{document.execCommand("formatBlock",!1,"<h4>"),this.update()},t.appendChild(this.buttonH4),t.appendChild(document.createTextNode(" ")),this.buttonBold=j("button",{class:"left",children:j("b",{children:"B"})}),this.buttonBold.onclick=()=>{document.execCommand("bold",!1),this.update()},t.appendChild(this.buttonBold),this.buttonItalic=j("button",{children:j("i",{children:"I"})}),this.buttonItalic.onclick=()=>{document.execCommand("italic",!1),this.update()},t.appendChild(this.buttonItalic),this.buttonUnderline=j("button",{children:j("u",{children:"U"})}),this.buttonUnderline.onclick=()=>{document.execCommand("underline",!1),this.update()},t.appendChild(this.buttonUnderline),this.buttonStrikeThrough=j("button",{children:j("strike",{children:"S"})}),this.buttonStrikeThrough.onclick=()=>{document.execCommand("strikeThrough",!1),this.update()},t.appendChild(this.buttonStrikeThrough),this.buttonSubscript=j("button",{children:"x₂"}),this.buttonSubscript.onclick=()=>{document.execCommand("subscript",!1),this.update()},t.appendChild(this.buttonSubscript),this.buttonSuperscript=j("button",{class:"right",children:"x²"}),this.buttonSuperscript.onclick=()=>{document.execCommand("superscript",!1),this.update()},t.appendChild(this.buttonSuperscript),t.appendChild(document.createTextNode(" ")),this.buttonJustifyLeft=j("button",{class:"left",children:G("svg",{viewBox:"0 0 10 9",width:"10",height:"9",children:[j("line",{x1:"0",y1:"0.5",x2:"10",y2:"0.5",class:"stroke"}),j("line",{x1:"0",y1:"2.5",x2:"6",y2:"2.5",class:"stroke"}),j("line",{x1:"0",y1:"4.5",x2:"10",y2:"4.5",class:"stroke"}),j("line",{x1:"0",y1:"6.5",x2:"6",y2:"6.5",class:"stroke"}),j("line",{x1:"0",y1:"8.5",x2:"10",y2:"8.5",class:"stroke"})]})}),this.buttonJustifyLeft.onclick=()=>{document.execCommand("justifyLeft",!1),this.update()},t.appendChild(this.buttonJustifyLeft),this.buttonJustifyCenter=j("button",{children:G("svg",{viewBox:"0 0 10 9",width:"10",height:"9",children:[j("line",{x1:"0",y1:"0.5",x2:"10",y2:"0.5",class:"stroke"}),j("line",{x1:"2",y1:"2.5",x2:"8",y2:"2.5",class:"stroke"}),j("line",{x1:"0",y1:"4.5",x2:"10",y2:"4.5",class:"stroke"}),j("line",{x1:"2",y1:"6.5",x2:"8",y2:"6.5",class:"stroke"}),j("line",{x1:"0",y1:"8.5",x2:"10",y2:"8.5",class:"stroke"})]})}),this.buttonJustifyCenter.onclick=()=>{document.execCommand("justifyCenter",!1),this.update()},t.appendChild(this.buttonJustifyCenter),this.buttonJustifyRight=j("button",{class:"right",children:G("svg",{viewBox:"0 0 10 9",width:"10",height:"9",children:[j("line",{x1:"0",y1:"0.5",x2:"10",y2:"0.5",class:"stroke"}),j("line",{x1:"4",y1:"2.5",x2:"10",y2:"2.5",class:"stroke"}),j("line",{x1:"0",y1:"4.5",x2:"10",y2:"4.5",class:"stroke"}),j("line",{x1:"4",y1:"6.5",x2:"10",y2:"6.5",class:"stroke"}),j("line",{x1:"0",y1:"8.5",x2:"10",y2:"8.5",class:"stroke"})]})}),this.buttonJustifyRight.onclick=()=>{document.execCommand("justifyRight",!1),this.update()},t.appendChild(this.buttonJustifyRight),this.attachShadow({mode:"open"}),this.shadowRoot.appendChild(document.importNode(Ht,!0)),this.shadowRoot.appendChild(t)}update(){this.buttonH1.classList.toggle("active","h1"===document.queryCommandValue("formatBlock")),this.buttonH2.classList.toggle("active","h2"===document.queryCommandValue("formatBlock")),this.buttonH3.classList.toggle("active","h3"===document.queryCommandValue("formatBlock")),this.buttonH4.classList.toggle("active","h4"===document.queryCommandValue("formatBlock")),this.buttonBold.classList.toggle("active",document.queryCommandState("bold")),this.buttonItalic.classList.toggle("active",document.queryCommandState("italic")),this.buttonUnderline.classList.toggle("active",document.queryCommandState("underline")),this.buttonStrikeThrough.classList.toggle("active",document.queryCommandState("strikeThrough")),this.buttonSubscript.classList.toggle("active",document.queryCommandState("subscript")),this.buttonSuperscript.classList.toggle("active",document.queryCommandState("superscript")),this.buttonJustifyLeft.classList.toggle("active",document.queryCommandState("justifyLeft")),this.buttonJustifyCenter.classList.toggle("active",document.queryCommandState("justifyCenter")),this.buttonJustifyRight.classList.toggle("active",document.queryCommandState("justifyRight"))}}St.define("tx-texttool",St);class Et extends wt{constructor(){super();let t=document.createElement("div");this.content=t,t.classList.add("tx-text"),t.contentEditable="true",t.oninput=e=>{if(this.model instanceof ht){let i=e.target.firstChild;i&&3===i.nodeType?document.execCommand("formatBlock",!1,"<div>"):"<br>"===t.innerHTML&&(t.innerHTML="")}this.updateModel()},t.onkeydown=t=>{this.model instanceof ht&&(!0===t.metaKey&&"b"===t.key?(t.preventDefault(),document.execCommand("bold",!1),this.updateTextTool()):!0===t.metaKey&&"i"===t.key?(t.preventDefault(),document.execCommand("italic",!1),this.updateTextTool()):!0===t.metaKey&&"u"===t.key?(t.preventDefault(),document.execCommand("underline",!1),this.updateTextTool()):"Tab"===t.key?t.preventDefault():"Enter"===t.key&&!0!==t.shiftKey&&"blockquote"===document.queryCommandValue("formatBlock")&&document.execCommand("formatBlock",!1,"<p>"))},t.onkeyup=()=>{this.updateTextTool()},t.onmouseup=()=>{this.updateTextTool()},this.attachShadow({mode:"open"}),this.attachStyle(Ct),this.shadowRoot.appendChild(t)}updateTextTool(){void 0!==St.texttool&&St.texttool.update()}updateModel(){this.model&&(this.model.promise=()=>this.model instanceof ht?this.content.innerHTML:this.content.innerText)}updateView(){this.model&&(this.model instanceof ht?this.content.innerHTML!==this.model.value&&(this.content.innerHTML=this.model.value):this.content.innerText!==this.model.value&&(this.content.innerText=this.model.value))}}Et.define("tx-textarea",Et);class At extends wt{constructor(t){super(t)}updateView(){void 0!==this.model?this.model instanceof rt?this.innerText=this.model.value:this.model instanceof ht?this.innerHTML=this.model.value:this.model instanceof d&&(this.innerText=`${this.model.value}`):this.innerText=""}}At.define("tx-display",At);const Tt=document.createElement("style");Tt.textContent=Y`
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
`;class _t extends yt{constructor(t){super(t),this.button=tt(this.label=Z()),this.button.classList.add("tx-button"),this.label.classList.add("tx-label"),this.button.onclick=()=>{this.action&&this.action.trigger()},this.button.disabled=!0,this.attachShadow({mode:"open"}),this.attachStyle(Tt),this.shadowRoot.appendChild(this.button)}connectedCallback(){super.connectedCallback(),0===this.children.length&&(this._observer=new MutationObserver(((t,e)=>{void 0!==this._timer&&clearTimeout(this._timer),this._timer=window.setTimeout((()=>{this._timer=void 0,this.updateView()}),100)})),this._observer.observe(this,{childList:!0,subtree:!0,characterData:!0}))}updateView(){this.isConnected&&(this.model&&this.model.value?this.model instanceof ht?this.label.innerHTML=this.model.value:this.label.innerText=this.model.value:this.label.innerHTML=this.innerHTML,this.button.disabled=!this.isEnabled())}}_t.define("tx-button",_t);class Mt extends wt{setModel(t){if(void 0!==t&&!(t instanceof lt))throw Error("BooleanView.setModel(): model is not of type BooleanModel");super.setModel(t)}updateModel(){this.model&&(this.model.value=this.input.checked)}updateView(){this.model&&this.model.enabled?this.input.removeAttribute("disabled"):this.input.setAttribute("disabled",""),this.model&&(this.input.checked=this.model.value)}}const Rt=document.createElement("style");Rt.textContent=Y`
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
`;class Nt extends Mt{constructor(){super(),this.classList.add("tx-checkbox"),this.input=Q(),this.input.type="checkbox",this.input.onchange=()=>{this.updateModel()};const t=ot(nt("M3.5 9.5a.999.999 0 01-.774-.368l-2.45-3a1 1 0 111.548-1.264l1.657 2.028 4.68-6.01A1 1 0 019.74 2.114l-5.45 7a1 1 0 01-.777.386z"));this.attachShadow({mode:"open"}),this.attachStyle(Rt),this.shadowRoot.appendChild(this.input),this.shadowRoot.appendChild(t)}}Nt.define("tx-checkbox",Nt);const Bt=document.createElement("style");Bt.textContent=Y`
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
}`;class Vt extends wt{constructor(){let t,e,i,s;super();const o=((...t)=>q("form",t))(X(t=ot(s=nt("M33.173 30.215L25.4 22.443a12.826 12.826 0 10-2.957 2.957l7.772 7.772a2.1 2.1 0 002.958-2.958zM6 15a9 9 0 119 9 9 9 0 01-9-9z")),i=Q()),tt(e=ot(nt("M6.548 5L9.63 1.917A1.094 1.094 0 008.084.371L5.001 3.454 1.917.37A1.094 1.094 0 00.371 1.917L3.454 5 .37 8.085A1.094 1.094 0 101.917 9.63l3.084-3.083L8.084 9.63a1.094 1.094 0 101.547-1.546z"))));t.setAttributeNS(null,"width","100%"),t.setAttributeNS(null,"height","100%"),s.setAttributeNS(null,"transform","scale(0.5, 0.5)"),e.setAttributeNS(null,"width","100%"),e.setAttributeNS(null,"height","100%"),i.type="search",i.placeholder="Search",i.autocomplete="off",o.classList.add("tx-search"),this.attachShadow({mode:"open"}),this.attachStyle(Bt),this.shadowRoot.appendChild(o)}}Vt.define("tx-search",Vt);const Dt=document.createElement("style");Dt.textContent=Y`
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
}`;class Lt extends Mt{constructor(){super(),this.classList.add("tx-switch"),this.input=Q(),this.input.type="checkbox",this.input.onchange=()=>{this.updateModel()},this.attachShadow({mode:"open"}),this.attachStyle(Dt),this.shadowRoot.appendChild(this.input),this.shadowRoot.appendChild(Z())}}Lt.define("tx-switch",Lt);const It=document.createElement("style");It.textContent=Y`
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
`;class $t extends wt{constructor(t){super(t),this.classList.add("tx-radio"),this.input=Q(),this.input.type="radio",this.input.value=this.getAttribute("value");let e=this;this.input.onchange=()=>{e.updateModel()},this.attachShadow({mode:"open"}),this.attachStyle(It),this.shadowRoot.appendChild(this.input),this.shadowRoot.appendChild(Z())}updateModel(){this.model&&(this.model.stringValue=this.input.value)}updateView(){if(this.model){let t=$t.radioGroups.get(this.model);void 0===t&&(t=++$t.radioGroupCounter,$t.radioGroups.set(this.model,t)),this.input.name=`radioGroup${t}`}else this.input.name="";this.model&&this.model.enabled?this.input.removeAttribute("disabled"):this.input.setAttribute("disabled",""),this.model&&(this.input.checked=this.model.stringValue===this.input.value)}}var zt;$t.radioGroupCounter=0,$t.radioGroups=new WeakMap,$t.define("tx-radiobutton",$t),function(t){t[t.WAIT=0]="WAIT",t[t.DOWN=1]="DOWN",t[t.UP_N_HOLD=2]="UP_N_HOLD",t[t.DOWN_N_HOLD=3]="DOWN_N_HOLD",t[t.DOWN_N_OUTSIDE=4]="DOWN_N_OUTSIDE",t[t.DOWN_N_INSIDE_AGAIN=5]="DOWN_N_INSIDE_AGAIN"}(zt||(zt={}));class Ot extends vt{constructor(t){super(t),this.vertical=!0,this.closeOnClose=!1,this.state=zt.WAIT}}class Pt extends Ot{constructor(t,e){super(),this.vertical=!0,this.root=t,this.parentButton=e,this.popup=document.createElement("div"),this.popup.classList.add("menu-popup");let i=t.down;for(;i;)i.isAvailable()?i.createWindowAt(this,this.popup):i.deleteWindow(),i=i.next;this.appendChild(this.popup),this.show()}show(){this.parentButton.master.vertical?function(t,e){let i=t.getBoundingClientRect();e.style.opacity="0",e.style.left=i.left+i.width+"px",e.style.top=i.top+"px",setTimeout((function(){let t=e.getBoundingClientRect();i.top+t.height>window.innerHeight&&(e.style.top=i.top+i.height-t.height+"px"),i.left+i.width+t.width>window.innerWidth&&(e.style.left=i.left-t.width+"px"),e.style.opacity="1"}),0)}(this.parentButton,this.popup):Ft(this.parentButton,this.popup),this.style.display=""}hide(){this.style.display="none"}}function Ft(t,e){let i=t.getBoundingClientRect();e.style.opacity="0",e.style.left=i.left+"px",e.style.top=i.top+i.height+"px",setTimeout((function(){let t=e.getBoundingClientRect();i.top+i.height+t.height>window.innerHeight&&(e.style.top=i.top-t.height+"px"),i.left+t.width>window.innerWidth&&(e.style.left=i.left+i.width-t.width+"px"),e.style.opacity="1"}),0)}vt.define("tx-popupmenu",Pt);const Wt=document.createElement("style");Wt.textContent=Y`
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
`;const Ut=document.createElement("style");Ut.textContent=Y`
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
}`;class jt extends wt{constructor(t){super(t),this.input=Q(),this.input.type="text",this.asPopupMenu();let e,i=this;this.input.oninput=()=>{i.updateModel()},this.input.onblur=t=>{void 0===this.hover&&this.close()};const s=tt(e=ot(nt("M3 9.95a.875.875 0 01-.615-1.498L5.88 5 2.385 1.547A.875.875 0 013.615.302L7.74 4.377a.876.876 0 010 1.246L3.615 9.698A.872.872 0 013 9.95z")));this.button=s,s.tabIndex=-1,s.style.outline="none",e.style.width="100%",e.style.height="100%",s.onpointerdown=t=>{this.popup?this.close():(t.preventDefault(),this.input.focus(),this.open(),s.setPointerCapture(t.pointerId))},s.onpointermove=t=>{if(void 0===this.popup)return;const e=this.shadowRoot.elementFromPoint(t.clientX,t.clientY);let i;i=e instanceof HTMLLIElement?e:void 0,this.hover!==i&&(this.hover&&this.hover.classList.remove("tx-hover"),this.hover=i,this.hover&&this.hover.classList.add("tx-hover"))},s.onpointerup=t=>{if(this.hover){const t=parseInt(this.hover.dataset.idx);return this.close(),void this.select(t)}const e=this.shadowRoot.elementFromPoint(t.clientX,t.clientY);s.contains(e)?this.input.focus():this.close()},this.keydown=this.keydown.bind(this),this.input.onkeydown=this.keydown,this.wheel=this.wheel.bind(this),this.input.onwheel=this.button.onwheel=this.wheel,this.classList.add("tx-combobox"),this.attachShadow({mode:"open"}),this.attachStyle(Wt),this.attachStyle(Ut),this.shadowRoot.appendChild(this.input),this.shadowRoot.appendChild(s)}connectedCallback(){if(this.controller)return;super.connectedCallback();const t=this.getAttribute("text");null!==t&&(pt.registerView(`M:${t}`,this),this.asComboBox(),this.updateModel())}setModel(t){if(!t)return this.text&&(this.text.modified.remove(this),this.text=void 0),void super.setModel(t);t instanceof bt&&super.setModel(t),t instanceof rt&&(this.text=t,this.text.modified.add((()=>{this.input.value=this.text.value}),this))}keydown(t){switch(this.input.readOnly&&t.preventDefault(),t.key){case"ArrowUp":this.previousItem();break;case"ArrowDown":this.nextItem()}}wheel(t){t.preventDefault(),this.input.focus(),t.deltaY>0&&this.nextItem(),t.deltaY<0&&this.previousItem()}asPopupMenu(){this.input.readOnly=!0;for(let t of["user-select","-webkit-user-select","-webkit-touch-callout","-khtml-user-select"])this.input.style.setProperty(t,"none")}asComboBox(){this.input.readOnly=!1;for(let t of["user-select","-webkit-user-select","-webkit-touch-callout","-khtml-user-select"])this.input.style.removeProperty(t)}updateModel(){this.text&&(this.text.value=this.input.value)}updateView(){this.model&&this.model.enabled?this.input.removeAttribute("disabled"):this.input.setAttribute("disabled",""),void 0!==this.model&&(this.input.value=this.displayName(this.model.stringValue),this.updateModel())}displayName(t){for(let e=0;e<this.children.length;++e){const i=this.children[e];if("OPTION"===i.nodeName){const e=i;if(e.value===t)return e.text}}let e="";for(let t=0;t<this.children.length;++t){const i=this.children[t];if("OPTION"===i.nodeName){e=`${e} '${i.value}'`}}return 0===e.length&&(e=" empty option list"),console.log(`'${t}' is not in${e} of <tx-select model="${this.getAttribute("model")}">`),console.trace(this),""}open(){let t,e=this;this.popup=X(t=et(...function(t,e){let i=[];for(let s=0;s<t;++s){const t=e(s);t instanceof Array?i.push(...t):i.push(t)}return i}(this.children.length,(t=>{const i=it(K(this.children.item(t).innerText));return i.tabIndex=0,i.ariaRoleDescription="option",i.dataset.idx=`${t}`,i.onpointerdown=t=>{this.button.setPointerCapture(t.pointerId),this.hover=i,t.preventDefault()},i.onclick=()=>{e.select(t)},this.children[t],i})))),this.popup.classList.add("tx-popover"),this.popup.style.position="fixed",this.popup.style.zIndex="99",t.ariaRoleDescription="listbox",t.classList.add("tx-menu"),this.shadowRoot.appendChild(this.popup),Ft(this,this.popup)}close(){this.hover=void 0,void 0!==this.popup&&(this.shadowRoot.removeChild(this.popup),this.popup=void 0)}select(t){if(void 0===this.model)return void console.log(`<tx-select model='${this.getAttribute("model")}'> has no model`);this.close();const e=this.children[t];e instanceof HTMLOptionElement?this.model.stringValue=e.value:console.log(`<tx-select>: unpexected element <${e.nodeName.toLowerCase()}> instead of <option>`)}getIndex(){const t=this.model?.stringValue;for(let e=0;e<this.children.length;++e)if(this.children[e].value===t)return e}nextItem(){let t=this.getIndex();void 0===t?t=0:++t,t>=this.children.length||this.select(t)}previousItem(){let t=this.getIndex();void 0===t?t=this.children.length-1:--t,t<0||this.select(t)}}jt.define("tx-select",jt);const Gt=document.createElement("style");Gt.textContent=Y`

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
`;class Jt extends wt{constructor(t){super(t),this.input=document.createElement("input"),this.input.type="range";let e=this;this.input.oninput=()=>{e.updateModel()},this.classList.add("tx-slider"),this.attachShadow({mode:"open"}),this.attachStyle(Gt),this.shadowRoot.appendChild(this.input)}updateModel(){this.model&&(this.model.value=Number.parseFloat(this.input.value))}updateView(){this.model&&(void 0===this.model.step&&void 0!==this.model.min&&void 0!==this.model.max?this.input.step=""+(this.model.max-this.model.min)/100:this.input.step=String(this.model.step),this.input.min=String(this.model.min),this.input.max=String(this.model.max),this.input.value=String(this.model.value))}}Jt.define("tx-slider",Jt);class Yt extends vt{static focusIn(t){const e=new Map;for(let i=t.parentElement,s=0;null!==i;i=i.parentElement,++s)e.set(i,s);let i,s,o=Number.MAX_SAFE_INTEGER,n=new Array;for(const s of this.allTools.values())if(s.canHandle(t))for(let t=s.parentElement,a=0;null!==t;t=t.parentElement,++a){const a=e.get(t);void 0!==a&&(o<a||(o>a&&(n.length=0),o=a,i=t,n.push(s)))}if(!i)return;const a=Yt.getIndex(t,i);let l=Number.MIN_SAFE_INTEGER;for(let t of n){const e=Yt.getIndex(t,i);e<a&&e>l&&(l=e,s=t)}this.setActive(s,t)}static getIndex(t,e){void 0===e&&console.trace(`GenericTool.getIndex(${t}, ${e})`);let i=t;for(;i.parentElement!==e;)i=i.parentElement;return Array.from(e.childNodes).indexOf(i)}static setActive(t,e){this.activeTool&&this.activeTool.deactivate(),this.activeTool=t,this.activeView=e,t&&t.activate()}static focusOut(t){this.activeView===t&&this.setActive(void 0,void 0)}connectedCallback(){super.connectedCallback(),Yt.allTools.add(this)}disconnectedCallback(){Yt.activeTool===this&&Yt.setActive(void 0,void 0),Yt.allTools.delete(this),super.disconnectedCallback()}}Yt.allTools=new Set,window.addEventListener("focusin",(t=>{t.target instanceof Yt||(t.relatedTarget instanceof vt&&Yt.focusOut(t.relatedTarget),t.target instanceof vt&&Yt.focusIn(t.target))}));let qt=document.createElement("style");qt.textContent="\n:host {\n    display: inline-block;\n    overflow: hidden;\n    box-sizing: border-box;\n    border: 1px solid #e3dbdb;\n    border-radius: 3px;\n    background: #e3dbdb;\n    width: 32px;\n    height: 32px;\n    margin: 0;\n    padding: 0;\n}\n\n:host([selected]) {\n    background: #ac9393;\n}\n\n:host([disabled]) {\n    opacity: 0.5;\n}\n\n:host([disabled]) img {\n    opacity: 0.5;\n}\n\n:host([checked][disabled]) {\n}\n";class Kt extends wt{constructor(t){super(t),t?(this.setAttribute("value",t.value),this.setAttribute("img",t.img),!0===t.disabled&&this.setAttribute("disabled","disabled")):t={value:this.getAttribute("value"),img:this.getAttribute("img"),disabled:this.hasAttribute("disabled")},this.onmousedown=t=>{this.hasAttribute("disabled")||(this.focus(),t.preventDefault(),void 0!==this.model&&(this.model.stringValue=this.getValue()))};let e=document.createElement("img");e.src=t.img,this.attachShadow({mode:"open"}),this.shadowRoot.appendChild(document.importNode(qt,!0)),this.shadowRoot.appendChild(e)}getValue(){let t=this.getAttribute("value");if(null===t)throw Error("no value");return t}connectedCallback(){super.connectedCallback(),void 0===this.model&&this.setAttribute("disabled","")}updateView(){if(void 0===this.model)return this.setAttribute("disabled",""),void this.removeAttribute("selected");let t=this.getValue();this.model.isValidStringValue(t)?this.removeAttribute("disabled"):this.setAttribute("disabled",""),this.model.stringValue===t?this.setAttribute("selected",""):this.removeAttribute("selected")}}Kt.define("tx-toolbutton",Kt);class Xt extends wt{constructor(){super()}updateView(){if(!this.model)return;let t=void 0===this.model.value?"":this.model.value;this.model instanceof ht?this.innerHTML=t:this.innerText=t}}Xt.define("tx-slot",Xt);class Zt extends wt{updateView(){this.model&&(this.style.display=this.model.value?"":"none")}}Zt.define("tx-if",Zt);const Qt=document.createElement("style");Qt.textContent=Y`
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

`;class te extends wt{constructor(t){super(t),this.setTab=this.setTab.bind(this),this.classList.add("tx-tabs"),this.hasAttribute("vertical")&&this.classList.add("tx-vertical"),this.content=X(((...t)=>q("slot",t))()),this.content.classList.add("content");const e=et();for(let t=0;t<this.children.length;++t){const i=this.children[t];if("TX-TAB"!==i.nodeName){console.log(`unexpected <${i.nodeName.toLowerCase()}> within <tabs>`);continue}const s=i;let o;e.appendChild(it(o=Z(K(s.getAttribute("label"))))),o.onpointerdown=t=>{t.stopPropagation(),t.preventDefault(),t.cancelBubble=!0,this.setTab(o,s)},void 0===this.activeTab?(this.activeTab=o,this.activePanel=s):s.style.display="none"}this.attachShadow({mode:"open"}),this.shadowRoot.appendChild(document.importNode(Qt,!0)),this.shadowRoot.appendChild(e),this.shadowRoot.appendChild(this.markerLine=X()),this.shadowRoot.appendChild(this.content),this.markerLine.classList.add("line"),this.activeTab&&this.setTab(this.activeTab,this.activePanel)}connectedCallback(){super.connectedCallback(),this.adjustLine()}setTab(t,e){this.activeTab.classList.remove("active"),this.activeTab=t,this.activeTab.classList.add("active"),this.activePanel.style.display="none",this.activePanel=e,this.activePanel.style.display="",this.adjustLine(),this.model&&e.value&&(this.model.stringValue=e.value)}adjustLine(){const t=this.markerLine,e=this.activeTab;void 0!==e&&(this.hasAttribute("vertical")?(t.style.top=`${e.offsetTop}px`,t.style.height=`${e.clientHeight}px`):(t.style.top="-2px",t.style.left=`${e.offsetLeft}px`,t.style.width=`${e.clientWidth}px`))}}te.define("tx-tabs",te);class ee extends vt{constructor(t){super(t),this.label=t?.label,this.value=t?.value}}vt.define("tx-tab",ee);const ie=document.createElement("style");ie.textContent=`\n  :host(.menu-button) {\n    font-family: var(--tx-font-family);\n    font-size: var(--tx-edit-font-size);\n    font-weight: var(--tx-edit-font-weight);\n    padding: 7px;\n    vertical-align: center;\n  \n    background: var(--tx-gray-200);\n    color: var(--tx-gray-900);\n    cursor: default;\n  }\n  :host(.menu-button:hover) {\n    background: var(--tx-gray-300);\n  }\n  :host(.menu-button.active) {\n    background: var(--tx-gray-400);\n    color: var(--tx-gray-900);\n  }\n  :host(.menu-button.disabled) {\n    color: var(--tx-gray-500);\n  }\n  :host(.menu-button.active.disabled) {\n    color: var(--tx-gray-700);\n  }\n  :host(.menu-button.menu-down) {\n    padding-right: 20px;\n    background-image: url("data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" width="15" height="14"><path d="M 0 4 l 10 0 l -5 5 Z" fill="#fff" stroke="none"/></svg>')}");\n    background-repeat: no-repeat;\n    background-position: right center;\n  }\n  :host(.menu-button.active.menu-down) {\n    background-image: url("data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" width="15" height="14"><path d="M 0 4 l 10 0 l -5 5 Z" fill="#fff" stroke="none"/></svg>')}");\n    background-repeat: no-repeat;\n    background-position: right center;\n  }\n  :host(.menu-button.menu-side) {\n    padding-right: 20px;\n    background-image: url("data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" width="15" height="14"><path d="M 0 2 l 0 10 l 5 -5 Z" fill="#fff" stroke="none"/></svg>')}");\n    background-repeat: no-repeat;\n    background-position: right center;\n  }\n  :host(.menu-button.active.menu-side) {\n    background-image: url("data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" width="15" height="14"><path d="M 0 2 l 0 10 l 5 -5 Z" fill="#fff" stroke="none"/></svg>')}");\n    background-repeat: no-repeat;\n    background-position: right center;\n  }\n  .menu-bar {\n    display: flex;\n    flex-direction: row;\n    justify-content: flex-start;\n    align-items: center;\n    background-color: var(--tx-gray-200);\n  }\n  .menu-popup {\n    position: fixed;\n    display: flex;\n    flex-direction: column;\n    box-shadow: 2px 2px 5px var(--tx-gray-50);\n  }\n`;class se extends wt{constructor(t,e){super(),this.master=t,this.node=e;let i=this;if(this.classList.add("menu-button"),e.down&&(t.vertical?this.classList.add("menu-side"):this.classList.add("menu-down")),this.updateView(),this.onmousedown=t=>{t.stopPropagation();let e=function(t){document.removeEventListener("mouseup",e,{capture:!0}),t.preventDefault(),setTimeout((()=>{se.buttonDown&&i.dispatchEvent(new MouseEvent("mouseup",t))}),0)};if(document.addEventListener("mouseup",e,{capture:!0}),se.buttonDown=!0,!this.master)throw Error("yikes");switch(this.master.state){case zt.WAIT:this.master.state=zt.DOWN,this.activate();break;case zt.UP_N_HOLD:this.master.active!==this?(this.master.state=zt.DOWN,this.activate()):this.master.state=zt.DOWN_N_HOLD;break;default:throw Error("unexpected state "+this.master.state)}return!1},this.onmouseup=t=>{if(t.stopPropagation(),se.buttonDown){if(se.buttonDown=!1,!this.master)throw Error("yikes");if(!this.node)throw Error("yikes");switch(this.master.state){case zt.DOWN:this.node.isEnabled()&&!this.node.down?(this.trigger(),this.master.state=zt.WAIT):(this.master.state=zt.UP_N_HOLD,se.documentMouseDown&&document.removeEventListener("mousedown",se.documentMouseDown,{capture:!1}),se.documentMouseDown=function(t){se.documentMouseDown&&document.removeEventListener("mousedown",se.documentMouseDown,{capture:!1}),se.documentMouseDown=void 0,"TOAD-MENUBUTTON"!==t.target.tagName&&i.collapse()},document.addEventListener("mousedown",se.documentMouseDown,{capture:!1}));break;case zt.DOWN_N_HOLD:case zt.DOWN_N_OUTSIDE:this.master.state=zt.WAIT,this.deactivate(),this.collapse(),this.master.closeOnClose;break;case zt.DOWN_N_INSIDE_AGAIN:this.trigger();break;default:throw Error("unexpected state "+this.master.state)}return!1}},this.onmouseout=t=>{if(t.stopPropagation(),!this.master)throw Error("yikes");switch(se.inside=void 0,this.master.state){case zt.WAIT:case zt.DOWN_N_OUTSIDE:case zt.UP_N_HOLD:case zt.DOWN_N_HOLD:break;case zt.DOWN:case zt.DOWN_N_INSIDE_AGAIN:this.master.state=zt.DOWN_N_OUTSIDE,this.updateView();break;default:throw Error("unexpected state")}return!1},this.onmouseover=t=>{if(t.stopPropagation(),!i.master)throw Error("yikes");switch(se.inside=i,i.master.state){case zt.WAIT:case zt.UP_N_HOLD:case zt.DOWN_N_OUTSIDE:case zt.DOWN_N_HOLD:case zt.DOWN:case zt.DOWN_N_INSIDE_AGAIN:if(!se.buttonDown)break;if(!this.master)throw Error("yikes");this.master.active&&this.master.active.deactivate(),this.master.state=zt.DOWN_N_INSIDE_AGAIN,this.activate();break;default:throw Error("unexpected state "+i.master.state)}return!1},this.attachShadow({mode:"open"}),!this.shadowRoot)throw Error("yikes");this.shadowRoot.appendChild(document.importNode(ie,!0)),this.node.modelId||this.shadowRoot.appendChild(document.createTextNode(e.label))}connectedCallback(){if(!this.controller){if(void 0===this.node.down){let t=this.node.title;for(let e=this.node.parent;e&&e.title.length;e=e.parent)t=e.title+"|"+t;t="A:"+t,pt.registerView(t,this)}if(void 0!==this.node.modelId)if("string"==typeof this.node.modelId){let t="M:"+this.node.modelId;pt.registerView(t,this)}else this.setModel(this.node.modelId)}}disconnectedCallback(){this.controller&&this.controller.unregisterView(this)}setModel(t){if(!t)return this.action&&this.action.modified.remove(this),this.model=void 0,this.action=void 0,void this.updateView();if(t instanceof dt)this.action=t,this.action.modified.add((()=>{this.updateView()}),this);else{if(!(t instanceof rt))throw Error("unexpected model of type "+t.constructor.name);this.model=t}this.updateView()}updateView(){if(this.model&&this.model.value){if(!this.shadowRoot)throw Error("yikes");let t=document.createElement("span");this.model instanceof ht?t.innerHTML=this.model.value:t.innerText=this.model.value,this.shadowRoot.children.length>1&&this.shadowRoot.removeChild(this.shadowRoot.children[1]),this.shadowRoot.children.length>1?this.shadowRoot.insertBefore(t,this.shadowRoot.children[1]):this.shadowRoot.appendChild(t)}if(!this.master)throw Error("yikes");let t=!1;if(this.master.active==this)switch(this.master.state){case zt.DOWN:case zt.UP_N_HOLD:case zt.DOWN_N_HOLD:case zt.DOWN_N_INSIDE_AGAIN:t=!0;break;case zt.DOWN_N_OUTSIDE:if(!this.node)throw Error("yikes");t=void 0!==this.node.down&&this.node.isEnabled()}this.classList.toggle("active",t),this.classList.toggle("disabled",!this.isEnabled())}isEnabled(){return void 0!==this.node.down||void 0!==this.action&&this.action.enabled}trigger(){this.collapse(),this.action&&this.action.trigger()}collapse(){if(!this.master)throw Error("yikes");this.master.parentButton?this.master.parentButton.collapse():this.deactivate()}openPopup(){if(this.node&&this.node.down){if(!this.shadowRoot)throw Error("yikes");this.popup?this.popup.show():(this.popup=new Pt(this.node,this),this.shadowRoot.appendChild(this.popup))}}closePopup(){this.popup&&(this.popup.active&&this.popup.active.deactivate(),this.popup.hide())}activate(){if(!this.master)throw Error("yikes");if(!this.node)throw Error("yikes");let t=this.master.active;this.master.active=this,t&&t!==this&&(t.closePopup(),t.updateView()),this.updateView(),this.openPopup()}deactivate(){if(!this.master)throw Error("yikes");this.master.active===this&&(this.master.active.closePopup(),this.master.active=void 0,this.master.state=zt.WAIT,this.updateView())}}se.define("tx-menubutton",se);class oe{constructor(t,e,i,s,o){this.title=t,this.label=e,this.shortcut=i,this.type=s||"entry",this.modelId=o}isEnabled(){return!0}isAvailable(){return!0}createWindowAt(t,e){if("spacer"==this.type){let t=document.createElement("span");return t.style.flexGrow="1",void e.appendChild(t)}this.view=new se(t,this),e.appendChild(this.view)}deleteWindow(){}}class ne extends Ot{constructor(t){super(t),this.config=t?.config,this.vertical=!1,this.root=new oe("","",void 0,void 0)}connectedCallback(){if(super.connectedCallback(),this.tabIndex=0,this.config)return this.config2nodes(this.config,this.root),this.referenceActions(),void this.createShadowDOM();0===this.children.length?(this._observer=new MutationObserver(((t,e)=>{void 0!==this._timer&&clearTimeout(this._timer),this._timer=window.setTimeout((()=>{this._timer=void 0,this.layout2nodes(this.children,this.root),this.referenceActions(),this.createShadowDOM()}),100)})),this._observer.observe(this,{childList:!0,subtree:!0})):(this.layout2nodes(this.children,this.root),this.referenceActions(),this.createShadowDOM())}layout2nodes(t,e){let i=e.down;for(let s of t){let t;switch(s.nodeName){case"TX-MENUSPACER":t=new oe("","","","spacer");break;case"TX-MENUENTRY":t=new oe(ct(s,"name"),ct(s,"label"),ut(s,"shortcut"),ut(s,"type"),ut(s,"model"))}if(t&&(t.parent=e,i?i.next=t:e.down=t,i=t),!i)throw Error("yikes");this.layout2nodes(s.children,i)}}config2nodes(t,e){let i=e.down;for(let s of t){let t;if(t=!0===s.space?new oe("","","","spacer"):new oe(s.name,s.label,s.shortcut,s.type,s.model),t&&(t.parent=e,i?i.next=t:e.down=t,i=t),!i)throw Error("yikes");s.sub&&this.config2nodes(s.sub,i)}}referenceActions(){}findNode(t,e){let i=t.indexOf("|"),s=-1==i?t:t.substr(0,i),o=-1==i?"":t.substr(i+1);e||(e=this.root);for(let t=e.down;t;t=t.next)if(t.title==s)return t.down?this.findNode(o,t):t}createShadowDOM(){this.view=document.createElement("div"),this.view.classList.add("menu-bar");let t=this.root.down;for(;t;)t.isAvailable()?t.createWindowAt(this,this.view):t.deleteWindow(),t=t.next;this.attachShadow({mode:"open"}),this.shadowRoot.appendChild(document.importNode(ie,!0)),this.shadowRoot.appendChild(this.view)}}ne.define("tx-menu",ne);class ae extends HTMLElement{}vt.define("tx-menuspacer",ae);class le extends r{isEmpty(){return 0===this.colCount&&0===this.rowCount}}var re,he,de;!function(t){t[t.EDIT_CELL=0]="EDIT_CELL",t[t.SELECT_CELL=1]="SELECT_CELL",t[t.SELECT_ROW=2]="SELECT_ROW"}(re||(re={}));class ce{constructor(t,e){this.col=t,this.row=e}toString(){return`TablePos { col:${this.col}, row:${this.row} }`}}class ue extends r{constructor(t=re.EDIT_CELL){super(),this.mode=t,this._value=new ce(0,0)}set col(t){this._value.col!==t&&(this._value.col=t,this.modified.trigger())}get col(){return this._value.col}set row(t){this._value.row!==t&&(this._value.row=t,this.modified.trigger())}get row(){return this._value.row}set value(t){this._value.col===t.col&&this._value.row===t.row||(this._value=t,this.modified.trigger())}get value(){return this._value}toString(){return`SelectionModel {enabled: ${this._enabled}, mode: ${re[this.mode]}, value: ${this._value}}`}}class pe extends le{constructor(t,e){super(),this.nodeClass=t}}!function(t){t[t.EDIT_ON_FOCUS=0]="EDIT_ON_FOCUS",t[t.EDIT_ON_ENTER=1]="EDIT_ON_ENTER"}(he||(he={}));class ge{constructor(){this.editMode=he.EDIT_ON_FOCUS,this.seamless=!1,this.expandColumn=!1,this.expandRow=!1}}class me{constructor(t){this.config=new ge,this.model=t}get colCount(){return void 0===this.model?0:this.model.colCount}get rowCount(){return void 0===this.model?0:this.model.rowCount}getColumnHead(t){}getRowHead(t){}showCell(t,e){}saveCell(t,e){}editCell(t,e){}isViewCompact(){return!1}static register(t,e,i){let s=me.modelToAdapter.get(e);if(void 0===s&&(s=new Map,me.modelToAdapter.set(e,s)),void 0!==i){if(s.has(i))throw Error("attempt to redefine existing table adapter");s.set(i,t)}else{if(s.has(null))throw Error("attempt to redefine existing table adapter");s.set(null,t)}}static unbind(){me.modelToAdapter.clear()}static lookup(t){let e;e=t instanceof pe?t.nodeClass:null;let i=me.modelToAdapter.get(Object.getPrototypeOf(t).constructor)?.get(e);if(void 0===i)for(let s of me.modelToAdapter.keys())if(t instanceof s){i=me.modelToAdapter.get(s)?.get(e);break}if(void 0===i){let i=`TableAdapter.lookup(): Did not find an adapter for model of type ${t.constructor.name}`;if(i+=`\n    Requested adapter: model=${t.constructor.name}, type=${e?.name}\n    Available adapters:`,0===me.modelToAdapter.size)i+=" none.";else for(const[t,e]of me.modelToAdapter)for(const[s,o]of e)i+=`\n        model=${t.name}`,null!=s&&(i+=`, type=${s.name}`);throw Error(i)}return i}}me.modelToAdapter=new Map,function(t){t[t.INSERT_ROW=0]="INSERT_ROW",t[t.REMOVE_ROW=1]="REMOVE_ROW",t[t.INSERT_COL=2]="INSERT_COL",t[t.REMOVE_COL=3]="REMOVE_COL",t[t.CELL_CHANGED=4]="CELL_CHANGED",t[t.RESIZE_ROW=5]="RESIZE_ROW",t[t.RESIZE_COL=6]="RESIZE_COL",t[t.CHANGED=7]="CHANGED"}(de||(de={}));class fe{constructor(t){this.table=t}get adapter(){return this.table.adapter}get root(){return this.table.root}get measure(){return this.table.measure}getStaging(){const t=this.table.animator;if(void 0===t.current)return;return t.current.bodyStaging}getHeadStaging(){const t=this.table.animator;if(void 0===t.current)return;return t.current.headStaging}get body(){return this.table.body}get splitBody(){return this.table.splitBody}get colHeads(){return this.table.colHeads}set colHeads(t){this.table.colHeads=t}get rowHeads(){return this.table.rowHeads}set rowHeads(t){this.table.rowHeads=t}get colResizeHandles(){return this.table.colResizeHandles}set colResizeHandles(t){this.table.colResizeHandles=t}get rowResizeHandles(){return this.table.rowResizeHandles}set rowResizeHandles(t){this.table.rowResizeHandles=t}set animationDone(t){this.table.animationDone=t}get selection(){return this.table.selection}get style(){return this.table.style}setCellSize(t,e,i,s,o){this.table.setCellSize(t,e,i,s,o)}clearAnimation(){this.table.animation=void 0}}class be extends fe{constructor(t){super(t)}prepareStagingWithRows(){this.prepareBodyStaging(),this.prepareRowHeadStaging(),this.table.addStaging(this.bodyStaging,this.headStaging),this.scrollStaging()}prepareStagingWithColumns(){this.prepareBodyStaging(),this.prepareColHeadStaging(),this.table.addStaging(this.bodyStaging,this.headStaging),this.scrollStaging()}prepareBodyStaging(){this.bodyStaging=X(),this.bodyStaging.className="staging",this.bodyStaging.style.left=this.body.style.left,this.bodyStaging.style.top=this.body.style.top}prepareRowHeadStaging(){void 0!==this.rowHeads&&(this.headStaging=X(),this.headStaging.classList.add("staging"),this.headStaging.style.top=this.rowHeads.style.top,this.headStaging.style.width=this.rowHeads.style.width)}prepareColHeadStaging(){void 0!==this.colHeads&&(this.headStaging=X(),this.headStaging.classList.add("staging"),this.headStaging.classList.add("colHack"),this.headStaging.style.left=this.colHeads.style.left,this.headStaging.style.height=this.colHeads.style.height)}disposeStaging(){this.table.removeStaging(this.bodyStaging,this.headStaging)}scrollStaging(){}makeRowMask(t,e){const i=Z();return i.style.boxSizing="content-box",i.style.top=`${t}px`,i.style.height=`${e}px`,i.style.left="0",i.style.right="0",i.style.border="none",i.style.backgroundColor=Le.maskColor,i}makeColumnMask(t,e){const i=Z();return i.style.boxSizing="content-box",i.style.left=`${t}px`,i.style.width=`${e}px`,i.style.top="0",i.style.bottom="0",i.style.border="none",i.style.backgroundColor=Le.maskColor,i}}class xe extends be{constructor(t,e){super(t),this.done=!1,this.event=e}prepare(){this.prepareCellsToBeMeasured(),this.prepareStaging()}firstFrame(){this.arrangeInStaging(),this.split()}animationFrame(t){this.animate(this.animationStart+t*this.totalSize)}lastFrame(){this.animate(this.animationStart+this.totalSize),this.join(),this.disposeStaging()}join(){this.done||(this.done=!0,this.joinHeader(),this.joinBody(),this.table.animationDone&&this.table.animationDone())}}class ve extends xe{constructor(t,e){super(t,e),this.join=this.join.bind(this),this.initialRowCount=this.adapter.rowCount-e.size,ve.current=this}prepareStaging(){this.prepareStagingWithRows()}animate(t){this.splitBody.style.top=`${t}px`,this.mask.style.top=`${t}px`,void 0!==this.rowHeads&&(this.splitHead.style.top=`${t}px`,this.headMask.style.top=`${t}px`)}prepareCellsToBeMeasured(){this.table.prepareMinCellSize();let t=new Array(this.event.size);for(let e=this.event.index;e<this.event.index+this.event.size;++e){const i=this.adapter.getRowHead(e);void 0===this.rowHeads&&void 0!==i&&(this.rowHeads=X(),this.rowHeads.className="rows",this.root.appendChild(this.rowHeads),this.rowResizeHandles=X(),this.rowResizeHandles.className="rows",this.root.appendChild(this.rowResizeHandles)),t[e-this.event.index]=i}if(void 0!==this.rowHeads)for(let e=0;e<this.event.size;++e){const i=Z(t[e]);i.className="head",this.measure.appendChild(i)}if(void 0===this.colHeads&&this.adapter.colCount===this.event.size){let t=new Array(this.adapter.colCount);for(let e=0;e<this.adapter.colCount;++e){const i=this.adapter.getColumnHead(e);void 0===this.colHeads&&void 0!==i&&(this.colHeads=X(),this.colHeads.className="cols",this.root.appendChild(this.colHeads),this.colResizeHandles=X(),this.colResizeHandles.className="cols",this.root.appendChild(this.colResizeHandles)),t[e]=i}if(void 0!==this.colHeads)for(let e=0;e<this.adapter.colCount;++e){const i=Z(t[e]);i.className="head",this.measure.appendChild(i)}}for(let t=this.event.index;t<this.event.index+this.event.size;++t)for(let e=0;e<this.adapter.colCount;++e){const i=this.table.createCell();this.table.showCell(new ce(e,t),i),this.measure.appendChild(i)}}arrangeInStaging(){this.table.calculateMinCellSize();const t=this.adapter.config.seamless?0:1;let e=0,i=this.event.index*this.adapter.colCount;if(0!==this.body.children.length)if(i<this.body.children.length){e=Ve(this.body.children[i].style.top)}else{let i=this.body.children[this.body.children.length-1],s=i.getBoundingClientRect();e=Ve(i.style.top)+s.height-t}let s=new Array(this.adapter.colCount);if(this.body.children.length>0)for(let t=0;t<this.adapter.colCount;++t){const e=this.body.children[t].getBoundingClientRect();s[t]=e.width,this.adapter.config.seamless&&(s[t]+=2)}else s.fill(this.table.minCellWidth);let o=this.table.minCellWidth;if(this.rowHeads&&this.rowHeads.children.length>0){const t=this.rowHeads.children[0].getBoundingClientRect();o=Math.max(o,t.width),this.adapter.config.seamless&&(o+=2)}let n=new Array(this.event.size);if(n.fill(this.table.minCellHeight),this.totalSize=0,i=0,void 0!==this.rowHeads)for(let t=0;t<this.event.size;++t){const e=this.measure.children[i++].getBoundingClientRect();n[t]=Math.max(n[t],e.height),o=Math.max(o,e.width)}o=Math.ceil(o);let a=0;if(void 0!==this.colHeads&&0===this.colHeads.children.length&&this.adapter.rowCount==this.event.size){a=this.table.minCellHeight;for(let t=0;t<this.adapter.colCount;++t){const e=this.measure.children[i++].getBoundingClientRect();s[t]=Math.max(s[t],e.width-this.table.WIDTH_ADJUST),a=Math.max(a,e.height-this.table.HEIGHT_ADJUST)}}else if(void 0!==this.colHeads){a=this.colHeads.children[0].getBoundingClientRect().height-this.table.HEIGHT_ADJUST}a=Math.ceil(a),this.rowHeads&&(this.rowHeads.style.top=0===a?"0px":a+this.table.HEIGHT_ADJUST-t+"px",this.rowHeads.style.bottom="0px",this.rowHeads.style.width=`${o}px`,this.body.style.left=o-t+"px",this.bodyStaging.style.left=o-t+"px");for(let e=0;e<this.event.size;++e){for(let t=0;t<this.adapter.colCount;++t){const o=this.measure.children[i++].getBoundingClientRect();n[e]=Math.max(n[e],o.height),this.adapter.config.expandColumn?s[t]=Math.ceil(Math.max(s[t],o.width)):0===e&&0===this.body.children.length&&(s[t]=Math.ceil(o.width))}this.totalSize+=n[e]-t}if(this.adapter.config.expandColumn){i=0;let e=0,o=0;for(;i<this.body.children.length;){const n=this.body.children[i];n.style.left=`${e}px`,n.style.width=s[o]-this.table.WIDTH_ADJUST+"px",e+=s[o]-t,this.adapter.config.seamless&&(e-=2),++o,++i,o>=this.adapter.colCount&&(e=0,o=0)}}this.totalSize+=t,this.adapter.config.seamless&&(this.totalSize-=2*this.event.size);let l=e;if(void 0!==this.rowHeads)for(let e=0;e<this.event.size;++e){const i=this.measure.children[0];this.setCellSize(i,0,l,o,n[e]),this.headStaging.appendChild(i),l+=n[e]-t,this.adapter.config.seamless&&(l-=2)}if(void 0!==this.colHeads&&0===this.colHeads.children.length&&this.adapter.rowCount==this.event.size){let e=0;for(let i=0;i<this.adapter.colCount;++i){const o=this.measure.children[0];o.style.left=`${e}px`,o.style.width=s[i]-this.table.WIDTH_ADJUST+"px",o.style.height=`${a}px`,this.colHeads.appendChild(o),e+=s[i]-t}a+=this.table.HEIGHT_ADJUST,this.body.style.top=a-t+"px",this.bodyStaging.style.top=a-t+"px",this.headStaging.style.top=a-t+"px",this.rowHeads.style.top=a-t+"px",this.colHeads.style.left=o-t+"px",this.colHeads.style.right="0px",this.colHeads.style.height=`${a}px`}l=e;for(let e=0;e<this.event.size;++e){let i=0;for(let o=0;o<this.adapter.colCount;++o){const a=this.measure.children[0];this.setCellSize(a,i,l,s[o],n[e]),this.bodyStaging.appendChild(a),i+=s[o]-t,this.adapter.config.seamless&&(i-=2)}l+=n[e]-t,this.adapter.config.seamless&&(l-=2)}if(this.mask=this.makeRowMask(e,this.totalSize),this.bodyStaging.appendChild(this.mask),void 0!==this.rowHeads&&(this.headMask=this.makeRowMask(e,this.totalSize),this.headStaging.appendChild(this.headMask)),0!==this.initialRowCount){const t=this.adapter.config.seamless?0:1;this.totalSize-=t}}split(){this.table.splitHorizontalNew(this.event.index),void 0!==this.rowHeads&&(this.splitHead=this.rowHeads.lastElementChild),this.animationStart=Ve(this.splitBody.style.top)}joinHeader(){if(void 0!==this.rowHeads){for(this.headStaging.removeChild(this.headMask),this.rowHeads.removeChild(this.splitHead);this.headStaging.children.length>0;)this.rowHeads.appendChild(this.headStaging.children[0]);if(this.splitHead.children.length>0){let t=Ve(this.splitHead.style.top);for(;this.splitHead.children.length>0;){const e=this.splitHead.children[0];e.style.top=`${Ve(e.style.top)+t}px`,this.rowHeads.appendChild(e)}}}}joinBody(){for(this.bodyStaging.removeChild(this.mask),this.body.removeChild(this.splitBody);this.bodyStaging.children.length>0;)this.body.appendChild(this.bodyStaging.children[0]);if(this.splitBody.children.length>0){let t=Ve(this.splitBody.style.top);for(;this.splitBody.children.length>0;){const e=this.splitBody.children[0];e.style.top=`${Ve(e.style.top)+t}px`,this.body.appendChild(e)}}}}class we extends be{constructor(t,e){if(super(t),this.event=e,this.joinHorizontal=this.joinHorizontal.bind(this),0===this.body.children.length)this.initialHeight=0;else{const t=this.body.children[this.body.children.length-1],e=Ve(t.style.top),i=t.getBoundingClientRect();this.initialHeight=e+i.height}this.overlap=this.adapter.config.seamless?0:1,this.removeAll=this.event.index>=this.adapter.rowCount,we.current=this}prepare(){this.prepareStagingWithRows(),this.arrangeRowsInStaging(),this.splitHorizontal()}firstFrame(){}animationFrame(t){this.splitBody.style.top=this.topSplitBody-t*this.animationHeight+"px",this.mask.style.top=this.topMask-t*this.animationHeight+"px",void 0!==this.rowHeads&&(this.splitHead.style.top=this.topSplitBody-t*this.animationHeight+"px",this.headMask.style.top=this.topMask-t*this.animationHeight+"px")}lastFrame(){this.joinHorizontal(),this.disposeStaging()}arrangeRowsInStaging(){const t=this.event.index*this.adapter.colCount,e=this.event.size*this.adapter.colCount,i=Ve(this.body.children[t].style.top);for(let i=0;i<e;++i)this.bodyStaging.appendChild(this.body.children[t]);let s;if(t<this.body.children.length)s=Ve(this.body.children[t].style.top);else{const t=this.bodyStaging.children[this.bodyStaging.children.length-1];s=Ve(t.style.top)+Ve(t.style.height)+this.table.HEIGHT_ADJUST}if(this.animationHeight=s-i,this.mask=this.makeRowMask(s,this.animationHeight),this.bodyStaging.appendChild(this.mask),void 0!==this.rowHeads){for(let t=0;t<this.event.size;++t)this.headStaging.appendChild(this.rowHeads.children[this.event.index]);this.headMask=this.makeRowMask(s,this.animationHeight),this.headStaging.appendChild(this.headMask)}}splitHorizontal(){this.table.splitHorizontalNew(this.event.index),void 0!==this.rowHeads&&(this.splitHead=this.rowHeads.lastElementChild),this.topSplitBody=Ve(this.splitBody.style.top),this.topMask=Ve(this.mask.style.top)}joinHorizontal(){this.bodyStaging.removeChild(this.mask),this.body.removeChild(this.splitBody),this.bodyStaging.replaceChildren(),this.moveSplitBodyToBody(),this.rowHeads&&(this.headStaging.removeChild(this.headMask),this.rowHeads.removeChild(this.splitHead),this.headStaging.replaceChildren(),this.moveSplitHeadToHead()),this.table.animationDone&&this.table.animationDone()}moveSplitHeadToHead(){if(0===this.splitHead.children.length)return;let t=Ve(this.splitHead.style.top);for(;this.splitHead.children.length>0;){const e=this.splitHead.children[0];e.style.top=`${Ve(e.style.top)+t}px`,this.rowHeads.appendChild(e)}}moveSplitBodyToBody(){if(0===this.splitBody.children.length)return;let t=Ve(this.splitBody.style.top);for(;this.splitBody.children.length>0;){const e=this.splitBody.children[0];e.style.top=`${Ve(e.style.top)+t}px`,this.body.appendChild(e)}}}class ye extends xe{constructor(t,e){super(t,e),this.event=e,this.join=this.join.bind(this),this.colCount=this.adapter.colCount,this.rowCount=this.adapter.rowCount,ye.current=this}prepareStaging(){this.prepareStagingWithColumns()}animate(t){this.mask.style.left=`${t}px`,this.splitBody.style.left=`${t}px`,void 0!==this.colHeads&&(this.splitHead.style.left=`${t}px`,this.headMask.style.left=`${t}px`)}prepareCellsToBeMeasured(){this.table.prepareMinCellSize();let t=new Array(this.event.size);for(let e=this.event.index;e<this.event.index+this.event.size;++e){const i=this.adapter.getColumnHead(e);void 0===this.colHeads&&void 0!==i&&(this.colHeads=X(),this.colHeads.className="cols",this.root.appendChild(this.colHeads),this.colResizeHandles=X(),this.colResizeHandles.className="cols",this.root.appendChild(this.colResizeHandles)),t[e-this.event.index]=i}if(void 0!==this.colHeads)for(let e=0;e<this.event.size;++e){const i=Z(t[e]);i.className="head",this.measure.appendChild(i)}if(void 0===this.rowHeads&&this.adapter.rowCount===this.event.size){let t=new Array(this.adapter.rowCount);for(let e=0;e<this.adapter.rowCount;++e){const i=this.adapter.getRowHead(e);void 0===this.rowHeads&&void 0!==i&&(this.rowHeads=X(),this.rowHeads.className="rows",this.root.appendChild(this.rowHeads),this.rowResizeHandles=X(),this.rowResizeHandles.className="rows",this.root.appendChild(this.rowResizeHandles)),t[e]=i}if(void 0!==this.rowHeads)for(let e=0;e<this.adapter.rowCount;++e){const i=Z(t[e]);i.className="head",this.measure.appendChild(i)}}for(let t=this.event.index;t<this.event.index+this.event.size;++t)for(let e=0;e<this.rowCount;++e){const i=Z();this.table.showCell(new ce(t,e),i),this.measure.appendChild(i)}}arrangeInStaging(){this.table.calculateMinCellSize();const t=this.colCount-this.event.size,e=this.adapter.config.seamless?0:1;let i,s=this.event.index;if(s<t){i=Be(this.body.children[s].style.left)}else if(0===this.body.children.length)i=0;else{const s=this.body.children[t-1];i=Be(s.style.left)+Be(s.style.width)+this.table.WIDTH_ADJUST-e}this.animationStart=i;let o=new Array(this.adapter.rowCount);if(0!==this.body.children.length)for(let e=0;e<this.adapter.rowCount;++e){const i=this.body.children[e*t].getBoundingClientRect();o[e]=i.height,this.adapter.config.seamless&&(o[e]+=2)}else o.fill(this.table.minCellHeight);let n=this.table.minCellHeight;if(this.colHeads&&this.colHeads.children.length>0){n=this.colHeads.children[0].getBoundingClientRect().height,this.adapter.config.seamless&&(n+=2)}let a=new Array(this.event.size);if(a.fill(this.table.minCellWidth),this.totalSize=0,s=0,void 0!==this.colHeads)for(let t=0;t<this.event.size;++t){const e=this.measure.children[s++].getBoundingClientRect();a[t]=Math.max(a[t],e.width),n=Math.max(n,e.height)}n=Math.ceil(n);let l=0;if(void 0!==this.rowHeads&&0===this.rowHeads.children.length&&this.adapter.colCount==this.event.size){l=this.table.minCellWidth;for(let t=0;t<this.adapter.rowCount;++t){const e=this.measure.children[s++].getBoundingClientRect();o[t]=Math.max(o[t],e.height-this.table.HEIGHT_ADJUST),l=Math.max(l,e.width-this.table.WIDTH_ADJUST)}}else if(void 0!==this.rowHeads){l=this.rowHeads.children[0].getBoundingClientRect().width-this.table.WIDTH_ADJUST}l=Math.ceil(l),this.colHeads&&(this.colHeads.style.left=0===l?"0px":l+this.table.WIDTH_ADJUST+2-e+"px",this.colHeads.style.right="0px",this.colHeads.style.height=`${n}px`,this.body.style.top=n-1+"px",this.bodyStaging.style.top=n-1+"px");for(let t=0;t<this.event.size;++t){for(let e=0;e<this.adapter.rowCount;++e){const i=this.measure.children[s++].getBoundingClientRect();a[t]=Math.ceil(Math.max(a[t],i.width)-2),this.adapter.config.expandRow?o[t]=Math.ceil(Math.max(o[e],i.height)):0===t&&0===this.body.children.length&&(o[e]=Math.ceil(i.height))}this.totalSize+=a[t]-e}a.forEach(((t,e)=>a[e]=t+4)),this.totalSize+=e,this.adapter.config.seamless&&(this.totalSize-=2*this.event.size);let r=i;if(void 0!==this.colHeads)for(let t=0;t<this.event.size;++t){const i=this.measure.children[0];this.setCellSize(i,r,0,a[t],n),this.headStaging.appendChild(i),r+=a[t]-e,this.adapter.config.seamless&&(r-=2)}if(void 0!==this.rowHeads&&0===this.rowHeads.children.length&&this.adapter.colCount==this.event.size){let t=0;for(let i=0;i<this.adapter.rowCount;++i){const s=this.measure.children[0];s.style.top=`${t}px`,s.style.height=o[i]-this.table.HEIGHT_ADJUST+"px",s.style.width=`${l}px`,this.rowHeads.appendChild(s),t+=o[i]-e}l+=this.table.WIDTH_ADJUST,this.body.style.left=l-e+"px",this.bodyStaging.style.left=l-e+"px",this.headStaging.style.left=l-e+"px",this.colHeads.style.left=l-e+"px",this.rowHeads.style.top=n-e+"px",this.rowHeads.style.bottom="0px",this.rowHeads.style.width=`${l}px`}let h=0;r=i;for(let t=this.event.index;t<this.event.index+this.event.size;++t){let i=a[t-this.event.index],s=0;for(let t=0;t<this.rowCount;++t){const n=this.measure.children[0];this.setCellSize(n,r,s,i,o[t]),this.bodyStaging.appendChild(n),s+=o[t]-e,this.adapter.config.seamless&&(s-=2)}r+=i-e-2,this.adapter.config.seamless||(r+=2),h+=i-2}this.totalSize=h+2,this.mask=this.makeColumnMask(i,this.totalSize),this.bodyStaging.appendChild(this.mask),void 0!==this.colHeads&&(this.headMask=this.makeColumnMask(i,this.totalSize),this.headStaging.appendChild(this.headMask))}split(){this.table.splitVerticalNew(this.event.index),void 0!==this.colHeads&&(this.splitHead=this.colHeads.lastElementChild)}joinHeader(){if(void 0!==this.colHeads){for(this.headStaging.removeChild(this.headMask),this.colHeads.removeChild(this.splitHead);this.headStaging.children.length>0;)this.colHeads.appendChild(this.headStaging.children[0]);if(this.splitHead.children.length>0){let t=Ve(this.splitHead.style.left);for(;this.splitHead.children.length>0;){const e=this.splitHead.children[0];e.style.left=`${Ve(e.style.left)+t}px`,this.colHeads.appendChild(e)}}}}joinBody(){this.bodyStaging.removeChild(this.mask),this.body.removeChild(this.splitBody);const t=this.adapter.model.colCount,e=this.event.index,i=this.event.size,s=t-i-this.event.index;for(let t=0;t<i;++t)for(let s=0;s<this.rowCount;++s){const o=this.bodyStaging.children[0],n=s*(e+i)+e+t;this.bodyInsertAt(o,n)}let o=this.totalSize+this.animationStart;for(let n=0;n<this.rowCount;++n)for(let a=0;a<s;++a){const s=this.splitBody.children[0];s.style.left=`${Ve(s.style.left)+o}px`;const l=n*t+e+i+a;this.bodyInsertAt(s,l)}}bodyInsertAt(t,e){let i;i=e<this.body.children.length?this.body.children[e]:null,this.body.insertBefore(t,i)}}class Ce extends be{constructor(t,e){if(super(t),this.done=!1,this.colCount=this.adapter.colCount,this.rowCount=this.adapter.rowCount,this.event=e,this.joinVertical=this.joinVertical.bind(this),0===this.body.children.length)this.initialWidth=0;else{const t=this.body.children[this.body.children.length-1],e=Ve(t.style.left),i=t.getBoundingClientRect();this.initialWidth=e+i.width}Ce.current=this}prepare(){this.prepareStagingWithColumns(),this.arrangeColumnsInStaging(),this.splitVertical()}firstFrame(){}animationFrame(t){let e=0;this.adapter.config.seamless&&(e=1),this.splitBody.style.left=`${this.leftSplitBody-t*this.animationWidth+e}px`,this.mask.style.left=this.leftMask-t*this.animationWidth+"px",void 0!==this.colHeads&&(this.splitHead.style.left=`${this.leftSplitBody-t*this.animationWidth+e}px`,this.headMask.style.left=this.leftMask-t*this.animationWidth+"px")}lastFrame(){this.joinVertical(),this.disposeStaging()}arrangeColumnsInStaging(){let t=this.event.index;for(let e=0;e<this.adapter.rowCount;++e){for(let e=0;e<this.event.size;++e)this.bodyStaging.appendChild(this.body.children[t]);t+=this.colCount}const e=this.bodyStaging.children[0],i=this.bodyStaging.children[this.bodyStaging.children.length-1];let s=Ve(i.style.left)+Ve(i.style.width)+this.table.WIDTH_ADJUST;s-=1;let o=s-Ve(e.style.left);if(this.animationWidth=o,this.mask=this.makeColumnMask(s,o),this.bodyStaging.appendChild(this.mask),void 0!==this.colHeads){for(let t=0;t<this.event.size;++t)this.headStaging.appendChild(this.colHeads.children[this.event.index]);this.headMask=this.makeColumnMask(s,o),this.headStaging.appendChild(this.headMask)}}splitVertical(){this.table.splitVerticalNew(this.event.index),void 0!==this.colHeads&&(this.splitHead=this.colHeads.lastElementChild);const t=Ve(this.splitBody.style.left);this.splitBody.style.width=this.initialWidth-t-1+"px",this.leftSplitBody=t,this.leftMask=Ve(this.mask.style.left),void 0!==this.colHeads&&(this.splitHead.style.left=`${t}px`,this.splitHead.style.width=this.initialWidth-t-1+"px")}joinVertical(){this.bodyStaging.removeChild(this.mask),this.body.removeChild(this.splitBody),this.bodyStaging.replaceChildren(),this.moveSplitBodyToBody(),this.colHeads&&(this.headStaging.removeChild(this.headMask),this.colHeads.removeChild(this.splitHead),this.headStaging.replaceChildren(),this.moveSplitHeadToHead()),this.table.animationDone&&this.table.animationDone()}moveSplitHeadToHead(){if(0===this.splitHead.children.length)return;let t=Ve(this.splitHead.style.left);for(;this.splitHead.children.length>0;){const e=this.splitHead.children[0];e.style.left=`${Ve(e.style.left)+t}px`,this.colHeads.appendChild(e)}}moveSplitBodyToBody(){if(0===this.splitBody.children.length)return;let t=Ve(this.splitBody.style.left);for(let e=0;e<this.rowCount;++e)for(let i=0;i<this.colCount-this.event.index;++i){const s=this.splitBody.children[0];s.style.left=`${Ve(s.style.left)+t}px`;const o=e*this.adapter.colCount+this.event.index+i;this.bodyInsertAt(s,o)}}bodyInsertAt(t,e){let i;i=e<this.body.children.length?this.body.children[e]:null,this.body.insertBefore(t,i)}}function ke(t){if(void 0===t)return;const e=function(t){for(;t!==document.body&&!1===_e(t);){if(null===t.parentElement)return;t=t.parentElement}return t}(t);if(void 0===e)return;const i=e.getBoundingClientRect(),s=t.getBoundingClientRect();if(e!==document.body){const{x:t,y:o}=function(t,e,i){const s=16,o=i.left+t.scrollLeft-e.left-s,n=i.right+t.scrollLeft-e.left+s,a=i.top+t.scrollTop-e.top-s,l=i.bottom+t.scrollTop-e.top+s,r=t.clientWidth,h=t.clientHeight;var d=t.scrollLeft,c=t.scrollTop;n-o-2*s>r?d=o:n>t.scrollLeft+r?d=n-r:o<t.scrollLeft&&(d=o);l-a-2*s>h?c=a:l>t.scrollTop+h?c=l-h:a<t.scrollTop&&(c=a);return d=Math.max(0,d),c=Math.max(0,c),{x:d,y:c}}(e,i,s);!function(t,e,i){let s,o,n=He.get(t);void 0===n?(n={x:e,y:i},He.set(t,n)):(n.x=e,n.y=i);t===document.body?(s=window.scrollX||window.pageXOffset,o=window.scrollY||window.pageYOffset):(s=t.scrollLeft,o=t.scrollTop);const a=e-s,l=i-o;if(0===a&&0===l)return void He.delete(t);r=r=>{if(n.x!==e||n.y!==i)return!1;const h=s+r*a,d=o+r*l;return t===document.body?window.scrollTo(h,d):(t.scrollLeft=h,t.scrollTop=d),1===r&&He.delete(t),!0},setTimeout((()=>{window.requestAnimationFrame(Ee.bind(window,r,void 0,void 0))}),0);var r}(e,t,o),"fixed"!==window.getComputedStyle(e).position&&window.scrollBy({left:i.left,top:i.top,behavior:"smooth"})}else window.scrollBy({left:s.left,top:s.top,behavior:"smooth"})}const He=new Map;let Se=0;function Ee(t,e,i){void 0===e&&(e=Date.now(),i=++Se);let s=(Date.now()-e)/468;s=s>1?1:s;const o=(n=s,.5*(1-Math.cos(Math.PI*n)));var n;!1!==t(o)&&o<1&&window.requestAnimationFrame(Ee.bind(window,t,e,i))}var Ae,Te=(Ae=window.navigator.userAgent,new RegExp(["MSIE ","Trident/","Edge/"].join("|")).test(Ae)?1:0);function _e(t){const e=Me(t,"Y")&&Re(t,"Y"),i=Me(t,"X")&&Re(t,"X");return e||i}function Me(t,e){return"X"===e?t.clientWidth+Te<t.scrollWidth:t.clientHeight+Te<t.scrollHeight}function Re(t,e){const i=window.getComputedStyle(t,null)["overflow"+e];return"auto"===i||"scroll"===i}const Ne=document.createElement("style");function Be(t){return parseInt(t.substring(0,t.length-2))}function Ve(t){return parseFloat(t.substring(0,t.length-2))}function De(t){return!1!==t.isConnected&&("none"!==window.getComputedStyle(t).display&&(!t.parentElement||De(t.parentElement)))}Ne.textContent=Y`
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
.seamless > .cols > .splitBody > span,
.seamless > .rows > .splitBody > span,
.seamless > .measure > span,
.seamless > .staging > span {
    border: none 0px;
}

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

.cols > span.handle,
.rows > span.handle {
    padding: 0;
    border: 0 none;
    opacity: 0;
    background-color: #08f;
}
.fill {
    opacity: 0;
}

.cols > span.handle {
    cursor: col-resize;
}
.rows > span.handle {
    cursor: row-resize;
}

.staging span.head,
.cols span.head,
.rows span.head,
.measure span.head {
    background: #1e1e1e;
    font-weight: 600;
}

.colHack > span,
.cols > span {
    text-align: center;
}

.measure {
    position: absolute;
    opacity: 0;
}

.body > span.edit, .splitBody > span.edit, .body > span.edit:hover, .splitBody > span.edit:hover {
    caret-color: currentcolor;
}
`;class Le extends vt{constructor(t){super(),this.WIDTH_ADJUST=6,this.HEIGHT_ADJUST=2,this.HANDLE_SIZE=5,this.HANDLE_SKEW=3,this.visible=!1,this.animator=new ft,this.arrangeAllMeasuredInGrid=this.arrangeAllMeasuredInGrid.bind(this),this.hostKeyDown=this.hostKeyDown.bind(this),this.cellKeyDown=this.cellKeyDown.bind(this),this.cellFocus=this.cellFocus.bind(this),this.focusIn=this.focusIn.bind(this),this.focusOut=this.focusOut.bind(this),this.pointerDown=this.pointerDown.bind(this),this.handleDown=this.handleDown.bind(this),this.handleMove=this.handleMove.bind(this),this.handleUp=this.handleUp.bind(this),this.setHeadingFillerSizeToScrollbarSize=this.setHeadingFillerSizeToScrollbarSize.bind(this),this.selectionChanged=this.selectionChanged.bind(this),this.modelChanged=this.modelChanged.bind(this),this.root=X(this.body=X()),this.root.className="root",this.body.className="body",this.measure=X(),this.measure.classList.add("measure"),this.onkeydown=this.hostKeyDown,this.addEventListener("focusin",this.focusIn),this.addEventListener("focusout",this.focusOut),this.body.onresize=this.setHeadingFillerSizeToScrollbarSize,this.body.onscroll=()=>{this.animator.current&&this.animator.current instanceof be&&this.animator.current.scrollStaging(),this.setHeadingFillerSizeToScrollbarSize(),this.colHeads&&(this.colHeads.scrollLeft=this.body.scrollLeft,this.colResizeHandles.scrollLeft=this.body.scrollLeft),this.rowHeads&&(this.rowHeads.scrollTop=this.body.scrollTop,this.rowResizeHandles.scrollTop=this.body.scrollTop)},this.body.onpointerdown=this.pointerDown,this.attachShadow({mode:"open",delegatesFocus:!0}),this.attachStyle(Ne),this.shadowRoot.appendChild(this.root),this.shadowRoot.appendChild(this.measure),t&&(J(this,t),t.selectionModel&&this.setModel(t.selectionModel)),void 0===Le.observer&&(Le.observer=new MutationObserver(((t,e)=>{Le.allTables.forEach((t=>{De(t)&&(Le.allTables.delete(t),t.prepareCells())}))})),Le.observer.observe(document.body,{attributes:!0,subtree:!0}))}connectedCallback(){De(this)?this.prepareCells():Le.allTables.add(this),super.connectedCallback(),void 0===this.selection&&(this.selection=new ue(re.SELECT_CELL),this.selection.modified.add(this.selectionChanged,this))}disconnectedCallback(){Le.allTables.delete(this)}addStaging(...t){for(const e of t)void 0!==e&&this.root.insertBefore(e,this.root.children[0])}removeStaging(...t){for(const e of t)void 0!==e&&this.root.removeChild(e)}hostKeyDown(t){if(this.selection&&this.selection.mode===re.SELECT_CELL){let e={col:this.selection.col,row:this.selection.row};switch(t.key){case"ArrowRight":void 0===this.editing&&e.col+1<this.adapter.colCount&&(++e.col,t.preventDefault(),t.stopPropagation());break;case"ArrowLeft":void 0===this.editing&&e.col>0&&(--e.col,t.preventDefault(),t.stopPropagation());break;case"ArrowDown":e.row+1<this.adapter.rowCount&&(++e.row,t.preventDefault(),t.stopPropagation());break;case"ArrowUp":e.row>0&&(--e.row,t.preventDefault(),t.stopPropagation());break;case"Enter":void 0===this.editing?this.adapter?.config.editMode===he.EDIT_ON_ENTER&&this.editCell():(this.saveCell(),e.row+1<this.adapter.rowCount&&(++e.row,this.selection.value=e,this.editCell())),t.preventDefault(),t.stopPropagation()}this.selection.value=e}}cellKeyDown(t){const e=t.target;if("Enter"===t.key)return this.hostKeyDown(t),void t.preventDefault();if(!e.classList.contains("edit")&&void 0===this.editing)switch(t.key){case"ArrowDown":case"ArrowUp":case"ArrowRight":case"ArrowLeft":case"Tab":case"Enter":break;default:this.adapter?.config.editMode===he.EDIT_ON_ENTER&&t.preventDefault()}}cellFocus(t){const e=t.target;if(e instanceof HTMLElement){const t=e.getBoundingClientRect(),i=this.clientPosToTablePos(t.x+t.width/2,t.y+t.height/2);void 0!==i&&(this.selection.value=i)}}focusIn(t){}focusOut(t){}editCell(){if(void 0!==this.editing){if(this.editing.col===this.selection.value.col&&this.editing.row===this.selection.value.row)return;console.log("WARN: Table.editCell(): already editing ANOTHER cell")}const t=this.selection.value.col,e=this.selection.value.row,i=this.body.children[t+e*this.adapter.colCount];this.editing=new ce(t,e),i.classList.add("edit"),this.adapter.editCell(this.editing,i)}saveCell(){if(void 0===this.editing)return;const t=this.editing.col,e=this.editing.row,i=this.body.children[t+e*this.adapter.colCount];i.classList.remove("edit"),this.adapter.saveCell(this.editing,i),this.editing=void 0,this.focus()}pointerDown(t){}getModel(){return this.model}setModel(t){if(void 0===t)return this.selection&&this.selection.modified.remove(this),this.model=void 0,this.selection=new ue,void this.selection.modified.add(this.selectionChanged,this);if(t instanceof ue)return this.selection&&this.selection.modified.remove(this),this.selection=t,void this.selection.modified.add(this.selectionChanged,this);if(t instanceof le){this.model=t,this.model.modified.add(this.modelChanged,this);const e=me.lookup(t);try{this.adapter=new e(t)}catch(t){throw console.log(`Table.setModel(): failed to instantiate table adapter: ${t}`),console.log("setting TypeScript's target to 'es6' might help"),t}this.prepareCells()}else if(t instanceof Object)throw Error("Table.setModel(): unexpected model of type "+t.constructor.name)}selectionChanged(){if(void 0!==this.selection)switch(this.saveCell(),this.selection.mode){case re.EDIT_CELL:if(document.activeElement===this){ke(this.body.children[this.selection.col+this.selection.row*this.adapter.colCount])}break;case re.SELECT_CELL:if(document.activeElement===this){const t=this.body.children[this.selection.col+this.selection.row*this.adapter.colCount];(function(t){if(!document.hasFocus())return!1;let e=document.activeElement;for(;null!==e;){if(e===t)return!0;if(null===e.shadowRoot)break;e=e.shadowRoot.activeElement}return!1})(t)||t.focus(),ke(t),this.adapter?.config.editMode===he.EDIT_ON_FOCUS&&this.editCell()}case re.SELECT_ROW:}}modelChanged(t){switch(t.type){case de.CELL_CHANGED:{const e=this.body.children[t.col+t.row*this.adapter.colCount];this.showCell(t,e)}break;case de.INSERT_ROW:this.animator.run(new ve(this,t));break;case de.REMOVE_ROW:this.animator.run(new we(this,t));break;case de.INSERT_COL:this.animator.run(new ye(this,t));break;case de.REMOVE_COL:this.animator.run(new Ce(this,t));break;default:console.log(`Table.modelChanged(): ${t} is not implemented`)}}prepareCells(){this.adapter&&(this.visible=De(this),this.visible&&0!==this.adapter.colCount&&0!==this.adapter.rowCount&&(this.adapter.config.seamless&&this.root.classList.add("seamless"),this.prepareMinCellSize(),this.prepareColumnHeads(),this.prepareRowHeads(),this.prepareBody(),setTimeout(this.arrangeAllMeasuredInGrid,0)))}arrangeAllMeasuredInGrid(){this.calculateMinCellSize();let{colWidths:t,colHeadHeight:e}=this.calculateColumnWidths(),{rowHeights:i,rowHeadWidth:s}=this.calculateRowHeights();this.placeColumnHeads(t,e,s),this.placeRowHeads(i,e,s),this.placeBody(s,e),this.placeBodyCells(t,i,e,s),this.setHeadingFillerSizeToScrollbarSize()}prepareMinCellSize(){if(void 0!==this.minCellHeight)return;const t=Z(K("Tg"));this.measure.appendChild(t)}calculateMinCellSize(){if(void 0!==this.minCellHeight)return;const t=this.measure.children[0],e=t.getBoundingClientRect();this.minCellWidth=Math.ceil(e.width-this.WIDTH_ADJUST),this.minCellHeight=Math.ceil(e.height-this.HEIGHT_ADJUST),this.measure.removeChild(t)}prepareColumnHeads(){const t=new Array(this.adapter.colCount);for(let e=0;e<this.adapter.colCount;++e){const i=this.adapter.getColumnHead(e);void 0===this.colHeads&&void 0!==i&&(this.colHeads=X(),this.colHeads.className="cols",this.root.appendChild(this.colHeads),this.colResizeHandles=X(),this.colResizeHandles.className="cols",this.root.appendChild(this.colResizeHandles)),t[e]=i}if(void 0!==this.colHeads)for(let e=0;e<this.adapter.colCount;++e){const i=Z(t[e]);i.className="head",this.measure.appendChild(i)}}prepareRowHeads(){let t=new Array(this.adapter.rowCount);for(let e=0;e<this.adapter.rowCount;++e){const i=this.adapter.getRowHead(e);void 0===this.rowHeads&&void 0!==i&&(this.rowHeads=X(),this.rowHeads.className="rows",this.root.appendChild(this.rowHeads),this.rowResizeHandles=X(),this.rowResizeHandles.className="rows",this.root.appendChild(this.rowResizeHandles)),t[e]=i}if(this.rowHeads)for(let e=0;e<this.adapter.rowCount;++e){const i=Z(t[e]);i.className="head",this.measure.appendChild(i)}}prepareBody(){for(let t=0;t<this.adapter.rowCount;++t)for(let e=0;e<this.adapter.colCount;++e){const i=this.createCell();this.showCell(new ce(e,t),i),this.measure.appendChild(i)}}createCell(){const t=Z();return t.onfocus=this.cellFocus,t.onkeydown=this.cellKeyDown,t.tabIndex=0,t.setAttribute("contenteditable",""),t}setCellSize(t,e,i,s,o){t.style.left=`${e}px`,t.style.top=`${i}px`,t.style.width=s-this.WIDTH_ADJUST+"px",t.style.height=o-this.HEIGHT_ADJUST+"px"}showCell(t,e){this.adapter.showCell(t,e),0!==e.children.length&&(e.style.caretColor="currentcolor")}calculateRowHeights(){let t=this.colHeads?this.adapter.colCount:0,e=0;const i=Array(this.adapter.rowCount);if(this.rowHeads)for(let s=0;s<this.adapter.rowCount;++s){const o=this.measure.children[t++].getBoundingClientRect();i[s]=Math.max(o.height,this.minCellHeight),e=Math.max(e,o.width)}else i.fill(this.minCellHeight);t=(this.colHeads?this.adapter.colCount:0)+(this.rowHeads?this.adapter.rowCount:0);for(let e=0;e<this.adapter.rowCount;++e){let s=i[e];for(let i=0;i<this.adapter.colCount;++i){const o=this.measure.children[t+i+e*this.adapter.colCount].getBoundingClientRect();s=Math.max(s,o.height)}i[e]=Math.ceil(s)}return e=Math.ceil(e),{rowHeights:i,rowHeadWidth:e}}calculateColumnWidths(t=!1){let e=0;const i=Array(this.adapter.colCount);if(this.colHeads)for(let t=0;t<this.adapter.colCount;++t){const s=this.measure.children[t].getBoundingClientRect();i[t]=Math.max(s.width,this.minCellWidth),e=Math.max(e,s.height)}else i.fill(this.minCellWidth);let s;e=Math.ceil(e),s=t?0:(this.colHeads?this.adapter.colCount:0)+(this.rowHeads?this.adapter.rowCount:0);for(let e=0;e<this.adapter.colCount;++e){let o=i[e];for(let i=0;i<this.adapter.rowCount;++i){let n,a=s+e+i*this.adapter.colCount;n=t?this.body.children[a]:this.measure.children[a];const l=n.getBoundingClientRect();o=Math.max(o,l.width)}i[e]=Math.ceil(o)}return{colWidths:i,colHeadHeight:e}}placeColumnHeads(t,e,i){if(void 0===this.colHeads)return;const s=this.adapter.config.seamless?0:1;let o=0;for(let i=0;i<this.adapter.colCount;++i){const n=this.measure.children[0];this.setCellSize(n,o,0,t[i],e),this.colHeads.appendChild(n),o+=t[i]-1-1+s}let n=Z();n.classList.add("head"),n.classList.add("fill"),n.style.left=`${o}px`,n.style.top="0",n.style.width="256px",n.style.height=`${e}px`,this.colHeads.appendChild(n),this.colResizeHandles.style.left=`${i}px`,this.colResizeHandles.style.height=`${e}px`,o=-this.HANDLE_SKEW;for(let i=0;i<this.adapter.colCount;++i){o+=t[i]-1;const s=this.createHandle(i,o,0,this.HANDLE_SIZE,e);this.colResizeHandles.appendChild(s)}o+=this.HANDLE_SIZE,n=Z(),n.classList.add("head"),n.classList.add("fill"),n.style.left=`${o}px`,n.style.top="0",n.style.width="256px",n.style.height=`${e}px`,this.colResizeHandles.appendChild(n)}placeRowHeads(t,e,i){if(void 0===this.rowHeads)return;const s=this.adapter.config.seamless?0:1;let o=0;for(let e=0;e<this.adapter.rowCount;++e){const n=this.measure.children[0];this.setCellSize(n,0,o,i,t[e]),this.rowHeads.appendChild(n),o+=t[e]-1-1+s}let n=Z();n.classList.add("head"),n.classList.add("fill"),n.style.left="0",n.style.top=`${o}px`,n.style.width=`${i}px`,n.style.height="256px",this.rowHeads.appendChild(n),this.rowResizeHandles.style.top=`${e}px`,this.rowResizeHandles.style.width=`${i}px`,o=-this.HANDLE_SKEW;for(let e=0;e<this.adapter.rowCount;++e){o+=t[e]-1;const s=this.createHandle(e,0,o,i,this.HANDLE_SIZE);this.rowResizeHandles.appendChild(s)}o+=this.HANDLE_SIZE,n=Z(),n.classList.add("head"),n.classList.add("fill"),n.style.left="0",n.style.top=`${o}0px`,n.style.width=`${i}px`,n.style.height="256px",this.rowResizeHandles.appendChild(n)}placeBody(t,e){return void 0!==this.colHeads&&(this.adapter?.config.seamless?(this.colHeads.style.height=e-2+"px",this.colHeads.style.left=t-(null==this.rowHeads?0:2)+"px"):(this.colHeads.style.height=`${e}px`,this.colHeads.style.left=t-(null==this.rowHeads?0:1)+"px")),void 0!==this.rowHeads&&(this.adapter?.config.seamless?(this.rowHeads.style.width=t-2+"px",this.rowHeads.style.top=e-(null==this.colHeads?0:2)+"px"):(this.rowHeads.style.width=`${t}px`,this.rowHeads.style.top=e-(null==this.colHeads?0:1)+"px")),--t,--e,this.adapter?.config.seamless&&(--t,--e),t<0&&(t=0),e<0&&(e=0),this.body.style.left=`${t}px`,this.body.style.top=`${e}px`,{rowHeadWidth:t,colHeadHeight:e}}placeBodyCells(t,e,i,s){const o=this.adapter.config.seamless?0:1;let n=0;for(let i=0;i<this.adapter.rowCount;++i){let s=0;for(let a=0;a<this.adapter.colCount;++a){const l=this.measure.children[0];this.setCellSize(l,s,n,t[a],e[i]),this.body.appendChild(l),s+=t[a]-2+o}n+=e[i]-2+o}}createHandle(t,e,i,s,o){const n=Z();return n.className="handle",n.style.left=`${e}px`,n.style.top=`${i}px`,n.style.width=`${s}px`,n.style.height=`${o}px`,n.dataset.idx=`${t}`,n.onpointerdown=this.handleDown,n.onpointermove=this.handleMove,n.onpointerup=this.handleUp,n}handleDown(t){t.preventDefault(),this.handle=t.target,this.handleIndex=parseInt(this.handle.dataset.idx)+1,this.handle.setPointerCapture(t.pointerId);if(this.handle.parentElement===this.colResizeHandles){this.deltaHandle=t.clientX-Be(this.handle.style.left),this.deltaSplitBody=t.clientX,this.deltaSplitHead=t.clientX-Ve(this.body.style.left);const e=this.colHeads.children[this.handleIndex-1];this.deltaColumn=t.clientX-Ve(e.style.width),this.splitVertical(this.handleIndex)}else{this.deltaHandle=t.clientY-Ve(this.handle.style.top),this.deltaSplitBody=t.clientY,this.deltaSplitHead=t.clientY-Ve(this.body.style.top);const e=this.rowHeads.children[this.handleIndex-1];this.deltaColumn=t.clientY-Ve(e.style.height),this.splitHorizontal(this.handleIndex)}}handleMove(t){if(void 0===this.handle)return;if(this.handle.parentElement===this.colResizeHandles){let e=t.clientX;const i=this.deltaColumn+8;e<i&&(e=i),this.handle.style.left=e-this.deltaHandle+"px",this.splitHead.style.left=e-this.deltaSplitHead+"px",this.splitBody.style.left=e-this.deltaSplitBody+"px";const s=this.handleIndex;this.colHeads.children[s-1].style.width=e-this.deltaColumn+"px";for(let t=0;t<this.adapter.rowCount;++t)this.body.children[s-1+t*s].style.width=e-this.deltaColumn+"px"}else{let e=t.clientY;const i=this.deltaColumn+8;e<i&&(e=i),this.handle.style.top=e-this.deltaHandle+"px",this.splitHead.style.top=e-this.deltaSplitHead+"px",this.splitBody.style.top=e-this.deltaSplitBody+"px";const s=this.handleIndex;this.rowHeads.children[s-1].style.height=e-this.deltaColumn+"px";let o=(s-1)*this.adapter.colCount;for(let t=0;t<this.adapter.colCount;++t)this.body.children[o+t].style.height=e-this.deltaColumn+"px"}}handleUp(t){if(void 0===this.handle)return;this.handleMove(t);if(this.handle.parentElement===this.colResizeHandles){let e=t.clientX;const i=this.deltaColumn+8;e<i&&(e=i),this.joinVertical(this.handleIndex,e-this.deltaSplitBody)}else{let e=t.clientY;const i=this.deltaColumn+8;e<i&&(e=i),this.joinHorizontal(this.handleIndex,e-this.deltaSplitBody)}this.handle=void 0}splitVerticalNew(t){this.splitHeadVertical(t),this.splitBodyVertical(t)}splitHeadVertical(t){if(void 0===this.colHeads)return;const e=this.adapter.config.seamless?0:1;this.splitHead=X(),this.splitHead.className="splitBody colHack",this.splitHead.style.top="0",this.splitHead.style.bottom="0",this.splitHead.style.backgroundColor=Le.splitColor;const i=t;if(0===this.body.children.length)this.splitHead.style.left="0px",this.splitHead.style.width="1px";else if(i<this.colHeads.children.length){let t=this.colHeads.children[i],s=0;const o=Ve(t.style.left);for(;i<this.colHeads.children.length;){t=this.colHeads.children[i];s+=t.getBoundingClientRect().width-e;let n=Ve(t.style.left);t.style.left=n-o+"px",this.splitHead.appendChild(t)}this.adapter.config.seamless&&(s+=e),this.splitHead.style.left=`${o}px`,this.splitHead.style.width=`${s}px`}else{let t=this.colHeads.children[this.body.children.length-1],i=t.getBoundingClientRect(),s=Ve(t.style.left)+i.width-e;this.splitHead.style.left=`${s}px`,this.splitHead.style.width="1px"}this.colHeads.appendChild(this.splitHead)}splitBodyVertical(t){const e=this.adapter.config.seamless?0:1;if(this.splitBody=X(),this.splitBody.className="splitBody",this.splitBody.style.top="0",this.splitBody.style.bottom="0",this.splitBody.style.backgroundColor=Le.splitColor,0===this.body.children.length)this.splitBody.style.left="0px",this.splitBody.style.width="1px";else{if(t<this.body.children.length/this.adapter.rowCount){let i=this.body.children[t];const s=Ve(i.style.left);let o=0;const n=this.body.children.length/this.adapter.rowCount-t;let a=t;for(let l=0;l<this.adapter.rowCount;++l){for(let t=0;t<n;++t){if(i=this.body.children[a],0===l){o+=i.getBoundingClientRect().width-e}i.style.left=Ve(i.style.left)-s+"px",this.splitBody.appendChild(i)}a+=t}this.splitBody.style.left=`${s}px`,this.splitBody.style.width=`${o}px`}else{let t=this.body.children[this.body.children.length-1],i=t.getBoundingClientRect(),s=Ve(t.style.left)+i.width-e;this.splitBody.style.left=`${s}px`,this.splitBody.style.width="1px"}}this.body.appendChild(this.splitBody)}splitVertical(t,e=0){void 0!==this.colHeads&&(this.splitHead=X(),this.splitHead.className="cols",this.splitHead.style.left=this.colHeads.style.left,this.splitHead.style.height=this.colHeads.style.height,this.root.appendChild(this.splitHead),setTimeout((()=>{this.splitHead.scrollTop=this.colHeads.scrollTop,this.splitHead.scrollLeft=this.colHeads.scrollLeft}),0)),this.splitBody=X(),this.splitBody.className="splitBody";const i=this.body.getBoundingClientRect();this.splitBody.style.width=`${i.width}px`,this.splitBody.style.height=`${i.height}px`,this.body.appendChild(this.splitBody);const s=t,o=this.adapter.colCount-t+e;if(void 0!==this.splitHead){for(let e=0;e<o;++e)this.splitHead.appendChild(this.colHeads.children[t]);this.splitHead.appendChild(this.colHeads.children[this.colHeads.children.length-1].cloneNode())}let n=t;for(let t=0;t<this.adapter.rowCount;++t){for(let t=0;t<o;++t)this.splitBody.appendChild(this.body.children[n]);n+=s}}joinVertical(t,e,i=0,s,o){void 0===s&&(s=this.adapter.colCount),void 0===o&&(o=this.adapter.rowCount);const n=s-t+i;let a=t-i;if(void 0!==this.colHeads){const t=this.colHeads.children[this.colHeads.children.length-1];for(let i=0;i<n;++i){const i=this.splitHead.children[0],s=Ve(i.style.left);i.style.left=`${s+e}px`,this.colHeads.insertBefore(i,t)}const i=Ve(t.style.left);t.style.left=`${i+e}px`;for(let t=a;t<=s;++t){const i=this.colResizeHandles.children[t],s=Ve(i.style.left);i.style.left=`${s+e}px`}}for(let t=0;t<o;++t){let t=this.body.children[a];for(let i=0;i<n;++i){const i=this.splitBody.children[0],s=Ve(i.style.left);i.style.left=`${s+e}px`,this.body.insertBefore(i,t)}a+=s}void 0!==this.colHeads&&(this.root.removeChild(this.splitHead),this.splitHead=void 0),this.body.removeChild(this.splitBody),this.splitBody=void 0}splitHorizontalNew(t){this.splitHeadHorizontal(t),this.splitBodyHorizontal(t)}splitHeadHorizontal(t){if(void 0===this.rowHeads)return;const e=this.adapter.config.seamless?0:1;this.splitHead=X(),this.splitHead.className="splitBody",this.splitHead.style.left="0",this.splitHead.style.right="0",this.splitHead.style.backgroundColor=Le.splitColor;const i=t;if(0===this.body.children.length)this.splitHead.style.top="0px",this.splitHead.style.height="1px";else if(i<this.rowHeads.children.length){let t=this.rowHeads.children[i],s=0;const o=Ve(t.style.top);for(;i<this.rowHeads.children.length;){t=this.rowHeads.children[i];s+=t.getBoundingClientRect().height-e;let n=Ve(t.style.top);t.style.top=n-o+"px",this.splitHead.appendChild(t)}this.adapter.config.seamless&&(s+=e),this.splitHead.style.top=`${o}px`,this.splitHead.style.height=`${s}px`}else{let t=this.rowHeads.children[this.body.children.length-1],i=t.getBoundingClientRect(),s=Ve(t.style.top)+i.height-e;this.splitHead.style.top=`${s}px`,this.splitHead.style.height="1px"}this.rowHeads.appendChild(this.splitHead)}splitBodyHorizontal(t){const e=this.adapter.config.seamless?0:1;this.splitBody=X(),this.splitBody.className="splitBody",this.splitBody.style.left="0",this.splitBody.style.right="0",this.splitBody.style.backgroundColor=Le.splitColor;const i=t*this.adapter.colCount;if(0===this.body.children.length)this.splitBody.style.top="0px",this.splitBody.style.height="1px";else if(i<this.body.children.length){let t=this.body.children[i],s=this.adapter.colCount,o=0;const n=Ve(t.style.top);for(;i<this.body.children.length;){if(t=this.body.children[i],--s,0===s){o+=t.getBoundingClientRect().height-e,s=this.adapter.colCount}let a=Ve(t.style.top);t.style.top=a-n+"px",this.splitBody.appendChild(t)}o+=e,this.splitBody.style.top=`${n}px`,this.splitBody.style.height=`${o}px`}else{let t=this.body.children[this.body.children.length-1],i=t.getBoundingClientRect(),s=Ve(t.style.top)+i.height-e;this.splitBody.style.top=`${s}px`,this.splitBody.style.height="1px"}this.body.appendChild(this.splitBody)}splitHorizontal(t,e=0,i){void 0!==this.rowHeads&&(this.splitHead=X(),this.splitHead.className="rows",this.splitHead.style.top=this.rowHeads.style.top,this.splitHead.style.width=this.rowHeads.style.width,this.root.appendChild(this.splitHead),setTimeout((()=>{this.splitHead.scrollTop=this.rowHeads.scrollTop,this.splitHead.scrollLeft=this.rowHeads.scrollLeft}),0)),this.splitBody=X(),this.splitBody.className="splitBody",this.splitBody.style.backgroundColor="rgba(255,128,0,0.5)";const s=this.body.getBoundingClientRect();this.splitBody.style.width=`${s.width}px`,this.splitBody.style.height=`${s.height}px`,this.body.appendChild(this.splitBody);const o=this.adapter.rowCount-t+e;if(void 0!==this.splitHead){for(let e=0;e<o;++e)this.splitHead.appendChild(this.rowHeads.children[t]);this.splitHead.appendChild(this.rowHeads.children[this.rowHeads.children.length-1].cloneNode())}let n=this.adapter.colCount*t;for(let t=0;t<o;++t)for(let t=0;t<this.adapter.colCount;++t)this.splitBody.appendChild(this.body.children[n]);if(this.splitBody.children.length>0){n=this.splitBody.children.length-1;const t=Be(this.splitBody.children[n].style.top);for(let e=0;e<this.splitBody.children.length;++e){const i=this.splitBody.children[e],s=Be(i.style.top);i.style.top=s-t+"px"}this.splitBody.style.backgroundColor="#f80",this.splitBody.style.top=`${t}px`,this.splitBody.style.height=s.height-t+"px"}else if(void 0!==i&&this.body.children.length>0){n=i.index*this.adapter.colCount;const t=Be(this.body.children[n].style.top);this.splitBody.style.top=`${t}px`,this.splitBody.style.height=s.height-t+"px"}else if(this.body.children.length>0){const t=Z();n=this.body.children.length-2;const e=this.body.children[n],i=this.body.children[n].getBoundingClientRect();t.style.border="none",t.style.backgroundColor="#1e1e1e";const o=Be(e.style.top)+i.height;t.style.top=`${o}px`,t.style.left="0px",t.style.width=s.width-2+"px",t.style.height=s.height-o+"px",this.splitBody.appendChild(t)}}joinHorizontal(t,e,i=0,s,o){void 0===s&&(s=this.adapter.colCount),void 0===o&&(o=this.adapter.rowCount);const n=o-t+i;if(void 0!==this.rowHeads){const i=this.rowHeads.children[this.rowHeads.children.length-1];for(let t=0;t<n;++t){const t=this.splitHead.children[0],s=Ve(t.style.top);t.style.top=`${s+e}px`,this.rowHeads.insertBefore(t,i)}const s=Ve(i.style.top);i.style.top=`${s+e}px`;for(let i=t;i<=o;++i){const t=this.rowResizeHandles.children[i],s=Ve(t.style.top);t.style.top=`${s+e}px`}}for(let t=0;t<n;++t)for(let t=0;t<s;++t){const t=this.splitBody.children[0],i=Ve(t.style.top);t.style.top=`${i+e}px`,this.body.appendChild(t)}void 0!==this.rowHeads&&(this.root.removeChild(this.splitHead),this.splitHead=void 0),this.body.removeChild(this.splitBody),this.splitBody=void 0}setHeadingFillerSizeToScrollbarSize(){const t=this.body.getBoundingClientRect();if(void 0!==this.colHeads){const e=Math.ceil(t.width-this.body.clientWidth);this.colHeads.children[this.colHeads.children.length-1].style.width=`${e}px`,this.colHeads.style.right=`${e}px`}if(void 0!==this.rowHeads){const e=Math.ceil(t.height-this.body.clientHeight);this.rowHeads.children[this.rowHeads.children.length-1].style.height=`${e}px`,this.rowHeads.style.bottom=`${e}px`}}clientPosToTablePos(t,e){let i,s;for(i=0;i<this.adapter.colCount;++i){const e=this.body.children[i].getBoundingClientRect();if(e.x<=t&&t<e.x+e.width)break}if(i>=this.adapter.colCount)return;let o=0;for(s=0;s<this.adapter.rowCount;++s){const t=this.body.children[o].getBoundingClientRect();if(t.y<=e&&e<t.y+t.height)break;o+=this.adapter.colCount}return s>=this.adapter.rowCount?void 0:new ce(i,s)}}Le.maskColor="#1e1e1e",Le.splitColor="#1e1e1e",Le.allTables=new Set,Le.define("tx-table",Le);function Ie(t){return void 0!==t&&"insertRow"in t&&"removeRow"in t}function $e(t){return void 0!==t&&"insertColumn"in t&&"removeColumn"in t}vt.define("tx-tabletool",class extends Yt{constructor(){super(),this.toolbar=j("div",{class:"toolbar"}),this.buttonAddRowAbove=j("button",{class:"left",title:"add row above",children:G("svg",{style:{display:"block"},viewBox:"0 0 13 13",width:"13",height:"13",children:[j("rect",{x:"0.5",y:"0.5",width:"12",height:"12",class:"strokeFill"}),j("line",{x1:"0.5",y1:"8.5",x2:"12.5",y2:"8.5",class:"stroke"}),j("line",{x1:"4.5",y1:"8.5",x2:"4.5",y2:"13.5",class:"stroke"}),j("line",{x1:"8.5",y1:"8.5",x2:"8.5",y2:"13.5",class:"stroke"}),j("line",{x1:"6.5",y1:"2",x2:"6.5",y2:"7",class:"stroke"}),j("line",{x1:"4",y1:"4.5",x2:"9",y2:"4.5",class:"stroke"})]})}),this.buttonAddRowAbove.onclick=()=>{this.lastActiveTable?.focus();const t=this.lastActiveTable?.model,e=this.lastActiveTable?.selection;e&&Ie(t)&&t.insertRow(e.row)},this.toolbar.appendChild(this.buttonAddRowAbove),this.buttonAddRowBelow=j("button",{title:"add row below",children:G("svg",{viewBox:"0 0 13 13",width:"13",height:"13",children:[j("rect",{x:"0.5",y:"0.5",width:"12",height:"12",class:"strokeFill"}),j("line",{x1:"0.5",y1:"4.5",x2:"12.5",y2:"4.5",class:"stroke"}),j("line",{x1:"4.5",y1:"0.5",x2:"4.5",y2:"4.5",class:"stroke"}),j("line",{x1:"8.5",y1:"0.5",x2:"8.5",y2:"4.5",class:"stroke"}),j("line",{x1:"6.5",y1:"6",x2:"6.5",y2:"11",class:"stroke"}),j("line",{x1:"4",y1:"8.5",x2:"9",y2:"8.5",class:"stroke"})]})}),this.buttonAddRowBelow.onclick=()=>{this.lastActiveTable?.focus();const t=this.lastActiveTable?.model,e=this.lastActiveTable?.selection;e&&Ie(t)&&t.insertRow(e.row+1)},this.toolbar.appendChild(this.buttonAddRowBelow),this.buttonDeleteRow=j("button",{class:"right",title:"delete row",children:G("svg",{viewBox:"0 0 13 13",width:"13",height:"13",children:[j("rect",{x:"0.5",y:"0.5",width:"12",height:"12",class:"strokeFill"}),j("line",{x1:"0.5",y1:"4.5",x2:"12.5",y2:"4.5",class:"stroke"}),j("line",{x1:"0.5",y1:"8.5",x2:"12.5",y2:"8.5",class:"stroke"}),j("line",{x1:"5.5",y1:"3.5",x2:"11.5",y2:"9.5",class:"stroke","stroke-width":"1.5"}),j("line",{x1:"11.5",y1:"3.5",x2:"5.5",y2:"9.5",class:"stroke","stroke-width":"1.5"})]})}),this.buttonDeleteRow.onclick=()=>{this.lastActiveTable?.focus();const t=this.lastActiveTable?.model,e=this.lastActiveTable?.selection;e&&Ie(t)&&t.removeRow(e.row,1)},this.toolbar.appendChild(this.buttonDeleteRow),this.toolbar.appendChild(document.createTextNode(" ")),this.buttonAddColumnLeft=j("button",{class:"left",title:"add column left",children:G("svg",{viewBox:"0 0 13 13",width:"13",height:"13",children:[j("rect",{x:"0.5",y:"0.5",width:"12",height:"12",class:"strokeFill"}),j("line",{x1:"8.5",y1:"0.5",x2:"8.5",y2:"12.5",class:"stroke"}),j("line",{x1:"8.5",y1:"4.5",x2:"12.5",y2:"4.5",class:"stroke"}),j("line",{x1:"8.5",y1:"8.5",x2:"12.5",y2:"8.5",class:"stroke"}),j("line",{x1:"2",y1:"6.5",x2:"7",y2:"6.5",class:"stroke"}),j("line",{x1:"4.5",y1:"4",x2:"4.5",y2:"9",class:"stroke"})]})}),this.buttonAddColumnLeft.onclick=()=>{this.lastActiveTable?.focus();const t=this.lastActiveTable?.model,e=this.lastActiveTable?.selection;e&&$e(t)&&t.insertColumn(e.col)},this.toolbar.appendChild(this.buttonAddColumnLeft),this.buttonAddColumnRight=j("button",{title:"add column right",children:G("svg",{viewBox:"0 0 13 13",width:"13",height:"13",children:[j("rect",{x:"0.5",y:"0.5",width:"12",height:"12",class:"strokeFill"}),j("line",{x1:"4.5",y1:"0.5",x2:"4.5",y2:"12.5",class:"stroke"}),j("line",{x1:"0.5",y1:"4.5",x2:"4.5",y2:"4.5",class:"stroke"}),j("line",{x1:"0.5",y1:"8.5",x2:"4.5",y2:"8.5",class:"stroke"}),j("line",{x1:"6",y1:"6.5",x2:"11",y2:"6.5",class:"stroke"}),j("line",{x1:"8.5",y1:"4",x2:"8.5",y2:"9",class:"stroke"})]})}),this.buttonAddColumnRight.onclick=()=>{this.lastActiveTable?.focus();const t=this.lastActiveTable?.model,e=this.lastActiveTable?.selection;e&&$e(t)&&t.insertColumn(e.col+1)},this.toolbar.appendChild(this.buttonAddColumnRight),this.buttonDeleteColumn=j("button",{class:"right",title:"delete column",children:G("svg",{viewBox:"0 0 13 13",width:"13",height:"13",children:[j("rect",{x:"0.5",y:"0.5",width:"12",height:"12",class:"strokeFill"}),j("line",{x1:"4.5",y1:"0.5",x2:"4.5",y2:"12.5",class:"stroke"}),j("line",{x1:"8.5",y1:"0.5",x2:"8.5",y2:"12.5",class:"stroke"}),j("line",{x1:"3.5",y1:"5.5",x2:"9.5",y2:"11.5",class:"stroke","stroke-width":"1.5"}),j("line",{x1:"3.5",y1:"11.5",x2:"9.5",y2:"5.5",class:"stroke","stroke-width":"1.5"})]})}),this.buttonDeleteColumn.onclick=()=>{this.lastActiveTable?.focus();const t=this.lastActiveTable?.model,e=this.lastActiveTable?.selection;e&&$e(t)&&t.removeColumn(e.col,1)},this.toolbar.appendChild(this.buttonDeleteColumn),this.toolbar.appendChild(document.createTextNode(" ")),this.buttonAddNodeAbove=j("button",{class:"left",title:"add node above",children:G("svg",{style:{display:"block",border:"none"},viewBox:"0 0 8 17",width:"8",height:"17",children:[j("rect",{x:"0.5",y:"1.5",width:"6",height:"6",class:"strokeFill"}),j("rect",{x:"0.5",y:"9.5",width:"6",height:"6",class:"fill"}),j("line",{x1:"3.5",y1:"3",x2:"3.5",y2:"6",class:"stroke"}),j("line",{x1:"2",y1:"4.5",x2:"5",y2:"4.5",class:"stroke"}),j("line",{x1:"3.5",y1:"0",x2:"3.5",y2:"1",class:"stroke"}),j("line",{x1:"3.5",y1:"8",x2:"3.5",y2:"17",class:"stroke"})]})}),this.toolbar.appendChild(this.buttonAddNodeAbove),this.buttonAddNodeBelow=j("button",{title:"add node below",children:G("svg",{style:{display:"block",border:"none"},viewBox:"0 0 8 17",width:"8",height:"17",children:[j("rect",{x:"0.5",y:"1.5",width:"6",height:"6",class:"fill"}),j("rect",{x:"0.5",y:"9.5",width:"6",height:"6",class:"strokeFill"}),j("line",{x1:"3.5",y1:"11",x2:"3.5",y2:"14",class:"stroke"}),j("line",{x1:"2",y1:"12.5",x2:"5",y2:"12.5",class:"stroke"}),j("line",{x1:"3.5",y1:"0",x2:"3.5",y2:"9",class:"stroke"}),j("line",{x1:"3.5",y1:"16",x2:"3.5",y2:"17",class:"stroke"})]})}),this.toolbar.appendChild(this.buttonAddNodeBelow),this.buttonAddNodeParent=j("button",{title:"add node parent",children:G("svg",{viewBox:"0 0 13 17",width:"13",height:"17",children:[j("rect",{x:"0.5",y:"1.5",width:"6",height:"6",class:"strokeFill"}),j("rect",{x:"6.5",y:"9.5",width:"6",height:"6",class:"fill"}),j("line",{x1:"7",y1:"4.5",x2:"10",y2:"4.5",class:"stroke"}),j("line",{x1:"9.5",y1:"4",x2:"9.5",y2:"9",class:"stroke"}),j("line",{x1:"3.5",y1:"3",x2:"3.5",y2:"6",class:"stroke"}),j("line",{x1:"2",y1:"4.5",x2:"5",y2:"4.5",class:"stroke"}),j("line",{x1:"3.5",y1:"0",x2:"3.5",y2:"1",class:"stroke"}),j("line",{x1:"3.5",y1:"8",x2:"3.5",y2:"17",class:"stroke"})]})}),this.buttonAddNodeParent.onclick=()=>{},this.toolbar.appendChild(this.buttonAddNodeParent),this.buttonAddNodeChild=j("button",{title:"add node child",children:G("svg",{viewBox:"0 0 13 17",width:"13",height:"17",children:[j("rect",{x:"0.5",y:"1.5",width:"6",height:"6",class:"fill"}),j("rect",{x:"6.5",y:"9.5",width:"6",height:"6",class:"strokeFill"}),j("line",{x1:"7",y1:"4.5",x2:"10",y2:"4.5",class:"stroke"}),j("line",{x1:"9.5",y1:"4",x2:"9.5",y2:"9",class:"stroke"}),j("line",{x1:"9.5",y1:"11",x2:"9.5",y2:"14",class:"stroke"}),j("line",{x1:"8",y1:"12.5",x2:"11",y2:"12.5",class:"stroke"}),j("line",{x1:"3.5",y1:"0",x2:"3.5",y2:"17",class:"stroke"})]})}),this.toolbar.appendChild(this.buttonAddNodeChild),this.buttonDeleteNode=j("button",{class:"right",title:"delete node",children:G("svg",{viewBox:"0 0 10 17",width:"10",height:"17",children:[j("rect",{x:"1.5",y:"5.5",width:"6",height:"6",class:"strokeFill"}),j("line",{x1:"4.5",y1:"2",x2:"4.5",y2:"5",class:"stroke"}),j("line",{x1:"4.5",y1:"12",x2:"4.5",y2:"15",class:"stroke"}),j("line",{x1:"0.5",y1:"4.5",x2:"8.5",y2:"12.5",class:"stroke","stroke-width":"1.5"}),j("line",{x1:"8.5",y1:"4.5",x2:"0.5",y2:"12.5",class:"stroke","stroke-width":"1.5"})]})}),this.toolbar.appendChild(this.buttonDeleteNode),this.attachShadow({mode:"open"}),this.shadowRoot.appendChild(document.importNode(Ht,!0)),this.shadowRoot.appendChild(this.toolbar)}canHandle(t){return t instanceof Le}activate(){this.lastActiveTable=Yt.activeView,this.toolbar.classList.add("active")}deactivate(){this.lastActiveTable=void 0,this.toolbar.classList.remove("active")}});class ze extends me{}class Oe extends ze{}class Pe{constructor(t,e,i){this.type=t,this.index=e,this.size=i}get col(){return this.index}get row(){return this.size}toString(){return`TableEvent {type: ${de[this.type]}, index: ${this.index}, size: ${this.size}}`}}class Fe{constructor(t,e,i=!0){this.node=t,this.depth=e,this.open=i}}class We extends pe{constructor(t,e){super(t),this.rows=new Array,void 0!==e&&this.createRowInfoHelper(this.rows,e,0)}get colCount(){return 1}get rowCount(){return this.rows.length}getRow(t){for(let e=0;e<this.rows.length;++e)if(this.rows[e].node===t)return e}addSiblingBefore(t){const e=this.createNode();return 0===this.rows.length?(t=0,this.setRoot(e),this.rows.push(new Fe(e,0))):0===t?(this.setNext(e,this.getRoot()),this.setRoot(e),this.rows.unshift(new Fe(e,0))):(this.setNext(e,this.rows[t].node),this.getNext(this.rows[t-1].node)===this.rows[t].node?this.setNext(this.rows[t-1].node,e):this.setDown(this.rows[t-1].node,e),this.rows.splice(t,0,new Fe(e,this.rows[t].depth))),this.modified.trigger(new Pe(de.INSERT_ROW,t,1)),t}addSiblingAfter(t){const e=this.createNode();if(0===this.rows.length)t=0,this.setRoot(e),this.rows.push(new Fe(e,0));else{this.setNext(e,this.getNext(this.rows[t].node)),this.setNext(this.rows[t].node,e);const i=this.nodeCount(this.getDown(this.rows[t].node)),s=this.rows[t].depth;t+=i+1,this.rows.splice(t,0,new Fe(e,s))}return this.modified.trigger(new Pe(de.INSERT_ROW,t,1)),t}addChildAfter(t){const e=this.createNode();if(0===this.rows.length)this.setRoot(e),this.rows.push(new Fe(e,0)),this.modified.trigger(new Pe(de.INSERT_ROW,0,1));else{const i=this.getDown(this.rows[t].node),s=this.nodeCount(i);for(let e=0;e<s;++e)++this.rows[t+1+e].depth;this.setDown(e,i),this.setDown(this.rows[t].node,e),this.rows.splice(t+1,0,new Fe(e,this.rows[t].depth+1)),this.modified.trigger(new Pe(de.INSERT_ROW,t+1,1))}return t}addParentBefore(t){const e=this.createNode();if(0===t){for(let e=0;e<this.rows.length;++e)++this.rows[t+e].depth;this.setDown(e,this.getRoot()),this.setRoot(e),this.rows.unshift(new Fe(e,0))}else{const i=this.rows[t].depth,s=this.nodeCount(this.getDown(this.rows[t].node))+1;for(let e=0;e<s;++e)++this.rows[t+e].depth;this.setDown(e,this.rows[t].node),this.setNext(e,this.getNext(this.rows[t].node)),this.setNext(this.rows[t].node,void 0),this.getNext(this.rows[t-1].node)===this.rows[t].node?this.setNext(this.rows[t-1].node,e):this.setDown(this.rows[t-1].node,e),this.rows.splice(t,0,new Fe(e,i))}return this.modified.trigger(new Pe(de.INSERT_ROW,t,1)),t}deleteAt(t){let e=this.getDown(this.rows[t].node);if(void 0!==e){const i=this.nodeCount(e)+1;for(let e=0;e<i;++e)--this.rows[t+e].depth;this.append(e,this.getNext(this.rows[t].node)),this.setNext(this.rows[t].node,void 0),0===t?this.setRoot(e):this.setNext(this.rows[t-1].node,e)}else if(0===t){const e=this.getNext(this.rows[t].node);this.setNext(this.rows[t].node,void 0),this.setRoot(e)}else{const e=this.getNext(this.rows[t].node);this.setNext(this.rows[t].node,void 0),this.getNext(this.rows[t-1].node)===this.rows[t].node?this.setNext(this.rows[t-1].node,e):this.setDown(this.rows[t-1].node,e)}return this.rows.splice(t,1),this.modified.trigger(new Pe(de.REMOVE_ROW,t,1)),t}init(){}toggleAt(t){this.rows[t].open?this.closeAt(t):this.openAt(t)}isOpen(t){return this.rows[t].open}openAt(t){let e=this.rows[t];if(e.open||void 0===this.getDown(e.node))return;e.open=!0;const i=this.createRowInfo(t);this.rows.splice(t+1,0,...i),this.modified.trigger(new Pe(de.INSERT_ROW,t+1,i.length))}closeAt(t){let e=this.rows[t];if(!e.open||void 0===this.getDown(e.node))return;const i=this.getVisibleChildCount(t);e.open=!1,this.rows.splice(t+1,i),this.modified.trigger(new Pe(de.REMOVE_ROW,t+1,i))}collapse(){let t=0;for(;t<this.rowCount;)this.closeAt(t),++t;for(let t of this.rows)t.open=!1}createRowInfo(t){const e=new Array;let i=this.rows[t];return i.open&&this.getDown(i.node)&&this.createRowInfoHelper(e,this.getDown(i.node),i.depth+1),e}createRowInfoHelper(t,e,i){const s=new Fe(e,i,!1);t.push(s),s.open&&this.getDown(e)&&this.createRowInfoHelper(t,this.getDown(e),s.depth+1),this.getNext(e)&&this.createRowInfoHelper(t,this.getNext(e),s.depth)}getVisibleChildCount(t){let e=this.rows[t],i=1;if(e.open&&this.getDown(e.node)){const e=this.getVisibleChildCountHelper(t+1);t+=e,i+=e}return i-1}getVisibleChildCountHelper(t){let e=this.rows[t],i=1;if(e.open&&this.getDown(e.node)){const e=this.getVisibleChildCountHelper(t+1);t+=e,i+=e}if(this.getNext(e.node)){const e=this.getVisibleChildCountHelper(t+1);t+=e,i+=e}return i}append(t,e){if(void 0===e)return;let i,s=t;for(;i=this.getNext(s),void 0!==i;)s=i;this.setNext(s,e)}nodeCount(t){return void 0===t?0:1+this.nodeCount(this.getDown(t))+this.nodeCount(this.getNext(t))}}class Ue extends Oe{constructor(t){super(t),this.config.seamless=!0}treeCell(t,e,i){this._showCell(t,e);const s=Z(K(i));s.style.verticalAlign="middle",s.style.padding="2px",e.appendChild(s)}showCell(t,e){this._showCell(t,e)}_showCell(t,e){if(void 0===this.model)return void console.log("no model");const i=this.model.rows[t.row],s=12,o=3.5,n=Math.round(2)-.5,a=i.depth*s+s+o,l=ot();l.setAttributeNS(null,"width",`${a}`),l.setAttributeNS(null,"height","12"),l.style.verticalAlign="middle",l.style.background="none";const r=i.depth;if(void 0!==this.model.getDown(i.node)){const t=r*s+o,e=function(t,e,i,s,o,n){const a=document.createElementNS(st,"rect");return a.setAttributeNS(null,"x",`${t}`),a.setAttributeNS(null,"y",`${e}`),a.setAttributeNS(null,"width",`${i}`),a.setAttributeNS(null,"height",`${s}`),void 0!==o&&a.setAttributeNS(null,"stroke",o),void 0!==n&&a.setAttributeNS(null,"fill",n),a}(t,n,8,8,"#000","#fff");e.style.cursor="pointer",l.appendChild(e);const a=at(t+2,n+4,t+8-2,n+4,"#000");a.style.cursor="pointer",l.appendChild(a);const h=at(t+4,n+2,t+4,n+8-2,"#000");h.style.cursor="pointer",h.style.display=i.open?"none":"",l.appendChild(h),l.appendChild(at(t+8,n+4,t+8+3,n+4,"#f80")),l.onpointerdown=e=>{e.preventDefault(),e.stopPropagation();const s=this.model.getRow(i.node);if(void 0===s)return void console.log("  ==> couldn't find row number for node");const o=l.getBoundingClientRect(),a=e.clientX-o.left,r=e.clientY-o.top;t<=a&&a<=t+8&&n<=r&&r<=n+8&&(this.model?.toggleAt(s),h.style.display=this.model.isOpen(s)?"none":"")}}else l.appendChild(at(r*s+o+4-.5,0,r*s+o+4,n+4,"#f80")),l.appendChild(at(r*s+o+4,n+4,r*s+o+8+3,n+4,"#f80"));let h="";for(let e=0;e<=r;++e){const n=e*s+o+4+2;for(let s=t.row+1;s<this.model.rowCount&&!(this.model.rows[s].depth<e);++s)if(e===this.model.rows[s].depth){(e!==r||void 0!==this.model.getNext(i.node))&&(h+=`<line x1='${n}' y1='0' x2='${n}' y2='100%' stroke='%23f80' />`);break}}if(void 0===this.model.getDown(i.node)||void 0===this.model.getNext(i.node)){const t=r*s+o+4+2;h+=`<line x1='${t}' y1='0' x2='${t}' y2='4' stroke='%23f80' />`}e.style.background=`url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' style='background: %23000;'>${h}</svg>")`,e.style.backgroundRepeat="repeat-y",e.replaceChildren(l)}}class je extends We{constructor(t,e){super(t,e),this.root=e}createNode(){return new this.nodeClass}deleteNode(t){}getRoot(){return this.root}setRoot(t){this.root=t}getDown(t){return t.down}setDown(t,e){t.down=e}getNext(t){return t.next}setNext(t,e){t.next=e}}class Ge{constructor(t,e){this.groupName=t.replace("/","-"),this.name=e.replace("/","-"),this.description="",this.value=0,this.defaultValue=0,this.targets=[]}setHuman(t){this.human=t,t.addModifier(this)}get fullName(){return`${this.groupName}/${this.name}`}getMin(){return 0}getMax(){return 1}setValue(t,{skipDependencies:e=!1}={}){console.log(`Modifier.setValue(${t}) // modifier ${this.fullName}`);const i=this.clampValue(t),s=this.getFactors(i),o=U(this.targets,s,i);for(let t of o)this.human.setDetail(t[0],t[1]);e||this.propagateUpdate(!1)}resetValue(){const t=this.getValue();return this.setValue(this.getDefaultValue()),t}propagateUpdate(t=!1){console.log("please note: Modifier.propagateUpdate is not implemented")}getValue(){let t=0;for(let e of this.targets)t+=this.human.getDetail(e.targetPath);return t}getDefaultValue(){return this.defaultValue}buildLists(){if(void 0===this.verts&&void 0===this.faces)for(const t in this.targets);}updateValue(t,{updateNormals:e=1,skipUpdate:i=!1}={}){this.setValue(t,{skipDependencies:!0})}getSymmetrySide(){throw Error("Not implemented")}getSymmetricOpposite(){throw Error("Not implemented")}getSimilar(){throw Error("Not implemented")}isMacro(){return void 0!==this.macroVariable}getModel(){return void 0===this.model&&(this.model=new d(this.getDefaultValue(),{min:this.getMin(),max:this.getMax(),step:.05})),this.model}}class Je extends Ge{constructor(t,e){super(t,e)}clampValue(t){return t=Math.min(t),t=void 0!==this.left?Math.max(-1,t):Math.max(0,t)}setValue(t,{skipDependencies:e=!1}={}){t=this.clampValue(t);const i=this.getFactors(t),s=U(this.targets,i);for(const t of s)this.human.setDetail(t[0],t[1]);e||this.propagateUpdate(!1)}getValue(){if(this.rTargets){let t=0;for(let e of this.rTargets)t+=this.human.getDetail(e.targetPath);return t}let t=0;for(let e of this.lTargets)t+=this.human.getDetail(e.targetPath);return t}getFactors(t){const e=new Map,i=Object.getOwnPropertyDescriptors(this.human);for(const t in i)t.endsWith("Val")&&e.set(t.substring(0,t.length-3),i[t].value.value);return e}}class Ye{constructor(t,e){this.targetPath=t,this.factorDependencies=e}}function qe(t){if(void 0===t)return[];const e=y.getInstance().getTargetsByGroup(t);if(void 0===e)throw Error(`findTargets(): failed to get targetsList for ${t}`);const i=[];for(const t of e){const e=t.tuple(),s=t.getVariables();s.push(e),i.push(new Ye(t.path,s))}return i}class Ke extends Je{constructor(t,e){super(t,e),this.defaultValue=.5,this.targets=qe(t),this.macroDependencies=function(t){var e;const i=new Set;return void 0===t||null===(e=y.getInstance().groups.get(t))||void 0===e||e.forEach((t=>{t.data.forEach(((t,e)=>{void 0!==t&&i.add(e)}))})),i}(t),this.macroVariable=this.getMacroVariable(),this.macroVariable&&this.macroDependencies.delete(this.macroVariable)}getMacroVariable(){if(this.name){let t=this.name.toLowerCase();if(-1!==x.indexOf(t))return t;if(v.has(t))return v.get(t)}}getValue(){return this.getModel().value}setValue(t,{skipDependencies:e=!1}={}){t=this.clampValue(t),this.getModel().value=t,super.setValue(t,{skipDependencies:e})}clampValue(t){return Math.max(0,Math.min(1,t))}getFactors(t){const e=super.getFactors(t);return e.set(this.groupName,1),e}buildLists(){}getModel(){if(void 0!==this.model)return this.model;if(void 0===this.human)throw Error("MacroModifier.getModel(): can only be called after human has been set");switch(this.name){case"Gender":this.model=this.human.gender;break;case"Age":this.model=this.human.age;break;case"Muscle":this.model=this.human.muscle;break;case"Weight":this.model=this.human.weight;break;case"Height":this.model=this.human.height;break;case"BodyProportions":this.model=this.human.bodyProportions;break;case"BreastSize":this.model=this.human.breastSize;break;case"BreastFirmness":this.model=this.human.breastFirmness;break;case"African":this.model=this.human.africanVal;break;case"Asian":this.model=this.human.asianVal;break;case"Caucasian":this.model=this.human.caucasianVal;break;default:throw Error(`MacroModifier.getModel(): not implemented for name '${this.name}'`)}return this.model}}class Xe extends Ke{constructor(t,e){super(t,e),this.defaultValue=1/3}}class Ze extends Je{constructor(t,e,i,s,o){let n,a,l,r,h=`${t}-${e}`;void 0!==i&&void 0!==s?(a=`${h}-${i}`,r=`${h}-${s}`,void 0!==o?(l=`${h}-${o}`,h=`${h}-${i}|${o}|${s}`,n=`${e}-${i}|${o}|${s}`):(l=void 0,h=`${h}-${i}|${s}`,n=`${e}-${i}|${s}`)):(a=void 0,r=h,l=void 0,n=e),super(t,n),this.targetName=h,this.left=a,this.center=l,this.right=r,this.lTargets=qe(this.left),this.rTargets=qe(this.right),this.cTargets=qe(this.center);for(const t of[this.lTargets,this.rTargets,this.cTargets])if(void 0!==t)for(const e of t)this.targets.push(e)}getMin(){return void 0!==this.left?-1:0}getFactors(t){const e=super.getFactors(t);return void 0!==this.left&&e.set(this.left,-Math.min(t,0)),void 0!==this.center&&e.set(this.center,1-Math.abs(t)),e.set(this.right,Math.max(0,t)),e}}function Qe(t,e){return function(t,e,i="memory"){const s=new Map([["EthnicModifier",Xe]]),o=JSON.parse(t),n=new Array,a=new Map;for(const t of o){const e=t.group;for(const i of t.modifiers){let t,o;if("modifierType"in i){if(t=s.get(i.modifierType),void 0===t)throw Error(`failed to instantiate modifer ${i.modifierType}`)}else t="macrovar"in i?Ke:Ze;if("macrovar"in i)o=new t(e,i.macrovar),o.isMacro()||console.log(`Expected modifier ${t.name} to be a macro modifier, but identifies as a regular one. Please check variable category definitions in class Component.`);else{if(t!==Ze)throw Error();o=new t(e,i.target,i.min,i.max,i.mid)}"defaultValue"in i&&(o.defaultValue=i.defaultValue),void 0===o.fullName&&(console.log("ERROR: modifier has no fullName"),console.log(o)),n.push(o),a.set(o.fullName,o)}}if(void 0!==e)for(const t of n)t.setHuman(e);return console.log(`Loaded ${n.length} modifiers from file ${i}`),n}(m.getInstance().readFile(t),e,t)}class ti{constructor(t,e){if(ti.count++,this.label=t||"",this.modifierSpec=e,e){const t=u.getInstance(),i=t.getModifier(e.mod);void 0!==i&&(this.model=i.getModel(),this.model.modified.add((()=>{i.updateValue(this.model.value),t.updateProxyMesh(!0)})))}}}function ei(t){return t[0].toUpperCase()+t.slice(1)}function ii(t,e){const i=e.split("-");return-1!==i[i.length-1].indexOf("|")&&i.pop(),i.length>1&&i[0]===t&&i.shift(),i[0]=ei(i[0]),i.join(" ")}function si(t){const e=function(t,e="memory"){const i=JSON.parse(t);let s,o;for(const[t,e]of Object.entries(i).sort(((t,e)=>t[1].sortOrder-e[1].sortOrder))){const i=e;let n=t;void 0!==i.label&&(n=i.label);const a=new ti(n);let l;a.category=i,o?o.next=a:s=a,o=a;for(const[t,e]of Object.entries(i.modifiers)){const i=new ti(ei(t));let s;l?l.next=i:o.down=i,l=i;for(const t of e){let e=t.label;if(void 0===e){const i=t.mod.split("/");e=ii(i[0],i[1])}const i=new ti(e,t);s?s.next=i:l.down=i,s=i}}}if(void 0===s)throw Error("No sliders found.");return s}(m.getInstance().readFile(t),t);return console.log(`Loaded ${ti.count} slider nodes from file ${t}`),e}ti.count=0;class oi{constructor(t,e){this.name=t,this.startIndex=e,this.length=0}}class ni{constructor(){this.name="",this.faceGroups=new Map,this.vertex=new Array,this.indices=new Array,this.groups=new Array}load(t){const e=m.getInstance().readFile(t),i=new Array,s=new Array,o=new g(e);let n=0;for(let t of o){if(++n,t=t.trim(),0===t.length)continue;if("#"===t[0])continue;const e=t.split(/\s+/);switch(e[0]){case"v":if(e.length<4)throw Error(`Too few arguments in ${t}`);if(e.length>5)throw Error(`Too many arguments in ${t}`);if(i.push(parseFloat(e[1])),i.push(parseFloat(e[2])),i.push(parseFloat(e[3])),5===e.length)throw Error("Can't handle vertex with weight yet...");break;case"vt":case"vn":case"vp":case"deg":case"bmat":case"step":case"cstype":case"p":case"l":case"curv":case"curv2":case"surf":case"parm":case"trim":case"hole":case"scrv":case"sp":case"end":case"con":case"s":case"mg":case"bevel":case"c_interp":case"d_interp":case"lod":case"usemtl":case"mtllib":case"shadow_obj":case"trace_obj":case"ctech":case"stech":break;case"f":if(5!==e.length)throw Error(`can't handle faces which are not quads yet (line ${n}: '${t}'}`);for(let t=1;t<e.length;++t){const i=e[t].split("/");s.push(parseInt(i[0],10)-1)}const o=s.length-4;s.push(s[o+0]),s.push(s[o+2]);break;case"g":this.groups.push(new oi(e[1],s.length));break;case"o":this.name=e[1];break;default:throw Error(`Unknown keyword '${e[0]}' in Wavefront OBJ file in line '${t}' of length ${t.length}'.`)}}if(this.vertex=i,this.indices=s,this.groups.length>0){for(let t=0;t<this.groups.length-1;++t)this.groups[t].length=this.groups[t+1].startIndex-this.groups[t].startIndex;this.groups[this.groups.length-1].length=s.length-this.groups[this.groups.length-1].startIndex}this.logStatistics(t)}getFaceGroup(t){const e=this.groups.filter((e=>e.name===t));if(1===e.length)return e[0]}logStatistics(t){let e="",i=0,s=0;this.groups.forEach((t=>{t.name.startsWith("joint-")?++i:t.name.startsWith("helper-")?++s:e=0===e.length?t.name:`${e}, ${t.name}`})),console.log(`Loaded ${this.groups.length} groups (${i} joints, ${s} helpers and ${e}), ${this.vertex.length/3} vertices, ${this.indices.length/3} triangles from file '${t}'`)}}var ai,li;!function(t){t[t.NONE=0]="NONE",t[t.MORPH=1]="MORPH",t[t.POSE=2]="POSE"}(ai||(ai={}));class ri{constructor(t,e){this.updateRequired=ai.NONE,this.human=t,this.obj=e,this.vertex=this.origVertex=e.vertex,this.indices=e.indices,this.groups=e.groups,t.meshData=e}update(){if(this.updateRequired===ai.NONE)return;this.vertex=[...this.origVertex],this.human.targetsDetailStack.forEach(((t,e)=>{if(isNaN(t))return;if(i=t,Math.abs(i)<=1e-9||isNaN(t))return;var i;(function(t){let e=C.get(t);return void 0!==e||(e=new f,e.load(t),C.set(t,e)),e})(e).apply(this.vertex,t)}));const t=this.obj.vertex;this.obj.vertex=this.vertex,this.human.__skeleton.updateJoints(this.human),this.human.__skeleton.build(),this.human.__skeleton.update(),this.obj.vertex=t,this.vertex=this.human.__skeleton.skinMesh(this.vertex,this.human.__skeleton.vertexWeights._data),console.log(`HumanMesh.update(): skinMesh, ${this.vertex.length}`),this.updateRequired=ai.NONE}}!function(t){t[t.MORPH=0]="MORPH",t[t.POSE=1]="POSE"}(li||(li={}));var hi=Uint8Array,di=Uint16Array,ci=Uint32Array,ui=new hi([0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0,0,0,0]),pi=new hi([0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13,0,0]),gi=new hi([16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15]),mi=function(t,e){for(var i=new di(31),s=0;s<31;++s)i[s]=e+=1<<t[s-1];var o=new ci(i[30]);for(s=1;s<30;++s)for(var n=i[s];n<i[s+1];++n)o[n]=n-i[s]<<5|s;return[i,o]},fi=mi(ui,2),bi=fi[0],xi=fi[1];bi[28]=258,xi[258]=28;for(var vi=mi(pi,0)[0],wi=new di(32768),yi=0;yi<32768;++yi){var Ci=(43690&yi)>>>1|(21845&yi)<<1;Ci=(61680&(Ci=(52428&Ci)>>>2|(13107&Ci)<<2))>>>4|(3855&Ci)<<4,wi[yi]=((65280&Ci)>>>8|(255&Ci)<<8)>>>1}var ki=function(t,e,i){for(var s=t.length,o=0,n=new di(e);o<s;++o)t[o]&&++n[t[o]-1];var a,l=new di(e);for(o=0;o<e;++o)l[o]=l[o-1]+n[o-1]<<1;if(i){a=new di(1<<e);var r=15-e;for(o=0;o<s;++o)if(t[o])for(var h=o<<4|t[o],d=e-t[o],c=l[t[o]-1]++<<d,u=c|(1<<d)-1;c<=u;++c)a[wi[c]>>>r]=h}else for(a=new di(s),o=0;o<s;++o)t[o]&&(a[o]=wi[l[t[o]-1]++]>>>15-t[o]);return a},Hi=new hi(288);for(yi=0;yi<144;++yi)Hi[yi]=8;for(yi=144;yi<256;++yi)Hi[yi]=9;for(yi=256;yi<280;++yi)Hi[yi]=7;for(yi=280;yi<288;++yi)Hi[yi]=8;var Si=new hi(32);for(yi=0;yi<32;++yi)Si[yi]=5;var Ei=ki(Hi,9,1),Ai=ki(Si,5,1),Ti=function(t){for(var e=t[0],i=1;i<t.length;++i)t[i]>e&&(e=t[i]);return e},_i=function(t,e,i){var s=e/8|0;return(t[s]|t[s+1]<<8)>>(7&e)&i},Mi=function(t,e){var i=e/8|0;return(t[i]|t[i+1]<<8|t[i+2]<<16)>>(7&e)},Ri=["unexpected EOF","invalid block type","invalid length/literal","invalid distance","stream finished","no stream handler",,"no callback","invalid UTF-8 data","extra field too long","date not in range 1980-2099","filename too long","stream finishing","invalid zip data"],Ni=function(t,e,i){var s=new Error(e||Ri[t]);if(s.code=t,Error.captureStackTrace&&Error.captureStackTrace(s,Ni),!i)throw s;return s},Bi=function(t,e,i){var s=t.length;if(!s||i&&i.f&&!i.l)return e||new hi(0);var o=!e||i,n=!i||i.i;i||(i={}),e||(e=new hi(3*s));var a=function(t){var i=e.length;if(t>i){var s=new hi(Math.max(2*i,t));s.set(e),e=s}},l=i.f||0,r=i.p||0,h=i.b||0,d=i.l,c=i.d,u=i.m,p=i.n,g=8*s;do{if(!d){l=_i(t,r,1);var m=_i(t,r+1,3);if(r+=3,!m){var f=t[(A=4+((r+7)/8|0))-4]|t[A-3]<<8,b=A+f;if(b>s){n&&Ni(0);break}o&&a(h+f),e.set(t.subarray(A,b),h),i.b=h+=f,i.p=r=8*b,i.f=l;continue}if(1==m)d=Ei,c=Ai,u=9,p=5;else if(2==m){var x=_i(t,r,31)+257,v=_i(t,r+10,15)+4,w=x+_i(t,r+5,31)+1;r+=14;for(var y=new hi(w),C=new hi(19),k=0;k<v;++k)C[gi[k]]=_i(t,r+3*k,7);r+=3*v;var H=Ti(C),S=(1<<H)-1,E=ki(C,H,1);for(k=0;k<w;){var A,T=E[_i(t,r,S)];if(r+=15&T,(A=T>>>4)<16)y[k++]=A;else{var _=0,M=0;for(16==A?(M=3+_i(t,r,3),r+=2,_=y[k-1]):17==A?(M=3+_i(t,r,7),r+=3):18==A&&(M=11+_i(t,r,127),r+=7);M--;)y[k++]=_}}var R=y.subarray(0,x),N=y.subarray(x);u=Ti(R),p=Ti(N),d=ki(R,u,1),c=ki(N,p,1)}else Ni(1);if(r>g){n&&Ni(0);break}}o&&a(h+131072);for(var B=(1<<u)-1,V=(1<<p)-1,D=r;;D=r){var L=(_=d[Mi(t,r)&B])>>>4;if((r+=15&_)>g){n&&Ni(0);break}if(_||Ni(2),L<256)e[h++]=L;else{if(256==L){D=r,d=null;break}var I=L-254;if(L>264){var $=ui[k=L-257];I=_i(t,r,(1<<$)-1)+bi[k],r+=$}var z=c[Mi(t,r)&V],O=z>>>4;z||Ni(3),r+=15&z;N=vi[O];if(O>3){$=pi[O];N+=Mi(t,r)&(1<<$)-1,r+=$}if(r>g){n&&Ni(0);break}o&&a(h+131072);for(var P=h+I;h<P;h+=4)e[h]=e[h-N],e[h+1]=e[h+1-N],e[h+2]=e[h+2-N],e[h+3]=e[h+3-N];h=P}}i.l=d,i.p=D,i.b=h,i.f=l,d&&(l=1,i.m=u,i.d=c,i.n=p)}while(!l);return h==e.length?e:function(t,e,i){(null==e||e<0)&&(e=0),(null==i||i>t.length)&&(i=t.length);var s=new(2==t.BYTES_PER_ELEMENT?di:4==t.BYTES_PER_ELEMENT?ci:hi)(i-e);return s.set(t.subarray(e,i)),s}(e,0,h)},Vi=new hi(0);function Di(t,e){return Bi(((8!=(15&(i=t)[0])||i[0]>>>4>7||(i[0]<<8|i[1])%31)&&Ni(6,"invalid zlib data"),32&i[1]&&Ni(6,"invalid zlib data: preset dictionaries not supported"),t.subarray(2,-4)),e);var i}var Li,Ii="undefined"!=typeof TextDecoder&&new TextDecoder;try{Ii.decode(Vi,{stream:!0}),1}catch(t){}class $i{readFile(t){if(t.endsWith(".z")){const e=new XMLHttpRequest;if(e.overrideMimeType("text/plain; charset=x-user-defined"),e.open("GET",t,!1),e.send(null),e.status>400)throw new Error(`Request failed for '${t}': ${e.statusText}`);const i=new ArrayBuffer(e.responseText.length),s=new Uint8Array(i);for(let t=0;t<e.responseText.length;++t)s[t]=e.responseText.charCodeAt(t);return new TextDecoder("utf-8").decode(Di(s))}if(t.endsWith("/directory.json")){const e=new XMLHttpRequest;if(e.open("GET",t,!1),e.send(null),e.status<400)return e.responseText;throw new Error(`Request failed for '${t}': ${e.statusText}`)}return this.readFile(`${t}.z`)}isFile(t){let e=$i.path2info.get(t);if(void 0===e){try{this.listDir(t)}catch(e){throw console.log(`failed to load directory ${t}`),$i.path2info.forEach(((t,e)=>console.log(e,t))),Error()}e=$i.path2info.get(t)}if(void 0===e)throw Error(`HTTPJSFSAdapter.isFile('${t}')`);return!e.isDir}isDir(t){const e=$i.path2info.get(t);if(void 0===e)throw Error(`HTTPJSFSAdapter.isFile('${t}')`);return e.isDir}listDir(t){let e=$i.path2info.get(t);if(void 0!==e&&void 0!==e.dir)return e.dir;void 0===e&&(e={file:"",isDir:!0,dir:void 0});const i=this.readFile(`data/${t}/directory.json`),s=JSON.parse(i);e.dir=[];for(const i of s){const s=`${t}/${i.file}`;e.dir.push(i.file),i.isDir||$i.path2info.set(s,{file:i.file,isDir:!1})}return $i.path2info.set(t,e),e.dir}realPath(t){return t}joinPath(t,e){return`${t}/${e}`}}function zi(t,e){function i(t,e){s[t]+=e[0],s[t+1]+=e[1],s[t+2]+=e[2]}const s=new Array(t.length);s.fill(0);for(let s=0;s<e.length;){const o=3*e[s++],n=3*e[s++],a=3*e[s++],l=M(t[o],t[o+1],t[o+2]),r=M(t[n],t[n+1],t[n+2]),h=M(t[a],t[a+1],t[a+2]),d=_();R(d,r,l);const c=_();R(c,h,l);const u=_();V(u,d,c),i(o,u),i(n,u),i(a,u)}for(let e=0;e<t.length;e+=3){const t=M(s[e],s[e+1],s[e+2]);B(t,t),s[e]=t[0],s[e+1]=t[1],s[e+2]=t[2]}return s}$i.path2info=new Map,function(t){t[t.SKIN=0]="SKIN",t[t.PANTS_HELPER=1]="PANTS_HELPER",t[t.SKIRT=126]="SKIRT",t[t.HAIR=127]="HAIR",t[t.EYEBALL0=128]="EYEBALL0",t[t.EYEBALL1=129]="EYEBALL1",t[t.PENIS=130]="PENIS",t[t.MOUTH_GUM_TOP=131]="MOUTH_GUM_TOP",t[t.MOUTH_GUM_BOTTOM=132]="MOUTH_GUM_BOTTOM",t[t.TOUNGE=169]="TOUNGE",t[t.CUBE=171]="CUBE"}(Li||(Li={}));let Oi=0;class Pi{constructor(t,e,i){this.gl=t,this.vertex=this.createBuffer(t.ARRAY_BUFFER,t.STATIC_DRAW,Float32Array,e),this.indices=this.createBuffer(t.ELEMENT_ARRAY_BUFFER,t.STATIC_DRAW,Uint16Array,i),this.normal=this.createBuffer(t.ARRAY_BUFFER,t.STATIC_DRAW,Float32Array,zi(e,i)),this.length=i.length}update(t,e){this.updateBuffer(this.vertex,this.gl.ARRAY_BUFFER,this.gl.STATIC_DRAW,Float32Array,t),this.updateBuffer(this.normal,this.gl.ARRAY_BUFFER,this.gl.STATIC_DRAW,Float32Array,zi(t,e))}draw(t,e){const i=this.gl.FLOAT;this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.vertex),this.gl.vertexAttribPointer(t.attribLocations.vertexPosition,3,i,false,0,0),this.gl.enableVertexAttribArray(t.attribLocations.vertexPosition),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.normal),this.gl.vertexAttribPointer(t.attribLocations.vertexNormal,3,i,false,0,0),this.gl.enableVertexAttribArray(t.attribLocations.vertexNormal),this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER,this.indices),this.gl.drawElements(e,this.length,this.gl.UNSIGNED_SHORT,0)}createBuffer(t,e,i,s){const o=this.gl.createBuffer();if(null===o)throw Error("Failed to create new WebGLBuffer");return this.updateBuffer(o,t,e,i,s),o}updateBuffer(t,e,i,s,o){return this.gl.bindBuffer(e,t),this.gl.bufferData(e,new s(o),i),t}}function Fi(t,e){console.log(`NUMBER OF BONES ${e.human.__skeleton.bones.size}`);const i=t.getContext("webgl2")||t.getContext("experimental-webgl");if(!i)throw Error("Unable to initialize WebGL. Your browser or machine may not support it.");const s=function(t,e){let i=Ji(e),s=e.vertex,o=e.indices;const n=s.length/3,a=2*o.length;let l;s=s.concat(i.vertex),o=o.concat(i.indices.map((t=>t+n))),e.proxy&&(l=new Pi(t,e.proxy.getCoords(e.vertex),e.proxyMesh.indices));return{vertex:Yi(t,t.ARRAY_BUFFER,t.STATIC_DRAW,Float32Array,s),normal:Yi(t,t.ARRAY_BUFFER,t.STATIC_DRAW,Float32Array,zi(s,o)),indices:Yi(t,t.ELEMENT_ARRAY_BUFFER,t.STATIC_DRAW,Uint16Array,o),skeletonIndex:a,proxy:l}}(i,e),o=ji(i,i.VERTEX_SHADER,Wi),n=ji(i,i.FRAGMENT_SHADER,Ui),a=function(t,e,i){const s=t.createProgram();if(null===s)throw Error("Unable to create WebGLProgram");if(t.attachShader(s,e),t.attachShader(s,i),t.linkProgram(s),!t.getProgramParameter(s,t.LINK_STATUS))throw Error(`Unable to initialize WebGLProgram: ${t.getProgramInfoLog(s)}`);return{program:s,attribLocations:{vertexPosition:t.getAttribLocation(s,"aVertexPosition"),vertexNormal:t.getAttribLocation(s,"aVertexNormal")},uniformLocations:{projectionMatrix:Gi(t,s,"uProjectionMatrix"),modelViewMatrix:Gi(t,s,"uModelViewMatrix"),normalMatrix:Gi(t,s,"uNormalMatrix"),color:Gi(t,s,"uColor")}}}(i,o,n);let l=0;requestAnimationFrame((function t(o){const n=(o*=.001)-l;if(l=o,e.updateRequired!==ai.NONE){e.update();let t=Ji(e),o=e.vertex,n=e.indices;const a=e.vertex.length/3;o=o.concat(t.vertex),n=n.concat(t.indices.map((t=>t+a))),s.proxy&&s.proxy.update(e.proxy.getCoords(e.vertex),e.proxyMesh.indices),s.vertex=Yi(i,i.ARRAY_BUFFER,i.STATIC_DRAW,Float32Array,o),s.normal=Yi(i,i.ARRAY_BUFFER,i.STATIC_DRAW,Float32Array,zi(o,n))}!function(t,e,i,s,o){const n=t.canvas;n.width===n.clientWidth&&n.height===n.clientHeight||(n.width=n.clientWidth,n.height=n.clientHeight);t.viewport(0,0,n.width,n.height),t.clearColor(0,0,0,1),t.clearDepth(1),t.enable(t.DEPTH_TEST),t.depthFunc(t.LEQUAL),t.clear(t.COLOR_BUFFER_BIT|t.DEPTH_BUFFER_BIT);const a=45*Math.PI/180,l=n.width/n.height,r=.1,h=100,d=H();A(d,a,l,r,h);const c=H();(function(t,e,i){var s,o,n,a,l,r,h,d,c,u,p,g,m=i[0],f=i[1],b=i[2];e===t?(t[12]=e[0]*m+e[4]*f+e[8]*b+e[12],t[13]=e[1]*m+e[5]*f+e[9]*b+e[13],t[14]=e[2]*m+e[6]*f+e[10]*b+e[14],t[15]=e[3]*m+e[7]*f+e[11]*b+e[15]):(s=e[0],o=e[1],n=e[2],a=e[3],l=e[4],r=e[5],h=e[6],d=e[7],c=e[8],u=e[9],p=e[10],g=e[11],t[0]=s,t[1]=o,t[2]=n,t[3]=a,t[4]=l,t[5]=r,t[6]=h,t[7]=d,t[8]=c,t[9]=u,t[10]=p,t[11]=g,t[12]=s*m+l*f+c*b+e[12],t[13]=o*m+r*f+u*b+e[13],t[14]=n*m+h*f+p*b+e[14],t[15]=a*m+d*f+g*b+e[15])})(c,c,[-0,0,-25]),function(t,e,i,s){var o,n,a,l,r,h,d,c,u,p,g,m,f,b,x,v,w,y,C,k,H,S,E,A,T=s[0],_=s[1],M=s[2],R=Math.hypot(T,_,M);R<1e-6||(T*=R=1/R,_*=R,M*=R,o=Math.sin(i),a=1-(n=Math.cos(i)),l=e[0],r=e[1],h=e[2],d=e[3],c=e[4],u=e[5],p=e[6],g=e[7],m=e[8],f=e[9],b=e[10],x=e[11],v=T*T*a+n,w=_*T*a+M*o,y=M*T*a-_*o,C=T*_*a-M*o,k=_*_*a+n,H=M*_*a+T*o,S=T*M*a+_*o,E=_*M*a-T*o,A=M*M*a+n,t[0]=l*v+c*w+m*y,t[1]=r*v+u*w+f*y,t[2]=h*v+p*w+b*y,t[3]=d*v+g*w+x*y,t[4]=l*C+c*k+m*H,t[5]=r*C+u*k+f*H,t[6]=h*C+p*k+b*H,t[7]=d*C+g*k+x*H,t[8]=l*S+c*E+m*A,t[9]=r*S+u*E+f*A,t[10]=h*S+p*E+b*A,t[11]=d*S+g*E+x*A,e!==t&&(t[12]=e[12],t[13]=e[13],t[14]=e[14],t[15]=e[15]))}(c,c,.7*Oi,[0,1,0]);const u=H();S(u,c),function(t,e){if(t===e){var i=e[1],s=e[2],o=e[3],n=e[6],a=e[7],l=e[11];t[1]=e[4],t[2]=e[8],t[3]=e[12],t[4]=i,t[6]=e[9],t[7]=e[13],t[8]=s,t[9]=n,t[11]=e[14],t[12]=o,t[13]=a,t[14]=l}else t[0]=e[0],t[1]=e[4],t[2]=e[8],t[3]=e[12],t[4]=e[1],t[5]=e[5],t[6]=e[9],t[7]=e[13],t[8]=e[2],t[9]=e[6],t[10]=e[10],t[11]=e[14],t[12]=e[3],t[13]=e[7],t[14]=e[11],t[15]=e[15]}(u,u);{const s=3,o=t.FLOAT,n=!1,a=0,l=0;t.bindBuffer(t.ARRAY_BUFFER,i.vertex),t.vertexAttribPointer(e.attribLocations.vertexPosition,s,o,n,a,l),t.enableVertexAttribArray(e.attribLocations.vertexPosition)}{const s=3,o=t.FLOAT,n=!1,a=0,l=0;t.bindBuffer(t.ARRAY_BUFFER,i.normal),t.vertexAttribPointer(e.attribLocations.vertexNormal,s,o,n,a,l),t.enableVertexAttribArray(e.attribLocations.vertexNormal)}let p;switch(t.bindBuffer(t.ELEMENT_ARRAY_BUFFER,i.indices),t.useProgram(e.program),t.uniformMatrix4fv(e.uniformLocations.projectionMatrix,!1,d),t.uniformMatrix4fv(e.uniformLocations.modelViewMatrix,!1,c),t.uniformMatrix4fv(e.uniformLocations.normalMatrix,!1,u),o.mode){case li.MORPH:p=[Li.SKIN,[1,.8,.7,1],t.TRIANGLES];break;case li.POSE:p=[Li.SKIN,[.2,.16,.7/5,1],t.LINES]}for(let s of[p,[Li.EYEBALL0,[0,.5,1,1],t.TRIANGLES],[Li.EYEBALL1,[0,.5,1,1],t.TRIANGLES],[Li.MOUTH_GUM_TOP,[1,0,0,1],t.TRIANGLES],[Li.MOUTH_GUM_BOTTOM,[1,0,0,1],t.TRIANGLES],[Li.TOUNGE,[1,0,0,1],t.TRIANGLES],[Li.CUBE,[1,0,.5,1],t.LINE_STRIP]]){const n=s[0],a=s[2];t.uniform4fv(e.uniformLocations.color,s[1]);const l=t.UNSIGNED_SHORT;let r=2*o.groups[n].startIndex,h=o.groups[n].length;i.proxy&&n===Li.SKIN||t.drawElements(a,h,l,r)}if(o.mode===li.POSE){t.uniform4fv(e.uniformLocations.color,[1,1,1,1]);const s=i.skeletonIndex,n=t.LINES,a=2*o.human.__skeleton.boneslist.length;t.drawElements(n,a,t.UNSIGNED_SHORT,s)}if(o.mode===li.POSE){t.uniform4fv(e.uniformLocations.color,[1,1,1,1]);const i=t.UNSIGNED_SHORT,s=2*o.groups[2].startIndex,n=124*o.groups[2].length;t.drawElements(t.TRIANGLES,n,i,s)}if(void 0!==i.proxy){let s;switch(t.uniform4fv(e.uniformLocations.color,[1,.8,.7,1]),o.mode){case li.MORPH:t.uniform4fv(e.uniformLocations.color,[1,.8,.7,1]),s=t.TRIANGLES;break;case li.POSE:t.uniform4fv(e.uniformLocations.color,[.2,.16,.7/5,1]),s=t.LINES}i.proxy.draw(e,s)}Oi+=s}(i,a,s,n,e),requestAnimationFrame(t)}))}const Wi="\n// this is our input per vertex\nattribute vec4 aVertexPosition;\nattribute vec3 aVertexNormal;\n// attribute vec4 aVertexColor;\n\n// input for all vertices (uniform for the whole shader program)\nuniform mat4 uNormalMatrix;\nuniform mat4 uModelViewMatrix;\nuniform mat4 uProjectionMatrix;\nuniform vec4 uColor;\n\n// data exchanged with other graphic pipeline stages\nvarying lowp vec4 vColor;\nvarying highp vec3 vLighting;\n\nvoid main(void) {\n  gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;\n\n  highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);\n  highp vec3 directionalLightColor = vec3(1, 1, 1);\n  highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));\n\n  highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);\n\n  highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);\n  vLighting = ambientLight + (directionalLightColor * directional);\n\n  vColor = uColor;\n}",Ui="\nvarying lowp vec4 vColor;\nvarying highp vec3 vLighting;\nvoid main(void) {\n  gl_FragColor = vec4(vec3(vColor[0],vColor[1],vColor[2]) * vLighting, vColor[3]);\n    // gl_FragColor = vColor;\n}";function ji(t,e,i){const s=t.createShader(e);if(null===s)throw Error("Unable to create WebGLShader");if(t.shaderSource(s,i),t.compileShader(s),!t.getShaderParameter(s,t.COMPILE_STATUS))throw t.deleteShader(s),Error(`An error occurred compiling the ${e} WebGLShader: ${t.getShaderInfoLog(s)}`);return s}function Gi(t,e,i){const s=t.getUniformLocation(e,i);if(null===s)throw Error(`Internal Error: Failed to get uniform location for ${i}`);return s}function Ji(t){const e=t.human.__skeleton,i=I(0,0,0,1),s=new Array(6*e.boneslist.length),o=new Array(2*e.boneslist.length);return e.boneslist.forEach(((t,e)=>{const n=t.matPoseGlobal?t.matPoseGlobal:t.matRestGlobal,a=$(L(),i,n),l=$(L(),t.yvector4,n),r=6*e,h=2*e;s[r]=a[0],s[r+1]=a[1],s[r+2]=a[2],s[r+3]=l[0],s[r+4]=l[1],s[r+5]=l[2],o[h]=2*e,o[h+1]=2*e+1})),{vertex:s,indices:o}}function Yi(t,e,i,s,o){const n=t.createBuffer();if(null===n)throw Error("Failed to create new WebGLBuffer");return t.bindBuffer(e,n),t.bufferData(e,new s(o),i),n}class qi{updateBone(){let t=H(),e=H();!function(t,e){var i=Math.sin(e),s=Math.cos(e);t[0]=1,t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[5]=s,t[6]=i,t[7]=0,t[8]=0,t[9]=-i,t[10]=s,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1}(t,this.x.value/360*2*Math.PI),function(t,e){var i=Math.sin(e),s=Math.cos(e);t[0]=s,t[1]=0,t[2]=-i,t[3]=0,t[4]=0,t[5]=1,t[6]=0,t[7]=0,t[8]=i,t[9]=0,t[10]=s,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1}(e,this.y.value/360*2*Math.PI),E(t,t,e),function(t,e){var i=Math.sin(e),s=Math.cos(e);t[0]=s,t[1]=i,t[2]=0,t[3]=0,t[4]=-i,t[5]=s,t[6]=0,t[7]=0,t[8]=0,t[9]=0,t[10]=1,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1}(e,this.z.value/360*2*Math.PI),E(t,t,e),this.bone.matPose=t,this.bone.skeleton.boneslist.forEach((t=>t.update()))}constructor(t,e){if(this.x=new d(0,{min:-180,max:180,step:5}),this.y=new d(0,{min:-180,max:180,step:5}),this.z=new d(0,{min:-180,max:180,step:5}),void 0===t||void 0===e)return;const i=()=>{this.updateBone(),e.trigger(this)};this.x.modified.add(i),this.y.modified.add(i),this.z.modified.add(i),this.bone=t,t.children.forEach((t=>{if(void 0===this.down)this.down=new qi(t,e);else{const i=this.down;this.down=new qi(t,e),this.down.next=i}}))}}qi.count=0;class Ki extends Ue{constructor(t){super(t),this.config.expandColumn=!0}get colCount(){return 2}showCell(t,e){if(void 0===this.model)return void console.log("no model");const i=this.model.rows[t.row].node;switch(t.col){case 0:this.treeCell(t,e,i.bone.name);break;case 1:const a=n(s,{children:[o(kt,{model:i.x,style:{width:"50px"}}),o(kt,{model:i.y,style:{width:"50px"}}),o(kt,{model:i.z,style:{width:"50px"}})]});e.replaceChildren(...a)}}}class Xi extends Ue{constructor(t){super(t),this.config.expandColumn=!0}get colCount(){return 2}showCell(t,e){if(void 0===this.model)return void console.log("no model");const i=this.model.rows[t.row].node;switch(t.col){case 0:this.treeCell(t,e,i.label);break;case 1:if(i.model){const t=n(s,{children:[o(kt,{model:i.model,style:{width:"50px"}}),o(Jt,{model:i.model,style:{width:"200px"}})]});e.replaceChildren(...t)}}}}function Zi(){try{!function(){console.log("loading assets..."),m.setInstance(new $i);const t=u.getInstance(),e=new ni;e.load("data/3dobjs/base.obj.z"),t.meshData=e;const a=new ri(t,e);t.modified.add((()=>a.updateRequired=ai.MORPH));const r=F("data/rigs/default.mhskel.z");t.setBaseSkeleton(r),Qe("data/modifiers/modeling_modifiers.json.z",t),Qe("data/modifiers/measurement_modifiers.json.z",t);const h=si("data/modifiers/modeling_sliders.json.z");(function(){const t=y.getInstance();for(const e of t.findTargets("macrodetails"));})(),console.log("everything is loaded..."),Ue.register(Xi,je,ti),Ue.register(Ki,je,qi);const d=new xt(li);d.modified.add((()=>{a.mode=d.value}));const c=new je(ti,h),p=new l;p.add((t=>{a.updateRequired===ai.NONE&&(a.updateRequired=ai.POSE)}));const g=new qi(r.roots[0],p),f=new je(qi,g),b=new class{};n(s,{children:[n(te,Object.assign({model:d,style:{position:"absolute",left:0,width:"500px",top:0,bottom:0}},{children:[o(ee,Object.assign({label:"Morph",value:"MORPH"},{children:o(Le,{model:c,style:{width:"100%",height:"100%"}})})),o(ee,Object.assign({label:"Pose",value:"POSE"},{children:o(Le,{model:f,style:{width:"100%",height:"100%"}})}))]})),o("div",Object.assign({style:{position:"absolute",left:"500px",right:0,top:0,bottom:0,overflow:"hidden"}},{children:o("canvas",{set:i(b,"canvas"),style:{width:"100%",height:"100%"}})}))]}).appendTo(document.body),Fi(b.canvas,a)}()}catch(t){console.log(t),t instanceof Error?alert(`${t.name}: ${t.message}`):alert(t)}}return window.onload=()=>{Zi()},t.main=Zi,t}({});
//# sourceMappingURL=makehuman.js.map
