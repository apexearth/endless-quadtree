var expect = require('chai').expect;
var Sector = require('./Sector');

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
        expect(sector.childrenSize).to.equal(100);
        expect(sector.dimensions).to.deep.equal([
            'x', 'y'
        ])
    });
    it('.add()', function () {
        var entity = {x: 0, y: 0};
        var addedEntity = sector.add(entity);
        expect(sector.children).to.equal(null);
        expect(sector.count).to.equal(1);
        expect(sector.entities.indexOf(entity) >= 0).to.equal(true);
        expect(entity).to.equal(addedEntity);

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
        expect(sector.children['1,1'].entities.length).to.equal(1);

        sector.add({x: -1000, y: -1000});
        expect(sector.entities.length).to.equal(8);
        expect(sector.children['0,0'].entities.length).to.equal(6);
        expect(sector.children['1,1'].entities.length).to.equal(1);
        expect(sector.children['-10,-10'].entities.length).to.equal(1);
    });
    it('.addToChildren()', function () {
        sector.addToChildren({x: 0, y: 0});
        expect(sector.children.count).to.be.equal(1);
        expect(sector.count).to.equal(0)
    });
    it('bench .add()', function () {
        this.timeout(100000);
        for (var k = 0; k < 100; k++) {
            var start = Date.now();
            for (var i = 0; i < 1000; i++) {
                sector.add({x: Math.random() * 1000, y: Math.random() * 1000});
            }
            var finish = Date.now();
            console.log(sector.count + ', ' + ((finish - start) / 1000));
        }
    });
});