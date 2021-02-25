module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1340),
  admin: {
    auth: {
      secret: env('ADMIN_JWT_SECRET', 'd471b8bad5e6ea3901661a0fae4cbb61'),
    },
  },
});
