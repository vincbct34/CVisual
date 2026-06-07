// JWT helpers read these at module load; provide deterministic test secrets.
process.env.JWT_SECRET ||= "test-jwt-secret";
process.env.JWT_REFRESH_SECRET ||= "test-jwt-refresh-secret";
