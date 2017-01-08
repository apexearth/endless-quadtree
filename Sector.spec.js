const expect = require('chai').expect;
const Sector = require('./Sector');

describe('Sector', function () {
    let sector;
    beforeEach(() => {
        sector = new Sector({
            dimensions: ['x', 'y'],
            childrenSize: 100,
            entityLimit: 5
        });
    });
    it('new', function () {
        expect(sector.entityLimit).to.equal(5);
        expect(sector.size).to.equal(Infinity);
        expect(sector.childrenSize).to.equal(100);
        expect(sector.dimensions).to.deep.equal([
            'x', 'y'
        ])
        expect(sector['minx']).to.be.NaN;
        expect(sector['maxx']).to.be.NaN;

        sector = new Sector({
            dimensions: ['x', 'y'],
            size: 100,
            coordinates: {x: 100, y: 100},
            entityLimit: 5
        });
        expect(sector.size).to.equal(100);
        expect(sector.childrenSize).to.equal(50);
        expect(sector['minx']).to.equal(100);
        expect(sector['maxx']).to.equal(200);
    });
    it('.add()', function () {
        let entity = {x: 0, y: 0};
        let addedEntity = sector.add(entity);
        expect(sector.children).to.equal(null);
        expect(sector.count).to.equal(1);
        expect(sector.entities.indexOf(entity) >= 0).to.equal(true);
        expect(entity).to.equal(addedEntity);
        expect(entity.sector).to.not.equal(null);

        addedEntity = sector.add(entity);
        expect(sector.children).to.equal(null);
        expect(sector.count).to.equal(1);
        expect(sector.entities.indexOf(entity) >= 0).to.equal(true);
        expect(entity).to.equal(addedEntity);

        sector.add({x: 0, y: 0});
        sector.add({x: 0, y: 0});
        sector.add({x: 0, y: 0});
        sector.add({x: 0, y: 0});
        expect(sector.children).to.equal(null);
        expect(sector.count).to.equal(5);
        sector.add({x: 0, y: 0});
        expect(sector.children).to.equal(null);
        expect(sector.count).to.equal(6);

        sector.add({x: 100, y: 100});
        expect(sector.count).to.equal(7);
        expect(sector.children['0,0'].entities.length).to.equal(6);
        expect(sector.children['100,100'].entities.length).to.equal(1);

        sector.add({x: -1000, y: -1000});
        expect(sector.entities.length).to.equal(8);
        expect(sector.children['0,0'].entities.length).to.equal(6);
        expect(sector.children['100,100'].entities.length).to.equal(1);
        expect(sector.children['-1000,-1000'].entities.length).to.equal(1);
    });
    it('.addToChildren()', function () {
        sector.addToChildren({x: 0, y: 0});
        expect(sector.count).to.equal(0)
    });
    it('bench .add()', function () {
        this.timeout(100000);
        for (let k = 0; k < 10; k++) {
            let start = Date.now();
            for (let i = 0; i < 2000; i++) {
                sector.add({x: Math.random() * 1000, y: Math.random() * 1000});
            }
            let finish = Date.now();
            console.log(sector.count + ', ' + ((finish - start) / 1000));
        }
    });
    it('.remove()', function () {
        let entities = [];
        for (let i = 0; i < 100; i++) {
            entities.push(sector.add({x: Math.random() * 100, y: Math.random() * 100}));
        }
        expect(sector.children).to.not.equal(null);
        expect(sector.entities.length).to.equal(100);
        for (let i = 0; i < 100; i++) {
            sector.remove(entities[i]);
            expect(sector.entities.length).to.equal(99 - i);
            expect(entities[i].sector).to.equal(null);
        }
        expect(sector.children).to.equal(null);
        expect(sector.entities.length).to.equal(0);

        sector.entityLimit = 1;
        sector.childrenSize = 10;
        let coords = [
            sector.add({x: 0, y: 0}),
            sector.add({x: 0, y: 0}),
            sector.add({x: 10, y: 0}),
            sector.add({x: 12, y: 0}),
            sector.add({x: 20, y: 0}),
            sector.add({x: 22, y: 0}),
            sector.add({x: 30, y: 0}),
            sector.add({x: 32, y: 0}),
            sector.add({x: 40, y: 0}),
            sector.add({x: 42, y: 0})
        ]
        expect(Object.keys(sector.children).length).to.equal(5);
        sector.remove(coords.pop())
        sector.remove(coords.pop())
        expect(Object.keys(sector.children).length).to.equal(4);
        sector.remove(coords.pop())
        sector.remove(coords.pop())
        expect(Object.keys(sector.children).length).to.equal(3);
        sector.remove(coords.pop())
        sector.remove(coords.pop())
        expect(Object.keys(sector.children).length).to.equal(2);
        sector.remove(coords.pop())
        sector.remove(coords.pop())
        expect(Object.keys(sector.children).length).to.equal(1);
        sector.remove(coords.pop())
        sector.remove(coords.pop())
        expect(sector.children).to.equal(null);

    });
    it('bench .remove()', function () {
        this.timeout(100000);
        let entities = [];
        for (let i = 0; i < 20000; i++) {
            entities.push(sector.add({x: Math.random() * 1000, y: Math.random() * 1000}));
        }
        var start = Date.now();
        for (let i = 1; i <= 20000; i++) {
            sector.remove(entities[i - 1]);
            if (i % 5000 === 0) {
                console.log(sector.count + ', ' + ((Date.now() - start) / 1000));
                start = Date.now();
            }
        }
    });
    it('.get()', function () {
        let putEntities = [
            sector.add({x: 0, y: 0}),
            sector.add({x: -200, y: -200}),
            sector.add({x: 200, y: 200})
        ];
        sector.add({x: 3000, y: 0});
        let getEntities = sector.get({x: -200, y: -200}, {x: 200, y: 200});
        getEntities.forEach(entity => expect(putEntities.indexOf(entity)).to.be.gte(0))

        for (let i = 0; i < 100; i++) {
            sector.add({x: Math.random() * 400 - 200, y: Math.random() * 400 - 200})
            sector.add({x: Math.random() * 400 + 201, y: Math.random() * 400 - 200})
        }
        getEntities = sector.get({x: -200, y: -200}, {x: 200, y: 200});
        expect(getEntities.length).to.equal(103);
    })
    it('bench .get()', function () {
        this.timeout(20000);
        let putEntities = [
            sector.add({x: 0, y: 0}),
            sector.add({x: -200, y: -200}),
            sector.add({x: 200, y: 200})
        ];
        sector.add({x: 3000, y: 0});
        let getEntities = sector.get({x: -200, y: -200}, {x: 200, y: 200});
        getEntities.forEach(entity => expect(putEntities.indexOf(entity)).to.be.gte(0))

        let count = 3;
        let start;
        for (let k = 0; k < 5; k++) {

            for (let i = 0; i < 2000; i++) {
                count++;
                sector.add({x: Math.random() * 400 - 200, y: Math.random() * 400 - 200});
                sector.add({x: Math.random() * 400 + 201, y: Math.random() * 400 - 200});
            }
            start = Date.now();
            getEntities = sector.get({x: -200, y: -200}, {x: 200, y: 200});
            console.log(sector.count + ', ' + ((Date.now() - start) / 1000));
            expect(getEntities.length).to.equal(count);
        }
    });
    it('.getWithinDistance()', function () {
        for (let x = 0; x < 100; x += 5) {
            for (let y = 0; y < 100; y += 5) {
                sector.add({x, y})
            }
        }
        let entities = sector.getWithinDistance({x: 50, y: 50}, 10);
        expect(entities.length).to.equal(13);
    });
    it('.getWithinDistance() (using entityCoordKey)', function () {
        sector.entityCoordKey = 'position';
        for (let x = 0; x < 100; x += 5) {
            for (let y = 0; y < 100; y += 5) {
                sector.add({position: {x, y}})
            }
        }
        let entities = sector.getWithinDistance({x: 50, y: 50}, 10);
        expect(entities.length).to.equal(13);
    });
    it('.getSectors()', function () {
        for (let x = -100; x < 100; x += 5) {
            for (let y = -100; y < 100; y += 5) {
                sector.add({x, y})
            }
        }
        const sectors = sector.getSectors({x: -10, y: -10}, {x: 50, y: 50});
        expect(sectors.length).to.equal(52);
        for (let sector of sectors) {
            expect(sector.minx).to.be.lte(50)
            expect(sector.miny).to.be.lte(50)
        }
    });
    it('.getSectorsExcluding()', function () {
        for (let x = 0; x < 100; x += 5) {
            for (let y = 0; y < 100; y += 5) {
                sector.add({x, y})
            }
        }
        const sectors = sector.getSectorsOutside({x: 0, y: 0}, {x: 50, y: 50});
        expect(sectors.length).to.equal(71);
        for (let sector of sectors) {
            if (sector.maxy <= 50) {
                expect(sector.maxx).to.be.gt(50)
            }
            if (sector.maxx <= 50) {
                expect(sector.maxy).to.be.gt(50)
            }
        }
    });
    it('.getCountAtCoordinate()', function () {
        sector.add({x: 50, y: 50});
        sector.add({x: 50, y: 50});
        sector.add({x: 50, y: 50});
        sector.add({x: 50, y: 51});
        sector.add({x: 50, y: 50.0000000000001});
        expect(sector.getCountAtCoordinate({x: 50, y: 50})).to.equal(4)
    });
    it('.entityShouldRelocate()', function () {
        for (let x = 0; x < 100; x += 5) {
            for (let y = 0; y < 100; y += 5) {
                sector.add({x, y})
            }
        }
        let coord = {x: 50, y: 50};
        sector.add(coord);
        expect(coord.sector.entityShouldRelocate(coord)).to.equal(false);
        coord.x += 50;
        expect(coord.sector.entityShouldRelocate(coord)).to.equal(true);
    });
    it('.update()', function () {
        for (let x = 0; x < 100; x += 5) {
            for (let y = 0; y < 100; y += 5) {
                sector.add({x, y})
            }
        }
        let coord = {x: 50, y: 50};
        sector.add(coord);
        expect(coord.sector.entityShouldRelocate(coord)).to.equal(false);
        coord.x += 50;
        expect(coord.sector.entityShouldRelocate(coord)).to.equal(true);
        sector.update();
        expect(coord.sector.entityShouldRelocate(coord)).to.equal(false);
    });
});
