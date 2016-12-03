class Sector {
    constructor({
        dimensions,
        coordinates,
        childrenSize,
        entityLimit,
        parent
    }) {
        this.dimensions = dimensions;
        this.coordinates = Object.assign({}, coordinates);
        this.entityLimit = entityLimit;
        this.entities = [];
        this.parent = parent;
        this.childrenSize = childrenSize;
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
        this.children = this.children || {count: 0};
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
            var dimensionCoordinate = coordinateDimension / this.childrenSize ^ 0;
            coordinates[dimension] = dimensionCoordinate;
            targetSectorKey += dimensionCoordinate;
        }
        var child = this.children[targetSectorKey];
        if (!child) {
            child = this.children[targetSectorKey] = new Sector({
                parent: this,
                coordinates: coordinates,
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
