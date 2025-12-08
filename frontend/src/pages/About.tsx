import { Link } from 'react-router-dom';

export const About = () => {
  return (
    <div className="min-h-screen auth-background flex items-center justify-center p-8">
      <div className="max-w-4xl bg-white rounded-lg shadow-2xl p-12">
        <h1 className="text-4xl font-bold text-[#8B1538] mb-6">About TeknoGrub</h1>
        <p className="text-lg text-gray-700 mb-4">
          TeknoGrub is a smart canteen order-queue system designed to streamline food ordering 
          and reduce waiting times at Cebu Institute of Technology University.
        </p>
        <p className="text-lg text-gray-700 mb-6">
          Skip the line, enjoy the grub. Order ahead and pick up when ready!
        </p>
        <Link
          to="/login"
          className="inline-block bg-yellow-400 hover:bg-yellow-500 text-[#8B1538] font-bold py-3 px-6 rounded-lg transition-colors"
        >
          Get Started
        </Link>
      </div>
    </div>
  );
};

