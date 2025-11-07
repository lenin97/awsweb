import {
  type LucideProps 
} from 'lucide-react'

// Define a reusable icon type for any Lucide-style component.
type IconComponent = React.FC<LucideProps>
// Renders an accessible, focusable SVG link.
export const iconLink = (
    href: string,
    label: string,
    Icon: IconComponent
  ) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="
        text-gray-600 dark:text-gray-300 
        hover:text-current 
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 
        transition
      "
    >
      {/* icon is decorative; name comes from the anchor’s aria-label */}
      <Icon className="w-6 h-6" aria-hidden="true" focusable="false" />
    </a>
  )