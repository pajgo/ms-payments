const { ActionTransport } = require('@microfleet/core');
const Errors = require('common-errors');

// helpers
const { SALES_DATA_PREFIX } = require('../../constants.js');
const key = require('../../redisKey.js');
const { remapState } = require('../../utils/transactions.js');
const { deserialize } = require('../../utils/redis.js');

function saleGet({ params: opts }) {
  const { redis } = this;
  const { owner, id } = opts;
  const saleKey = key(SALES_DATA_PREFIX, id);

  return redis
    .hgetall(saleKey)
    .then((data) => {
      if (!data) {
        throw new Errors.HttpStatusError(404, `payment id ${id} missing`);
      }

      const output = deserialize(data);
      if (owner && owner !== output.owner) {
        throw new Errors.HttpStatusError(403, `no access to payment ${id}`);
      }

      return {
        ...output.sale,
        owner: output.owner,
        create_time: output.create_time,
        update_time: output.update_time,
        state: remapState(output.sale.state),
      };
    });
}

saleGet.transports = [ActionTransport.amqp];

module.exports = saleGet;
