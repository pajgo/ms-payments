/* global TEST_CONFIG */
const assert = require('assert');
const Promise = require('bluebird');

function debug(result) {
  if (result.isRejected()) {
    const err = result.reason();
    console.log(require('util').inspect(err, { depth: 5 }) + '\n');
    console.log(err && err.stack || err);
    console.log(err && err.response || '');
  }
}

describe('Plans suite', function PlansSuite() {
  const Payments = require('../../src');

  // mock paypal requests
  // require('../mocks/paypal');
  const { billingPlanBase } = require('../data/paypal');

  this.timeout(20000);

  describe('unit tests', function UnitSuite() {
    const createPlanHeaders = { routingKey: 'payments.plan.create' };
    const deletePlanHeaders = { routingKey: 'payments.plan.delete' };
    const listPlanHeaders = { routingKey: 'payments.plan.list' };
    const updatePlanHeaders = { routingKey: 'payments.plan.update' };
    const statePlanHeaders = { routingKey: 'payments.plan.state' };

    let payments;
    let billingPlan;

    before(function startService() {
      payments = new Payments(TEST_CONFIG);
      return payments.connect()
        .then(function stub() {
          payments._amqp = {
            publishAndWait: () => {
              return Promise.resolve(true);
            },
          };
        });
    });

    it('Should fail to create on invalid plan schema', () => {
      const data = {
        something: 'useless',
      };

      return payments.router(data, createPlanHeaders)
        .reflect()
        .then((result) => {
          assert(result.isRejected());
          assert.equal(result.reason().name, 'ValidationError');
        });
    });

    it('Should create a plan', () => {
      return payments.router(billingPlanBase, createPlanHeaders)
        .reflect()
        .then((result) => {
          debug(result);
          assert(result.isFulfilled());

          billingPlan = result.value();

          assert(billingPlan.id);
          assert.equal(billingPlan.state, 'CREATED');
        });
    });

    it('Should fail to activate on an unknown plan id', () => {
      return payments.router({ id: 'random', state: 'active' }, statePlanHeaders)
        .reflect()
        .then((result) => {
          assert(result.isRejected());
          assert.equal(result.reason().httpStatusCode, 400);
        });
    });

    it('Should fail to activate on an invalid state', () => {
      return payments.router({ id: 'random', state: 'invalid' }, statePlanHeaders)
        .reflect()
        .then((result) => {
          assert(result.isRejected());
          assert.equal(result.reason().name, 'ValidationError');
        });
    });

    it('Should activate the plan', () => {
      return payments.router({ id: billingPlan.id, state: 'active' }, statePlanHeaders)
        .reflect()
        .then((result) => {
          debug(result);
          assert(result.isFulfilled());
        });
    });

    it('Should fail to update on an unknown plan id', () => {
      return payments.router({ id: 'random', plan: { name: 'Updated name' } }, updatePlanHeaders)
        .reflect()
        .then((result) => {
          assert(result.isRejected());
          assert.equal(result.reason().httpStatusCode, 400);
        });
    });

    it('Should fail to update on invalid plan schema', () => {
      return payments.router({ id: billingPlan.id, plan: { invalid: true } }, updatePlanHeaders)
        .reflect()
        .then((result) => {
          assert(result.isRejected());
          assert.equal(result.reason().name, 'ValidationError');
        });
    });

    /* it('Should update plan info', () => {
     const updateData = {
     id: billingPlan.id,
     plan: {
     name: 'Updated name',
     },
     };

     return payments.router(updateData, updatePlanHeaders)
     .reflect()
     .then((result) => {
     debug(result);
     expect(result.isFulfilled()).to.be.eq(true);
     });
     }); */

    it('Should fail to list on invalid query schema', () => {
      return payments.router({ status: 'invalid' }, listPlanHeaders)
        .reflect()
        .then((result) => {
          assert(result.isRejected());
          assert.equal(result.reason().name, 'ValidationError');
        });
    });

    it('Should list all plans', () => {
      return payments.router({}, listPlanHeaders)
        .reflect()
        .then(result => {
          return result.isFulfilled() ? result.value() : Promise.reject(result.reason());
        });
    });

    it('Should fail to delete on an unknown plan id', () => {
      return payments.router('random', deletePlanHeaders)
        .reflect()
        .then((result) => {
          assert(result.isRejected());
        });
    });

    it('Should delete plan', () => {
      return payments.router(billingPlan.id, deletePlanHeaders)
        .reflect()
        .then((result) => {
          debug(result);
          assert(result.isFulfilled());
        });
    });
  });
});