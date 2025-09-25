const bcrypt = require('bcryptjs');
const { generateToken } = require('../config/jwt');

class AuthService {
  static async hashPassword(password) {
    return await bcrypt.hash(password, 12);
  }

  static async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  static generateAuthToken(userId) {
    return generateToken(userId);
  }
}

module.exports = AuthService;
