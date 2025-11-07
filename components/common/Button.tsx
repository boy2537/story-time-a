import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ children, className, ...props }) => {
  return (
    <button
      className={`
        px-5 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl
        shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300
        disabled:bg-slate-300 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed
        disabled:shadow-none disabled:transform-none
        flex items-center justify-center
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};
