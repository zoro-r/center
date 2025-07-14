import Router from '@koa/router';
import { 
  userLogin, 
  getUserInfo, 
  getUserListAPI, 
  createUserAPI, 
  updateUserAPI, 
  deleteUserAPI, 
  batchDeleteUsersAPI,
  updateUserRolesAPI
} from '@/controller/user';

export default function userRouter(router: Router) {
  // 用户登录
  router.post('/api/user/login', userLogin);
  
  // 获取用户信息
  router.get('/api/user/info', getUserInfo);
  
  // 用户管理接口
  router.get('/api/users', getUserListAPI);
  router.post('/api/users', createUserAPI);
  router.put('/api/users/:uuid', updateUserAPI);
  router.delete('/api/users/:uuid', deleteUserAPI);
  router.post('/api/users/batch-delete', batchDeleteUsersAPI);
  
  // 用户角色管理接口
  router.put('/api/users/:uuid/roles', updateUserRolesAPI);
}
