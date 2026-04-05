/**
 * @file index.ts
 * @description Export de componentes UI atoms - Origen Dashboard v3.0
 * Re-exports from @origen/ux-library + local dashboard-specific components
 * @version 3.2.0
 */

// ─── @origen/ux-library ───────────────────────────────────────────────────────
export {
  // Inputs
  Input, InputGroup,
  Textarea,
  Label, labelVariants,
  CurrencyInput,
  PercentageInput,
  TagsInput,
  // Selection
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup,
  Checkbox, CheckboxWithLabel, CheckboxGroup,
  RadioGroup, RadioGroupItem,
  Toggle,
  ToggleGroup, ToggleGroupItem,
  Switch,
  Slider,
  // Display
  ProductImage,
  Badge, StatusBadge,
  Avatar, AvatarFallback, AvatarImage, AvatarGroup,
  Progress,
  Stepper, StepperContent, StepperFooter,
  Separator,
  // Feedback
  Alert, AlertTitle, AlertDescription,
  Toast, ToastProvider, ToastViewport, ToastTitle, ToastDescription,
  ToastClose, ToastAction, Toaster, toast, useToast,
  Tooltip,
  // Containers
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, cardVariants,
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
  Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle,
  SheetDescription, SheetFooter, SheetClose,
  // Navigation
  Button, buttonVariants,
  Tabs, TabsList, TabsTrigger, TabsContent,
  Pagination,
  // Data
  Table,
  // Other
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogFooter, AlertDialogTitle, AlertDialogDescription,
  AlertDialogAction, AlertDialogCancel,
} from '@origen/ux-library';
