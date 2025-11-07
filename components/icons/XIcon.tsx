// icons/XIcon.tsx
import { LucideProps } from 'lucide-react'

/**
 * X (formerly Twitter) Icon Component (Official simple mark)
 */
export const XIcon: React.FC<LucideProps> = (props) => (
   <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    role="img"
  >
    <title>X</title>
    {/* Official X mark: two crossing strokes */}
    <path
      d="M3 3l18 18M21 3L3 21"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
)