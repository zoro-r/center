import { Context } from 'koa';

import { success, fail } from '@/utils/tool';
import { 
  login, 
  getUserById, 
  verifyToken, 
  getUserMenus, 
  getUserList,
  createUser,
  updateUser,
  deleteUser,
  batchDeleteUsers,
  checkLoginNameExists,
  checkEmailExists,
  checkPhoneExists,
  hashPassword,
  updateUserRoles
} from '@/service/user';

// 用户登录
export async function userLogin(ctx: Context) {
  try {
    const { loginName, password, platformId } = ctx.request.body as any;
    
    if (!loginName || !password || !platformId) {
      ctx.body = fail('登录名、密码和平台ID不能为空');
      return;
    }

    const result = await login(loginName, password, platformId);
    
    ctx.body = success(result, '登录成功');
  } catch (err: any) {
    ctx.body = fail(err.message);
  }
}

// 获取用户信息
export async function getUserInfo(ctx: Context) {
  try {
    const token = ctx.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      ctx.status = 401;
      ctx.body = fail('未提供认证令牌');
      return;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      ctx.status = 401;
      ctx.body = fail('无效的认证令牌');
      return;
    }

    const user = await getUserById(decoded.uuid, decoded.platformId);
    if (!user) {
      ctx.status = 401;
      ctx.body = fail('用户不存在');
      return;
    }

    // 获取用户菜单
    const menus = await getUserMenus(decoded.uuid, decoded.platformId);
    
    ctx.body = success({
      ...user,
      menus
    });
  } catch (err: any) {
    ctx.status = 500;
    ctx.body = fail(err.message);
  }
}

// 获取用户列表
export async function getUserListAPI(ctx: Context) {
  try {
    const { 
      page = 1, 
      pageSize = 10, 
      name, 
      loginName, 
      status, 
      platformId = 'default' 
    } = ctx.request.query as any;

    const result = await getUserList({
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      name,
      loginName,
      status,
      platformId
    });

    ctx.body = success(result);
  } catch (err: any) {
    ctx.body = fail(err.message);
  }
}

// 创建用户
export async function createUserAPI(ctx: Context) {
  try {
    const userData = ctx.request.body as any;
    const { loginName, email, phone, password, platformId = 'default' } = userData;

    // 验证必填字段
    if (!loginName || !email || !password) {
      ctx.body = fail('登录名、邮箱和密码不能为空');
      return;
    }

    // 检查登录名是否已存在
    const loginNameExists = await checkLoginNameExists(loginName, undefined, platformId);
    if (loginNameExists) {
      ctx.body = fail('登录名已存在');
      return;
    }

    // 检查邮箱是否已存在
    const emailExists = await checkEmailExists(email, undefined, platformId);
    if (emailExists) {
      ctx.body = fail('邮箱已存在');
      return;
    }

    // 检查手机号是否已存在
    if (phone) {
      const phoneExists = await checkPhoneExists(phone, undefined, platformId);
      if (phoneExists) {
        ctx.body = fail('手机号已存在');
        return;
      }
    }

    // 密码加密
    const hashedPassword = hashPassword(password);

    const user = await createUser({
      ...userData,
      password: hashedPassword,
      platformId
    });

    ctx.body = success(user, '用户创建成功');
  } catch (err: any) {
    ctx.body = fail(err.message);
  }
}

// 更新用户
export async function updateUserAPI(ctx: Context) {
  try {
    const { uuid } = ctx.params;
    const userData = ctx.request.body as any;
    const { loginName, email, phone, password, platformId = 'default' } = userData;

    // 检查登录名是否已存在（排除当前用户）
    if (loginName) {
      const loginNameExists = await checkLoginNameExists(loginName, uuid, platformId);
      if (loginNameExists) {
        ctx.body = fail('登录名已存在');
        return;
      }
    }

    // 检查邮箱是否已存在（排除当前用户）
    if (email) {
      const emailExists = await checkEmailExists(email, uuid, platformId);
      if (emailExists) {
        ctx.body = fail('邮箱已存在');
        return;
      }
    }

    // 检查手机号是否已存在（排除当前用户）
    if (phone) {
      const phoneExists = await checkPhoneExists(phone, uuid, platformId);
      if (phoneExists) {
        ctx.body = fail('手机号已存在');
        return;
      }
    }

    // 如果有新密码，需要加密
    if (password) {
      userData.password = hashPassword(password);
    }

    const user = await updateUser(uuid, userData, platformId);
    
    if (!user) {
      ctx.body = fail('用户不存在');
      return;
    }

    ctx.body = success(user, '用户更新成功');
  } catch (err: any) {
    ctx.body = fail(err.message);
  }
}

// 删除用户
export async function deleteUserAPI(ctx: Context) {
  try {
    const { uuid } = ctx.params;
    const { platformId = 'default' } = ctx.request.query as any;

    const user = await deleteUser(uuid, platformId);
    
    if (!user) {
      ctx.body = fail('用户不存在');
      return;
    }

    ctx.body = success(null, '用户删除成功');
  } catch (err: any) {
    ctx.body = fail(err.message);
  }
}

// 批量删除用户
export async function batchDeleteUsersAPI(ctx: Context) {
  try {
    const { uuids } = ctx.request.body as any;
    const { platformId = 'default' } = ctx.request.query as any;

    if (!uuids || !Array.isArray(uuids) || uuids.length === 0) {
      ctx.body = fail('请提供要删除的用户ID列表');
      return;
    }

    await batchDeleteUsers(uuids, platformId);
    
    ctx.body = success(null, '用户批量删除成功');
  } catch (err: any) {
    ctx.body = fail(err.message);
  }
}

// 更新用户角色
export async function updateUserRolesAPI(ctx: Context) {
  try {
    const { uuid } = ctx.params;
    const { roleIds } = ctx.request.body as any;
    const { platformId = 'default' } = ctx.request.query as any;

    if (!Array.isArray(roleIds)) {
      ctx.body = fail('角色ID列表格式错误');
      return;
    }

    const user = await updateUserRoles(uuid, roleIds, platformId);
    
    if (!user) {
      ctx.body = fail('用户不存在');
      return;
    }

    ctx.body = success(user, '用户角色更新成功');
  } catch (err: any) {
    ctx.body = fail(err.message);
  }
}
