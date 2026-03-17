/**
 * @file index.ts
 * @description Export de componentes UI atoms - Origen Marketplace v3.0
 * @version 3.1.0
 *
 * Componentes atómicos según Manual de Marca "Bosque Profundo"
 */

// Inputs
export { Input, InputGroup } from './input';
export { Textarea } from './textarea';
export { Label, labelVariants } from './label';
export { CurrencyInput } from './currency-input';
export { PercentageInput } from './percentage-input';
export { TagsInput } from './tags-input';

// Selection
export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup } from './select';
export { Checkbox, CheckboxWithLabel, CheckboxGroup } from './checkbox';
export { RadioGroup, RadioGroupItem } from './radio-group';
export { Toggle, ToggleGroup } from './toggle';
export { Switch } from './switch';
export { Slider } from './slider';

// Display
export { Badge, StatusBadge } from './badge';
export { Avatar, AvatarFallback, AvatarImage, AvatarGroup } from './avatar';
export { Progress, CircularProgress, SteppedProgress } from './progress';
export { Stepper, StepperContent, StepperFooter, StepperHeader } from './stepper';
export { Separator } from './separator';

// Feedback
export { Alert, AlertTitle, AlertDescription, AlertWithIcon, AlertStack } from './alert';
export {
  Toast,
  ToastProvider,
  ToastViewport,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  Toaster,
  toast,
  toastUtils,
  useToast,
} from './toast';
export { Tooltip, InfoTooltip, TooltipInline } from './tooltip';

// Containers
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, FeatureCard, StatCard, ProductCard } from './card';
export { Modal } from './dialog';
export { Sheet, SheetPortal, SheetOverlay, SheetClose, SheetTrigger, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription } from './sheet';

// Navigation
export { Button, buttonVariants } from './button';
export { Tabs, TabsList, TabsTrigger, TabsContent, TabsWithIcon } from './tabs';
export { Accordion, AccordionItem, AccordionTrigger, AccordionContent, FilterAccordion, AccordionGroup } from './accordion';
export { Pagination } from './pagination';

// Data
export { Table } from './table';

// Other
export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from './alert-dialog';
