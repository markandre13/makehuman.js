const categoryData = {
    // category        values
    'gender':          ['male', 'female'],
    'age':             ['baby', 'child', 'young', 'old'],
    'race':            ['caucasian', 'asian', 'african'],
    'muscle':          ['maxmuscle', 'averagemuscle', 'minmuscle'],
    'weight':          ['minweight', 'averageweight', 'maxweight'],
    'height':          ['minheight', 'averageheight', 'maxheight'],
    'breastsize':      ['mincup', 'averagecup', 'maxcup'],
    'breastfirmness':  ['minfirmness', 'averagefirmness', 'maxfirmness'],
    'bodyproportions': ['uncommonproportions', 'regularproportions', 'idealproportions']
}
const validCategories = new Array<string>()
const valueToCategory = new Map<string, string>()

for(const category in categoryData) {
    if (!categoryData.hasOwnProperty(category))
        continue
    validCategories.push(category)
    // tslint:disable-next-line: forin
    for(const value of (categoryData as any)[category]) {
        valueToCategory.set(value, category)
    }
}

export class Component {
    path?: string
    parent?: Component

    // the target's file name is split into parts.
    // if the part belongs to a category, it is stored in ...
    data: Map<string, string|undefined> // Map<category, value>
    // ... otherwise it is stored in ...
    key: string[] // values (TargetsCrawler sorts the directory content so that the keys in here are sorted)

    constructor(parent?: Component) {
        this.parent = parent
        if (parent === undefined) {
            this.key = new Array<string>()
            this.data = new Map<string, string|undefined>()
        } else {
            this.key = parent.key.slice()
            this.data = new Map(parent.data)
        }
    }

    isRoot(): boolean {
        return this.parent === undefined
    }

    createChild(): Component {
        return new Component(this)
    }

    update(value: string) {
        const category = valueToCategory.get(value)
        if (category !== undefined) {
            this.setData(category, value)
        } else
        if (value !== 'target') {
            this.addKey(value)
        }
    }

    tuple(): string {
        let s = ''
        for(const key of this.key) {
            if (s.length !== 0)
                s += '-'
            s += key
        }
        return s
    }

    getVariables(): string[] {
        // return [value for key,value in list(self.data.items()) if value != None]
        const result = []
        for(const [key, value] of this.data.entries()) {
            if (value !== undefined)
                result.push(value)
        }
        return result
    }

    private addKey(key: string) {
        this.key.push(key)
    }

    private setData(category: string, value: string) {
        this.data = new Map(this.data)
        const orig = this.data.get(category)
        if (orig !== undefined) {
            if (orig !== value)
                throw Error(`Component category ${category} can not be set to ${value} as it is already been set to ${orig}`)
            return
        }
        this.data.set(category, value)
    }

    finish(pathname: string) {
        this.path = pathname
        for(const category of validCategories) {
            if (!this.data.has(category))
                this.data.set(category, undefined)
        }
    }
}
