import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Key, Eye, EyeOff } from 'lucide-react';

function Login({ onLogin }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isFirstTime, setIsFirstTime] = useState(!localStorage.getItem('app_password'));
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const handleSetPassword = (e) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('密码至少需要6位！');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致！');
      return;
    }
    
    localStorage.setItem('app_password', password);
    onLogin();
    navigate('/');
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const savedPassword = localStorage.getItem('app_password');
    if (password === savedPassword) {
      onLogin();
      navigate('/');
    } else {
      setError('密码错误！');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">酒店会议记录助手</h1>
          <p className="text-gray-600">智能会议管理，效率翻倍</p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="flex items-center justify-center mb-6">
            <Key className="w-6 h-6 text-primary mr-2" />
            <h2 className="text-xl font-semibold text-gray-800">
              {isFirstTime ? '设置访问密码' : '请输入密码'}
            </h2>
          </div>
          
          <form onSubmit={isFirstTime ? handleSetPassword : handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isFirstTime ? '设置密码' : '密码'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-blue-100 transition-all"
                  placeholder={isFirstTime ? '至少6位' : '请输入密码'}
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            {isFirstTime && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">确认密码</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-blue-100 transition-all"
                    placeholder="请再次输入密码"
                    autoComplete="off"
                  />
                </div>
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}
            
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
            >
              {isFirstTime ? '设置密码' : '登录'}
            </button>
          </form>
          
          {isFirstTime && (
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-sm text-blue-700">
                💡 第一次使用，需要设置访问密码，以后每次访问都需要输入这个密码
              </p>
            </div>
          )}
          
          {!isFirstTime && (
            <button
              onClick={() => {
                if (confirm('确定要重置密码吗？这将清除当前密码，需要重新设置！')) {
                  localStorage.removeItem('app_password');
                  setIsFirstTime(true);
                  setPassword('');
                  setConfirmPassword('');
                  setError('');
                }
              }}
              className="w-full mt-4 text-sm text-gray-500 hover:text-red-500"
            >
              忘记密码？重置密码
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
