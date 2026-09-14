import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { vi } from 'vitest';
import React from 'react';
import { server } from './tests/mocks/server';

vi.mock('@arcediano/ux-library', () => {
	const passthrough = (tag: keyof JSX.IntrinsicElements) =>
		React.forwardRef<any, any>(({ children, ...props }, ref) =>
			React.createElement(tag, { ref, ...props }, children)
		);

	const Button = passthrough('button');
	const Input = React.forwardRef<any, any>(({ label, error, id, ...props }, ref) =>
		React.createElement(
			'div',
			null,
			label ? React.createElement('label', { htmlFor: id }, label) : null,
			React.createElement('input', { ref, id, 'aria-invalid': error ? 'true' : undefined, ...props }),
			error ? React.createElement('div', { role: 'alert' }, error) : null
		)
	);
	const InputAffixField = React.forwardRef<any, any>(({ label, error, id, affixLeft: _affixLeft, affixRight: _affixRight, ...props }, ref) =>
		React.createElement(
			'div',
			null,
			label ? React.createElement('label', { htmlFor: id }, label) : null,
			React.createElement('input', { ref, id, 'aria-invalid': error ? 'true' : undefined, ...props }),
			error ? React.createElement('div', { role: 'alert' }, error) : null
		)
	);
	const Textarea = passthrough('textarea');
	const Label = passthrough('label');
	const Badge = passthrough('span');
	const Card = passthrough('div');
	const CardContent = passthrough('div');
	const CardHeader = passthrough('div');
	const CardTitle = passthrough('h3');
	const CardDescription = passthrough('p');
	const CardFooter = passthrough('div');
	const Separator = passthrough('hr');
	const Alert = passthrough('div');
	const AlertTitle = passthrough('h4');
	const AlertDescription = passthrough('p');
	const Dialog = passthrough('div');
	const DialogContent = passthrough('div');
	const DialogHeader = passthrough('div');
	const DialogTitle = passthrough('h2');
	const DialogDescription = passthrough('p');
	const DialogFooter = passthrough('div');
	const Avatar = passthrough('div');
	const AvatarImage = passthrough('img');
	const AvatarFallback = passthrough('span');
	const Progress = passthrough('progress');
	const Toggle = passthrough('button');
	const Tooltip = passthrough('div');
	const ProductImage = passthrough('img');

	const Checkbox = React.forwardRef<any, any>(({ children, ...props }, ref) =>
		React.createElement('input', { ref, type: 'checkbox', ...props }, children)
	);

	const CheckboxWithLabel = ({ id, label, checked, defaultChecked, onCheckedChange, onChange, ...props }: any) => {
		const [internalChecked, setInternalChecked] = React.useState(Boolean(defaultChecked));
		const resolvedChecked = checked ?? internalChecked;

		const handleChange = (event: any) => {
			const nextChecked = Boolean(event?.target?.checked);
			if (checked === undefined) {
				setInternalChecked(nextChecked);
			}
			if (typeof onCheckedChange === 'function') {
				onCheckedChange(nextChecked);
			}
			if (typeof onChange === 'function') {
				onChange(event);
			}
		};

		return React.createElement(
			'label',
			{ htmlFor: id },
			React.createElement('input', { id, type: 'checkbox', checked: resolvedChecked, onChange: handleChange, ...props }),
			label
		);
	};

	const Select = passthrough('select');
	const SelectTrigger = passthrough('button');
	const SelectValue = passthrough('span');
	const SelectContent = passthrough('div');
	const SelectItem = passthrough('option');

	const Tabs = passthrough('div');
	const TabsList = passthrough('div');
	const TabsTrigger = passthrough('button');
	const TabsContent = passthrough('div');

	const Table = passthrough('table');
	const Pagination = passthrough('nav');
	const TagsInput = passthrough('input');
	const StatusBadge = passthrough('span');

	// Añadidos (2026-09-14) — exports usados en src/ que faltaban en este mock
	// manual, encontrados al auditar la deuda de tests preexistente (ver
	// claude-agile/proyectos/origen-dashboard/tareas-completadas.md). Mismo
	// patrón `passthrough`/`forwardRef` ya usado arriba — solo necesitan no
	// romper el árbol de render, no replicar el comportamiento visual real.
	const ActionBar = passthrough('div');
	const ActiveFilterChips = passthrough('div');
	const AuthFooter = passthrough('div');
	const CardIconHeader = passthrough('div');
	const ConfirmDialog = passthrough('div');
	const CurrencyInput = passthrough('input');
	const DateInput = passthrough('input');
	const DialogTrigger = passthrough('button');
	const EmptyState = passthrough('div');
	const FilterBottomSheet = passthrough('div');
	const FilterPanel = passthrough('div');
	const FilterToolbar = passthrough('div');
	const MobileCardList = passthrough('div');
	const MobilePullRefresh = passthrough('div');
	const MobileScrollSlider = passthrough('div');
	const MobileTopBar = passthrough('div');
	const NotificationCard = passthrough('div');
	const NotificationCardSkeleton = passthrough('div');
	const PageError = passthrough('div');
	const PageHeader = passthrough('div');
	const PageLoader = passthrough('div');
	const PasswordStrengthIndicator = passthrough('div');
	const PercentageInput = passthrough('input');
	const QuantitySelector = passthrough('div');
	const ReviewSummary = passthrough('div');
	const RichTextEditor = passthrough('div');
	const ScrollChipFilter = passthrough('div');
	const SearchInput = passthrough('input');
	const SelectableCard = passthrough('div');
	const Sheet = passthrough('div');
	const SheetContent = passthrough('div');
	const SheetHeader = passthrough('div');
	const SheetTitle = passthrough('h2');
	const Spinner = passthrough('div');
	const StarRating = passthrough('div');
	const StatCard = passthrough('div');
	const StatGrid = passthrough('div');
	const StatHighlightCard = passthrough('div');
	const SwipeableRow = passthrough('div');
	const ToggleGroup = passthrough('div');
	const ToggleGroupItem = passthrough('button');

	// Mismo patrón que Checkbox (arriba): no traduce onCheckedChange -> onChange,
	// solo evita que el render explote.
	const Switch = React.forwardRef<any, any>(({ children, ...props }, ref) =>
		React.createElement('input', { ref, type: 'checkbox', ...props }, children)
	);

	// Hook (no componente) — asume escritorio por defecto; ningún test actual
	// depende de la rama móvil de este hook a través del mock global.
	const useIsMobile = () => false;

	// Utilidades puras de app-shell-padding.ts — misma fórmula de fallback que
	// el código real (safe-area-inset-bottom), sin replicar la tabla estática
	// de clases pre-generadas (solo importa para el JIT de Tailwind en build
	// real, no para lo que estos tests verifican).
	const NAV_HEIGHT_MOBILE_DASHBOARD = 88;
	const appShellSafeAreaOffset = (base: number, extra = 0) =>
		`calc(${base + extra}px+env(safe-area-inset-bottom,0px))`;
	const appShellPaddingClass = (base: number, extra = 0) =>
		`pb-[${appShellSafeAreaOffset(base, extra)}]`;
	const appShellBottomOffsetClass = (base: number, extra = 0) =>
		`bottom-[${appShellSafeAreaOffset(base, extra)}]`;

	const toast = vi.fn();

	return {
		Button,
		Input,
		InputAffixField,
		Textarea,
		Label,
		Badge,
		Card,
		CardContent,
		CardHeader,
		CardTitle,
		CardDescription,
		CardFooter,
		Separator,
		Alert,
		AlertTitle,
		AlertDescription,
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogDescription,
		DialogFooter,
		Avatar,
		AvatarImage,
		AvatarFallback,
		Progress,
		Toggle,
		Tooltip,
		ProductImage,
		Checkbox,
		CheckboxWithLabel,
		Select,
		SelectTrigger,
		SelectValue,
		SelectContent,
		SelectItem,
		Tabs,
		TabsList,
		TabsTrigger,
		TabsContent,
		Table,
		Pagination,
		TagsInput,
		StatusBadge,
		buttonVariants: () => '',
		ActionBar,
		ActiveFilterChips,
		AuthFooter,
		CardIconHeader,
		ConfirmDialog,
		CurrencyInput,
		DateInput,
		DialogTrigger,
		EmptyState,
		FilterBottomSheet,
		FilterPanel,
		FilterToolbar,
		MobileCardList,
		MobilePullRefresh,
		MobileScrollSlider,
		MobileTopBar,
		NotificationCard,
		NotificationCardSkeleton,
		PageError,
		PageHeader,
		PageLoader,
		PasswordStrengthIndicator,
		PercentageInput,
		QuantitySelector,
		ReviewSummary,
		RichTextEditor,
		ScrollChipFilter,
		SearchInput,
		SelectableCard,
		Sheet,
		SheetContent,
		SheetHeader,
		SheetTitle,
		Spinner,
		StarRating,
		StatCard,
		StatGrid,
		StatHighlightCard,
		SwipeableRow,
		Switch,
		ToggleGroup,
		ToggleGroupItem,
		useIsMobile,
		NAV_HEIGHT_MOBILE_DASHBOARD,
		appShellPaddingClass,
		appShellBottomOffsetClass,
		toast,
	};
});

// Start MSW server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));

// Reset handlers after each test to avoid test pollution
afterEach(() => server.resetHandlers());

// Clean up after all tests
afterAll(() => server.close());
