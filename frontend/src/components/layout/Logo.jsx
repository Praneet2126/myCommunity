import { Link } from 'react-router-dom';
import myLogo from '../../assets/myLogo.png';

// Logo Component - MakeMyTrip Style
// Reusable logo with "my" logo image and "Community" beside it

function Logo({ variant = 'light', size = 'md' }) {
  // Size configurations
  const sizeConfig = {
    sm: {
      image: 'h-8',
      text: 'text-lg',
    },
    md: {
      image: 'h-10',
      text: 'text-2xl',
    },
    lg: {
      image: 'h-12',
      text: 'text-3xl',
    },
  };

  // Color configurations based on variant
  const colorConfig = {
    light: {
      community: 'text-white',
    },
    dark: {
      community: 'text-blue-700',
    },
  };

  const currentSize = sizeConfig[size];
  const currentColor = colorConfig[variant];

  return (
    <Link to="/" className="flex items-center group">
      <div className="flex items-center gap-1">
        {/* "my" part - Logo image */}
        <img 
          src={myLogo} 
          alt="my" 
          className={`${currentSize.image} object-contain group-hover:scale-105 transition-transform`}
        />
        
        {/* "Community" part - Blue/White text depending on variant */}
        <span className={`${currentSize.text} font-bold ${currentColor.community}`}>
          Community
        </span>
      </div>
    </Link>
  );
}

export default Logo;
