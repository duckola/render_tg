import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

interface SignUpForm {
  firstName: string;
  lastName: string;
  schoolId: string;
  email: string;
  password: string;
}

export const SignUp = () => {
  const navigate = useNavigate();
  const { signup, isLoading } = useAuthStore();
  const { register, handleSubmit, formState: { errors } } = useForm<SignUpForm>();
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (data: SignUpForm) => {
    try {
      await signup({
        fullName: `${data.firstName} ${data.lastName}`,
        email: data.email,
        password: data.password,
        schoolId: data.schoolId,
      });
      toast.success('Account created successfully! Please log in.');
      navigate('/login');
    } catch (error: any) {
      console.error('Signup error:', error);
      const errorMessage = error.response?.data?.message 
        || error.response?.data?.error 
        || error.message 
        || 'Sign up failed. Please try again.';
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
          <Link to="/login">Log In</Link>
          <Link to="/about">About Us</Link>
        </div>
      </nav>
      <img className="bg-logo" src="/citulogo.png" alt="CIT Logo" />

      <div className="signup-grid">
        {/* Form Container */}
        <div className="signup-form-container">
          <h2>Sign up to TeknoGrub!</h2>
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* First Name and Last Name Row */}
            <div className="input-row">
              <div className="input-group">
                <input
                  {...register('firstName', { required: 'First name is required' })}
                  type="text"
                  id="first_name"
                  placeholder="First Name"
                />
                {errors.firstName && (
                  <p className="mt-1 text-xs text-red-600" style={{ marginTop: '4px' }}>{errors.firstName.message}</p>
                )}
              </div>
              <div className="input-group">
                <input
                  {...register('lastName', { required: 'Last name is required' })}
                  type="text"
                  id="last_name"
                  placeholder="Last Name"
                />
                {errors.lastName && (
                  <p className="mt-1 text-xs text-red-600" style={{ marginTop: '4px' }}>{errors.lastName.message}</p>
                )}
              </div>
            </div>

            {/* ID Number */}
            <div className="input-group">
              <input
                {...register('schoolId', { required: 'ID Number is required' })}
                type="text"
                id="id_number"
                placeholder="ID Number"
              />
              {errors.schoolId && (
                <p className="mt-1 text-xs text-red-600" style={{ marginTop: '4px' }}>{errors.schoolId.message}</p>
              )}
            </div>

            {/* School Email */}
            <div className="input-group">
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
                type="email"
                id="email"
                placeholder="School Email"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600" style={{ marginTop: '4px' }}>{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="input-group">
              <input
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                })}
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="Create Password"
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
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button type="submit" className="signup-btn" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          {/* Login Link */}
          <p className="login-link">
            Already have an account? <Link to="/login">Log in here!</Link>
          </p>
        </div>

        {/* Welcome Section */}
        <div className="signup-welcome-section">
          <h1>Hungry? Sign up now, teknoy!</h1>
          <p>Skip the line, enjoy the grub. Sign up now and start ordering with ease.</p>
        </div>
      </div>
    </div>
  );
};
