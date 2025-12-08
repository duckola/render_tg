import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

interface LoginForm {
  schoolId: string;
  password: string;
  rememberMe?: boolean;
}

export const Login = () => {
  const navigate = useNavigate();
  const { login, isLoading, isAdmin, isStaff } = useAuthStore();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data.schoolId, data.password);
      if (data.rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      }
      toast.success('Login successful!');
      // Redirect admins to dashboard, staff to orders page, others to menu
      if (isAdmin()) {
        navigate('/admin/dashboard');
      } else if (isStaff()) {
        navigate('/admin/orders');
      } else {
        navigate('/menu');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message 
        || error.response?.data?.error 
        || error.message 
        || 'Login failed. Please check your credentials.';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="auth-background">
      <nav className="auth-navbar">
        <div className="navbar-brand">
          <span className="brand-white">TEKNO</span>
          <span className="brand-yellow">GRUB</span>
        </div>
        <div className="navbar-links">
          <Link to="/signup">Signup</Link>
          <Link to="/about">About Us</Link>
        </div>
      </nav>
      <img className="bg-logo" src="/citulogo.png" alt="CIT Logo" />

      <div className="login-grid">
        {/* Welcome Section */}
        <div className="welcome-section">
          <h1>Welcome back, teknoy!</h1>
          <p>Feeling hungry? Queue up your grub now!</p>
        </div>

        {/* Form Container */}
        <div className="form-container">
          <h2>Log in to your account!</h2>
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* ID Number Field */}
            <div className="input-group">
              <input
                {...register('schoolId', { required: 'ID Number is required' })}
                type="text"
                id="id_number"
                placeholder="ID Number"
              />
              {errors.schoolId && (
                <p className="mt-1 text-sm text-red-600" style={{ marginTop: '4px' }}>{errors.schoolId.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="input-group">
              <input
                {...register('password', { required: 'Password is required' })}
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="Password"
              />
              <button
                type="button"
                className="password-toggle-icon"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}
              >
                <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="form-options">
              <div className="remember-me">
                <input
                  {...register('rememberMe')}
                  type="checkbox"
                  id="remember"
                  name="remember"
                />
                <label htmlFor="remember">Remember me</label>
              </div>
              <Link to="/forgot-password" className="forgot-password">
                Forgot Password?
              </Link>
            </div>

            {/* Submit Button */}
            <button type="submit" className="login-btn" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          {/* Sign Up Link */}
          <p className="signup-link">
            Don't have an account? <Link to="/signup">Create one!</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
