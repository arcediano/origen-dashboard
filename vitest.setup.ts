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
	};
});

// Start MSW server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));

// Reset handlers after each test to avoid test pollution
afterEach(() => server.resetHandlers());

// Clean up after all tests
afterAll(() => server.close());
