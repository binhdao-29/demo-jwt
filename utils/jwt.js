import jwt from 'jsonwebtoken';
import config from '../config.js';
import { STATUS, TOKEN_TYPE } from '../constants.js';

export const signToken = (payload, token_expire) => {
  return new Promise((resolve, reject) => {
    jwt.sign(payload, config.jwt_secret_key, { expiresIn: token_expire }, (error, token) => {
      if (error) return reject(error);
      resolve(token);
    });
  });
};

export const verifyToken = (token, tokeType = TOKEN_TYPE.accessToken) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, config.jwt_secret_key, (error, decoded) => {
      if (error) {
        const message = error.name === 'TokenExpiredError' ? 'Hết hạn token' : 'Sai token';
        const errorResponse = {
          status: STATUS.UNAUTHORIZED,
          error: {
            message,
            name: tokeType,
          },
        };
        reject(errorResponse);
      } else {
        resolve(decoded);
      }
    });
  });
};
