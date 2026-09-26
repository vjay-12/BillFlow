import React from 'react';

interface PasumaiLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
}

/**
 * Pasumai Cafe custom monogram logo:
 * An organic asymmetric leaf silhouette with a clean sans-serif "P" cutout.
 * Single flat silhouette rendered with currentColor on a transparent background.
 * Theme matching: #0F766E in light mode, #F5F0E6 in dark mode.
 */
export const PasumaiLogo: React.FC<PasumaiLogoProps> = ({
  size,
  className = '',
  ...props
}) => {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M 16 94 C 16 94, 25 80, 20 62 C 14 44, 14 24, 38 10 C 58 -2, 86 2, 94 20 C 98 28, 96 54, 80 74 C 64 90, 38 92, 16 94 Z M 36 28 L 36 74 L 47 74 L 47 54 L 58 54 C 68 54, 76 48, 76 41 C 76 34, 68 28, 58 28 L 36 28 Z M 47 36 L 56 36 C 62 36, 65 38, 65 41 C 65 44, 62 46, 56 46 L 47 46 L 47 36 Z"
      />
    </svg>
  );
};
