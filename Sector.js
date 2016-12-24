class Sector {
    constructor({
        dimensions,
        coordinates,
        size,
        childrenSize,
        entityCoordKey,
        entityLimit,
        parent
    }) {
        this.dimensions = dimensions;
        if (coordinates) {
            this.coordinates = Object.assign({}, coordinates);
            this.dimensions.forEach(dimension => {
                this[`min${dimension}`] = this.coordinates[dimension];
                this[`max${dimension}`] = this.coordinates[dimension] + size;
            })
        }
        this.entityLimit = entityLimit;
        this.entities = [];
        this.parent = parent;
        this.size = size || Infinity;
        this.childrenSize = childrenSize || (this.size === Infinity ? 200 : size / 2);
        this.entityCoordKey = entityCoordKey || undefined;
        this.children = null;
        this.validate();
    }

    get isRoot() {
        return this.size === Infinity;
    }

    get count() {
        return this.entities.length;
    }

    validate() {
        if (isNaN(this.size)) throw new Error('size ' + size + ' should be a number');
        if (isNaN(this.childrenSize)) throw new Error('childrenSize ' + childrenSize + ' should be a number');
        this.dimensions.forEach(dimension => {
            if (!this.isRoot && isNaN(this.coordinates[dimension])) throw new Error('coordinates[' + dimension + '] + ' + coordinates[dimension] + ' should be a number');
        })
    }

    update() {
        if (this.entities.length > this.entityLimit) {
            for (var key in this.children) {
                if (key === 'count') continue;
                var child = this.children[key];
                child.update();
            }
        } else {
            // TODO: Ensure entities still belong here.
        }
    }

    add(entity) {
        if (this.entities.indexOf(entity) >= 0) return entity;
        if (this.entities.length > this.entityLimit && (this.children || this.size === Infinity || this.getCountAtCoordinate(this.getEntityCoordinate(entity)) <= this.entityLimit)) {
            if (!this.children && this.entities.length > this.entityLimit) {
                for (var i in this.entities) {
                    this.addToChildren(this.entities[i]);
                }
                this.addToChildren(entity);
            } else {
                this.addToChildren(entity);
            }
        }
        if (!this.children) {
            entity.sector = this;
        }
        this.entities.push(entity);
        return entity;
    }

    addToChildren(entity) {
        this.children = this.children || {};
        this.getChildSector(this.getEntityCoordinate(entity)).add(entity);
    }

    remove(entity) {
        if (entity.sector) {
            let current = entity.sector;
            entity.sector = null;
            while (current) {
                var index = current.entities.indexOf(entity);
                if (index >= 0) {
                    current.entities.splice(index, 1);
                }
                if (current.entities.length === current.entityLimit) {
                    // Get rid of child sectors, move entity sectors to current first.
                    for (let i = 0; i < current.entities.length; i++) {
                        current.entities[i].sector = current;
                    }
                    current.children = null;
                }
                current = current.parent;
            }
        }
    }

    getChildSector(coordinate) {
        var coordinates = {};
        var targetSectorKey = '';
        for (var i in this.dimensions) {
            var dimension = this.dimensions[i];
            if (targetSectorKey) targetSectorKey += ',';
            var coordinateDimension = coordinate[dimension];
            if (typeof coordinateDimension !== 'number' || isNaN(coordinateDimension)) {
                throw new Error('Invalid coordinate received');
            }
            var dimensionCoordinate = (coordinateDimension / this.childrenSize ^ 0) * this.childrenSize;
            coordinates[dimension] = dimensionCoordinate;
            targetSectorKey += dimensionCoordinate;
        }
        var child = this.children[targetSectorKey];
        if (!child) {
            child = this.children[targetSectorKey] = new Sector({
                parent: this,
                coordinates: coordinates,
                dimensions: this.dimensions,
                size: this.childrenSize,
                entityLimit: this.entityLimit,
                entityCoordKey: this.entityCoordKey,
            });
        }
        return child;
    }

    getEntityCoordinate(entity) {
        if (this.entityCoordKey !== undefined) {
            return entity[this.entityCoordKey];
        } else {
            return entity;
        }
    }

    getCountAtCoordinate(coordinate) {
        var compare = (entity) => {
            for (var i in this.dimensions) {
                var dimension = this.dimensions[i];
                if (entity[dimension] !== coordinate[dimension]) {
                    return false;
                }
            }
            return true;
        };

        var count = 0;
        for (var e in this.entities) {
            var entity = this.entities[e];
            if (compare(entity)) {
                count++;
            }
        }
        return count;
    }

    /**
     * Get entities within coordinates.
     * @param minCoordinate
     * @param maxCoordinate
     * @param alwaysTakeAll Always take all entities from sectors within the coordinates.
     * @returns {Array}
     */
    get(minCoordinate, maxCoordinate, alwaysTakeAll) {
        var childEntities = [];
        var canTakeAll = true;
        var dimension = null;
        if (!this.children || alwaysTakeAll) {
            canTakeAll = true;
        } else {
            for (dimension of this.dimensions) {
                if (this[`min${dimension}`] > minCoordinate[dimension] || this[`max${dimension}`] < maxCoordinate[dimension]) {
                    canTakeAll = false;
                    break;
                }
            }
        }
        if (canTakeAll) {
            addToArray(this.entities, childEntities);
        } else {
            var childrenToDiveInto = this.getSectors(minCoordinate, maxCoordinate);
            childrenToDiveInto.forEach(child => addToArray(child.get(minCoordinate, maxCoordinate), childEntities));
            // TODO ME!
        }
        childEntities = childEntities.filter(entity => {
            for (var i = 0; i < this.dimensions.length; i++) {
                var dimension = this.dimensions[i];
                if (entity[dimension] < minCoordinate[dimension]) return false;
                if (entity[dimension] > maxCoordinate[dimension]) return false;
            }
            return true;
        })
        return childEntities;
    }

    getWithinDistance(coordinate, distance) {
        return this.get(
            {
                x: coordinate.x - distance,
                y: coordinate.y - distance
            },
            {
                x: coordinate.x + distance,
                y: coordinate.y + distance
            },
            true
        ).filter(object=> {
            var total = 0
            var objectCoordinate = this.getEntityCoordinate(object)
            for (let dimension of this.dimensions) {
                total += Math.pow(Math.abs(objectCoordinate[dimension] - coordinate[dimension]), 2)
            }
            return Math.sqrt(total) <= distance;
        });
    }

    coordinatesOverlap(minCoordinate, maxCoordinate) {
        for (let dimension of this.dimensions) {
            if (this[`min${dimension}`] > maxCoordinate[dimension] || this[`max${dimension}`] < minCoordinate[dimension]) {
                return false;
            }
        }
        return true;
    }

    getSectors(minCoordinate, maxCoordinate) {
        let sectors = [];
        if (this.children) {
            for (let key in this.children) {
                var child = this.children[key];
                if (child.coordinatesOverlap(minCoordinate, maxCoordinate)) {
                    sectors = sectors.concat(child.getSectors(minCoordinate, maxCoordinate));
                }
            }
        } else {
            sectors.push(this);
        }
        return sectors;
    }

    getSectorsOutside(minCoordinate, maxCoordinate) {
        let sectors = [];
        if (this.children) {
            for (let key in this.children) {
                var child = this.children[key];
                sectors = sectors.concat(child.getSectorsOutside(minCoordinate, maxCoordinate));
            }
        } else {
            if (!this.coordinatesOverlap(minCoordinate, maxCoordinate)) {
                sectors.push(this);
            }
        }
        return sectors;
    }
}

module.exports = Sector;

function addToArray(source, target) {
    for (var i = 0; i < source.length; i++) {
        target.push(source[i]);
    }
}
