// ============================================================================
// COMPONENT: CategoryCard
// ============================================================================
// Card component for selecting producer categories with icon and styling

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCategoryIcon } from '../constants';

export interface CategoryCardProps {
  category: { id: string; name: string; description: string };
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category, isSelected, onSelect }) => {
  const IconComponent = getCategoryIcon(category.id);

  return (
    <button
      type="button"
      onClick={() => onSelect(category.id)}
      className={cn(
        'group relative bg-white rounded-xl border-2 transition-all w-full',
        'hover:shadow-md hover:scale-[1.02]',
        'focus:outline-none focus:ring-2 focus:ring-origen-hoja/50',
        'p-3 md:p-5',
        isSelected
          ? 'border-origen-bosque/40 bg-gradient-to-br from-origen-bosque/5 to-transparent shadow-md'
          : 'border-gray-200 hover:border-origen-hoja'
      )}
    >
      {isSelected && (
        <div className="absolute top-2 right-2">
          <div className="w-5 h-5 bg-gradient-to-br from-origen-bosque to-origen-pino rounded-full flex items-center justify-center shadow">
            <Check className="w-3 h-3 text-white" />
          </div>
        </div>
      )}
      <div className="flex flex-col items-center text-center">
        <div className={cn(
          'rounded-xl flex items-center justify-center mb-2 transition-all',
          'w-11 h-11 md:w-16 md:h-16',
          isSelected
            ? 'bg-gradient-to-br from-origen-bosque to-origen-pino text-white shadow-lg'
            : 'bg-gradient-to-br from-origen-crema to-origen-pastel text-origen-bosque group-hover:scale-110'
        )}>
          <IconComponent className="w-5 h-5 md:w-8 md:h-8" />
        </div>
        <h3 className={cn('text-xs md:text-lg font-semibold mb-0.5 leading-tight', isSelected ? 'text-origen-bosque' : 'text-gray-900')}>
          {category.name}
        </h3>
        <p className="text-[10px] md:text-sm text-gray-500 line-clamp-2 hidden md:block">
          {category.description}
        </p>
      </div>
    </button>
  );
};
