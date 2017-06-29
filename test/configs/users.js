const mixPlan = require('./mixPlan.js');

module.exports = {
  admins: [
    {
      username: 'test@test.ru',
      password: 'megalongsuperpasswordfortest',
      firstName: 'Unit',
      lastName: 'Test',
    },
  ],
  hooks: {
    'users:activate': mixPlan,
  },
  oauth: {
    providers: {
      facebook: {
        password: Array.from({ length: 64 }).join('_'),
      },
    },
  },
};
