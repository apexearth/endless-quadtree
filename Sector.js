class Sector {
    constructor({
        dimensions,
        coordinates,
        size,
        childrenSize,
        entityLimit,
        parent
    }) {
        this.dimensions = dimensions;
        this.coordinates = Object.assign({}, coordinates);
        this.dimensions.forEach(dimension => {
            this[`min${dimension}`] = this.coordinates[dimension];
            this[`max${dimension}`] = this.coordinates[dimension] + size;
        })
        this.entityLimit = entityLimit;
        this.entities = [];
        this.parent = parent;
        this.size = size || Infinity;
        this.childrenSize = childrenSize || size / 2;
        this.children = null;
    }

    get count() {
        return this.entities.length;
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
        if (this.entities.length >= this.entityLimit && (this.children || this.getCountAtCoordinate(entity) < this.entityLimit)) {
            if (!this.children && this.entities.length >= this.entityLimit) {
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
        this.getChildSector(entity).add(entity);
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
                entityLimit: this.entityLimit
            });
        }
        return child;
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

    get(minCoordinate, maxCoordinate) {
        var childEntities = [];
        var canTakeAll = true;
        var dimension = null;
        if (!this.children) {
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
            var childrenToDiveInto = [];
            for (var key in this.children) {
                var child = this.children[key];
                var valid = true;
                for (dimension of this.dimensions) {
                    if (child[`min${dimension}`] > maxCoordinate[dimension] || child[`max${dimension}`] < minCoordinate[dimension]) {
                        valid = false;
                        break;
                    }
                }
                if (valid) {
                    childrenToDiveInto.push(child);
                }
            }
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
}

module.exports = Sector;

function addToArray(source, target) {
    for (var i = 0; i < source.length; i++) {
        target.push(source[i]);
    }
}
