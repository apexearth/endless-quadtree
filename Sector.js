class Sector {
    constructor({
        dimensions,
        childrenSize,
        entityLimit
    }) {
        this.dimensions = dimensions;
        for (var i in dimensions) {
            var dimension = dimensions[i];
            this[dimension + 'Min'] = null;
            this[dimension + 'Max'] = null;
        }
        this.entityLimit = entityLimit;
        this.entities = [];
        this.childrenSize = childrenSize;
        this.children = null;
    }

    get count() {
        return this.entities.length;
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
        this.entities.push(entity);
        return entity;
    }

    addToChildren(entity) {
        this.children = this.children || {count: 0};
        this.getChildSector(entity).add(entity);
    }

    getChildSector(coordinate) {
        var targetSectorKey = '';
        for (var i in this.dimensions) {
            var dimension = this.dimensions[i];
            if (targetSectorKey) targetSectorKey += ',';
            var coordinateDimension = coordinate[dimension];
            if (typeof coordinateDimension !== 'number' || isNaN(coordinateDimension)) {
                throw new Error('Invalid coordinate received');
            }
            targetSectorKey += coordinateDimension / this.childrenSize ^ 0;
        }
        var child = this.children[targetSectorKey];
        if (!child) {
            child = this.children[targetSectorKey] = new Sector({
                dimensions: this.dimensions,
                childrenSize: this.childrenSize / 2,
                entityLimit: this.entityLimit
            });
            this.children.count++;
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
}

module.exports = Sector;
