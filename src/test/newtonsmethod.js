'use strict'
const expect = require('chai').expect
const minimize = require('../lib/newtonsmethod').minimize
describe('newtonsmethod', () => {
    describe('.minimize', () => {
        describe('(x-10)^2', () => {
            it('is close to 10', () => {
                const result = minimize((x)=>Math.pow((x-10),2), 0)
                expect(result).to.be.at.least(9.9)
                expect(result).to.be.at.most(10.1)
            })
        })
    })
})
