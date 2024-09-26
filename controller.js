import fs from 'fs';
import { STATUS, TOKEN_TYPE } from './constants.js';
import { signToken, verifyToken } from './utils/jwt.js';
import config from './config.js';

const getDatabase = () => {
  const rawDatabase = fs.readFileSync('./database.json');
  const database = JSON.parse(rawDatabase);
  return database;
};

const writeDatabase = data => {
  const databaseJSON = JSON.stringify(data);
  fs.writeFileSync('./database.json', databaseJSON);
};

export const loginController = async req => {
  const body = req.body;
  const { username, password } = body;
  const database = await getDatabase();
  const isAccountExist = database.users.some(user => user.username === username && user.password === password);

  if (!isAccountExist) {
    return {
      status: STATUS.UNAUTHORIZED,
      response: {
        message: 'Sai username hoặc password',
      },
    };
  }

  const accessToken$ = signToken(
    {
      username,
      tokenType: TOKEN_TYPE.accessToken,
    },
    config.jwt_expire_access_token
  );

  const refreshToken$ = signToken(
    {
      username,
      tokenType: TOKEN_TYPE.refreshToken,
    },
    config.jwt_expire_refresh_token
  );

  const [access_token, refresh_token] = await Promise.all([accessToken$, refreshToken$]);
  database.access_tokens.push({
    username,
    access_token,
  });
  database.refresh_tokens.push({
    username,
    refresh_token,
  });
  writeDatabase(database);
  return {
    status: STATUS.OK,
    response: {
      message: 'Đăng nhập thành công',
      data: {
        access_token,
        refresh_token,
      },
    },
  };
};

export const getProfileController = async req => {
  const access_token = req.headers.authorization?.replace('Bearer ', '');
  try {
    const decoded = await verifyToken(access_token);
    const { username } = decoded;
    const database = getDatabase();
    const account = database.users.find(user => user.username === username);
    const isAccessTokenExits = database.access_tokens.some(item => item.access_token === access_token);

    if (account && isAccessTokenExits) {
      delete account.password;
      return {
        status: STATUS.OK,
        response: {
          message: 'Lấy thông tin người dùng thành công',
          data: account,
        },
      };
    }

    return {
      status: STATUS.NOT_FOUND,
      response: { message: 'User không tồn tại' },
    };
  } catch (error) {
    return { ...error, response: error.error };
  }
};

export const refreshTokenController = async req => {
  const { refresh_token } = req.body;
  try {
    const decodedRefreshToken = await verifyToken(refresh_token, TOKEN_TYPE.refreshToken);
    const { username } = decodedRefreshToken;
    const database = getDatabase();
    const isAccountExist = database.users.some(user => user.username === username);
    const isRefreshTokenExist = database.refresh_tokens.some(refreshTokenObject => refreshTokenObject.token === refresh_token);

    if (isAccountExist && isRefreshTokenExist) {
      const access_token = await signToken(
        {
          username,
          tokenType: TOKEN_TYPE.accessToken,
        },
        config.jwt_expire_access_token
      );
      database.access_tokens.push({
        username,
        token: access_token,
      });
      writeDatabase(database);
      return {
        status: STATUS.OK,
        response: {
          message: 'Refresh Token thành công',
          data: { access_token },
        },
      };
    }
    return {
      status: STATUS.NOT_FOUND,
      response: { message: 'Refresh Token không tồn tại' },
    };
  } catch (error) {
    return { ...error, response: error.error };
  }
};

export const getProductsController = async (req) => {
  const access_token = req.headers.authorization?.replace('Bearer ', '')
  try {
    const decodedAccessToken = await verifyToken(access_token)
    const { username } = decodedAccessToken
    const database = getDatabase()
    const account = database.users.find((user) => user.username === username)
    const isAccessTokenExist = database.access_tokens.some(
      (accessTokenObject) => accessTokenObject.token === access_token
    )
    if (account && isAccessTokenExist) {
      return {
        status: STATUS.OK,
        response: {
          message: 'Lấy danh sách sản phẩm thành công',
          data: database.products
        }
      }
    }
    return {
      status: STATUS.NOT_FOUND,
      response: { message: 'Không tồn tại user' }
    }
  } catch (error) {
    return { ...error, response: error.error }
  }
}
