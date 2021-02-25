module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1341),
  admin: {
    auth: {
      secret: env('ADMIN_JWT_SECRET', '887260f67358141634e2de07619005d1'),
    },
  },
});
