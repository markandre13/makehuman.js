/*
 *  workflow - A collaborative real-time white- and kanban board
 *  Copyright (C) 2018-2021 Mark-André Hopf <mhopf@mark13.org>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

// set, get, has, clear, delete, entries, keys, values, forEach

/**
 * Ordered map with customer comparator
 */
export class OrderedMap<K, V> {
    private array: Array<{ k: K, v: V }>
    private order: (a: K, b: K) => boolean

    constructor(order: (a: K, b: K) => boolean) {
        this.array = new Array()
        this.order = order
    }

    get size() {
        return this.array.length
    }

    entries() {
        return this.array
    }

    set(k: K, v: V) {
        // TODO: what we actually want is an indexOf() which either produces the index
        // of the wanted element where the element needs to be after inserting
        const i = this.indexOf(k)
        if (i !== undefined) {
            this.array[i].v = v
            return
        }

        let firstIndex = 0,
            lastIndex = this.array.length,
            middleIndex = Math.floor((lastIndex + firstIndex) / 2)
        while (firstIndex < lastIndex) {
            if (this.order(k, this.array[middleIndex].k)) {
                lastIndex = middleIndex - 1
            } else {
                if (this.order(this.array[middleIndex].k, k)) {
                    firstIndex = middleIndex + 1
                } else {
                    return
                }
            }
            middleIndex = Math.floor((lastIndex + firstIndex) / 2)
        }

        if (middleIndex >= this.array.length) {
            this.array.push({ k, v })
        } else {
            if (middleIndex < 0) {
                this.array.splice(0, 0, { k, v })
            } else {
                if (this.order(k, this.array[middleIndex].k)) {
                    this.array.splice(middleIndex, 0, { k, v })
                } else {
                    this.array.splice(middleIndex + 1, 0, { k, v })
                }
            }
        }
    }

    has(k: K): boolean {
        return this.indexOf(k) !== undefined
    }

    get(k: K): V | undefined {
        const index = this.indexOf(k)
        if (index === undefined) {
            return undefined
        }
        return this.array[index].v
    }

    private indexOf(k: K): number | undefined {
        let firstIndex = 0, lastIndex = this.array.length

        while (firstIndex < lastIndex) {
            const middleIndex = Math.floor((lastIndex + firstIndex) / 2)
            // console.log(`[${firstIndex} ... ${middleIndex} ... ${lastIndex}[`)
            if (this.order(k, this.array[middleIndex].k)) {
                // console.log("K < M")
                lastIndex = middleIndex - 1
            } else {
                // console.log("K >= M")
                if (!this.order(this.array[middleIndex].k, k)) {
                    // console.log("K <= M")
                    return middleIndex
                }
                // console.log("K <= M")
                firstIndex = middleIndex + 1
            }
        }
        // console.log(`[${firstIndex} ... ... ${lastIndex}[`)
        if (firstIndex >= this.array.length ||
            this.order(k, this.array[firstIndex].k) ||
            this.order(this.array[firstIndex].k, k)) {
            return undefined
        }
        return firstIndex
    }

    get length() {
        return this.array.length
    }

    empty() {
        return this.array.length === 0
    }

    clear() {
        return this.array.length = 0
    }
}
